import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/index';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;

  logger.error('Unhandled API exception', err, {
    requestId,
    url: req.originalUrl,
    method: req.method
  });

  const statusCode = (err as any).statusCode || 500;
  const message = config.isDev ? err.message : 'An internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    requestId,
    ...(config.isDev && { stack: err.stack })
  });
}
