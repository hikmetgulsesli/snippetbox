import { Router } from 'express';
import { pool } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// Get all snippets
router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      GROUP BY s.id, c.id
      ORDER BY s.updated_at DESC
    `);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching snippets:', err);
        res.status(500).json({ error: 'Failed to fetch snippets' });
    }
});
// Get snippet by ID
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error fetching snippet:', err);
        res.status(500).json({ error: 'Failed to fetch snippet' });
    }
});
// Create snippet
router.post('/', async (req, res) => {
    const { title, description, code, language, collection_id, tags, is_public } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const shareId = is_public ? uuidv4() : null;
        const snippetResult = await client.query(`
      INSERT INTO snippets (title, description, code, language, collection_id, is_public, share_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, code, language, collection_id, is_public || false, shareId]);
        const snippet = snippetResult.rows[0];
        // Add tags if provided
        if (tags && tags.length > 0) {
            for (const tagId of tags) {
                await client.query(`
          INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)
        `, [snippet.id, tagId]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json(snippet);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating snippet:', err);
        res.status(500).json({ error: 'Failed to create snippet' });
    }
    finally {
        client.release();
    }
});
// Update snippet
router.put('/:id', async (req, res) => {
    const { title, description, code, language, collection_id, tags, is_public } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Get current snippet to check if share_id needs to be generated
        const currentResult = await client.query('SELECT is_public, share_id FROM snippets WHERE id = $1', [req.params.id]);
        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        const current = currentResult.rows[0];
        let shareId = current.share_id;
        // Generate share_id if making public for first time
        if (is_public && !current.is_public && !shareId) {
            shareId = uuidv4();
        }
        const result = await client.query(`
      UPDATE snippets 
      SET title = $1, description = $2, code = $3, language = $4, 
          collection_id = $5, is_public = $6, share_id = $7
      WHERE id = $8
      RETURNING *
    `, [title, description, code, language, collection_id, is_public, shareId, req.params.id]);
        // Update tags
        if (tags) {
            await client.query('DELETE FROM snippet_tags WHERE snippet_id = $1', [req.params.id]);
            for (const tagId of tags) {
                await client.query('INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)', [req.params.id, tagId]);
            }
        }
        await client.query('COMMIT');
        res.json(result.rows[0]);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating snippet:', err);
        res.status(500).json({ error: 'Failed to update snippet' });
    }
    finally {
        client.release();
    }
});
// Delete snippet
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM snippets WHERE id = $1', [req.params.id]);
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting snippet:', err);
        res.status(500).json({ error: 'Failed to delete snippet' });
    }
});
export default router;
//# sourceMappingURL=snippets.js.map