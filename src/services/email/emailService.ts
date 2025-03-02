import { ServerClient } from 'postmark';
import config from '../../config/config';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Initialize Postmark client
const postmarkClient = new ServerClient(config.postmark.apiKey);

// Rate limiter for email sending (100 emails per hour)
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 3600,
});

export interface EmailDigest {
  recipientEmail: string;
  proposals: Array<{
    id: string;
    title: string;
    summary: string;
    deadline: string;
    voteLink: string;
  }>;
}

export interface EmailReply {
  from: string;
  subject: string;
  textBody: string;
  strippedTextReply: string;
  messageId: string;
}

export class EmailService {
  /**
   * Send a governance digest email
   */
  async sendDigest(digest: EmailDigest): Promise<boolean> {
    try {
      await rateLimiter.consume(digest.recipientEmail);

      const templateId = config.postmark.templates.digest;
      if (!templateId) {
        throw new Error('Digest template ID not configured');
      }

      await postmarkClient.sendEmailWithTemplate({
        TemplateId: parseInt(templateId),
        From: 'governance@basedvoter.com',
        To: digest.recipientEmail,
        TemplateModel: {
          proposals: digest.proposals,
          replyInstructions: 'Reply to this email with "Vote YES/NO on [Proposal ID]" to cast your vote.',
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to send digest email:', error);
      return false;
    }
  }

  /**
   * Send a welcome email to new users
   */
  async sendWelcomeEmail(email: string, walletAddress: string): Promise<boolean> {
    try {
      await rateLimiter.consume(email);

      const templateId = config.postmark.templates.welcome;
      if (!templateId) {
        throw new Error('Welcome template ID not configured');
      }

      await postmarkClient.sendEmailWithTemplate({
        TemplateId: parseInt(templateId),
        From: 'welcome@basedvoter.com',
        To: email,
        TemplateModel: {
          walletAddress,
          setupInstructions: 'Your smart wallet has been created. You can now start participating in DAO governance.',
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Process an incoming email reply
   */
  async processReply(reply: EmailReply): Promise<{
    intent: 'vote' | 'question' | 'unknown';
    data?: any;
  }> {
    const text = reply.strippedTextReply || reply.textBody;
    
    // Basic vote command detection (can be enhanced with AI)
    const voteMatch = text.match(/vote\s+(yes|no)\s+on\s+(\d+)/i);
    if (voteMatch) {
      return {
        intent: 'vote',
        data: {
          choice: voteMatch[1].toLowerCase(),
          proposalId: voteMatch[2],
        },
      };
    }

    // If no clear vote command, treat as a question
    if (text.includes('?')) {
      return {
        intent: 'question',
        data: { question: text },
      };
    }

    // Unknown intent
    return { intent: 'unknown' };
  }

  /**
   * Send an error or unknown intent response
   */
  async sendUnknownIntentResponse(email: string): Promise<boolean> {
    try {
      await rateLimiter.consume(email);

      const templateId = config.postmark.templates.unknownIntent;
      if (!templateId) {
        throw new Error('Unknown intent template ID not configured');
      }

      await postmarkClient.sendEmailWithTemplate({
        TemplateId: parseInt(templateId),
        From: 'governance@basedvoter.com',
        To: email,
        TemplateModel: {
          instructions: 'I couldn\'t understand your request. Please use "Vote YES/NO on [Proposal ID]" to vote.',
        },
      });

      return true;
    } catch (error) {
      console.error('Failed to send unknown intent response:', error);
      return false;
    }
  }
} 