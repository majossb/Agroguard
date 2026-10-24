import { spawn } from 'child_process';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { InferenceEngine } from '../../application/ports/InferenceEngine.js';
import {
  InferenceUnavailableError,
  InvalidInferenceResultError,
} from '../../domain/errors/DomainError.js';
import {
  WeightedVotingEnsemble,
  ENSEMBLE_WEIGHTS,
} from '../../domain/services/WeightedVotingEnsemble.js';

/**
 * Adaptador de infraestructura que conecta Node.js con el daemon persistente de Python
 * para ejecutar los 4 modelos de Deep Learning reales en memoria con Weighted Voting.
 * @implements {InferenceEngine}
 */
export class PythonEnsembleInferenceEngine extends InferenceEngine {
  /**
   * @param {object} options
   * @param {string} [options.pythonBin] - Ruta al binario de Python
   * @param {string} [options.scriptPath] - Ruta al script inference_ensemble.py
   * @param {string} [options.modelDir] - Directorio de modelos
   * @param {readonly string[]} options.classNames - Lista de 38 clases
   * @param {object} [options.logger] - Logger de Pino
   * @param {number} [options.timeoutMs=30000] - Timeout por inferencia
   */
  constructor({
    pythonBin = process.env.PYTHON_BIN || '/home/pablo/env/bin/python3',
    scriptPath = path.resolve('scripts/inference_ensemble.py'),
    modelDir = path.resolve('agroguard_modelos_completos'),
    classNames,
    logger = null,
    timeoutMs = 30000,
  }) {
    super();
    if (!Array.isArray(classNames) || classNames.length === 0) {
      throw new Error('PythonEnsembleInferenceEngine requiere una lista válida de classNames.');
    }

    this.pythonBin = pythonBin;
    this.scriptPath = scriptPath;
    this.modelDir = modelDir;
    this.classNames = classNames;
    this.logger = logger;
    this.timeoutMs = timeoutMs;

    this.childProcess = null;
    this.readlineInterface = null;
    this.isDaemonReady = false;
    this.initPromise = null;
    this.requestQueue = [];
    this.activeRequest = null;

    // Iniciar el proceso persistente
    this.initPromise = this._startDaemon();
  }

  /**
   * Arranca el subproceso daemon de Python y espera el evento ready.
   * @private
   */
  async _startDaemon() {
    return new Promise((resolve, reject) => {
      try {
        if (this.logger) {
          this.logger.info(
            { pythonBin: this.pythonBin, script: this.scriptPath },
            'Iniciando daemon de inferencia de ensamble en Python...'
          );
        }

        const env = {
          ...process.env,
          AGROGUARD_MODEL_ROOT: this.modelDir,
          PYTHONUNBUFFERED: '1',
        };

        this.childProcess = spawn(this.pythonBin, [this.scriptPath], {
          env,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        this.readlineInterface = readline.createInterface({
          input: this.childProcess.stdout,
          terminal: false,
        });

        let readyHandled = false;

        this.readlineInterface.on('line', (line) => {
          this._handleDaemonLine(line, (isReady, error) => {
            if (!readyHandled) {
              readyHandled = true;
              if (isReady) {
                this.isDaemonReady = true;
                if (this.logger) {
                  this.logger.info(
                    'Daemon de ensamble de modelos Keras listo y residente en memoria.'
                  );
                }
                resolve();
              } else {
                reject(error || new Error('Fallo al inicializar daemon de Python.'));
              }
            }
          });
        });

        this.childProcess.stderr.on('data', (data) => {
          const msg = data.toString();
          if (this.logger) {
            this.logger.debug({ stderr: msg }, '[Python Inference Daemon stderr]');
          }
        });

        this.childProcess.on('error', (err) => {
          if (this.logger) {
            this.logger.error({ err }, 'Error en el proceso de inferencia de Python.');
          }
          this._rejectActiveAndQueue(new InferenceUnavailableError(`Error en proceso Python: ${err.message}`));
          if (!readyHandled) {
            readyHandled = true;
            reject(err);
          }
        });

        this.childProcess.on('exit', (code, signal) => {
          if (this.logger) {
            this.logger.warn(
              { code, signal },
              'El daemon de Python finalizó. Reiniciando si es necesario...'
            );
          }
          this.isDaemonReady = false;
          this._rejectActiveAndQueue(new InferenceUnavailableError('El daemon de inferencia terminó inesperadamente.'));
          if (!readyHandled) {
            readyHandled = true;
            reject(new Error(`Daemon de Python terminó prematuramente con código ${code}`));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Procesa cada línea JSON recibida desde stdout de Python.
   * @private
   */
  _handleDaemonLine(line, readyCallback) {
    line = line.trim();
    if (!line) return;

    let payload;
    try {
      payload = JSON.parse(line);
    } catch {
      return; // Ignorar líneas no JSON (como advertencias iniciales)
    }

    if (payload.status === 'ready') {
      readyCallback(true, null);
      return;
    }

    if (this.activeRequest) {
      const { resolve, reject, timer } = this.activeRequest;
      clearTimeout(timer);
      this.activeRequest = null;

      if (payload.status === 'success') {
        resolve(payload);
      } else {
        reject(new InvalidInferenceResultError(payload.message || 'Error en inferencia de Python'));
      }

      // Procesar siguiente petición en cola
      this._processNextInQueue();
    }
  }

  /**
   * Procesa la siguiente petición en la cola FIFO.
   * @private
   */
  _processNextInQueue() {
    if (this.requestQueue.length === 0 || this.activeRequest !== null) {
      return;
    }

    const nextReq = this.requestQueue.shift();
    this.activeRequest = nextReq;

    const timer = setTimeout(() => {
      if (this.activeRequest === nextReq) {
        this.activeRequest = null;
        nextReq.reject(new InferenceUnavailableError('Timeout de inferencia excedido en Python daemon.'));
        this._processNextInQueue();
      }
    }, this.timeoutMs);

    nextReq.timer = timer;

    try {
      const line = JSON.stringify(nextReq.command) + '\n';
      this.childProcess.stdin.write(line);
    } catch (err) {
      clearTimeout(timer);
      this.activeRequest = null;
      nextReq.reject(err);
      this._processNextInQueue();
    }
  }

  /**
   * Rechaza peticiones activas y encoladas ante caída del proceso.
   * @private
   */
  _rejectActiveAndQueue(error) {
    if (this.activeRequest) {
      clearTimeout(this.activeRequest.timer);
      this.activeRequest.reject(error);
      this.activeRequest = null;
    }
    while (this.requestQueue.length > 0) {
      const req = this.requestQueue.shift();
      req.reject(error);
    }
  }

  /**
   * Ejecuta la predicción real sobre los 4 modelos y combina mediante Weighted Voting.
   * @param {{ buffer: Buffer, mimeType: string }} image
   * @returns {Promise<import('../../application/ports/InferenceEngine.js').InferenceResult & { ensembleBreakdown: any }>}
   */
  async predict(image) {
    if (!image || !Buffer.isBuffer(image.buffer)) {
      throw new InvalidInferenceResultError('Se requiere un buffer de imagen válido.');
    }

    // Asegurar que el daemon está listo
    await this.initPromise;

    // Escribir imagen en archivo temporal de forma segura
    const tmpId = crypto.randomUUID();
    const tmpPath = path.join(os.tmpdir(), `agroguard-infer-${tmpId}.jpg`);
    await fs.writeFile(tmpPath, image.buffer);

    let daemonResult;
    try {
      daemonResult = await new Promise((resolve, reject) => {
        this.requestQueue.push({
          command: { command: 'predict', imagePath: tmpPath },
          resolve,
          reject,
        });
        this._processNextInQueue();
      });
    } finally {
      // Limpieza garantizada del archivo temporal
      try {
        await fs.unlink(tmpPath);
      } catch {
        // Ignorar si ya fue removido
      }
    }

    // Aplicar el método de ensamble matemático por Votación Ponderada (Weighted Voting)
    const ensembleResult = WeightedVotingEnsemble.combine({
      modelOutputs: daemonResult.models,
      classNames: this.classNames,
      weights: ENSEMBLE_WEIGHTS,
    });

    return {
      modelName: 'AgroGuard_Weighted_Voting_Ensemble_v1',
      modelVersion: '1.0.0',
      provider: 'ensemble',
      probabilities: ensembleResult.ensembleProbabilities,
      inferenceTimeMs: daemonResult.inferenceTimeMs || 0,
      ensembleBreakdown: {
        weights: ENSEMBLE_WEIGHTS,
        models: ensembleResult.modelsBreakdown,
        consensus: ensembleResult.consensus,
        latencyMs: daemonResult.inferenceTimeMs || 0,
        winningClassKey: ensembleResult.winningClassKey,
        globalConfidence: ensembleResult.globalConfidence,
      },
      explanation: null,
    };
  }

  /**
   * Metadatos de la arquitectura del ensamble.
   */
  async info() {
    return {
      name: 'AgroGuard Deep Ensemble (Weighted Voting)',
      version: '1.0.0',
      inputSize: 224,
      classCount: this.classNames.length,
      dataset: 'New Plant Diseases Dataset (PlantVillage, 38 clases)',
      metrics: {
        weights: ENSEMBLE_WEIGHTS,
        architectures: [
          'EfficientNet-B0 (35%)',
          'ResNet-50 (30%)',
          'MobileNet-V2 (20%)',
          'CNN Base (15%)',
        ],
      },
      evaluationNote: 'Ensamble de 4 arquitecturas profundas reales con preprocesamiento específico por modelo.',
    };
  }

  /**
   * Verifica la disponibilidad del daemon.
   */
  async isReady() {
    return this.isDaemonReady && this.childProcess && !this.childProcess.killed;
  }

  /**
   * Cierra el proceso persistente de Python ordenadamente.
   */
  async close() {
    if (this.childProcess && !this.childProcess.killed) {
      try {
        this.childProcess.stdin.write(JSON.stringify({ command: 'exit' }) + '\n');
      } catch {
        // Ignorar
      }
      this.childProcess.kill('SIGTERM');
    }
  }
}
