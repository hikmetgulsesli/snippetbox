import { Router } from 'express';
import { pool } from '../database/connection.js';
const router = Router();
// Get dashboard statistics
router.get('/', async (_req, res) => {
    try {
        // Total snippets
        const totalResult = await pool.query('SELECT COUNT(*) as total FROM snippets');
        // Snippets by language
        const languageResult = await pool.query(`
      SELECT language, COUNT(*) as count FROM snippets GROUP BY language ORDER BY count DESC
    `);
        // Recent snippets
        const recentResult = await pool.query(`
      SELECT id, title, language, created_at FROM snippets ORDER BY created_at DESC LIMIT 10
    `);
        // Most used tags
        const tagsResult = await pool.query(`
      SELECT t.name, t.color, COUNT(st.snippet_id) as count
      FROM tags t
      JOIN snippet_tags st ON t.id = st.tag_id
      GROUP BY t.id
      ORDER BY count DESC
      LIMIT 10
    `);
        // Collection sizes
        const collectionsResult = await pool.query(`
      SELECT c.name, c.color, COUNT(s.id) as count
      FROM collections c
      LEFT JOIN snippets s ON c.id = s.collection_id
      GROUP BY c.id
      ORDER BY count DESC
    `);
        // Snippets over time (last 30 days)
        const timelineResult = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM snippets
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
        res.json({
            total_snippets: parseInt(totalResult.rows[0].total),
            by_language: languageResult.rows,
            recent_snippets: recentResult.rows,
            top_tags: tagsResult.rows,
            collection_sizes: collectionsResult.rows,
            timeline: timelineResult.rows
        });
    }
    catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});
export default router;
//# sourceMappingURL=stats.js.map