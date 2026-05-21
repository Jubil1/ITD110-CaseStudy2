const repo = require('../models/backupRepo');

async function exportJson(req, res) {
  try {
    const data = await repo.exportGraph();
    const filename = `sangkap-backup-${new Date().toISOString().slice(0, 10)}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(data);
  } catch (err) {
    console.error('[backup.export]', err);
    res.status(500).json({ error: 'failed to export graph backup' });
  }
}

async function importJson(req, res) {
  try {
    const { backup, replace } = req.body || {};
    if (!backup) {
      return res.status(400).json({ error: 'backup JSON body is required' });
    }

    const result = await repo.importGraph(backup, { replace: Boolean(replace) });
    res.json({
      ok: true,
      message: replace
        ? 'Database replaced and backup restored.'
        : 'Backup merged into the graph.',
      ...result,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[backup.import]', err);
    res.status(500).json({ error: 'failed to import backup' });
  }
}

module.exports = { exportJson, importJson };
