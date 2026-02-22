import { pool } from '../database/connection.js';
import type { 
  Snippet, 
  SnippetInput, 
  SnippetUpdateInput, 
  SnippetWithTags,
  SearchFilters
} from '../types/shared.js';

export class SnippetModel {
  static async findAll(filters?: SearchFilters): Promise<SnippetWithTags[]> {
    let query = `
      SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (filters?.query) {
      query += ` AND (s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR s.code ILIKE $${paramIndex})`;
      params.push(`%${filters.query}%`);
      paramIndex++;
    }

    if (filters?.language) {
      query += ` AND s.language = $${paramIndex}`;
      params.push(filters.language);
      paramIndex++;
    }

    if (filters?.collection_id) {
      query += ` AND s.collection_id = $${paramIndex}`;
      params.push(filters.collection_id);
      paramIndex++;
    }

    if (filters?.tag) {
      query += ` AND EXISTS (
        SELECT 1 FROM snippet_tags st2 
        JOIN tags t2 ON st2.tag_id = t2.id 
        WHERE st2.snippet_id = s.id AND t2.name = LOWER($${paramIndex})
      )`;
      params.push(filters.tag);
      paramIndex++;
    }

    query += ` GROUP BY s.id, c.id`;

    const sortBy = filters?.sort_by || 'updated_at';
    const sortOrder = filters?.sort_order || 'desc';
    query += ` ORDER BY s.${sortBy} ${sortOrder.toUpperCase()}`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id: string): Promise<SnippetWithTags | null> {
    const result = await pool.query(
      `SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.id = $1
      GROUP BY s.id, c.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByShareId(shareId: string): Promise<SnippetWithTags | null> {
    const result = await pool.query(
      `SELECT s.*, 
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) 
          FILTER (WHERE t.id IS NOT NULL), '[]') as tags,
        jsonb_build_object('id', c.id, 'name', c.name, 'color', c.color) as collection
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      LEFT JOIN collections c ON s.collection_id = c.id
      WHERE s.share_id = $1 AND s.is_public = TRUE
      GROUP BY s.id, c.id`,
      [shareId]
    );
    return result.rows[0] || null;
  }

  static async create(input: SnippetInput): Promise<Snippet> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { title, description, code, language, collection_id, tag_ids, is_public } = input;
      
      const snippetResult = await client.query(
        `INSERT INTO snippets (title, description, code, language, collection_id, is_public) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [title, description || null, code, language, collection_id || null, is_public || false]
      );
      
      const snippet = snippetResult.rows[0];

      if (tag_ids && tag_ids.length > 0) {
        for (const tagId of tag_ids) {
          await client.query(
            'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)',
            [snippet.id, tagId]
          );
        }
      }

      await client.query('COMMIT');
      return snippet;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async update(id: string, input: SnippetUpdateInput): Promise<Snippet | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { title, description, code, language, collection_id, tag_ids, is_public } = input;

      const snippetResult = await client.query(
        `UPDATE snippets 
         SET title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             code = COALESCE($3, code),
             language = COALESCE($4, language),
             collection_id = $5,
             is_public = COALESCE($6, is_public),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 
         RETURNING *`,
        [title, description, code, language, collection_id === null ? null : collection_id, is_public, id]
      );

      if (snippetResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      if (tag_ids !== undefined) {
        await client.query('DELETE FROM snippet_tags WHERE snippet_id = $1', [id]);
        for (const tagId of tag_ids) {
          await client.query(
            'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)',
            [id, tagId]
          );
        }
      }

      await client.query('COMMIT');
      return snippetResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM snippets WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM snippets');
    return parseInt(result.rows[0].count, 10);
  }

  static async getLanguages(): Promise<{ language: string; count: number }[]> {
    const result = await pool.query(
      `SELECT language, COUNT(*) as count 
       FROM snippets 
       GROUP BY language 
       ORDER BY count DESC`
    );
    return result.rows;
  }
}
