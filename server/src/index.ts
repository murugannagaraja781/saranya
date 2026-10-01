import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config/index';
import { logger } from './utils/logger';
import { webhookRouter } from './routes/webhookRoutes';
import { apiRouter } from './routes/apiRoutes';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// 1. Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow dev tools & Vite dev proxy
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS setup - Production domain strictly enforced in production
const allowedOrigins = config.isDev
  ? [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']
  : [config.corsOrigin];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-request-id',
      'x-idempotency-key',
      'x-n8n-secret'
    ]
  })
);

// 3. Body parsers with payload bounds
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 4. Request ID & Structured access logging
app.use((req, res, next) => {
  const reqId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = reqId;
  res.setHeader('x-request-id', reqId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
      requestId: reqId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration
    });
  });

  next();
});

// 5. Mount API & Webhook routers
app.use('/api/webhooks', webhookRouter);
app.use('/api', apiRouter);

// 6. Serve static frontend bundle in production if available
const candidateDistPaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(__dirname, '../../dist')
];

let distPath: string | null = null;
for (const p of candidateDistPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    distPath = p;
    break;
  }
}

if (distPath) {
  app.use(express.static(distPath));
}

// Serve Super Admin UI at /admin and /admin.html
app.get(['/admin', '/admin.html'], (req, res) => {
  const adminPaths = [
    path.resolve(process.cwd(), 'admin.html'),
    path.resolve(process.cwd(), 'php-app/public/admin.html'),
    path.resolve(__dirname, '../../../admin.html'),
    path.resolve(__dirname, '../../client/dist/admin.html')
  ];
  for (const p of adminPaths) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }
  res.redirect('/');
});

// Single Page Application (SPA) fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (distPath) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  res.send('Naga AI Assistant — Node.js Backend Running. Please run "npm run build" to generate client assets.');
});

// 7. Centralized Error Handler
app.use(errorHandler);

// 8. Start server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : config.port;
  const server = app.listen(port, () => {
    logger.info(`====================================================`);
    logger.info(`  Naga AI Assistant (${config.assistantName}) Backend Running!      `);
    logger.info(`  Listening on Port: ${port}`);
    logger.info(`  Mode: ${config.mockMode ? 'MOCK_MODE (Deterministic)' : 'PRODUCTION'}`);
    logger.info(`  Owner: ${config.ownerName} | Assistant: ${config.assistantName}`);
    logger.info(`====================================================`);
  });

  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      logger.info('Server closed. Process exiting.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
