const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  db.all('SELECT * FROM tasks', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run('INSERT INTO tasks (title, completed) VALUES (?, ?)', [title, 0], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, title, completed: 0 });
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  if (title === undefined && completed === undefined) {
    return res.status(400).json({ error: 'Title or completed field is required' });
  }

  let query = 'UPDATE tasks SET ';
  const params = [];

  if (title !== undefined) {
    query += 'title = ?';
    params.push(title);
  }
  if (completed !== undefined) {
    if (title !== undefined) query += ', ';
    query += 'completed = ?';
    params.push(completed);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task updated', id: parseInt(id) });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted', id: parseInt(id) });
  });
});

module.exports = router;