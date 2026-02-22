import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { pool } from '../src/database/connection.js';

describe('Snippet API', () => {
  let testSnippetId: string;
  let testCollectionId: string;
  let testTagId: string;

  beforeAll(async () => {
    // Create test collection
    const collectionResult = await pool.query(
      `INSERT INTO collections (name, description, color) 
       VALUES ('Test Collection', 'For API tests', '#3B82F6') 
       RETURNING id`
    );
    testCollectionId = collectionResult.rows[0].id;

    // Create test tag
    const tagResult = await pool.query(
      `INSERT INTO tags (name, color) 
       VALUES ('test-api', '#10B981') 
       RETURNING id`
    );
    testTagId = tagResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await pool.query("DELETE FROM snippets WHERE title LIKE 'API Test%'");
    await pool.query(`DELETE FROM collections WHERE id = $1`, [testCollectionId]);
    await pool.query(`DELETE FROM tags WHERE id = $1`, [testTagId]);
    await pool.end();
  });

  describe('POST /api/snippets', () => {
    it('should create a snippet with valid data', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'API Test Snippet',
          description: 'Test description',
          code: 'console.log("hello");',
          language: 'javascript',
          collection_id: testCollectionId,
          tag_ids: [testTagId],
          is_public: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('API Test Snippet');
      expect(response.body.code).toBe('console.log("hello");');
      expect(response.body.language).toBe('javascript');
      expect(response.body.is_public).toBe(true);
      expect(Array.isArray(response.body.tags)).toBe(true);
      expect(response.body.collection).toBeDefined();

      testSnippetId = response.body.id;
    });

    it('should auto-detect language from code patterns', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'API Test Python',
          code: 'def hello():\n    print("world")',
          is_public: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.language).toBe('python');
    });

    it('should auto-detect language from filename', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'API Test TypeScript',
          code: 'const x = 1;',
          filename: 'test.ts',
          is_public: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.language).toBe('typescript');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          // Missing required title
          code: 'console.log("test");',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid UUID in collection_id', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'Test',
          code: 'test',
          collection_id: 'invalid-uuid',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/snippets', () => {
    it('should return paginated list of snippets', async () => {
      const response = await request(app)
        .get('/api/snippets')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBeDefined();
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.offset).toBe(0);
      expect(typeof response.body.meta.hasMore).toBe('boolean');
    });

    it('should filter by language', async () => {
      const response = await request(app)
        .get('/api/snippets')
        .query({ language: 'javascript' });

      expect(response.status).toBe(200);
      expect(response.body.data.every((s: { language: string }) => s.language === 'javascript')).toBe(true);
    });

    it('should filter by collection_id', async () => {
      const response = await request(app)
        .get('/api/snippets')
        .query({ collection_id: testCollectionId });

      expect(response.status).toBe(200);
    });

    it('should search by query', async () => {
      const response = await request(app)
        .get('/api/snippets')
        .query({ search: 'API Test' });

      expect(response.status).toBe(200);
    });

    it('should sort by different fields', async () => {
      const response = await request(app)
        .get('/api/snippets')
        .query({ sort_by: 'title', sort_order: 'asc' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/snippets/:id', () => {
    it('should return a snippet by ID', async () => {
      const response = await request(app)
        .get(`/api/snippets/${testSnippetId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testSnippetId);
      expect(response.body.title).toBe('API Test Snippet');
      expect(Array.isArray(response.body.tags)).toBe(true);
    });

    it('should return 404 for non-existent snippet', async () => {
      const response = await request(app)
        .get('/api/snippets/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/snippets/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/snippets/:id', () => {
    it('should update a snippet', async () => {
      const response = await request(app)
        .put(`/api/snippets/${testSnippetId}`)
        .send({
          title: 'Updated API Test Snippet',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated API Test Snippet');
      expect(response.body.description).toBe('Updated description');
    });

    it('should auto-detect language on code update', async () => {
      const response = await request(app)
        .put(`/api/snippets/${testSnippetId}`)
        .send({
          code: 'interface User {\n  name: string;\n}',
        });

      expect(response.status).toBe(200);
      expect(response.body.language).toBe('typescript');
    });

    it('should update tags', async () => {
      const response = await request(app)
        .put(`/api/snippets/${testSnippetId}`)
        .send({
          tag_ids: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.tags).toHaveLength(0);
    });

    it('should return 404 for non-existent snippet', async () => {
      const response = await request(app)
        .put('/api/snippets/00000000-0000-0000-0000-000000000000')
        .send({
          title: 'Updated',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/snippets/:id', () => {
    it('should delete a snippet', async () => {
      // Create a snippet to delete
      const createResponse = await request(app)
        .post('/api/snippets')
        .send({
          title: 'API Test To Delete',
          code: 'console.log("delete me");',
        });

      const snippetId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/snippets/${snippetId}`);

      expect(response.status).toBe(204);

      // Verify it's gone
      const getResponse = await request(app)
        .get(`/api/snippets/${snippetId}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent snippet', async () => {
      const response = await request(app)
        .delete('/api/snippets/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/snippets/:id/copy', () => {
    it('should return snippet code for copy', async () => {
      const response = await request(app)
        .post(`/api/snippets/${testSnippetId}/copy`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBeDefined();
      expect(response.body.title).toBeDefined();
    });

    it('should return 404 for non-existent snippet', async () => {
      const response = await request(app)
        .post('/api/snippets/00000000-0000-0000-0000-000000000000/copy');

      expect(response.status).toBe(404);
    });
  });

  describe('Language Detection', () => {
    const testCases = [
      { code: 'def foo():\n    pass', expected: 'python' },
      { code: 'interface Foo { bar: string }', expected: 'typescript' },
      { code: 'public class Foo { }', expected: 'java' },
      { code: 'func main() { }', expected: 'go' },
      { code: 'fn main() { }', expected: 'rust' },
      { code: 'def foo\n  bar\nend', expected: 'ruby' },
      { code: '<?php echo "hi"; ?>', expected: 'php' },
      { code: 'SELECT * FROM users', expected: 'sql' },
      { code: '<!DOCTYPE html><html>', expected: 'html' },
      { code: '.foo { color: red; }', expected: 'css' },
      { code: '#!/bin/bash\necho hi', expected: 'bash' },
      { code: '{"foo": "bar"}', expected: 'json' },
    ];

    testCases.forEach(({ code, expected }) => {
      it(`should detect ${expected} from code patterns`, async () => {
        const response = await request(app)
          .post('/api/snippets')
          .send({
            title: `Language Test ${expected}`,
            code,
            is_public: false,
          });

        expect(response.status).toBe(201);
        expect(response.body.language).toBe(expected);
      });
    });
  });
});
