import fs from 'fs/promises';
import path from 'path';
import { Diagnosis } from '../../../domain/entities/Diagnosis.js';
import { DiagnosisInterpreter } from '../../../domain/services/DiagnosisInterpreter.js';
import { ValidationError, ImageRejectedError, ImageReviewRequiredError } from '../../../domain/errors/DomainError.js';
import { REVIEW_STATUS } from '../../../domain/entities/Condition.js';
import { ValidationState } from '../../../domain/value-objects/ValidationState.js';

/**
 * Caso de uso para crear y ejecutar un diagnóstico fitopatológico.
 */
export class CreateDiagnosis {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/ImageProcessor.js').ImageProcessor} dependencies.imageProcessor
   * @param {import('../../ports/InferenceEngine.js').InferenceEngine} dependencies.inferenceEngine
   * @param {import('../../ports/ImageValidator.js').ImageValidator} [dependencies.imageValidator]
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   * @param {import('../../ports/ConditionCatalogRepository.js').ConditionCatalogRepository} [dependencies.conditionCatalogRepository]
   * @param {import('../../ports/ImageStorage.js').ImageStorage} dependencies.imageStorage
   * @param {import('../../ports/IdGenerator.js').IdGenerator} dependencies.idGenerator
   * @param {import('../../ports/Clock.js').Clock} dependencies.clock
   * @param {readonly string[]} dependencies.validClassKeys
   * @param {number} [dependencies.minConfidence=0.60]
   */
  constructor({
    imageProcessor,
    inferenceEngine,
    imageValidator = null,
    diagnosisRepository,
    conditionCatalogRepository = null,
    imageStorage,
    idGenerator,
    clock,
    validClassKeys,
    minConfidence = 0.6,
  }) {
    this.imageProcessor = imageProcessor;
    this.inferenceEngine = inferenceEngine;
    this.imageValidator = imageValidator;
    this.diagnosisRepository = diagnosisRepository;
    this.conditionCatalogRepository = conditionCatalogRepository;
    this.imageStorage = imageStorage;
    this.idGenerator = idGenerator;
    this.clock = clock;
    this.validClassKeys = validClassKeys;
    this.minConfidence = minConfidence;
  }


  /**
   * Ejecuta el diagnóstico de la imagen
   * @param {import('../../dtos/DiagnosisDTOs.js').CreateDiagnosisInput} input
   * @returns {Promise<import('../../dtos/DiagnosisDTOs.js').CreateDiagnosisOutput>}
   */
  async execute(input) {
    const startTime = Date.now();
    const { imageBuffer, ownerId = null, plotName, cropHint, notes } = input;

    // Validación opcional de cropHint contra los cultivos válidos del modelo
    if (cropHint && typeof cropHint === 'string') {
      const validCrops = new Set(this.validClassKeys.map((k) => k.split('___')[0].toLowerCase()));
      const normalizedHint = cropHint.trim().toLowerCase();
      if (!validCrops.has(normalizedHint)) {
        throw new ValidationError(
          `El cultivo sugerido '${cropHint}' no es soportado por el modelo.`,
          'INVALID_CROP_HINT'
        );
      }
    }

    // 1. Normalización y saneamiento de la imagen
    const processedImage = await this.imageProcessor.normalize(imageBuffer);

    // 2. Validación CLIP — ninguna inferencia del ensemble puede ejecutarse
    //    sin que la imagen haya superado la validación CLIP.
    let clipValidation = null;
    if (this.imageValidator) {
      clipValidation = await this.imageValidator.validate(processedImage.buffer);
      const validationState = new ValidationState(clipValidation.state);

      if (validationState.isRejected()) {
        throw new ImageRejectedError(
          clipValidation.reason || 'La imagen no parece corresponder a una hoja o planta.',
          clipValidation.reason || '',
          clipValidation.topLabels || []
        );
      }


      if (validationState.isReview()) {
        // REVISAR: HTTP 200, sin predicción, sin ensemble
        const now = this.clock.now();
        return {
          id: null,
          persisted: false,
          createdAt: now.toISOString(),
          validationState: ValidationState.REVISAR,
          validationReason: clipValidation.reason,
          clipTopLabels: clipValidation.topLabels || [],
          verdict: null,
          prediction: null,
          topPredictions: null,
          warnings: [clipValidation.reason],
          message: clipValidation.reason,
          recommendation: null,
          model: null,
          ensembleBreakdown: null,
          report: null,
          processingTimeMs: Date.now() - startTime,
          image: null,
        };
      }
    }

    // 3. Predicción con el motor de inferencia (solo si CLIP aceptó o no hay validador)
    const inferenceResult = await this.inferenceEngine.predict({
      buffer: processedImage.buffer,
      mimeType: processedImage.mimeType,
    });


    // 3. Interpretación según reglas de negocio fitopatológicas
    const interpreted = DiagnosisInterpreter.interpret({
      inferenceResult,
      validClassKeys: this.validClassKeys,
      minConfidence: this.minConfidence,
      context: { plotName, cropHint, notes },
      imageDimensions: {
        width: processedImage.width,
        height: processedImage.height,
      },
    });

    const now = this.clock.now();
    const processingTimeMs = Date.now() - startTime;

    let diagnosisId = null;
    let persisted = false;
    let savedStorageKey = null;
    let imageUrl = null;

    // 4. Persistencia si el usuario está autenticado
    if (ownerId) {
      diagnosisId = this.idGenerator.generate();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const storageKey = `images/${year}/${month}/${diagnosisId}.jpg`;

      // Guardar archivo de imagen
      savedStorageKey = await this.imageStorage.save(storageKey, processedImage.buffer);

      const diagnosisEntity = new Diagnosis({
        id: diagnosisId,
        ownerId,
        image: {
          storageKey: savedStorageKey,
          mimeType: processedImage.mimeType,
          sizeBytes: processedImage.sizeBytes,
          width: processedImage.width,
          height: processedImage.height,
          sha256: processedImage.sha256,
        },
        verdict: interpreted.verdict,
        prediction: interpreted.prediction,
        topPredictions: interpreted.topPredictions,
        warnings: interpreted.warnings,
        message: interpreted.message,
        model: {
          name: inferenceResult.modelName,
          version: inferenceResult.modelVersion,
          provider: inferenceResult.provider,
        },
        processingTimeMs,
        context: { plotName, cropHint, notes },
        createdAt: now,
      });

      try {
        await this.diagnosisRepository.save(diagnosisEntity);
        persisted = true;
        imageUrl = `/api/v1/diagnoses/${diagnosisId}/image`;
      } catch (error) {
        // Compensación ante fallo en base de datos: eliminar imagen guardada para evitar huérfanos
        if (savedStorageKey) {
          try {
            await this.imageStorage.delete(savedStorageKey);
          } catch {
            // Log de error de compensación si fuera necesario
          }
        }
        throw error;
      }
    }

    // 5. Resolución de recomendación agronómica (solo si no es inconcluso)
    let recommendation = null;
    if (!interpreted.verdict.healthStatus.isInconclusive()) {
      if (this.conditionCatalogRepository) {
        const condition = await this.conditionCatalogRepository.findByClassKey(
          interpreted.prediction.classKey
        );
        if (condition) {
          recommendation = condition.getRecommendation();
        }
      }

      if (!recommendation) {
        // Fallback genérico seguro
        recommendation = {
          reviewStatus: REVIEW_STATUS.PENDING_REVIEW,
          summary: `Diagnóstico para ${interpreted.prediction.cropName}: ${interpreted.prediction.conditionName}.`,
          generalAdvice:
            'Consulta a un ingeniero agrónomo antes de aplicar cualquier tratamiento.',
          actions: [],
        };
      }
    }

    // 6. Generación y persistencia real del reporte en formato JSON
    const reportId = diagnosisId || `anon-${now.getTime()}`;
    const reportData = {
      reportId,
      createdAt: now.toISOString(),
      verdict: {
        healthStatus: interpreted.verdict.healthStatus.value,
        confidence: interpreted.verdict.confidence,
        healthyProbability: interpreted.verdict.healthyProbability,
      },
      prediction: interpreted.prediction,
      topPredictions: interpreted.topPredictions,
      warnings: interpreted.warnings,
      message: interpreted.message,
      recommendation,
      model: {
        name: inferenceResult.modelName,
        version: inferenceResult.modelVersion,
        provider: inferenceResult.provider,
      },
      ensembleBreakdown: inferenceResult.ensembleBreakdown || null,
      processingTimeMs,
      imageMetadata: {
        width: processedImage.width,
        height: processedImage.height,
        sizeBytes: processedImage.sizeBytes,
        mimeType: processedImage.mimeType,
        sha256: processedImage.sha256,
      },
      context: { plotName, cropHint, notes },
    };

    // Guardar reporte en archivo JSON persistente
    try {
      const reportsDir = path.resolve('data/reports');
      await fs.mkdir(reportsDir, { recursive: true });
      const reportFilePath = path.join(reportsDir, `report-${reportId}.json`);
      await fs.writeFile(reportFilePath, JSON.stringify(reportData, null, 2), 'utf-8');
    } catch {
      // Continuar si hay algún fallo al escribir en disco para no bloquear la respuesta
    }

    return {
      id: diagnosisId,
      persisted,
      createdAt: now.toISOString(),
      validationState: clipValidation
        ? ValidationState.ACEPTAR
        : inferenceResult.validationState || null,
      validationReason: clipValidation
        ? clipValidation.reason
        : inferenceResult.validationReason || null,
      clipTopLabels: clipValidation
        ? clipValidation.topLabels
        : inferenceResult.clipTopLabels || null,

      verdict: {
        healthStatus: interpreted.verdict.healthStatus.value,
        confidence: interpreted.verdict.confidence,
        healthyProbability: interpreted.verdict.healthyProbability,
      },
      prediction: interpreted.prediction,
      topPredictions: interpreted.topPredictions,
      warnings: interpreted.warnings,
      message: interpreted.message,
      recommendation,
      model: {
        name: inferenceResult.modelName,
        version: inferenceResult.modelVersion,
        provider: inferenceResult.provider,
      },
      ensembleBreakdown: inferenceResult.ensembleBreakdown || null,
      report: reportData,
      processingTimeMs,
      image: persisted
        ? {
            url: imageUrl,
            width: processedImage.width,
            height: processedImage.height,
          }
        : null,
    };

  }
}
