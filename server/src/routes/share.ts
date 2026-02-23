import { Router } from 'express';
import { pool } from '../database/connection.js';
import { z } from 'zod';
import { validateParams } from '../middleware/validateRequest.js';

const router = Router();

const shareParamsSchema = z.object({
  shareId: z.string().min(1),
});

// Get public snippet by shareId
router.get('/:shareId', validateParams(shareParamsSchema), async (req, res) => {
  try {
    const { shareId } = req.params;
    
    const result = await pool.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.share_id = $1 AND s.is_public = true
      GROUP BY s.id, c.id
    `, [shareId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Snippet not found or not public' 
        } 
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching public snippet:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to fetch snippet' 
      } 
    });
  }
});

export default router;
