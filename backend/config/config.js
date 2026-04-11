import dotenv from 'dotenv';
dotenv.config();

const config = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/saan_db',
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key_here',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  esewa: {
    merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST", // or your real merchant code
    secretKey: process.env.ESEWA_SECRET_KEY || "your_secret_key",
    paymentUrl: process.env.ESEWA_PAYMENT_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    verifyUrl: process.env.ESEWA_VERIFY_URL || "https://rc-epay.esewa.com.np/api/epay/transaction/status/",
  }
};

export default config;
