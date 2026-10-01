import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.'
  }
});

export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // limit each webhook IP to 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Webhook rate limit exceeded.'
  }
});
