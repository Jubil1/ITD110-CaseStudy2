const repo = require('../models/statsRepo');

async function dashboard(req, res) {
  try {
    const data = await repo.dashboard();
    res.json(data);
  } catch (err) {
    console.error('[stats.dashboard]', err);
    res.status(500).json({ error: 'failed to load dashboard data' });
  }
}

module.exports = { dashboard };
