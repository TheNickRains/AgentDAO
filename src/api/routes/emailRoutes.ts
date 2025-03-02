import express from 'express';
import { EmailService, EmailReply } from '../../services/email/emailService';
import { rateLimit } from 'express-rate-limit';
import config from '../../config/config';

const router = express.Router();
const emailService = new EmailService();

// Rate limiter for webhook endpoints
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

// Middleware to verify Postmark webhook signature
const verifyPostmarkWebhook = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const webhookSecret = config.postmark.webhookSecret;
  const signature = req.headers['x-postmark-signature'];

  if (!webhookSecret || !signature || signature !== webhookSecret) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

/**
 * Webhook endpoint for handling email replies
 */
router.post(
  '/webhook/inbound',
  webhookLimiter,
  verifyPostmarkWebhook,
  async (req: express.Request, res: express.Response) => {
    try {
      const emailReply: EmailReply = {
        from: req.body.From,
        subject: req.body.Subject,
        textBody: req.body.TextBody,
        strippedTextReply: req.body.StrippedTextReply,
        messageId: req.body.MessageID,
      };

      const result = await emailService.processReply(emailReply);

      switch (result.intent) {
        case 'vote':
          // TODO: Forward to voting service
          res.json({ status: 'Vote intent detected', data: result.data });
          break;

        case 'question':
          // TODO: Forward to AI service for processing
          res.json({ status: 'Question intent detected', data: result.data });
          break;

        case 'unknown':
          await emailService.sendUnknownIntentResponse(emailReply.from);
          res.json({ status: 'Unknown intent' });
          break;
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Endpoint to manually trigger a digest email
 */
router.post(
  '/digest',
  async (req: express.Request, res: express.Response) => {
    try {
      const { recipientEmail, proposals } = req.body;

      if (!recipientEmail || !proposals) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await emailService.sendDigest({
        recipientEmail,
        proposals,
      });

      if (success) {
        res.json({ status: 'Digest email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send digest email' });
      }
    } catch (error) {
      console.error('Error sending digest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Endpoint to send welcome email
 */
router.post(
  '/welcome',
  async (req: express.Request, res: express.Response) => {
    try {
      const { email, walletAddress } = req.body;

      if (!email || !walletAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = await emailService.sendWelcomeEmail(email, walletAddress);

      if (success) {
        res.json({ status: 'Welcome email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send welcome email' });
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router; 