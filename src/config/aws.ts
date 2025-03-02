import { SESClient } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

// AWS SES client configuration
export const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Email configuration
export const emailConfig = {
  fromEmail: process.env.FROM_EMAIL || 'dao@basedvoter.com',
  replyToEmail: process.env.REPLY_TO_EMAIL || 'vote@basedvoter.com',
  bounceEmail: process.env.BOUNCE_EMAIL || 'bounces@basedvoter.com'
}; 