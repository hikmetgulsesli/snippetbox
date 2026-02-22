import { Router } from 'express';
import { pool } from '../database/connection.js';
const router = Router();
// Get all collections with snippet counts
router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT c.*, COUNT(s.id) as snippet_count
      FROM collections c
      LEFT JOIN snippets s ON c.id = s.collection_id
      GROUP BY c.id
      ORDER BY c.name
    `);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching collections:', err);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});
// Create collection
router.post('/', async (req, res) => {
    const { name, description, color } = req.body;
    try {
        const result = await pool.query(`
      INSERT INTO collections (name, description, color) VALUES ($1, $2, $3) RETURNING *
    `, [name, description, color || '#3B82F6']);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Error creating collection:', err);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});
// Update collection
router.put('/:id', async (req, res) => {
    const { name, description, color } = req.body;
    try {
        const result = await pool.query(`
      UPDATE collections SET name = $1, description = $2, color = $3 WHERE id = $4 RETURNING *
    `, [name, description, color, req.params.id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error updating collection:', err);
        res.status(500).json({ error: 'Failed to update collection' });
    }
});
// Delete collection
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM collections WHERE id = $1', [req.params.id]);
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting collection:', err);
        res.status(500).json({ error: 'Failed to delete collection' });
    }
});
export default router;
//# sourceMappingURL=collections.js.map