require('dotenv').config();
const express = require('express');
const { initDatabase, seedDatabase } = require('./src/database/init');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS simples
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rota de saúde
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎬 Movies API - Projeto Final',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      movies: ['GET /api/movies', 'GET /api/movies/:id', 'POST /api/movies', 'PUT /api/movies/:id', 'DELETE /api/movies/:id'],
      genres: ['GET /api/genres', 'GET /api/genres/:id', 'POST /api/genres', 'PUT /api/genres/:id', 'DELETE /api/genres/:id'],
      reviews: ['GET /api/movies/:id/reviews', 'POST /api/movies/:id/reviews', 'PUT /api/movies/:id/reviews/:reviewId', 'DELETE /api/movies/:id/reviews/:reviewId'],
    },
    filters_available: ['search', 'genre_id', 'year', 'director', 'min_rating', 'language', 'sort_by', 'sort_order', 'page', 'limit'],
  });
});

// Rotas da API
app.use('/api', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Rota ${req.method} ${req.path} não encontrada.` });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

// Inicializar banco e iniciar servidor
(async () => {
  try {
    await initDatabase();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📚 Documentação: http://localhost:${PORT}/`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar:', err);
    process.exit(1);
  }
})();

module.exports = app;
