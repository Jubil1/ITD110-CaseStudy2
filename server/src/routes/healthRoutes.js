const express = require('express');
const { getSession, verifyConnectivity } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json({
    app: 'Sangkap API',
    status: 'ok',
    time: new Date().toISOString(),
  });
});

router.get('/db', async (req, res) => {
  const result = await verifyConnectivity();
  if (!result.ok) {
    return res.status(503).json({ db: 'unreachable', error: result.error });
  }

  const session = getSession();
  try {
    const counts = await session.run(`
      MATCH (n) WITH count(n) AS nodeCount
      OPTIONAL MATCH ()-[r]->() WITH nodeCount, count(r) AS relCount
      RETURN nodeCount, relCount
    `);
    const record = counts.records[0];
    res.json({
      db: 'connected',
      nodeCount: record?.get('nodeCount') ?? 0,
      relationshipCount: record?.get('relCount') ?? 0,
    });
  } catch (err) {
    res.status(500).json({ db: 'error', error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
