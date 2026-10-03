import mongoose from 'mongoose';

const conditionMongooseSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // classKey (ej. Tomato___Early_blight)
    cropKey: { type: String, required: true, index: true },
    conditionKey: { type: String, required: true },
    isHealthy: { type: Boolean, required: true, index: true },
    names: {
      es: {
        cropName: { type: String, default: '' },
        conditionName: { type: String, default: '' },
      },
    },
    description: { type: String, default: '' },
    symptoms: [{ type: String }],
    management: {
      cultural: [{ type: String }],
      biological: [{ type: String }],
      chemical: [{ type: String }],
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING_REVIEW', 'REVIEWED'],
      default: 'PENDING_REVIEW',
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    sources: [{ type: String }],
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

export const ConditionModel =
  mongoose.models.Condition ||
  mongoose.model('Condition', conditionMongooseSchema, 'conditions');
