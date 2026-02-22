import { pool } from '../database/connection.js';
import type { Tag, TagInput } from '../types/shared.js';

export class TagModel {
  static async findAll(): Promise<Tag[]> {
    const result = await pool.query(
      `SELECT t.*, COUNT(st.snippet_id) as snippet_count 
       FROM tags t 
       LEFT JOIN snippet_tags st ON t.id = st.tag_id 
       GROUP BY t.id 
       ORDER BY snippet_count DESC, t.name`
    );
    return result.rows;
  }

  static async findById(id: string): Promise<Tag | null> {
    const result = await pool.query(
      `SELECT t.*, COUNT(st.snippet_id) as snippet_count 
       FROM tags t 
       LEFT JOIN snippet_tags st ON t.id = st.tag_id 
       WHERE t.id = $1 
       GROUP BY t.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByName(name: string): Promise<Tag | null> {
    const result = await pool.query(
      `SELECT t.*, COUNT(st.snippet_id) as snippet_count 
       FROM tags t 
       LEFT JOIN snippet_tags st ON t.id = st.tag_id 
       WHERE t.name = LOWER($1) 
       GROUP BY t.id`,
      [name]
    );
    return result.rows[0] || null;
  }

  static async create(input: TagInput): Promise<Tag> {
    const { name, color } = input;
    const result = await pool.query(
      `INSERT INTO tags (name, color) 
       VALUES (LOWER($1), $2) 
       RETURNING *`,
      [name, color || '#10B981']
    );
    return result.rows[0];
  }

  static async findOrCreate(name: string, color?: string): Promise<Tag> {
    const existing = await this.findByName(name);
    if (existing) return existing;
    return this.create({ name, color });
  }

  static async update(id: string, input: Partial<TagInput>): Promise<Tag | null> {
    const { name, color } = input;
    const result = await pool.query(
      `UPDATE tags 
       SET name = COALESCE(LOWER($1), name), 
           color = COALESCE($2, color)
       WHERE id = $3 
       RETURNING *`,
      [name, color, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM tags WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async getSnippetsByTagId(tagId: string): Promise<string[]> {
    const result = await pool.query(
      'SELECT snippet_id FROM snippet_tags WHERE tag_id = $1',
      [tagId]
    );
    return result.rows.map(row => row.snippet_id);
  }
}
