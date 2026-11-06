const express = require('express');
const jwt = require('jsonwebtoken');

// Мидлвар для проверки токена
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Нет токена' });

  try {
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, req.app.get('secret'));
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

module.exports = (db, SECRET) => {
  const router = express.Router();
  
  // Передаем секрет в app для мидлвара
  router.use((req, res, next) => {
    req.app.set('secret', SECRET);
    next();
  });

  // Получить доски
  router.get('/', auth, (req, res) => {
    const boards = db.prepare('SELECT id, name, created_at FROM boards WHERE user_id = ? ORDER BY id DESC').all(req.userId);
    res.json(boards);
  });

  // Создать доску
  router.post('/', auth, (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Название обязательно' });

    const result = db.prepare('INSERT INTO boards (user_id, name) VALUES (?, ?)').run(req.userId, name.trim());
    const board = db.prepare('SELECT id, name, created_at FROM boards WHERE id = ?').get(result.lastInsertRowid);
    res.json(board);
  });

  // Удалить доску
  router.delete('/:id', auth, (req, res) => {
    const board = db.prepare('SELECT id FROM boards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!board) return res.status(404).json({ error: 'Доска не найдена' });

    db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  return router;
};