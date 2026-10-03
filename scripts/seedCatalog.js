/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { loadConfig } from '../src/infrastructure/config/env.js';
import { loadClassNames } from '../src/infrastructure/config/classNamesLoader.js';
import { ClassKeyParser } from '../src/domain/services/ClassKeyParser.js';
import { Condition, REVIEW_STATUS } from '../src/domain/entities/Condition.js';
import { MongoConditionCatalogRepository } from '../src/infrastructure/persistence/mongo/repositories/MongoConditionCatalogRepository.js';

async function runSeed() {
  const config = loadConfig(process.env);
  const classNames = loadClassNames(undefined, config.EXPECTED_NUM_CLASSES);

  const catalogDir = path.resolve(process.cwd(), 'data/catalog');
  if (!fs.existsSync(catalogDir)) {
    fs.mkdirSync(catalogDir, { recursive: true });
  }

  const catalogJsonPath = path.join(catalogDir, 'conditions.es.json');

  // Generar o cargar catálogo base
  let conditionsData = [];
  if (fs.existsSync(catalogJsonPath)) {
    try {
      conditionsData = JSON.parse(fs.readFileSync(catalogJsonPath, 'utf-8'));
    } catch {
      conditionsData = [];
    }
  }

  const existingMap = new Map(conditionsData.map((c) => [c.classKey, c]));

  const updatedCatalogList = classNames.map((classKey) => {
    const parsed = ClassKeyParser.parse(classKey);
    const existing = existingMap.get(classKey) || {};

    return {
      classKey,
      cropKey: parsed.cropKey,
      conditionKey: parsed.conditionKey,
      isHealthy: parsed.isHealthy,
      names: {
        es: {
          cropName: parsed.cropName,
          conditionName: parsed.conditionName,
        },
      },
      description:
        existing.description ||
        (parsed.isHealthy
          ? `Hoja de ${parsed.cropName} en estado saludable, sin signos visibles de patógenos.`
          : `Condición fitopatológica de ${parsed.cropName}: ${parsed.conditionName}.`),
      symptoms: existing.symptoms || (parsed.isHealthy ? [] : ['Síntomas pendientes de revisión agronómica']),
      management: existing.management || { cultural: [], biological: [], chemical: [] },
      reviewStatus: existing.reviewStatus || REVIEW_STATUS.PENDING_REVIEW,
      reviewedBy: existing.reviewedBy || null,
      reviewedAt: existing.reviewedAt || null,
      sources: existing.sources || ['PlantVillage Dataset / AgroGuard Core'],
    };
  });

  // Guardar archivo JSON actualizado
  fs.writeFileSync(catalogJsonPath, JSON.stringify(updatedCatalogList, null, 2), 'utf-8');

  // Si hay conexión a MongoDB, sembrar en la base de datos
  try {
    await mongoose.connect(config.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    const repo = new MongoConditionCatalogRepository();

    for (const data of updatedCatalogList) {
      const condition = new Condition(data);
      await repo.save(condition);
    }

    await mongoose.disconnect();
  } catch (dbErr) {
    // Si la BD no está corriendo durante build/local, registramos que el JSON fue actualizado
    console.warn('Nota: No se pudo conectar a MongoDB para el seed en BD:', dbErr.message);
  }
}

runSeed()
  .then(() => {
    console.log('Seed del catálogo fitopatológico completado exitosamente.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error fatal al ejecutar seed del catálogo:', err);
    process.exit(1);
  });
