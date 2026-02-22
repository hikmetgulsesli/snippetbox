import { Router } from 'express';
import { pool } from '../database/connection.js';

const router = Router();

// Export all snippets
router.get('/export', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      GROUP BY s.id
    `);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=snippets.json');
    res.json({ snippets: result.rows, exported_at: new Date().toISOString() });
  } catch (err) {
    console.error('Error exporting snippets:', err);
    res.status(500).json({ error: 'Failed to export snippets' });
  }
});

// Import snippets
router.post('/import', async (req, res) => {
  const { snippets } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let imported = 0;
    for (const snippet of snippets) {
      const result = await client.query(`
        INSERT INTO snippets (title, description, code, language)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [snippet.title, snippet.description, snippet.code, snippet.language || 'text']);
      
      // Handle tags if present
      if (snippet.tags && snippet.tags.length > 0) {
        for (const tagName of snippet.tags) {
          // Create tag if not exists
          const tagResult = await client.query(`
            INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id
          `, [tagName.toLowerCase()]);
          
          await client.query(`
            INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)
          `, [result.rows[0].id, tagResult.rows[0].id]);
        }
      }
      
      imported++;
    }
    
    await client.query('COMMIT');
    res.json({ imported, message: `Successfully imported ${imported} snippets` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing snippets:', err);
    res.status(500).json({ error: 'Failed to import snippets' });
  } finally {
    client.release();
  }
});

export default router;
