require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

app.use(cors()); // Разрешаем запросы с Netlify
app.use(express.json());

// === РОУТЫ ===
const authRoutes = require('./routes/auth')(db, SECRET);
const boardRoutes = require('./routes/boards')(db, SECRET);

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

// Проверка сервера
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`✅ Сервер работает: http://localhost:${PORT}`);
});