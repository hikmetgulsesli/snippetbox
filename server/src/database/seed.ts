import { pool } from './connection.js';
import { CollectionModel } from '../models/collection.js';
import { TagModel } from '../models/tag.js';
import { SnippetModel } from '../models/snippet.js';

const seedData = {
  collections: [
    { name: 'React Components', description: 'Reusable React components', color: '#61DAFB' },
    { name: 'Utility Functions', description: 'Helper functions and utilities', color: '#F7DF1E' },
    { name: 'Database Queries', description: 'SQL and database operations', color: '#336791' },
    { name: 'API Endpoints', description: 'REST API examples', color: '#68A063' },
    { name: 'Configuration', description: 'Config files and setup', color: '#FFA500' },
  ],
  tags: [
    { name: 'javascript', color: '#F7DF1E' },
    { name: 'typescript', color: '#3178C6' },
    { name: 'react', color: '#61DAFB' },
    { name: 'sql', color: '#336791' },
    { name: 'python', color: '#3776AB' },
    { name: 'css', color: '#1572B6' },
    { name: 'node', color: '#339933' },
    { name: 'testing', color: '#C21325' },
  ],
  snippets: [
    {
      title: 'React useFetch Hook',
      description: 'Custom hook for data fetching with loading and error states',
      language: 'typescript',
      code: `import { useState, useEffect } from 'react';

interface UseFetchOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export function useFetch<T>({ url, method = 'GET', body }: UseFetchOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, method, body]);

  return { data, loading, error };
}`,
      collection_name: 'React Components',
      tag_names: ['react', 'typescript'],
      is_public: true,
    },
    {
      title: 'Debounce Function',
      description: 'Debounce utility for limiting function calls',
      language: 'typescript',
      code: `export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Usage example:
const handleSearch = debounce((query: string) => {
  console.log('Searching for:', query);
}, 300);`,
      collection_name: 'Utility Functions',
      tag_names: ['typescript', 'javascript'],
      is_public: true,
    },
    {
      title: 'PostgreSQL Connection Pool',
      description: 'Database connection configuration with pg',
      language: 'typescript',
      code: `import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'database',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  }
}`,
      collection_name: 'Database Queries',
      tag_names: ['sql', 'node', 'typescript'],
      is_public: true,
    },
    {
      title: 'Express Error Handler',
      description: 'Centralized error handling middleware',
      language: 'typescript',
      code: `import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    code,
    statusCode,
  });

  res.status(statusCode).json({
    error: {
      code,
      message: err.message || 'Internal server error',
    },
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}`,
      collection_name: 'API Endpoints',
      tag_names: ['node', 'typescript'],
      is_public: true,
    },
    {
      title: 'Array Chunk Function',
      description: 'Split array into chunks of specified size',
      language: 'javascript',
      code: `export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be greater than 0');
  
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Usage:
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const chunks = chunk(numbers, 3);
// [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]`,
      collection_name: 'Utility Functions',
      tag_names: ['javascript', 'typescript'],
      is_public: false,
    },
    {
      title: 'CSS Grid Layout',
      description: 'Responsive grid layout with auto-fit',
      language: 'css',
      code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.grid-item {
  background: var(--surface-alt);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.grid-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}`,
      collection_name: 'Configuration',
      tag_names: ['css'],
      is_public: true,
    },
    {
      title: 'Python List Comprehension',
      description: 'Common list comprehension patterns',
      language: 'python',
      code: `# Filter even numbers
evens = [x for x in range(100) if x % 2 == 0]

# Transform with condition
squares = [x**2 for x in range(50) if x % 3 == 0]

# Nested comprehension
matrix = [[i * j for j in range(5)] for i in range(5)]

# Dictionary comprehension
word_lengths = {word: len(word) for word in ['hello', 'world', 'python']}

# Set comprehension
unique_chars = {c for c in 'hello world' if c.isalpha()}

# Generator expression (memory efficient)
sum_of_squares = sum(x**2 for x in range(1000000))`,
      collection_name: 'Utility Functions',
      tag_names: ['python'],
      is_public: true,
    },
    {
      title: 'Jest Test Setup',
      description: 'Basic test configuration with Jest',
      language: 'typescript',
      code: `import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const user = await service.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.id).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Existing User',
      };

      await expect(service.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });
});`,
      collection_name: 'Configuration',
      tag_names: ['testing', 'typescript'],
      is_public: true,
    },
    {
      title: 'SQL Full-Text Search',
      description: 'PostgreSQL full-text search query',
      language: 'sql',
      code: `-- Create GIN index for full-text search
CREATE INDEX idx_snippets_search 
ON snippets 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || code));

-- Search snippets
SELECT s.*, 
  ts_rank(
    to_tsvector('english', s.title || ' ' || COALESCE(s.description, '') || ' ' || s.code),
    plainto_tsquery('english', $1)
  ) as rank
FROM snippets s
WHERE to_tsvector('english', s.title || ' ' || COALESCE(s.description, '') || ' ' || s.code)
  @@ plainto_tsquery('english', $1)
ORDER BY rank DESC;`,
      collection_name: 'Database Queries',
      tag_names: ['sql'],
      is_public: true,
    },
    {
      title: 'React Context Provider',
      description: 'Theme context with dark mode support',
      language: 'typescript',
      code: `import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as Theme) || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};`,
      collection_name: 'React Components',
      tag_names: ['react', 'typescript'],
      is_public: true,
    },
  ],
};

async function seed() {
  console.log('Starting database seed...');

  try {
    // Create collections
    console.log('Creating collections...');
    const collectionMap = new Map<string, string>();
    for (const collection of seedData.collections) {
      const existing = await CollectionModel.findByName(collection.name);
      if (existing) {
        collectionMap.set(collection.name, existing.id);
        console.log(`  Collection '${collection.name}' already exists`);
      } else {
        const created = await CollectionModel.create(collection);
        collectionMap.set(collection.name, created.id);
        console.log(`  Created collection '${collection.name}'`);
      }
    }

    // Create tags
    console.log('Creating tags...');
    const tagMap = new Map<string, string>();
    for (const tag of seedData.tags) {
      const created = await TagModel.findOrCreate(tag.name, tag.color);
      tagMap.set(tag.name, created.id);
      console.log(`  Created tag '${tag.name}'`);
    }

    // Create snippets
    console.log('Creating snippets...');
    for (const snippet of seedData.snippets) {
      const collection_id = collectionMap.get(snippet.collection_name) || null;
      const tag_ids = snippet.tag_names
        .map(name => tagMap.get(name))
        .filter((id): id is string => id !== undefined);

      const existing = await pool.query(
        'SELECT id FROM snippets WHERE title = $1',
        [snippet.title]
      );

      if (existing.rows.length > 0) {
        console.log(`  Snippet '${snippet.title}' already exists`);
        continue;
      }

      await SnippetModel.create({
        title: snippet.title,
        description: snippet.description,
        code: snippet.code,
        language: snippet.language,
        collection_id,
        tag_ids,
        is_public: snippet.is_public,
      });
      console.log(`  Created snippet '${snippet.title}'`);
    }

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
