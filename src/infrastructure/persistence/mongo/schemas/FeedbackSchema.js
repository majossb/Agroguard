import mongoose from 'mongoose';

const feedbackMongooseSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // UUID
    diagnosisId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    wasCorrect: { type: Boolean, required: true },
    correctClassKey: { type: String, default: null },
    comment: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

export const FeedbackModel =
  mongoose.models.Feedback ||
  mongoose.model('Feedback', feedbackMongooseSchema, 'feedback');
