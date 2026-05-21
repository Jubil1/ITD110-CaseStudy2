require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const statsRoutes = require('./routes/statsRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/backup', backupRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.use((err, req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
