import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { pool } from '../src/database/connection.js';

// Test data
const testSnippet = {
  title: 'Test Snippet',
  description: 'A test snippet for API testing',
  code: 'console.log("Hello World");',
  language: 'javascript',
  is_public: false,
};

describe('Snippet CRUD API', () => {
  // Clean up test data before each test
  beforeEach(async () => {
    await pool.query("DELETE FROM snippets WHERE title LIKE 'Test%'");
  });

  describe('POST /api/snippets', () => {
    it('creates a snippet with valid input', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send(testSnippet)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testSnippet.title);
      expect(response.body.code).toBe(testSnippet.code);
      expect(response.body.language).toBe(testSnippet.language);
    });

    it('auto-detects language when not provided', async () => {
      const snippetWithoutLang = {
        title: 'Test Python Snippet',
        code: 'def hello():\n    print("Hello")',
      };

      const response = await request(app)
        .post('/api/snippets')
        .send(snippetWithoutLang)
        .expect(201);

      expect(response.body.language).toBe('python');
    });

    it('returns 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({ description: 'Missing title and code' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid field types', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'Test',
          code: 'test',
          is_public: 'not-a-boolean',
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/snippets', () => {
    beforeAll(async () => {
      // Create test snippets
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/snippets')
          .send({
            title: `Test Snippet ${i}`,
            code: `console.log(${i});`,
            language: 'javascript',
          });
      }
    });

    it('returns paginated list of snippets', async () => {
      const response = await request(app)
        .get('/api/snippets?page=1&limit=3')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(3);
    });

    it('returns default pagination when no params provided', async () => {
      const response = await request(app)
        .get('/api/snippets')
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(20);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('returns 400 for invalid pagination params', async () => {
      const response = await request(app)
        .get('/api/snippets?page=invalid')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/snippets/:id', () => {
    let createdSnippet: { id: string };

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send(testSnippet);
      createdSnippet = response.body;
    });

    it('returns a snippet by ID', async () => {
      const response = await request(app)
        .get(`/api/snippets/${createdSnippet.id}`)
        .expect(200);

      expect(response.body.id).toBe(createdSnippet.id);
      expect(response.body.title).toBe(testSnippet.title);
      expect(response.body).toHaveProperty('tags');
      expect(response.body).toHaveProperty('collection');
    });

    it('returns 404 for non-existent snippet', async () => {
      const response = await request(app)
        .get('/api/snippets/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/snippets/invalid-uuid')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/snippets/:id', () => {
    let createdSnippet: { id: string };

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send(testSnippet);
      createdSnippet = response.body;
    });

    it('updates a snippet', async () => {
      const updateData = {
        title: 'Updated Title',
        code: 'console.log("Updated");',
      };

      const response = await request(app)
        .put(`/api/snippets/${createdSnippet.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.code).toBe(updateData.code);
    });

    it('returns 404 for non-existent snippet', async () => {
      const response = await request(app)
        .put('/api/snippets/00000000-0000-0000-0000-000000000000')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('validates update data', async () => {
      const response = await request(app)
        .put(`/api/snippets/${createdSnippet.id}`)
        .send({ title: '' }) // Empty title should fail
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('generates share_id when making snippet public', async () => {
      const privateSnippet = await request(app)
        .post('/api/snippets')
        .send({
          title: 'Private Snippet',
          code: 'test',
          is_public: false,
        });

      expect(privateSnippet.body.share_id).toBeNull();

      const response = await request(app)
        .put(`/api/snippets/${privateSnippet.body.id}`)
        .send({ is_public: true })
        .expect(200);

      expect(response.body.share_id).toBeTruthy();
    });
  });

  describe('DELETE /api/snippets/:id', () => {
    let createdSnippet: { id: string };

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send(testSnippet);
      createdSnippet = response.body;
    });

    it('deletes a snippet', async () => {
      await request(app)
        .delete(`/api/snippets/${createdSnippet.id}`)
        .expect(204);

      // Verify it's deleted
      await request(app)
        .get(`/api/snippets/${createdSnippet.id}`)
        .expect(404);
    });

    it('returns 404 for non-existent snippet', async () => {
      const response = await request(app)
        .delete('/api/snippets/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Language Detection', () => {
    it('detects TypeScript from code patterns', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'TypeScript Test',
          code: 'interface User { name: string; }',
        })
        .expect(201);

      expect(response.body.language).toBe('typescript');
    });

    it('detects Python from code patterns', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'Python Test',
          code: 'def hello_world():\n    pass',
        })
        .expect(201);

      expect(response.body.language).toBe('python');
    });

    it('detects Go from code patterns', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'Go Test',
          code: 'func main() {\n    fmt.Println("Hello")\n}',
        })
        .expect(201);

      expect(response.body.language).toBe('go');
    });

    it('defaults to text for unknown code', async () => {
      const response = await request(app)
        .post('/api/snippets')
        .send({
          title: 'Unknown Language',
          code: 'some random text without clear patterns',
        })
        .expect(201);

      expect(response.body.language).toBe('text');
    });
  });
});
