const path = require("path");
const dotenv = require("dotenv");

const envPath = process.env.ENV_PATH || path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

const requiredVars = ['MONGO_URI'];

requiredVars.forEach((variable) => {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
});

module.exports = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME || "electronics_ecommerce",
  nodeEnv: process.env.NODE_ENV || "development",
};
