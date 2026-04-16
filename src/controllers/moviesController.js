const { getDb, run, all, get } = require('../database/db');

async function listMovies(req, res) {
  try {
    const db = await getDb();

    // Query params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const search = req.query.search || '';
    const genre_id = req.query.genre_id;
    const year = req.query.year;
    const director = req.query.director;
    const min_rating = req.query.min_rating;
    const language = req.query.language;

    const allowedSortFields = ['title', 'year', 'rating', 'director', 'duration', 'created_at'];
    const sortBy = allowedSortFields.includes(req.query.sort_by) ? req.query.sort_by : 'title';
    const sortOrder = req.query.sort_order === 'desc' ? 'DESC' : 'ASC';

    let conditions = [];
    let params = [];

    if (search) {
      conditions.push(`(m.title LIKE ? OR m.original_title LIKE ? OR m.director LIKE ? OR m.synopsis LIKE ?)`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (genre_id) {
      conditions.push('m.genre_id = ?');
      params.push(Number(genre_id));
    }
    if (year) {
      conditions.push('m.year = ?');
      params.push(Number(year));
    }
    if (director) {
      conditions.push('m.director LIKE ?');
      params.push(`%${director}%`);
    }
    if (min_rating) {
      conditions.push('m.rating >= ?');
      params.push(Number(min_rating));
    }
    if (language) {
      conditions.push('m.language LIKE ?');
      params.push(`%${language}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = get(db,
      `SELECT COUNT(*) as total FROM movies m ${whereClause}`,
      params
    );
    const total = countRow?.total || 0;

    const movies = all(db,
      `SELECT m.*, g.name as genre_name,
        (SELECT AVG(r.score) FROM reviews r WHERE r.movie_id = m.id) as avg_score,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.movie_id = m.id) as review_count
       FROM movies m
       LEFT JOIN genres g ON m.genre_id = g.id
       ${whereClause}
       ORDER BY m.${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: movies,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page < Math.ceil(total / limit),
        has_prev: page > 1,
      },
      filters: { search, genre_id, year, director, min_rating, language },
      sort: { sort_by: sortBy, sort_order: sortOrder },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function getMovie(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    const movie = get(db,
      `SELECT m.*, g.name as genre_name, g.description as genre_description,
        (SELECT AVG(r.score) FROM reviews r WHERE r.movie_id = m.id) as avg_score,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.movie_id = m.id) as review_count
       FROM movies m
       LEFT JOIN genres g ON m.genre_id = g.id
       WHERE m.id = ?`,
      [Number(id)]
    );

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Filme não encontrado.' });
    }

    const reviews = all(db,
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.movie_id = ?
       ORDER BY r.created_at DESC`,
      [Number(id)]
    );

    return res.status(200).json({ success: true, data: { ...movie, reviews } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function createMovie(req, res) {
  try {
    const db = await getDb();
    const { title, original_title, director, year, duration, synopsis, rating, genre_id, language, country, poster_url } = req.body;

    // Verificar gênero
    const genre = get(db, 'SELECT id FROM genres WHERE id = ?', [Number(genre_id)]);
    if (!genre) {
      return res.status(404).json({ success: false, message: 'Gênero não encontrado.' });
    }

    // Verificar duplicata
    const existing = get(db, 'SELECT id FROM movies WHERE title = ? AND year = ?', [title.trim(), Number(year)]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Já existe um filme com esse título e ano.' });
    }

    const result = run(db,
      `INSERT INTO movies (title, original_title, director, year, duration, synopsis, rating, genre_id, language, country, poster_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), original_title || null, director.trim(), Number(year), Number(duration),
       synopsis || null, rating !== undefined ? Number(rating) : 0, Number(genre_id),
       language || 'Inglês', country || 'EUA', poster_url || null]
    );

    const movie = get(db,
      `SELECT m.*, g.name as genre_name FROM movies m LEFT JOIN genres g ON m.genre_id = g.id WHERE m.id = ?`,
      [result.lastInsertRowid]
    );

    return res.status(201).json({ success: true, message: 'Filme criado com sucesso!', data: movie });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function updateMovie(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    const existing = get(db, 'SELECT * FROM movies WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Filme não encontrado.' });
    }

    const { title, original_title, director, year, duration, synopsis, rating, genre_id, language, country, poster_url } = req.body;

    if (genre_id) {
      const genre = get(db, 'SELECT id FROM genres WHERE id = ?', [Number(genre_id)]);
      if (!genre) {
        return res.status(404).json({ success: false, message: 'Gênero não encontrado.' });
      }
    }

    // Verificar duplicata excluindo o próprio filme
    if (title || year) {
      const checkTitle = title?.trim() || existing.title;
      const checkYear = year ? Number(year) : existing.year;
      const duplicate = get(db, 'SELECT id FROM movies WHERE title = ? AND year = ? AND id != ?', [checkTitle, checkYear, Number(id)]);
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Já existe outro filme com esse título e ano.' });
      }
    }

    run(db,
      `UPDATE movies SET
        title = ?, original_title = ?, director = ?, year = ?, duration = ?,
        synopsis = ?, rating = ?, genre_id = ?, language = ?, country = ?,
        poster_url = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        title?.trim() || existing.title,
        original_title !== undefined ? original_title : existing.original_title,
        director?.trim() || existing.director,
        year ? Number(year) : existing.year,
        duration ? Number(duration) : existing.duration,
        synopsis !== undefined ? synopsis : existing.synopsis,
        rating !== undefined ? Number(rating) : existing.rating,
        genre_id ? Number(genre_id) : existing.genre_id,
        language || existing.language,
        country || existing.country,
        poster_url !== undefined ? poster_url : existing.poster_url,
        Number(id),
      ]
    );

    const updated = get(db,
      `SELECT m.*, g.name as genre_name FROM movies m LEFT JOIN genres g ON m.genre_id = g.id WHERE m.id = ?`,
      [Number(id)]
    );

    return res.status(200).json({ success: true, message: 'Filme atualizado com sucesso!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

async function deleteMovie(req, res) {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) < 1) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    const existing = get(db, 'SELECT id, title FROM movies WHERE id = ?', [Number(id)]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Filme não encontrado.' });
    }

    // Deletar avaliações relacionadas
    run(db, 'DELETE FROM reviews WHERE movie_id = ?', [Number(id)]);
    run(db, 'DELETE FROM movies WHERE id = ?', [Number(id)]);

    return res.status(200).json({ success: true, message: `Filme "${existing.title}" deletado com sucesso.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno.', error: err.message });
  }
}

module.exports = { listMovies, getMovie, createMovie, updateMovie, deleteMovie };
