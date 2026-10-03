import mongoose from 'mongoose';

const diagnosisMongooseSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // UUID
    ownerId: { type: String, default: null, index: true },
    image: {
      storageKey: { type: String, default: null },
      mimeType: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      sha256: { type: String, required: true },
    },
    verdict: {
      healthStatus: {
        type: String,
        enum: ['HEALTHY', 'DISEASED', 'INCONCLUSIVE'],
        required: true,
      },
      confidence: { type: Number, required: true },
      healthyProbability: { type: Number, required: true },
    },
    prediction: {
      classKey: { type: String, required: true },
      cropKey: { type: String, required: true },
      conditionKey: { type: String, required: true },
      cropName: { type: String, default: '' },
      conditionName: { type: String, default: '' },
    },
    topPredictions: [
      {
        classKey: { type: String, required: true },
        probability: { type: Number, required: true },
      },
    ],
    warnings: [{ type: String }],
    message: { type: String, default: null },
    model: {
      name: { type: String, required: true },
      version: { type: String, required: true },
      provider: { type: String, required: true },
    },
    processingTimeMs: { type: Number, required: true },
    context: {
      plotName: { type: String, default: null },
      cropHint: { type: String, default: null },
      notes: { type: String, default: null },
    },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

// Índices compuestos recomendados para filtrado e historial
diagnosisMongooseSchema.index({ ownerId: 1, createdAt: -1 });
diagnosisMongooseSchema.index({ ownerId: 1, 'verdict.healthStatus': 1, createdAt: -1 });
diagnosisMongooseSchema.index({ ownerId: 1, 'prediction.cropKey': 1, createdAt: -1 });

export const DiagnosisModel =
  mongoose.models.Diagnosis ||
  mongoose.model('Diagnosis', diagnosisMongooseSchema, 'diagnoses');
