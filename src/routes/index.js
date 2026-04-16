const express = require('express');
const router = express.Router();

const { register, login, me } = require('../controllers/authController');
const { listMovies, getMovie, createMovie, updateMovie, deleteMovie } = require('../controllers/moviesController');
const {
  listGenres, getGenre, createGenre, updateGenre, deleteGenre,
  listReviews, createReview, updateReview, deleteReview,
} = require('../controllers/genresReviewsController');

const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateMovie, validateUser, validateReview, validateGenre } = require('../middleware/validate');

// ─── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', validateUser, register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);

// ─── MOVIES ───────────────────────────────────────────────────────────────────
router.get('/movies', listMovies);
router.get('/movies/:id', getMovie);
router.post('/movies', authenticate, requireAdmin, validateMovie, createMovie);
router.put('/movies/:id', authenticate, requireAdmin, validateMovie, updateMovie);
router.delete('/movies/:id', authenticate, requireAdmin, deleteMovie);

// ─── GENRES ───────────────────────────────────────────────────────────────────
router.get('/genres', listGenres);
router.get('/genres/:id', getGenre);
router.post('/genres', authenticate, requireAdmin, validateGenre, createGenre);
router.put('/genres/:id', authenticate, requireAdmin, validateGenre, updateGenre);
router.delete('/genres/:id', authenticate, requireAdmin, deleteGenre);

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
router.get('/movies/:movie_id/reviews', listReviews);
router.post('/movies/:movie_id/reviews', authenticate, validateReview, createReview);
router.put('/movies/:movie_id/reviews/:id', authenticate, validateReview, updateReview);
router.delete('/movies/:movie_id/reviews/:id', authenticate, deleteReview);

module.exports = router;
