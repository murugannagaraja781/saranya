import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';
import { webhookRateLimiter } from '../middleware/rateLimiter';

export const webhookRouter = Router();

// Apply webhook rate limiter
webhookRouter.use(webhookRateLimiter);

// 1. Primary n8n Webhook
webhookRouter.post('/n8n/message', (req, res) => webhookController.handleN8NWebhook(req, res));

// 2. Direct Gmail Webhook
webhookRouter.post('/gmail', (req, res) => webhookController.handleGmailWebhook(req, res));

// 3. WhatsApp Business Webhooks
webhookRouter.get('/whatsapp', (req, res) => webhookController.verifyWhatsAppWebhook(req, res));
webhookRouter.post('/whatsapp', (req, res) => webhookController.handleWhatsAppWebhook(req, res));

// 4. Post-Call Webhook (from SnapServe / Vobiz / telephony completion)
webhookRouter.post('/post-call', (req, res) => webhookController.handlePostCallWebhook(req, res));
