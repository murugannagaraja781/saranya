import { Router } from 'express';
import { apiController } from '../controllers/apiController';
import { adminController } from '../controllers/adminController';
import { requireAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';

export const apiRouter = Router();

// Apply API rate limiting
apiRouter.use(apiRateLimiter);

// Public health check
apiRouter.get('/health', (req, res) => apiController.getHealth(req, res));

// Super Admin .env Management API (Password: 1369)
apiRouter.post('/admin/login', (req, res) => adminController.login(req, res));
apiRouter.get('/admin/env', (req, res) => adminController.getEnv(req, res));
apiRouter.post('/admin/env', (req, res) => adminController.saveEnv(req, res));

// Authenticated API endpoints (dev/mock mode allows automatic local access)
apiRouter.use(requireAuth);

// Dashboard
apiRouter.get('/dashboard/stats', (req, res) => apiController.getDashboardStats(req, res));

// Messages
apiRouter.get('/messages', (req, res) => apiController.getMessages(req, res));
apiRouter.get('/messages/:id', (req, res) => apiController.getMessageById(req, res));
apiRouter.post('/messages/analyze', (req, res) => apiController.analyzeMessageManually(req, res));

// Clients
apiRouter.get('/clients', (req, res) => apiController.getClients(req, res));
apiRouter.get('/clients/:id', (req, res) => apiController.getClientById(req, res));

// Calls
apiRouter.get('/calls', (req, res) => apiController.getCalls(req, res));
apiRouter.get('/calls/:id', (req, res) => apiController.getCallById(req, res));
apiRouter.post('/calls', (req, res) => apiController.triggerManualCall(req, res));

// Tasks
apiRouter.get('/tasks', (req, res) => apiController.getTasks(req, res));
apiRouter.post('/tasks', (req, res) => apiController.createTask(req, res));
apiRouter.patch('/tasks/:id', (req, res) => apiController.updateTask(req, res));

// Integrations & Settings
apiRouter.get('/integrations', (req, res) => apiController.getIntegrations(req, res));
apiRouter.get('/settings', (req, res) => apiController.getSettings(req, res));
apiRouter.post('/settings', (req, res) => apiController.updateSettings(req, res));

// Notifications
apiRouter.get('/notifications', (req, res) => apiController.getNotifications(req, res));
apiRouter.patch('/notifications/:id/read', (req, res) => apiController.markNotificationRead(req, res));

// Audit Logs
apiRouter.get('/audit-logs', (req, res) => apiController.getAuditLogs(req, res));
