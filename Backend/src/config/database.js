const mongoose = require("mongoose");

const connectDatabase = async (mongoUri, dbName) => {
  const options = {
    dbName,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(mongoUri, options);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

module.exports = { connectDatabase };
