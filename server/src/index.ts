import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './database/connection.js';
import snippetRoutes from './routes/snippets.js';
import tagRoutes from './routes/tags.js';
import collectionRoutes from './routes/collections.js';
import searchRoutes from './routes/search.js';
import importExportRoutes from './routes/importExport.js';
import statsRoutes from './routes/stats.js';
import shareRoutes from './routes/share.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3519', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts from Vite build
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Public rate limiter (for shared snippets)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/snippets', snippetRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/stats', statsRoutes);

// Public snippet sharing
app.use('/s', publicLimiter, shareRoutes);

// Serve client static files in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Test database connection
    const connected = await testConnection();
    if (connected) {
      console.log('Database connected successfully');
    } else {
      console.error('Failed to connect to database');
    }
  });
}

export default app;
