import { Router } from 'express';
import { pool } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import { createSnippetSchema, updateSnippetSchema, paginationSchema, uuidParamSchema } from '../utils/validation.js';
import { detectLanguage } from '../utils/languageDetection.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

// Get all snippets with pagination
router.get('/', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { page, limit } = (req as any).validatedQuery as { page: number; limit: number };
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM snippets');
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated snippets
    const result = await pool.query(
      `
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      GROUP BY s.id, c.id
      ORDER BY s.updated_at DESC
      LIMIT $1 OFFSET $2
    `,
      [limit, offset]
    );

    res.json({
      data: result.rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Get snippet by ID
router.get('/:id', validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Snippet', req.params.id);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Create snippet
router.post('/', validateBody(createSnippetSchema), async (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { title, description, code, language, collection_id, tags, is_public } = (req as any).validatedBody;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Auto-detect language if not provided
    const detectedLanguage = language || detectLanguage(code, title);

    const shareId = is_public ? uuidv4() : null;

    const snippetResult = await client.query(
      `
      INSERT INTO snippets (title, description, code, language, collection_id, is_public, share_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [title, description, code, detectedLanguage, collection_id, is_public || false, shareId]
    );

    const snippet = snippetResult.rows[0];

    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await client.query(`INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)`, [snippet.id, tagId]);
      }
    }

    await client.query('COMMIT');

    // Fetch the created snippet with tags
    const fullResult = await pool.query(
      `
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `,
      [snippet.id]
    );

    res.status(201).json(fullResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// Update snippet
router.put('/:id', validateParams(uuidParamSchema), validateBody(updateSnippetSchema), async (req, res, next) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { title, description, code, language, collection_id, tags, is_public } = (req as any).validatedBody;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current snippet to check if share_id needs to be generated
    const currentResult = await client.query('SELECT is_public, share_id FROM snippets WHERE id = $1', [req.params.id]);
    if (currentResult.rows.length === 0) {
      throw new NotFoundError('Snippet', req.params.id);
    }

    const current = currentResult.rows[0];
    let shareId = current.share_id;

    // Generate share_id if making public for first time
    if (is_public && !current.is_public && !shareId) {
      shareId = uuidv4();
    }

    // Auto-detect language if code is provided but language is not
    let finalLanguage = language;
    if (code && !language) {
      finalLanguage = detectLanguage(code);
    }

    const updateFields: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (code !== undefined) {
      updateFields.push(`code = $${paramIndex++}`);
      values.push(code);
    }
    if (finalLanguage !== undefined) {
      updateFields.push(`language = $${paramIndex++}`);
      values.push(finalLanguage);
    }
    if (collection_id !== undefined) {
      updateFields.push(`collection_id = $${paramIndex++}`);
      values.push(collection_id);
    }
    if (is_public !== undefined) {
      updateFields.push(`is_public = $${paramIndex++}`);
      values.push(is_public);
    }
    if (shareId !== current.share_id) {
      updateFields.push(`share_id = $${paramIndex++}`);
      values.push(shareId);
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: { code: 'NO_CHANGES', message: 'No fields to update' } });
    }

    await client.query(
      `UPDATE snippets SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      [...values, req.params.id]
    );

    // Update tags if provided
    if (tags) {
      await client.query('DELETE FROM snippet_tags WHERE snippet_id = $1', [req.params.id]);
      for (const tagId of tags) {
        await client.query('INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)', [req.params.id, tagId]);
      }
    }

    await client.query('COMMIT');

    // Fetch the updated snippet with tags
    const fullResult = await pool.query(
      `
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id
    `,
      [req.params.id]
    );

    res.json(fullResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// Delete snippet
router.delete('/:id', validateParams(uuidParamSchema), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM snippets WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Snippet', req.params.id);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
