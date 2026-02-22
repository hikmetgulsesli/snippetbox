import { Router } from 'express';
import { pool } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.js';
import { 
  createSnippetSchema, 
  updateSnippetSchema, 
  snippetParamsSchema, 
  listSnippetsQuerySchema,
  detectLanguage 
} from '../middleware/validation.js';

const router = Router();

// Get all snippets with pagination and filtering
router.get('/', validateQuery(listSnippetsQuerySchema), async (req, res) => {
  const { 
    limit, 
    offset, 
    search, 
    language, 
    collection_id, 
    tag, 
    tags,
    tag_mode,
    sort_by, 
    sort_order 
  } = req.query as unknown as ReturnType<typeof listSnippetsQuerySchema.parse>;

  try {
    let whereClause = 'WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (
        s.title ILIKE $${paramIndex} 
        OR s.description ILIKE $${paramIndex} 
        OR s.code ILIKE $${paramIndex}
        OR to_tsvector('english', s.title || ' ' || COALESCE(s.description, '') || ' ' || s.code) 
           @@ plainto_tsquery('english', $${paramIndex})
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (language) {
      whereClause += ` AND s.language = $${paramIndex}`;
      params.push(language);
      paramIndex++;
    }

    if (collection_id) {
      whereClause += ` AND s.collection_id = $${paramIndex}`;
      params.push(collection_id);
      paramIndex++;
    }

    if (tag) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM snippet_tags st 
        JOIN tags t ON st.tag_id = t.id 
        WHERE st.snippet_id = s.id AND t.name = LOWER($${paramIndex})
      )`;
      params.push(tag);
      paramIndex++;
    }

    // Filter by multiple tags with AND/OR logic
    if (tags) {
      const tagIds = tags.split(',').filter(id => id.trim());
      if (tagIds.length > 0) {
        if (tag_mode === 'and') {
          // AND mode: snippet must have ALL specified tags
          whereClause += ` AND (
            SELECT COUNT(DISTINCT st.tag_id)
            FROM snippet_tags st
            WHERE st.snippet_id = s.id AND st.tag_id IN (${tagIds.map((_, i) => `$${paramIndex + i}`).join(',')})
          ) = ${tagIds.length}`;
          params.push(...tagIds);
          paramIndex += tagIds.length;
        } else {
          // OR mode: snippet must have ANY of the specified tags
          whereClause += ` AND EXISTS (
            SELECT 1 FROM snippet_tags st
            WHERE st.snippet_id = s.id AND st.tag_id IN (${tagIds.map((_, i) => `$${paramIndex + i}`).join(',')})
          )`;
          params.push(...tagIds);
          paramIndex += tagIds.length;
        }
      }
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM snippets s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get snippets
    const dataParams = [...params, limit, offset];
    const result = await pool.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color, 'description', c.description) ELSE NULL END as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      ${whereClause}
      GROUP BY s.id, c.id
      ORDER BY s.${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `, dataParams);

    res.json({
      data: result.rows,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total,
      },
    });
  } catch (err) {
    console.error('Error fetching snippets:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to fetch snippets' 
      } 
    });
  }
});

// Get snippet by ID
router.get('/:id', validateParams(snippetParamsSchema), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color, 'description', c.description) ELSE NULL END as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Snippet not found' 
        } 
      });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching snippet:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to fetch snippet' 
      } 
    });
  }
});

// Create snippet
router.post('/', validateBody(createSnippetSchema), async (req, res) => {
  const { 
    title, 
    description, 
    code, 
    language, 
    collection_id, 
    tag_ids, 
    is_public,
    filename 
  } = req.body;

  // Auto-detect language if not provided
  const detectedLanguage = language || detectLanguage(code, filename);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const shareId = is_public ? uuidv4() : null;
    
    const snippetResult = await client.query(`
      INSERT INTO snippets (title, description, code, language, collection_id, is_public, share_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description || null, code, detectedLanguage, collection_id || null, is_public || false, shareId]);
    
    const snippet = snippetResult.rows[0];
    
    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await client.query(`
          INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)
        `, [snippet.id, tagId]);
      }
    }
    
    // Fetch complete snippet with relations
    const completeResult = await client.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color, 'description', c.description) ELSE NULL END as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `, [snippet.id]);
    
    await client.query('COMMIT');
    res.status(201).json(completeResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating snippet:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to create snippet' 
      } 
    });
  } finally {
    client.release();
  }
});

// Update snippet
router.put('/:id', validateParams(snippetParamsSchema), validateBody(updateSnippetSchema), async (req, res) => {
  const { 
    title, 
    description, 
    code, 
    language, 
    collection_id, 
    tag_ids, 
    is_public,
    filename 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get current snippet to check if share_id needs to be generated
    const currentResult = await client.query(
      'SELECT is_public, share_id FROM snippets WHERE id = $1', 
      [req.params.id]
    );
    
    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Snippet not found' 
        } 
      });
    }
    
    const current = currentResult.rows[0];
    let shareId = current.share_id;
    
    // Generate share_id if making public for first time
    if (is_public && !current.is_public && !shareId) {
      shareId = uuidv4();
    }

    // Auto-detect language if code changed and language not explicitly provided
    let finalLanguage = language;
    if (code && !language) {
      finalLanguage = detectLanguage(code, filename);
    }
    
    await client.query(`
      UPDATE snippets 
      SET title = COALESCE($1, title), 
          description = COALESCE($2, description), 
          code = COALESCE($3, code),
          language = COALESCE($4, language),
          collection_id = $5,
          is_public = COALESCE($6, is_public),
          share_id = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      title, 
      description, 
      code, 
      finalLanguage, 
      collection_id === null ? null : collection_id, 
      is_public, 
      shareId, 
      req.params.id
    ]);
    
    // Update tags if provided
    if (tag_ids !== undefined) {
      await client.query('DELETE FROM snippet_tags WHERE snippet_id = $1', [req.params.id]);
      for (const tagId of tag_ids) {
        await client.query(
          'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)', 
          [req.params.id, tagId]
        );
      }
    }
    
    // Fetch complete snippet with relations
    const completeResult = await client.query(`
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color, 'description', c.description) ELSE NULL END as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `, [req.params.id]);
    
    await client.query('COMMIT');
    res.json(completeResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating snippet:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to update snippet' 
      } 
    });
  } finally {
    client.release();
  }
});

// Delete snippet
router.delete('/:id', validateParams(snippetParamsSchema), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM snippets WHERE id = $1 RETURNING id', 
      [req.params.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Snippet not found' 
        } 
      });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting snippet:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to delete snippet' 
      } 
    });
  }
});

// Copy snippet (for analytics)
router.post('/:id/copy', validateParams(snippetParamsSchema), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT code, title FROM snippets WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Snippet not found' 
        } 
      });
    }

    res.json({
      message: 'Snippet code ready for copy',
      code: result.rows[0].code,
      title: result.rows[0].title,
    });
  } catch (err) {
    console.error('Error preparing snippet copy:', err);
    res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to prepare snippet copy' 
      } 
    });
  }
});

// Add tag to snippet
router.post('/:id/tags', validateParams(snippetParamsSchema), async (req, res) => {
  const { id } = req.params;
  const { tag_id, name, color } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify snippet exists
    const snippetResult = await client.query(
      'SELECT id FROM snippets WHERE id = $1',
      [id]
    );

    if (snippetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Snippet not found',
        },
      });
    }

    let finalTagId = tag_id;

    // If no tag_id provided, create or find tag by name
    if (!finalTagId && name) {
      const existingTag = await client.query(
        'SELECT id FROM tags WHERE name = LOWER($1)',
        [name]
      );

      if (existingTag.rows.length > 0) {
        finalTagId = existingTag.rows[0].id;
      } else {
        const newTag = await client.query(
          'INSERT INTO tags (name, color) VALUES (LOWER($1), $2) RETURNING id',
          [name, color || '#10B981']
        );
        finalTagId = newTag.rows[0].id;
      }
    }

    if (!finalTagId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Either tag_id or name must be provided',
        },
      });
    }

    // Check if association already exists
    const existingAssoc = await client.query(
      'SELECT 1 FROM snippet_tags WHERE snippet_id = $1 AND tag_id = $2',
      [id, finalTagId]
    );

    if (existingAssoc.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Tag is already associated with this snippet',
        },
      });
    }

    // Create association
    await client.query(
      'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)',
      [id, finalTagId]
    );

    // Fetch updated snippet with tags
    const result = await client.query(`
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
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding tag to snippet:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add tag to snippet',
      },
    });
  } finally {
    client.release();
  }
});

// Remove tag from snippet
router.delete('/:id/tags/:tagId', validateParams(z.object({
  id: z.string().uuid(),
  tagId: z.string().uuid(),
})), async (req, res) => {
  const { id, tagId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM snippet_tags WHERE snippet_id = $1 AND tag_id = $2 RETURNING *',
      [id, tagId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tag association not found',
        },
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error removing tag from snippet:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove tag from snippet',
      },
    });
  }
});

export default router;
