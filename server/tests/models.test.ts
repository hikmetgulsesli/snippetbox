import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../src/database/connection.js';
import { CollectionModel } from '../src/models/collection.js';
import { TagModel } from '../src/models/tag.js';
import { SnippetModel } from '../src/models/snippet.js';

describe('Database Models', () => {
  // Test data
  let testCollectionId: string;
  let testTagId: string;
  let testSnippetId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await pool.query("DELETE FROM snippets WHERE title LIKE 'Test%'");
    await pool.query("DELETE FROM collections WHERE name LIKE 'Test%'");
    await pool.query("DELETE FROM tags WHERE name LIKE 'test%'");
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('CollectionModel', () => {
    it('should create a collection', async () => {
      const collection = await CollectionModel.create({
        name: 'Test Collection',
        description: 'A test collection',
        color: '#FF0000',
      });

      expect(collection).toBeDefined();
      expect(collection.id).toBeDefined();
      expect(collection.name).toBe('Test Collection');
      expect(collection.description).toBe('A test collection');
      expect(collection.color).toBe('#FF0000');

      testCollectionId = collection.id;
    });

    it('should find all collections', async () => {
      const collections = await CollectionModel.findAll();
      expect(Array.isArray(collections)).toBe(true);
    });

    it('should find collection by id', async () => {
      const collection = await CollectionModel.findById(testCollectionId);
      expect(collection).toBeDefined();
      expect(collection?.id).toBe(testCollectionId);
    });

    it('should find collection by name', async () => {
      const collection = await CollectionModel.findByName('Test Collection');
      expect(collection).toBeDefined();
      expect(collection?.name).toBe('Test Collection');
    });

    it('should update a collection', async () => {
      const updated = await CollectionModel.update(testCollectionId, {
        description: 'Updated description',
      });

      expect(updated).toBeDefined();
      expect(updated?.description).toBe('Updated description');
    });
  });

  describe('TagModel', () => {
    it('should create a tag', async () => {
      const tag = await TagModel.create({
        name: 'test-tag',
        color: '#00FF00',
      });

      expect(tag).toBeDefined();
      expect(tag.id).toBeDefined();
      expect(tag.name).toBe('test-tag');
      expect(tag.color).toBe('#00FF00');

      testTagId = tag.id;
    });

    it('should find all tags', async () => {
      const tags = await TagModel.findAll();
      expect(Array.isArray(tags)).toBe(true);
    });

    it('should find tag by id', async () => {
      const tag = await TagModel.findById(testTagId);
      expect(tag).toBeDefined();
      expect(tag?.id).toBe(testTagId);
    });

    it('should find tag by name (case insensitive)', async () => {
      const tag = await TagModel.findByName('TEST-TAG');
      expect(tag).toBeDefined();
      expect(tag?.name).toBe('test-tag');
    });

    it('should find or create tag', async () => {
      const tag = await TagModel.findOrCreate('test-tag-2', '#0000FF');
      expect(tag).toBeDefined();
      expect(tag.name).toBe('test-tag-2');

      // Should return existing on second call
      const existing = await TagModel.findOrCreate('test-tag-2', '#FFFFFF');
      expect(existing.id).toBe(tag.id);
    });

    it('should update a tag', async () => {
      const updated = await TagModel.update(testTagId, {
        color: '#FFFF00',
      });

      expect(updated).toBeDefined();
      expect(updated?.color).toBe('#FFFF00');
    });
  });

  describe('SnippetModel', () => {
    it('should create a snippet', async () => {
      const snippet = await SnippetModel.create({
        title: 'Test Snippet',
        description: 'A test snippet',
        code: 'console.log("hello");',
        language: 'javascript',
        collection_id: testCollectionId,
        tag_ids: [testTagId],
        is_public: true,
      });

      expect(snippet).toBeDefined();
      expect(snippet.id).toBeDefined();
      expect(snippet.title).toBe('Test Snippet');
      expect(snippet.code).toBe('console.log("hello");');

      testSnippetId = snippet.id;
    });

    it('should find all snippets', async () => {
      const snippets = await SnippetModel.findAll();
      expect(Array.isArray(snippets)).toBe(true);
    });

    it('should find snippet by id with tags', async () => {
      const snippet = await SnippetModel.findById(testSnippetId);
      expect(snippet).toBeDefined();
      expect(snippet?.id).toBe(testSnippetId);
      expect(Array.isArray(snippet?.tags)).toBe(true);
    });

    it('should filter snippets by language', async () => {
      const snippets = await SnippetModel.findAll({ language: 'javascript' });
      expect(Array.isArray(snippets)).toBe(true);
      expect(snippets.some(s => s.language === 'javascript')).toBe(true);
    });

    it('should filter snippets by collection', async () => {
      const snippets = await SnippetModel.findAll({ collection_id: testCollectionId });
      expect(Array.isArray(snippets)).toBe(true);
    });

    it('should search snippets by query', async () => {
      const snippets = await SnippetModel.findAll({ query: 'Test' });
      expect(Array.isArray(snippets)).toBe(true);
    });

    it('should update a snippet', async () => {
      const updated = await SnippetModel.update(testSnippetId, {
        title: 'Updated Test Snippet',
        description: 'Updated description',
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated Test Snippet');
      expect(updated?.description).toBe('Updated description');
    });

    it('should get snippet count', async () => {
      const count = await SnippetModel.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should get languages with counts', async () => {
      const languages = await SnippetModel.getLanguages();
      expect(Array.isArray(languages)).toBe(true);
      if (languages.length > 0) {
        expect(languages[0]).toHaveProperty('language');
        expect(languages[0]).toHaveProperty('count');
      }
    });
  });

  describe('Cleanup', () => {
    it('should delete the test snippet', async () => {
      const deleted = await SnippetModel.delete(testSnippetId);
      expect(deleted).toBe(true);

      const found = await SnippetModel.findById(testSnippetId);
      expect(found).toBeNull();
    });

    it('should delete the test tag', async () => {
      const deleted = await TagModel.delete(testTagId);
      expect(deleted).toBe(true);
    });

    it('should delete the test collection', async () => {
      const deleted = await CollectionModel.delete(testCollectionId);
      expect(deleted).toBe(true);
    });
  });
});
