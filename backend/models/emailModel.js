import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model(
  "EmailVerification",
  emailVerificationSchema
);
