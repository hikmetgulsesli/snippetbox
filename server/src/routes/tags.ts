import { Router } from 'express';
import { pool } from '../database/connection.js';

const router = Router();

// Get all tags with snippet counts
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, COUNT(st.snippet_id) as snippet_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id
      ORDER BY snippet_count DESC, t.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create tag
router.post('/', async (req, res) => {
  const { name, color } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *
    `, [name.toLowerCase(), color || '#10B981']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating tag:', err);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Delete tag
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tags WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting tag:', err);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
