const express = require('express');
const ctrl = require('../controllers/statsController');

const router = express.Router();

router.get('/dashboard', ctrl.dashboard);

module.exports = router;
