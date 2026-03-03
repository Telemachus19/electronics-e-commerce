const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');

const startServer = async () => {
  try {
    await connectDatabase(env.mongoUri, env.dbName);
    app.listen(env.port, () => {
      console.log(`Backend server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error.message);
    process.exit(1);
  }
};

startServer();