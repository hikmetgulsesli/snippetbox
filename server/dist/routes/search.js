import { Router } from 'express';
import { pool } from '../database/connection.js';
const router = Router();
// Search snippets
router.get('/', async (req, res) => {
    const { q, language, tag, collection, sort = 'updated_at' } = req.query;
    try {
        let query = `
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (q) {
            query += ` AND (s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR s.code ILIKE $${paramIndex})`;
            params.push(`%${q}%`);
            paramIndex++;
        }
        if (language) {
            query += ` AND s.language = $${paramIndex}`;
            params.push(language);
            paramIndex++;
        }
        if (collection) {
            query += ` AND s.collection_id = $${paramIndex}`;
            params.push(collection);
            paramIndex++;
        }
        if (tag) {
            query += ` AND EXISTS (SELECT 1 FROM snippet_tags st2 JOIN tags t2 ON st2.tag_id = t2.id WHERE st2.snippet_id = s.id AND t2.name = $${paramIndex})`;
            params.push(tag.toLowerCase());
            paramIndex++;
        }
        query += ` GROUP BY s.id, c.id`;
        // Sorting
        const allowedSort = ['created_at', 'updated_at', 'title', 'language'];
        const sortColumn = allowedSort.includes(sort) ? sort : 'updated_at';
        query += ` ORDER BY s.${sortColumn} DESC`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error searching snippets:', err);
        res.status(500).json({ error: 'Failed to search snippets' });
    }
});
export default router;
//# sourceMappingURL=search.js.map