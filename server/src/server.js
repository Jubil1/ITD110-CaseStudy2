require('dotenv').config();
const app = require('./app');
const { verifyConnectivity, closeDriver } = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  const dbStatus = await verifyConnectivity();
  if (dbStatus.ok) {
    console.log('[neo4j] connection verified ✓');
  } else {
    console.warn('[neo4j] connection failed:', dbStatus.error);
    console.warn('[neo4j] server will still start; fix .env and restart');
  }

  const server = app.listen(PORT, () => {
    console.log(`[sangkap-api] listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[sangkap-api] ${signal} received, shutting down...`);
    server.close(async () => {
      await closeDriver();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
