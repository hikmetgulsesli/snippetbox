import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';

describe('Health Check', () => {
  it('should return ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('API Routes', () => {
  it('should have snippets route', async () => {
    const response = await request(app).get('/api/snippets');
    // Should not be 404 (might be 500 if DB not connected, but route exists)
    expect(response.status).not.toBe(404);
  });

  it('should have collections route', async () => {
    const response = await request(app).get('/api/collections');
    expect(response.status).not.toBe(404);
  });

  it('should have tags route', async () => {
    const response = await request(app).get('/api/tags');
    expect(response.status).not.toBe(404);
  });

  it('should have search route', async () => {
    const response = await request(app).get('/api/search');
    expect(response.status).not.toBe(404);
  });

  it('should have stats route', async () => {
    const response = await request(app).get('/api/stats');
    expect(response.status).not.toBe(404);
  });
});
