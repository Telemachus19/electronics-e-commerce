const mongoose = require('mongoose');

const connectDatabase = async (mongoUri, dbName) => {
  await mongoose.connect(mongoUri, { dbName });
  console.log('MongoDB connected successfully');
};

module.exports = { connectDatabase };