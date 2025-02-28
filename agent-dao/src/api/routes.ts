import { Express, Request, Response } from 'express';
import { handleEmailReply } from '../services/email/emailReplyHandler';
import { fetchProposals } from '../services/governance/proposalService';
import { createUser, getUserByEmail, createMockUser } from '../services/user/userService';

export const setupRoutes = (app: Express): void => {
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // User onboarding endpoint
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const { email, walletAddress } = req.body;
      
      // Use mock user service for testing
      const user = await createMockUser(email, walletAddress);
      
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  });

  // Get user by email
  app.get('/api/users/:email', async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const user = await getUserByEmail(email);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
  });

  // Fetch governance proposals
  app.get('/api/proposals', async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.query;
      if (!walletAddress || typeof walletAddress !== 'string') {
        res.status(400).json({ success: false, error: 'Wallet address is required' });
        return;
      }
      const proposals = await fetchProposals(walletAddress);
      res.status(200).json({ success: true, data: proposals });
    } catch (error) {
      console.error('Error fetching proposals:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch proposals' });
    }
  });

  // Email reply webhook endpoint
  app.post('/api/email-reply', async (req: Request, res: Response) => {
    try {
      const emailData = req.body;
      await handleEmailReply(emailData);
      res.status(200).json({ success: true, message: 'Email reply processed successfully' });
    } catch (error) {
      console.error('Error processing email reply:', error);
      res.status(500).json({ success: false, error: 'Failed to process email reply' });
    }
  });

  // Fallback for undefined routes
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });
}; 