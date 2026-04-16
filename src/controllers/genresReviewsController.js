const { getDb, run, all, get } = require('../database/db');

// ─── GENRES ───────────────────────────────────────────────────────────────────

async function listGenres(req, res) {
  try {
    const db = await getDb();
    const genres = all(db,
      `SELECT g.*, COUNT(m.id) as movie_count
       FROM genres g
       LEFT JOIN movies m ON m.genre_id = g.id
       GROUP BY g.id
       ORDER BY g.name ASC`
    );
    return res.status(200).json({ success: true, data: genres, total: genres.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function getGenre(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    const genre = get(db, 'SELECT * FROM genres WHERE id = ?', [Number(id)]);
    if (!genre) {
      return res.status(404).json({ success: false, message: 'Gênero não encontrado.' });
    }

    const movies = all(db,
      'SELECT id, title, year, director, rating FROM movies WHERE genre_id = ? ORDER BY rating DESC',
      [Number(id)]
    );

    return res.status(200).json({ success: true, data: { ...genre, movies } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function createGenre(req, res) {
  try {
    const db = await getDb();
    const { name, description } = req.body;

    const existing = get(db, 'SELECT id FROM genres WHERE name = ?', [name.trim()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Gênero já cadastrado.' });
    }

    const result = run(db, 'INSERT INTO genres (name, description) VALUES (?, ?)', [name.trim(), description || null]);
    const genre = get(db, 'SELECT * FROM genres WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({ success: true, message: 'Gênero criado com sucesso!', data: genre });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function updateGenre(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { name, description } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    const existing = get(db, 'SELECT * FROM genres WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Gênero não encontrado.' });
    }

    if (name && name.trim() !== existing.name) {
      const duplicate = get(db, 'SELECT id FROM genres WHERE name = ? AND id != ?', [name.trim(), Number(id)]);
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Já existe um gênero com esse nome.' });
      }
    }

    run(db, 'UPDATE genres SET name = ?, description = ? WHERE id = ?',
      [name?.trim() || existing.name, description !== undefined ? description : existing.description, Number(id)]
    );

    const updated = get(db, 'SELECT * FROM genres WHERE id = ?', [Number(id)]);
    return res.status(200).json({ success: true, message: 'Gênero atualizado!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function deleteGenre(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    const existing = get(db, 'SELECT * FROM genres WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Gênero não encontrado.' });
    }

    const movieCount = get(db, 'SELECT COUNT(*) as count FROM movies WHERE genre_id = ?', [Number(id)]);
    if (movieCount?.count > 0) {
      return res.status(409).json({
        success: false,
        message: `Não é possível deletar. Existem ${movieCount.count} filme(s) com este gênero.`,
      });
    }

    run(db, 'DELETE FROM genres WHERE id = ?', [Number(id)]);
    return res.status(200).json({ success: true, message: `Gênero "${existing.name}" deletado com sucesso.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

async function listReviews(req, res) {
  try {
    const db = await getDb();
    const { movie_id } = req.params;

    if (!Number.isInteger(Number(movie_id)) || Number(movie_id) < 1) {
      return res.status(400).json({ success: false, message: 'ID do filme inválido.' });
    }

    const movie = get(db, 'SELECT id, title FROM movies WHERE id = ?', [Number(movie_id)]);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Filme não encontrado.' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const total = get(db, 'SELECT COUNT(*) as count FROM reviews WHERE movie_id = ?', [Number(movie_id)])?.count || 0;
    const avg = get(db, 'SELECT AVG(score) as avg FROM reviews WHERE movie_id = ?', [Number(movie_id)])?.avg || 0;

    const reviews = all(db,
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.movie_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [Number(movie_id), limit, offset]
    );

    return res.status(200).json({
      success: true,
      movie: movie.title,
      avg_score: avg ? Number(avg.toFixed(1)) : null,
      data: reviews,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function createReview(req, res) {
  try {
    const db = await getDb();
    const { movie_id } = req.params;
    const { score, comment } = req.body;

    if (!Number.isInteger(Number(movie_id)) || Number(movie_id) < 1) {
      return res.status(400).json({ success: false, message: 'ID do filme inválido.' });
    }

    const movie = get(db, 'SELECT id FROM movies WHERE id = ?', [Number(movie_id)]);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Filme não encontrado.' });
    }

    const existing = get(db, 'SELECT id FROM reviews WHERE movie_id = ? AND user_id = ?',
      [Number(movie_id), req.user.id]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Você já avaliou este filme. Use PUT para atualizar.' });
    }

    const result = run(db,
      'INSERT INTO reviews (movie_id, user_id, score, comment) VALUES (?, ?, ?, ?)',
      [Number(movie_id), req.user.id, Number(score), comment || null]
    );

    const review = get(db,
      `SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      [result.lastInsertRowid]
    );

    return res.status(201).json({ success: true, message: 'Avaliação criada!', data: review });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function updateReview(req, res) {
  try {
    const db = await getDb();
    const { movie_id, id } = req.params;
    const { score, comment } = req.body;

    const review = get(db, 'SELECT * FROM reviews WHERE id = ? AND movie_id = ?', [Number(id), Number(movie_id)]);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada.' });
    }

    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para editar esta avaliação.' });
    }

    if (score !== undefined) {
      const s = Number(score);
      if (!Number.isInteger(s) || s < 1 || s > 10) {
        return res.status(400).json({ success: false, message: 'Score deve ser entre 1 e 10.' });
      }
    }

    run(db, 'UPDATE reviews SET score = ?, comment = ? WHERE id = ?',
      [score !== undefined ? Number(score) : review.score, comment !== undefined ? comment : review.comment, Number(id)]
    );

    const updated = get(db,
      `SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      [Number(id)]
    );

    return res.status(200).json({ success: true, message: 'Avaliação atualizada!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function deleteReview(req, res) {
  try {
    const db = await getDb();
    const { movie_id, id } = req.params;

    const review = get(db, 'SELECT * FROM reviews WHERE id = ? AND movie_id = ?', [Number(id), Number(movie_id)]);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avaliação não encontrada.' });
    }

    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para deletar esta avaliação.' });
    }

    run(db, 'DELETE FROM reviews WHERE id = ?', [Number(id)]);
    return res.status(200).json({ success: true, message: 'Avaliação deletada com sucesso.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

module.exports = {
  listGenres, getGenre, createGenre, updateGenre, deleteGenre,
  listReviews, createReview, updateReview, deleteReview,
};
