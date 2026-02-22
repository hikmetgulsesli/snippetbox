import { Router } from 'express';
import { pool } from '../database/connection.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js';
import { z } from 'zod';
const router = Router();
// Validation schemas
const createTagSchema = z.object({
    name: z.string().min(1, 'Tag name is required').max(100, 'Tag name too long'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code').optional(),
});
const tagParamsSchema = z.object({
    id: z.string().uuid('Invalid tag ID'),
});
const autocompleteQuerySchema = z.object({
    q: z.string().min(1, 'Query is required'),
    limit: z.coerce.number().int().min(1).max(20).default(10),
});
const addTagToSnippetSchema = z.object({
    tag_id: z.string().uuid('Invalid tag ID').optional(),
    name: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).refine((data) => data.tag_id || data.name, {
    message: 'Either tag_id or name must be provided',
});
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
    }
    catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch tags'
            }
        });
    }
});
// Tag autocomplete endpoint
router.get('/autocomplete', validateQuery(autocompleteQuerySchema), async (req, res) => {
    const { q, limit } = req.query;
    try {
        const result = await pool.query(`
      SELECT t.*, COUNT(st.snippet_id) as snippet_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      WHERE t.name ILIKE $1
      GROUP BY t.id
      ORDER BY snippet_count DESC, t.name
      LIMIT $2
    `, [`%${q}%`, limit]);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error searching tags:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to search tags'
            }
        });
    }
});
// Get single tag by ID
router.get('/:id', validateParams(tagParamsSchema), async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT t.*, COUNT(st.snippet_id) as snippet_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tag not found'
                }
            });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error fetching tag:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch tag'
            }
        });
    }
});
// Create tag
router.post('/', validateBody(createTagSchema), async (req, res) => {
    const { name, color } = req.body;
    try {
        // Check if tag already exists
        const existing = await pool.query('SELECT * FROM tags WHERE name = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
            return res.status(409).json({
                error: {
                    code: 'ALREADY_EXISTS',
                    message: 'Tag with this name already exists'
                }
            });
        }
        const result = await pool.query(`
      INSERT INTO tags (name, color) VALUES (LOWER($1), $2) RETURNING *
    `, [name, color || '#10B981']);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Error creating tag:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create tag'
            }
        });
    }
});
// Update tag
router.put('/:id', validateParams(tagParamsSchema), validateBody(createTagSchema.partial()), async (req, res) => {
    const { name, color } = req.body;
    try {
        const result = await pool.query(`
      UPDATE tags 
      SET name = COALESCE(LOWER($1), name), 
          color = COALESCE($2, color)
      WHERE id = $3
      RETURNING *
    `, [name, color, req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tag not found'
                }
            });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error updating tag:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update tag'
            }
        });
    }
});
// Delete tag
router.delete('/:id', validateParams(tagParamsSchema), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tag not found'
                }
            });
        }
        res.status(204).send();
    }
    catch (err) {
        console.error('Error deleting tag:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to delete tag'
            }
        });
    }
});
// Add tag to snippet (creates new tag if name provided, or uses existing if tag_id provided)
router.post('/snippets/:id/tags', validateParams(z.object({ id: z.string().uuid() })), validateBody(addTagToSnippetSchema), async (req, res) => {
    const { id } = req.params;
    const { tag_id, name, color } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Verify snippet exists
        const snippetResult = await client.query('SELECT id FROM snippets WHERE id = $1', [id]);
        if (snippetResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Snippet not found'
                }
            });
        }
        let finalTagId = tag_id;
        // If name provided instead of tag_id, find or create tag
        if (name && !tag_id) {
            const existingTag = await client.query('SELECT * FROM tags WHERE name = LOWER($1)', [name]);
            if (existingTag.rows.length > 0) {
                finalTagId = existingTag.rows[0].id;
            }
            else {
                // Create new tag
                const newTag = await client.query('INSERT INTO tags (name, color) VALUES (LOWER($1), $2) RETURNING id', [name, color || '#10B981']);
                finalTagId = newTag.rows[0].id;
            }
        }
        // Add tag to snippet (ignore if already exists)
        await client.query(`
      INSERT INTO snippet_tags (snippet_id, tag_id) 
      VALUES ($1, $2) 
      ON CONFLICT (snippet_id, tag_id) DO NOTHING
    `, [id, finalTagId]);
        // Get updated snippet with tags
        const updatedSnippet = await client.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);
        await client.query('COMMIT');
        res.json(updatedSnippet.rows[0]);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Error adding tag to snippet:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to add tag to snippet'
            }
        });
    }
    finally {
        client.release();
    }
});
// Remove tag from snippet
router.delete('/snippets/:snippetId/tags/:tagId', validateParams(z.object({
    snippetId: z.string().uuid(),
    tagId: z.string().uuid()
})), async (req, res) => {
    const { snippetId, tagId } = req.params;
    try {
        const result = await pool.query('DELETE FROM snippet_tags WHERE snippet_id = $1 AND tag_id = $2 RETURNING *', [snippetId, tagId]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tag association not found'
                }
            });
        }
        res.status(204).send();
    }
    catch (err) {
        console.error('Error removing tag from snippet:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to remove tag from snippet'
            }
        });
    }
});
// Get snippets by tag (with AND/OR logic)
router.get('/:id/snippets', validateParams(tagParamsSchema), validateQuery(z.object({
    operator: z.enum(['AND', 'OR']).default('OR'),
    additional_tags: z.string().optional(), // comma-separated list of tag IDs
})), async (req, res) => {
    const { id } = req.params;
    const { operator, additional_tags } = req.query;
    try {
        // First check if tag exists
        const tagCheck = await pool.query('SELECT id FROM tags WHERE id = $1', [id]);
        if (tagCheck.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Tag not found'
                }
            });
        }
        let query;
        let params = [id];
        if (additional_tags) {
            const tagIds = additional_tags.split(',').filter(Boolean);
            if (tagIds.length === 0) {
                // No valid additional tags, just use the main tag
                query = `
          SELECT s.*, 
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
              FILTER (WHERE t.id IS NOT NULL), '[]') as tags
          FROM snippets s
          INNER JOIN snippet_tags st ON s.id = st.snippet_id
          LEFT JOIN snippet_tags st2 ON s.id = st2.snippet_id
          LEFT JOIN tags t ON st2.tag_id = t.id
          WHERE st.tag_id = $1
          GROUP BY s.id
          ORDER BY s.updated_at DESC
        `;
            }
            else if (operator === 'AND') {
                // Snippets must have ALL specified tags
                const allTagIds = [id, ...tagIds];
                query = `
          SELECT s.*, 
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
              FILTER (WHERE t.id IS NOT NULL), '[]') as tags
          FROM snippets s
          INNER JOIN snippet_tags st ON s.id = st.snippet_id
          LEFT JOIN snippet_tags st2 ON s.id = st2.snippet_id
          LEFT JOIN tags t ON st2.tag_id = t.id
          WHERE st.tag_id = ANY($1::uuid[])
          GROUP BY s.id
          HAVING COUNT(DISTINCT st.tag_id) = $2
          ORDER BY s.updated_at DESC
        `;
                params = [allTagIds.join(','), allTagIds.length.toString()];
            }
            else {
                // Snippets must have ANY of the specified tags (OR)
                const allTagIds = [id, ...tagIds];
                query = `
          SELECT DISTINCT s.*, 
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
              FILTER (WHERE t.id IS NOT NULL), '[]') as tags
          FROM snippets s
          INNER JOIN snippet_tags st ON s.id = st.snippet_id
          LEFT JOIN snippet_tags st2 ON s.id = st2.snippet_id
          LEFT JOIN tags t ON st2.tag_id = t.id
          WHERE st.tag_id = ANY($1::uuid[])
          GROUP BY s.id
          ORDER BY s.updated_at DESC
        `;
                params = [allTagIds.join(',')];
            }
        }
        else {
            // Just get snippets for this tag
            query = `
        SELECT s.*, 
          COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
            FILTER (WHERE t.id IS NOT NULL), '[]') as tags
        FROM snippets s
        INNER JOIN snippet_tags st ON s.id = st.snippet_id
        LEFT JOIN snippet_tags st2 ON s.id = st2.snippet_id
        LEFT JOIN tags t ON st2.tag_id = t.id
        WHERE st.tag_id = $1
        GROUP BY s.id
        ORDER BY s.updated_at DESC
      `;
        }
        const result = await pool.query(query, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching snippets by tag:', err);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch snippets by tag'
            }
        });
    }
});
export default router;
//# sourceMappingURL=tags.js.map