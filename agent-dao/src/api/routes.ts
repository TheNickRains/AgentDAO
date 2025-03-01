import { Express, Request, Response } from 'express';
import { handleEmailReply } from '../services/email/emailReplyHandler';
import { fetchProposals } from '../services/governance/proposalService';
import { createUser, getUserByEmail, createMockUser, checkAndDelegateGovernanceTokens, updateDelegationStatus, getUserByWallet } from '../services/user/userService';
import { checkCcipMessageStatus, verifyVoteExecution } from '../services/blockchain/ccipService';
import { sendProposalDigestEmail } from '../services/email/postmarkService';
import { verifyToken, verifyWalletOwnership, validateApiKey, generateToken } from '../middleware/authMiddleware';
import { verifySignature } from '../services/auth/authService';
import { storeNonce, getNonce, invalidateNonce } from '../services/database/supabaseService';
import { authRateLimiter, nonceRateLimiter, apiRateLimiter, emailWebhookRateLimiter } from '../middleware/rateLimitMiddleware';
import { asyncHandler, ApiError } from '../middleware/errorMiddleware';
import { DecodedToken } from '../middleware/authMiddleware';
import { getGovernanceTokens, delegateGovernanceTokens } from '../services/blockchain/tokenService';
import { updateUserInDb } from '../services/user/userDbService';

export const setupRoutes = (app: Express): void => {
  // Apply API rate limiter to all routes
  app.use(apiRateLimiter);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Generate nonce for wallet signature
  app.get('/api/auth/nonce', nonceRateLimiter, asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress } = req.query;
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ApiError(400, 'Wallet address is required');
    }
    
    // Generate a nonce for the wallet
    const nonce = generateNonce();
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Store the nonce in the database
    const stored = await storeNonce(walletAddress, nonce, expiresAt);
    
    if (!stored) {
      throw new ApiError(500, 'Failed to store nonce');
    }
    
    res.status(200).json({ 
      success: true, 
      data: { 
        nonce,
        walletAddress,
        expiresAt: expiresAt.toISOString()
      } 
    });
  }));

  // User login endpoint
  app.post('/api/auth/login', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      throw new ApiError(400, 'Wallet address, signature, and message are required');
    }
    
    // Get the stored nonce for this wallet
    const storedNonce = await getNonce(walletAddress);
    
    if (!storedNonce) {
      throw new ApiError(401, 'Invalid or expired nonce. Please request a new nonce.');
    }
    
    // Verify the message contains the correct nonce
    if (!message.includes(storedNonce)) {
      throw new ApiError(401, 'Invalid message. The message must contain the nonce.');
    }
    
    // Verify the wallet signature
    const isValidSignature = await verifySignature(walletAddress, signature, message);
    
    if (!isValidSignature) {
      throw new ApiError(401, 'Invalid signature');
    }
    
    // Invalidate the nonce after successful verification
    await invalidateNonce(walletAddress);
    
    // Get user by wallet address
    const user = await getUserByWallet(walletAddress);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Generate JWT token
    const token = generateToken(user.id, walletAddress, user.role || 'user');
    
    res.status(200).json({ 
      success: true, 
      data: { 
        token,
        user: {
          id: user.id,
          email: user.email,
          walletAddress: user.wallet_address,
          role: user.role || 'user'
        }
      } 
    });
  }));

  // User registration endpoint
  app.post('/api/users', asyncHandler(async (req: Request, res: Response) => {
    const { email, walletAddress } = req.body;
    
    if (!email || !walletAddress) {
      throw new ApiError(400, 'Email and wallet address are required');
    }
    
    // Use real user service instead of mock
    const user = await createUser(email, walletAddress);
    
    res.status(201).json({ success: true, data: user });
  }));

  // Get user by email - protected endpoint
  app.get('/api/users/:email', verifyToken, asyncHandler(async (req: Request & { user?: any }, res: Response) => {
    const { email } = req.params;
    const user = await getUserByEmail(email);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    res.status(200).json({ success: true, data: user });
  }));

  // Fetch governance proposals - protected endpoint
  app.get('/api/proposals', verifyToken, verifyWalletOwnership, async (req: Request, res: Response) => {
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

  // Email reply webhook endpoint - protected with API key
  app.post('/api/email-reply', validateApiKey, emailWebhookRateLimiter, async (req: Request, res: Response) => {
    try {
      const emailData = req.body;
      await handleEmailReply(emailData);
      res.status(200).json({ success: true, message: 'Email reply processed successfully' });
    } catch (error) {
      console.error('Error processing email reply:', error);
      res.status(500).json({ success: false, error: 'Failed to process email reply' });
    }
  });

  // Delegate governance tokens endpoint - protected endpoint
  app.post('/api/delegate', verifyToken, verifyWalletOwnership, async (req: Request, res: Response) => {
    try {
      const { walletAddress, smartWalletAddress } = req.body;
      
      if (!walletAddress || !smartWalletAddress) {
        res.status(400).json({ success: false, error: 'Wallet address and smart wallet address are required' });
        return;
      }
      
      await checkAndDelegateGovernanceTokens(walletAddress, smartWalletAddress);
      
      res.status(200).json({ success: true, message: 'Delegation process initiated' });
    } catch (error) {
      console.error('Error delegating governance tokens:', error);
      res.status(500).json({ success: false, error: 'Failed to delegate governance tokens' });
    }
  });

  // Update delegation status endpoint - protected endpoint
  app.post('/api/delegation-status', verifyToken, async (req: Request, res: Response) => {
    try {
      const { userId, dao, status } = req.body;
      
      if (!userId || !dao || status === undefined) {
        res.status(400).json({ success: false, error: 'User ID, DAO, and status are required' });
        return;
      }
      
      await updateDelegationStatus(userId, dao, status);
      
      res.status(200).json({ success: true, message: 'Delegation status updated' });
    } catch (error) {
      console.error('Error updating delegation status:', error);
      res.status(500).json({ success: false, error: 'Failed to update delegation status' });
    }
  });

  // Check CCIP message status endpoint - protected endpoint
  app.get('/api/ccip-status/:messageId', verifyToken, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { chainId } = req.query;
      
      const status = await checkCcipMessageStatus(
        messageId,
        chainId ? parseInt(chainId as string) : undefined
      );
      
      res.status(200).json({ success: true, data: { messageId, status } });
    } catch (error) {
      console.error('Error checking CCIP message status:', error);
      res.status(500).json({ success: false, error: 'Failed to check CCIP message status' });
    }
  });

  // Verify vote execution endpoint - protected endpoint
  app.get('/api/verify-vote/:txHash', verifyToken, async (req: Request, res: Response) => {
    try {
      const { txHash } = req.params;
      const { chainId } = req.query;
      
      if (!chainId || typeof chainId !== 'string') {
        res.status(400).json({ success: false, error: 'Chain ID is required' });
        return;
      }
      
      const isExecuted = await verifyVoteExecution(txHash, parseInt(chainId));
      
      res.status(200).json({ success: true, data: { txHash, isExecuted } });
    } catch (error) {
      console.error('Error verifying vote execution:', error);
      res.status(500).json({ success: false, error: 'Failed to verify vote execution' });
    }
  });

  // Send governance digest email endpoint - protected endpoint
  app.post('/api/send-digest', verifyToken, verifyWalletOwnership, async (req: Request, res: Response) => {
    try {
      const { email, walletAddress } = req.body;
      
      if (!email || !walletAddress) {
        res.status(400).json({ success: false, error: 'Email and wallet address are required' });
        return;
      }
      
      // Fetch proposals for the user
      const proposals = await fetchProposals(walletAddress);
      
      // Sort proposals by end time (closest to expiration first)
      const sortedProposals = proposals.sort((a, b) => a.endTimestamp - b.endTimestamp);
      
      // Take the top 3 proposals
      const topProposals = sortedProposals.slice(0, 3);
      
      // Send the email
      await sendProposalDigestEmail(email, topProposals, email.split('@')[0]);
      
      res.status(200).json({ success: true, message: 'Governance digest email sent' });
    } catch (error) {
      console.error('Error sending governance digest email:', error);
      res.status(500).json({ success: false, error: 'Failed to send governance digest email' });
    }
  });

  // User details endpoint
  app.get('/api/users/details', verifyToken, asyncHandler(async (req: Request & { user?: DecodedToken }, res: Response) => {
    const { walletAddress } = req.query;
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ApiError(400, 'Wallet address is required');
    }
    
    // Get user details
    const user = await getUserByWallet(walletAddress);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  }));
  
  // Update wallet endpoint
  app.post('/api/users/update-wallet', verifyToken, asyncHandler(async (req: Request & { user?: DecodedToken }, res: Response) => {
    const { currentWalletAddress, newWalletAddress } = req.body;
    
    if (!currentWalletAddress || !newWalletAddress) {
      throw new ApiError(400, 'Current and new wallet addresses are required');
    }
    
    // Get user by current wallet
    const user = await getUserByWallet(currentWalletAddress);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Update user wallet
    await updateUserInDb(user.id, { walletAddress: newWalletAddress });
    
    res.status(200).json({
      success: true,
      message: 'Wallet updated successfully'
    });
  }));
  
  // Update delegation status endpoint
  app.post('/api/users/update-delegation', verifyToken, asyncHandler(async (req: Request & { user?: DecodedToken }, res: Response) => {
    const { walletAddress, delegationEnabled } = req.body;
    
    if (!walletAddress || typeof delegationEnabled !== 'boolean') {
      throw new ApiError(400, 'Wallet address and delegation status are required');
    }
    
    // Get user by wallet
    const user = await getUserByWallet(walletAddress);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Update delegation status
    await updateUserInDb(user.id, { delegationEnabled });
    
    res.status(200).json({
      success: true,
      message: `Delegation ${delegationEnabled ? 'enabled' : 'disabled'} successfully`
    });
  }));
  
  // Fetch governance tokens endpoint
  app.get('/api/tokens', verifyToken, asyncHandler(async (req: Request & { user?: DecodedToken }, res: Response) => {
    const { walletAddress } = req.query;
    
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new ApiError(400, 'Wallet address is required');
    }
    
    // Get user by wallet
    const user = await getUserByWallet(walletAddress);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Get governance tokens for the wallet
    const tokens = await getGovernanceTokens(walletAddress);
    
    res.status(200).json({
      success: true,
      data: tokens
    });
  }));
  
  // Token delegation endpoint
  app.post('/api/delegate', verifyToken, asyncHandler(async (req: Request & { user?: DecodedToken }, res: Response) => {
    const { walletAddress, tokenSymbol, smartWalletAddress } = req.body;
    
    if (!walletAddress || !tokenSymbol || !smartWalletAddress) {
      throw new ApiError(400, 'Wallet address, token symbol, and smart wallet address are required');
    }
    
    // Get user by wallet
    const user = await getUserByWallet(walletAddress);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    // Delegate token
    const result = await delegateGovernanceTokens(walletAddress, smartWalletAddress, tokenSymbol);
    
    if (!result.success) {
      throw new ApiError(500, result.error || 'Failed to delegate token');
    }
    
    // Update delegation status in database
    await updateDelegationStatus(user.id, tokenSymbol, true);
    
    res.status(200).json({
      success: true,
      message: `Successfully delegated ${tokenSymbol} to smart wallet`
    });
  }));
  
  // Validate auth token endpoint
  app.get('/api/auth/validate', verifyToken, asyncHandler(async (req: Request & { user?: DecodedToken }, res: Response) => {
    // If middleware passes, token is valid
    res.status(200).json({
      success: true,
      message: 'Token is valid'
    });
  }));

  // Fallback for undefined routes
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });
}; 