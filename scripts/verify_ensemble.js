import fs from 'fs/promises';
import path from 'path';
import { PythonEnsembleInferenceEngine } from '../src/infrastructure/inference/PythonEnsembleInferenceEngine.js';
import { loadClassNames } from '../src/infrastructure/config/classNamesLoader.js';

async function main() {
  console.log('--- Probando Inferencia Real con Ensamble Persistente ---');
  const classNames = loadClassNames();
  const engine = new PythonEnsembleInferenceEngine({
    pythonBin: '/home/pablo/env/bin/python3',
    scriptPath: path.resolve('scripts/inference_ensemble.py'),
    modelDir: path.resolve('agroguard_modelos_completos'),
    classNames,
    timeoutMs: 30000,
  });

  const testImgPath = path.resolve('uploads/images/images/2026/10/6d424908-891c-48d2-92ff-4041dc58c729.jpg');
  const buffer = await fs.readFile(testImgPath);

  console.log('Enviando primera imagen para inferencia...');
  const t0 = Date.now();
  const res1 = await engine.predict({ buffer, mimeType: 'image/jpeg' });
  const t1 = Date.now();
  console.log(`Inferencia 1 completada en ${t1 - t0} ms.`);
  console.log('Clase ganadora:', res1.ensembleBreakdown.winningClassKey);
  console.log('Confianza global:', (res1.ensembleBreakdown.globalConfidence * 100).toFixed(2) + '%');
  console.log('Consenso:', res1.ensembleBreakdown.consensus.label);
  console.log('Desglose de arquitecturas:');
  for (const m of res1.ensembleBreakdown.models) {
    console.log(`  - ${m.displayName} (w=${m.weight}): ${m.topClassKey} (${(m.individualConfidence * 100).toFixed(1)}%) -> aporte: ${(m.contribution * 100).toFixed(1)}%`);
  }

  console.log('\nEnviando segunda imagen (demostrando proceso residente y latencia en milisegundos)...');
  const t2 = Date.now();
  const res2 = await engine.predict({ buffer, mimeType: 'image/jpeg' });
  const t3 = Date.now();
  console.log(`Inferencia 2 completada en ${t3 - t2} ms (tiempo Python: ${res2.inferenceTimeMs} ms)!`);

  await engine.close();
  console.log('\n--- Inferencia Real con Daemon y Weighted Voting EXITOSA ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error durante la prueba:', err);
  process.exit(1);
});
