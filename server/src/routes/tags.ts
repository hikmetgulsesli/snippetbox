import { Router } from 'express';
import { pool } from '../database/connection.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').default('#10B981'),
});

const addTagToSnippetSchema = z.object({
  tag_id: z.string().uuid('Invalid tag ID').optional(),
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10B981').optional(),
}).refine((data) => data.tag_id || data.name, {
  message: 'Either tag_id or name must be provided',
});

const tagParamsSchema = z.object({
  id: z.string().uuid('Invalid tag ID'),
});

const snippetTagParamsSchema = z.object({
  id: z.string().uuid('Invalid snippet ID'),
  tagId: z.string().uuid('Invalid tag ID'),
});

const autocompleteQuerySchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
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
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to fetch tags' 
      } 
    });
  }
});

// Autocomplete endpoint - MUST be before /:id route
router.get('/autocomplete', validateQuery(autocompleteQuerySchema), async (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { q, limit } = req.query as any;
  
  try {
    const result = await pool.query(`
      SELECT id, name, color
      FROM tags
      WHERE name ILIKE $1
      ORDER BY name
      LIMIT $2
    `, [`%${q}%`, limit]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tag autocomplete:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tag autocomplete',
      },
    });
  }
});

// Get tag by ID with snippets
router.get('/:id', validateParams(tagParamsSchema), async (req, res) => {
  try {
    // Get tag info
    const tagResult = await pool.query(`
      SELECT t.*, COUNT(st.snippet_id) as snippet_count
      FROM tags t
      LEFT JOIN snippet_tags st ON t.id = st.tag_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [req.params.id]);

    if (tagResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      });
    }

    // Get snippets with this tag
    const snippetsResult = await pool.query(`
      SELECT s.id, s.title, s.language, s.is_public, s.updated_at
      FROM snippets s
      JOIN snippet_tags st ON s.id = st.snippet_id
      WHERE st.tag_id = $1
      ORDER BY s.updated_at DESC
    `, [req.params.id]);

    res.json({
      ...tagResult.rows[0],
      snippets: snippetsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching tag:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tag',
      },
    });
  }
});

// Create tag
router.post('/', validateBody(createTagSchema), async (req, res) => {
  const { name, color } = req.body;
  try {
    // Check if tag already exists
    const existing = await pool.query(
      'SELECT * FROM tags WHERE name = LOWER($1)',
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Tag with this name already exists',
        },
      });
    }

    const result = await pool.query(
      'INSERT INTO tags (name, color) VALUES (LOWER($1), $2) RETURNING *',
      [name, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating tag:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create tag',
      },
    });
  }
});

// Update tag - removed updated_at since column doesn't exist
router.put('/:id', validateParams(tagParamsSchema), validateBody(createTagSchema.partial()), async (req, res) => {
  const { name, color } = req.body;
  try {
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = LOWER($${paramIndex})`);
      values.push(name);
      paramIndex++;
    }

    if (color !== undefined) {
      updates.push(`color = $${paramIndex}`);
      values.push(color);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_CHANGES',
          message: 'No fields to update',
        },
      });
    }

    values.push(req.params.id as string | null);

    const result = await pool.query(
      `UPDATE tags SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating tag:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update tag',
      },
    });
  }
});

// Delete tag
router.delete('/:id', validateParams(tagParamsSchema), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tags WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting tag:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete tag',
      },
    });
  }
});

export default router;
