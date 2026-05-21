const express = require('express');
const ctrl = require('../controllers/backupController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/json', ctrl.exportJson);
router.post('/import', requireAuth, ctrl.importJson);

module.exports = router;
