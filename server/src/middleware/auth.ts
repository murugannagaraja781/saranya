import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { config } from '../config/index';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // In test mode, MOCK_MODE, or development mode, allow standard demo sessions or bearer dev-token
  if (process.env.NODE_ENV === 'test' || config.mockMode || config.isDev) {
    req.user = {
      uid: 'user-naga-1',
      email: 'naga@example.com',
      name: config.ownerName,
      role: 'owner'
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header.' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || config.ownerName,
      role: 'owner'
    };
    next();
  } catch (error) {
    logger.error('Firebase token verification failed', error);
    res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
  }
}
