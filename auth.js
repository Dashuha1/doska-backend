const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (db, SECRET) => {
  const router = express.Router();

  // Регистрация
  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
      if (password.length < 6) return res.status(400).json({ error: 'Пароль короче 6 символов' });

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(400).json({ error: 'Email уже зарегистрирован' });

      const hash = await bcrypt.hash(password, 10);
      const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);

      const token = jwt.sign({ userId: result.lastInsertRowid, email }, SECRET, { expiresIn: '30d' });
      res.json({ token, email });
    } catch (err) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  // Вход
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) return res.status(400).json({ error: 'Неверный email или пароль' });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ error: 'Неверный email или пароль' });

      const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '30d' });
      res.json({ token, email: user.email });
    } catch (err) {
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  return router;
};