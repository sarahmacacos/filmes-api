function validateMovie(req, res, next) {
  const { title, director, year, duration, genre_id } = req.body;
  const errors = [];

  if (!title || title.trim().length < 1)
    errors.push('O campo "title" é obrigatório.');
  if (title && title.trim().length > 200)
    errors.push('O campo "title" deve ter no máximo 200 caracteres.');

  if (!director || director.trim().length < 2)
    errors.push('O campo "director" é obrigatório e deve ter pelo menos 2 caracteres.');

  if (!year)
    errors.push('O campo "year" é obrigatório.');
  else if (!Number.isInteger(Number(year)) || Number(year) < 1888 || Number(year) > new Date().getFullYear() + 5)
    errors.push(`O campo "year" deve ser um ano válido entre 1888 e ${new Date().getFullYear() + 5}.`);

  if (!duration)
    errors.push('O campo "duration" é obrigatório (duração em minutos).');
  else if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 600)
    errors.push('O campo "duration" deve ser um número inteiro entre 1 e 600 minutos.');

  if (!genre_id)
    errors.push('O campo "genre_id" é obrigatório.');
  else if (!Number.isInteger(Number(genre_id)) || Number(genre_id) < 1)
    errors.push('O campo "genre_id" deve ser um ID de gênero válido.');

  if (req.body.rating !== undefined) {
    const rating = Number(req.body.rating);
    if (isNaN(rating) || rating < 0 || rating > 10)
      errors.push('O campo "rating" deve ser um número entre 0 e 10.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Dados inválidos.', errors });
  }

  next();
}

function validateUser(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push('O campo "name" é obrigatório e deve ter pelo menos 2 caracteres.');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('O campo "email" deve ser um endereço de e-mail válido.');

  if (!password || password.length < 6)
    errors.push('O campo "password" é obrigatório e deve ter pelo menos 6 caracteres.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Dados inválidos.', errors });
  }

  next();
}

function validateReview(req, res, next) {
  const { score } = req.body;
  const errors = [];

  if (score === undefined || score === null)
    errors.push('O campo "score" é obrigatório.');
  else if (!Number.isInteger(Number(score)) || Number(score) < 1 || Number(score) > 10)
    errors.push('O campo "score" deve ser um número inteiro entre 1 e 10.');

  if (req.body.comment && req.body.comment.length > 1000)
    errors.push('O campo "comment" deve ter no máximo 1000 caracteres.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Dados inválidos.', errors });
  }

  next();
}

function validateGenre(req, res, next) {
  const { name } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2)
    errors.push('O campo "name" é obrigatório e deve ter pelo menos 2 caracteres.');

  if (name && name.trim().length > 100)
    errors.push('O campo "name" deve ter no máximo 100 caracteres.');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Dados inválidos.', errors });
  }

  next();
}

module.exports = { validateMovie, validateUser, validateReview, validateGenre };
