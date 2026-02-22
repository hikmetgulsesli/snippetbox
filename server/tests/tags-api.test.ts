import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { pool } from '../src/database/connection.js';

describe('Tag API', () => {
  let testTagId: string;
  let testSnippetId: string;
  let secondTagId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await pool.query("DELETE FROM snippets WHERE title LIKE 'Tag API Test%'");
    await pool.query("DELETE FROM tags WHERE name LIKE 'tag-api%'");

    // Create test tags
    const tagResult = await pool.query(
      `INSERT INTO tags (name, color) VALUES ('tag-api-test', '#10B981') RETURNING id`
    );
    testTagId = tagResult.rows[0].id;

    const secondTagResult = await pool.query(
      `INSERT INTO tags (name, color) VALUES ('tag-api-second', '#3B82F6') RETURNING id`
    );
    secondTagId = secondTagResult.rows[0].id;

    // Create test snippet
    const snippetResult = await pool.query(
      `INSERT INTO snippets (title, code, language, is_public) 
       VALUES ('Tag API Test Snippet', 'console.log("test");', 'javascript', true) 
       RETURNING id`
    );
    testSnippetId = snippetResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query("DELETE FROM snippets WHERE title LIKE 'Tag API Test%'");
    await pool.query("DELETE FROM tags WHERE name LIKE 'tag-api%'");
    await pool.end();
  });

  describe('GET /api/tags', () => {
    it('should return all tags with snippet counts', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const testTag = response.body.find((t: { name: string }) => t.name === 'tag-api-test');
      expect(testTag).toBeDefined();
      expect(testTag.color).toBe('#10B981');
      expect(typeof testTag.snippet_count).toBe('string'); // PostgreSQL returns count as string
    });
  });

  describe('GET /api/tags/:id', () => {
    it('should return tag by ID with snippets', async () => {
      const response = await request(app).get(`/api/tags/${testTagId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testTagId);
      expect(response.body.name).toBe('tag-api-test');
      expect(Array.isArray(response.body.snippets)).toBe(true);
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app).get('/api/tags/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/tags/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/tags', () => {
    it('should create a new tag', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'tag-api-new',
          color: '#FF0000',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('tag-api-new');
      expect(response.body.color).toBe('#FF0000');

      // Cleanup
      await pool.query('DELETE FROM tags WHERE id = $1', [response.body.id]);
    });

    it('should return 409 for duplicate tag name', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'tag-api-test', // Already exists
          color: '#FF0000',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 for invalid color format', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'tag-api-invalid',
          color: 'invalid-color',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/tags/:id', () => {
    it('should update tag color', async () => {
      const response = await request(app)
        .put(`/api/tags/${testTagId}`)
        .send({
          color: '#FFFF00',
        });

      expect(response.status).toBe(200);
      expect(response.body.color).toBe('#FFFF00');

      // Restore original color
      await pool.query('UPDATE tags SET color = $1 WHERE id = $2', ['#10B981', testTagId]);
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .put('/api/tags/00000000-0000-0000-0000-000000000000')
        .send({
          color: '#FF0000',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/tags/autocomplete', () => {
    it('should return matching tags by partial name', async () => {
      const response = await request(app)
        .get('/api/tags/autocomplete?q=tag-api&limit=10');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some((t: { name: string }) => t.name.includes('tag-api'))).toBe(true);
    });

    it('should return empty array for non-matching query', async () => {
      const response = await request(app)
        .get('/api/tags/autocomplete?q=xyznonexistent&limit=10');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/tags/autocomplete?limit=10');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/snippets/:id/tags', () => {
    it('should add existing tag to snippet', async () => {
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({
          tag_id: testTagId,
        });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags.some((t: { id: string }) => t.id === testTagId)).toBe(true);
    });

    it('should create and add new tag to snippet by name', async () => {
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({
          name: 'tag-api-dynamic',
          color: '#FF00FF',
        });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.tags.some((t: { name: string }) => t.name === 'tag-api-dynamic')).toBe(true);

      // Cleanup the dynamically created tag
      await pool.query("DELETE FROM tags WHERE name = 'tag-api-dynamic'");
    });

    it('should return 404 for non-existent snippet', async () => {
      const response = await request(app)
        .post('/api/snippets/00000000-0000-0000-0000-000000000000/tags')
        .send({
          tag_id: testTagId,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 409 for duplicate tag association', async () => {
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({
          tag_id: testTagId,
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('DELETE /api/snippets/:id/tags/:tagId', () => {
    it('should remove tag from snippet', async () => {
      // First add the tag
      await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({
          tag_id: testTagId,
        });

      // Then remove it
      const response = await request(app)
        .delete(`/api/snippets/${testSnippetId}/tags/${testTagId}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent association', async () => {
      // First ensure the tag is not associated
      await pool.query(
        'DELETE FROM snippet_tags WHERE snippet_id = $1 AND tag_id = $2',
        [testSnippetId, testTagId]
      );

      // Try to delete
      const response = await request(app)
        .delete(`/api/snippets/${testSnippetId}/tags/${testTagId}`);

      expect(response.status).toBe(404);
      expect(response.body?.error?.code || 'NOT_FOUND').toBe('NOT_FOUND');
    });
  });

  describe('GET /api/snippets with tag filtering', () => {
    beforeAll(async () => {
      // Add both tags to the test snippet
      await pool.query(
        'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)',
        [testSnippetId, testTagId]
      );
      await pool.query(
        'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)',
        [testSnippetId, secondTagId]
      );
    });

    it('should filter snippets by single tag', async () => {
      const response = await request(app)
        .get(`/api/snippets?tag=tag-api-test`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((s: { title: string }) => 
        s.title === 'Tag API Test Snippet'
      )).toBe(true);
    });

    it('should filter snippets by multiple tags with OR logic (default)', async () => {
      const response = await request(app)
        .get(`/api/snippets?tags=${testTagId},${secondTagId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter snippets by multiple tags with AND logic', async () => {
      const response = await request(app)
        .get(`/api/snippets?tags=${testTagId},${secondTagId}&tag_mode=and`);

      expect(response.status).toBe(200);
      // Should only return snippets that have BOTH tags
      const snippet = response.body.data.find((s: { id: string }) => s.id === testSnippetId);
      expect(snippet).toBeDefined();
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .delete('/api/tags/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
