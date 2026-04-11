const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const Otp = require("./models/Otp");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// 📩 Send OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();

  try {
    // Remove old OTP
    await Otp.deleteMany({ email });

    // Save OTP to MongoDB
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send Email
    await transporter.sendMail({
      from: `"OTP Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Expires in 5 minutes</p>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "OTP sending failed" });
  }
});

// ✅ Verify OTP
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const record = await Otp.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "OTP expired" });
    }

    await Otp.deleteOne({ _id: record._id });
    res.json({ message: "OTP verified successfully" });

  } catch {
    res.status(500).json({ message: "Verification failed" });
  }
});

app.listen(5000, () =>
  console.log("Server running on port 5000")
);
