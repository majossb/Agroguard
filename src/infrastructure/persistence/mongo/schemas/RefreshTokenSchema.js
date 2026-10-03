import mongoose from 'mongoose';

const refreshTokenMongooseSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // tokenHash
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Índice TTL automático
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

export const RefreshTokenModel =
  mongoose.models.RefreshToken ||
  mongoose.model('RefreshToken', refreshTokenMongooseSchema, 'refresh_tokens');
