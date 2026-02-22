import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { pool } from '../src/database/connection.js';

describe('Tag API', () => {
  let testTagId: string;
  let testSnippetId: string;

  beforeAll(async () => {
    // Create test tag
    const tagResult = await pool.query(
      `INSERT INTO tags (name, color) VALUES ('test-api-tag', '#FF0000') RETURNING id`
    );
    testTagId = tagResult.rows[0].id;

    // Create test snippet
    const snippetResult = await pool.query(
      `INSERT INTO snippets (title, code, language) VALUES ('Test Snippet', 'test', 'javascript') RETURNING id`
    );
    testSnippetId = snippetResult.rows[0].id;

    // Associate tag with snippet
    await pool.query(
      'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES ($1, $2)',
      [testSnippetId, testTagId]
    );
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM snippet_tags WHERE snippet_id = $1', [testSnippetId]);
    await pool.query('DELETE FROM snippets WHERE id = $1', [testSnippetId]);
    await pool.query(`DELETE FROM tags WHERE name LIKE 'test-%'`);
    await pool.end();
  });

  describe('GET /api/tags', () => {
    it('should return all tags with snippet counts', async () => {
      const response = await request(app).get('/api/tags');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const testTag = response.body.find((t: { name: string }) => t.name === 'test-api-tag');
      expect(testTag).toBeDefined();
      expect(testTag.snippet_count).toBe('1');
      expect(testTag.color).toBe('#FF0000');
    });
  });

  describe('GET /api/tags/autocomplete', () => {
    it('should return matching tags by partial name', async () => {
      const response = await request(app)
        .get('/api/tags/autocomplete')
        .query({ q: 'test', limit: 10 });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((t: { name: string }) => t.name.includes('test'))).toBe(true);
    });

    it('should return empty array for non-matching query', async () => {
      const response = await request(app)
        .get('/api/tags/autocomplete')
        .query({ q: 'xyznonexistent', limit: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/tags/autocomplete')
        .query({ limit: 10 });
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/tags/:id', () => {
    it('should return a single tag by ID', async () => {
      const response = await request(app).get(`/api/tags/${testTagId}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testTagId);
      expect(response.body.name).toBe('test-api-tag');
      expect(response.body.color).toBe('#FF0000');
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .get('/api/tags/00000000-0000-0000-0000-000000000000');
      
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
    it('should create a new tag with color', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'test-new-tag',
          color: '#00FF00',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('test-new-tag');
      expect(response.body.color).toBe('#00FF00');
    });

    it('should create a tag with default color', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'test-default-color',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.color).toBe('#10B981');
    });

    it('should return 409 for duplicate tag name', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'test-api-tag',
          color: '#0000FF',
        });
      
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('ALREADY_EXISTS');
    });

    it('should return 400 for invalid color format', async () => {
      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'test-invalid-color',
          color: 'invalid',
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/tags/:id', () => {
    it('should update tag color', async () => {
      // Create a tag to update
      const createResponse = await request(app)
        .post('/api/tags')
        .send({ name: 'test-update-tag', color: '#111111' });
      
      const tagId = createResponse.body.id;
      
      const response = await request(app)
        .put(`/api/tags/${tagId}`)
        .send({ color: '#222222' });
      
      expect(response.status).toBe(200);
      expect(response.body.color).toBe('#222222');
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .put('/api/tags/00000000-0000-0000-0000-000000000000')
        .send({ color: '#333333' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should delete a tag', async () => {
      // Create a tag to delete
      const createResponse = await request(app)
        .post('/api/tags')
        .send({ name: 'test-delete-tag' });
      
      const tagId = createResponse.body.id;
      
      const response = await request(app).delete(`/api/tags/${tagId}`);
      
      expect(response.status).toBe(204);
      
      // Verify it's gone
      const getResponse = await request(app).get(`/api/tags/${tagId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .delete('/api/tags/00000000-0000-0000-0000-000000000000');
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/snippets/:id/tags', () => {
    it('should add existing tag to snippet by tag_id', async () => {
      // Create a new tag
      const tagResponse = await request(app)
        .post('/api/tags')
        .send({ name: 'test-add-existing', color: '#444444' });
      
      const tagId = tagResponse.body.id;
      
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({ tag_id: tagId });
      
      expect(response.status).toBe(200);
      expect(response.body.tags.some((t: { id: string }) => t.id === tagId)).toBe(true);
    });

    it('should create and add new tag to snippet by name', async () => {
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({ name: 'test-create-and-add', color: '#555555' });
      
      expect(response.status).toBe(200);
      expect(response.body.tags.some((t: { name: string }) => 
        t.name === 'test-create-and-add'
      )).toBe(true);
    });

    it('should use existing tag when adding by existing name', async () => {
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({ name: 'test-api-tag' }); // Already exists
      
      expect(response.status).toBe(200);
      expect(response.body.tags.some((t: { name: string }) => 
        t.name === 'test-api-tag'
      )).toBe(true);
    });

    it('should return 404 for non-existent snippet', async () => {
      const response = await request(app)
        .post('/api/snippets/00000000-0000-0000-0000-000000000000/tags')
        .send({ name: 'test' });
      
      expect(response.status).toBe(404);
    });

    it('should return 400 when neither tag_id nor name provided', async () => {
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({});
      
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/snippets/:snippetId/tags/:tagId', () => {
    it('should remove tag from snippet', async () => {
      // First add a tag
      await request(app)
        .post(`/api/snippets/${testSnippetId}/tags`)
        .send({ name: 'test-remove-me' });
      
      // Get the tag ID
      const tagsResponse = await request(app).get('/api/tags');
      const tag = tagsResponse.body.find((t: { name: string }) => 
        t.name === 'test-remove-me'
      );
      
      // Remove it
      const response = await request(app)
        .delete(`/api/snippets/${testSnippetId}/tags/${tag.id}`);
      
      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent association', async () => {
      const response = await request(app)
        .delete(`/api/snippets/${testSnippetId}/tags/00000000-0000-0000-0000-000000000000`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/tags/:id/snippets', () => {
    it('should return snippets for a tag', async () => {
      const response = await request(app).get(`/api/tags/${testTagId}/snippets`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((s: { id: string }) => s.id === testSnippetId
      )).toBe(true);
    });

    it('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .get('/api/tags/00000000-0000-0000-0000-000000000000/snippets');
      
      expect(response.status).toBe(404);
    });
  });
});
