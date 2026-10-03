import mongoose from 'mongoose';

const userMongooseSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['FARMER'],
      default: 'FARMER',
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

export const UserModel = mongoose.models.User || mongoose.model('User', userMongooseSchema, 'users');
