import { pool } from '../database/connection.js';
import type { Collection, CollectionInput } from '../types/shared.js';

export class CollectionModel {
  static async findAll(): Promise<Collection[]> {
    const result = await pool.query(
      `SELECT c.*, COUNT(s.id) as snippet_count 
       FROM collections c 
       LEFT JOIN snippets s ON c.id = s.collection_id 
       GROUP BY c.id 
       ORDER BY c.name`
    );
    return result.rows;
  }

  static async findById(id: string): Promise<Collection | null> {
    const result = await pool.query(
      `SELECT c.*, COUNT(s.id) as snippet_count 
       FROM collections c 
       LEFT JOIN snippets s ON c.id = s.collection_id 
       WHERE c.id = $1 
       GROUP BY c.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(input: CollectionInput): Promise<Collection> {
    const { name, description, color } = input;
    const result = await pool.query(
      `INSERT INTO collections (name, description, color) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description || null, color || '#3B82F6']
    );
    return result.rows[0];
  }

  static async update(id: string, input: Partial<CollectionInput>): Promise<Collection | null> {
    const { name, description, color } = input;
    const result = await pool.query(
      `UPDATE collections 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           color = COALESCE($3, color),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING *`,
      [name, description, color, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM collections WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async findByName(name: string): Promise<Collection | null> {
    const result = await pool.query(
      'SELECT * FROM collections WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }
}
