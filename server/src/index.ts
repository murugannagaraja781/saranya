import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config/index';
import { logger } from './utils/logger';
import { webhookRouter } from './routes/webhookRoutes';
import { apiRouter } from './routes/apiRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// 1. Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow dev tools & Vite dev proxy
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS setup
app.use(
  cors({
    origin: [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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

// 6. Centralized Error Handler
app.use(errorHandler);

// 7. Start server if not imported by test runner
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(config.port, config.host, () => {
    logger.info(`====================================================`);
    logger.info(`  Naga AI Assistant (${config.assistantName}) Backend Running!      `);
    logger.info(`  Listening on: http://${config.host}:${config.port}`);
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
