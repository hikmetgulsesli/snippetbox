import { pool } from './connection.js';
const migrations = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'text',
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  share_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#10B981',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Snippet-Tag junction table
CREATE TABLE IF NOT EXISTS snippet_tags (
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (snippet_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_snippets_collection ON snippets(collection_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_share ON snippets(share_id) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_snippets_search ON snippets USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || code));
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_snippets_updated_at ON snippets;
CREATE TRIGGER update_snippets_updated_at
  BEFORE UPDATE ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;
async function migrate() {
    try {
        await pool.query(migrations);
        console.log('Migrations completed successfully');
    }
    catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}
migrate();
//# sourceMappingURL=migrate.js.map