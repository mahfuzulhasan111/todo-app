const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use('/tasks', tasksRouter);

app.get('/debug-db', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      cwd: process.cwd(),
      rows: rows
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});