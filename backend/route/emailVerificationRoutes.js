import express from "express";
import {
  sendVerificationEmail,
  verifyEmail,
} from "../controllers/emailVerificationController.js";

const router = express.Router();

router.post("/send", sendVerificationEmail);
router.get("/verify/:token", verifyEmail);

export default router;
