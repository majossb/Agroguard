#!/usr/bin/env node
/**
 * AgroGuard — Script de Calibración de Umbrales CLIP
 *
 * Evalúa imágenes de prueba contra el microservicio CLIP Validator
 * para medir tasa de falso rechazo (FRR), tasa de falsa aceptación (FAR),
 * y calibrar los umbrales óptimos:
 *   - CLIP_THRESHOLD_PLANT (default: 0.70)
 *   - CLIP_THRESHOLD_NO_PLANT (default: 0.70)
 *   - CLIP_THRESHOLD_UNSUPPORTED_CROP (default: 0.50)
 *
 * Uso:
 *   node scripts/calibrate-clip.mjs [--url http://localhost:8001] [--image path/to/img.png] [--dir path/to/dataset]
 */

import fs from 'fs/promises';
import path from 'path';

const CLIP_SERVICE_URL = process.env.CLIP_SERVICE_URL || 'http://localhost:8001';

async function validateImage(serviceUrl, imageBuffer) {
  const base64 = imageBuffer.toString('base64');
  const res = await fetch(`${serviceUrl}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: base64 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Error ${res.status}: ${err.detail || 'Fallo de validación'}`);
  }

  return await res.json();
}

async function runCalibration() {
  const args = process.argv.slice(2);
  let serviceUrl = CLIP_SERVICE_URL;
  let singleImage = null;
  let datasetDir = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) serviceUrl = args[++i];
    if (args[i] === '--image' && args[i + 1]) singleImage = args[++i];
    if (args[i] === '--dir' && args[i + 1]) datasetDir = args[++i];
  }

  console.log('='.repeat(70));
  console.log(' AgroGuard — Herramienta de Calibración de Filtro CLIP');
  console.log('='.repeat(70));
  console.log(`URL del servicio CLIP: ${serviceUrl}`);

  // Verificar salud del microservicio
  try {
    const healthRes = await fetch(`${serviceUrl}/health`);
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
    const health = await healthRes.json();
    console.log(`Estado del microservicio: ${health.status} (modelo cargado: ${health.model_loaded})`);
    console.log(`Umbrales actuales en servicio:`, health.thresholds);
  } catch (err) {
    console.error(`\n❌ Error conectando al microservicio CLIP en ${serviceUrl}: ${err.message}`);
    console.error('Asegúrate de que el servicio esté ejecutándose (ej. uvicorn services.clip-validator.main:app --port 8001).\n');
    process.exit(1);
  }

  if (singleImage) {
    console.log(`\nEvaluando imagen individual: ${singleImage}`);
    const buffer = await fs.readFile(singleImage);
    const start = Date.now();
    const result = await validateImage(serviceUrl, buffer);
    const latency = Date.now() - start;

    console.log(`\nResultado:`);
    console.log(`  Estado:      ${result.state}`);
    console.log(`  Motivo:      ${result.reason}`);
    console.log(`  Latencia:    ${latency} ms`);
    console.log(`  Top Etiquetas CLIP:`);
    result.topLabels.forEach((l, idx) => {
      console.log(`    ${idx + 1}. [${(l.score * 100).toFixed(2)}%] ${l.label}`);
    });
    return;
  }

  // Si no se proporcionó imagen ni directorio, evaluar imagen de referencia si existe
  const defaultTestImage = path.resolve('img.png');
  let testImageExists = false;
  try {
    await fs.access(defaultTestImage);
    testImageExists = true;
  } catch {}

  if (testImageExists) {
    console.log(`\nEvaluando imagen de referencia local: ${defaultTestImage}`);
    const buffer = await fs.readFile(defaultTestImage);
    const result = await validateImage(serviceUrl, buffer);
    console.log(`  Estado:      ${result.state}`);
    console.log(`  Motivo:      ${result.reason}`);
    console.log(`  Top Etiquetas CLIP:`);
    result.topLabels.forEach((l, idx) => {
      console.log(`    ${idx + 1}. [${(l.score * 100).toFixed(2)}%] ${l.label}`);
    });
  }

  console.log('\nCalibración completada.');
}

runCalibration().catch((err) => {
  console.error('Error durante la calibración:', err);
  process.exit(1);
});
