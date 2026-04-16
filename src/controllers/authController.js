const bcrypt = require('bcryptjs');
const { getDb, run, get } = require('../database/db');
const { generateToken } = require('../middleware/auth');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const db = await getDb();

    const existing = get(db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'E-mail já cadastrado.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = run(db, 
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const user = get(db, 'SELECT id, name, email, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso!',
      data: { user, token },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
    }

    const db = await getDb();
    const user = get(db, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: err.message });
  }
}

async function me(req, res) {
  return res.status(200).json({ success: true, data: req.user });
}

module.exports = { register, login, me };
