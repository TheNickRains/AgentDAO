import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { createMockUser } from './src/services/user/userService';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Serve the dashboard HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

// Serve the onboarding HTML file
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'onboarding.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

interface User {
  email: string;
  walletAddress: string;
}

// User onboarding endpoint
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { email, walletAddress } = req.body as User;
    console.log(`Creating mock user with email: ${email}`);
    
    // Use mock user service for testing
    const user = await createMockUser(email, walletAddress);
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

interface Proposal {
  id: string;
  title: string;
  description: string;
  endDate: Date;
  status: 'active' | 'completed';
}

// Mock proposals endpoint
app.get('/api/proposals', (_req: Request, res: Response) => {
  const mockProposals: Proposal[] = [
    {
      id: '1',
      title: 'Treasury Allocation Q1 2024',
      description: 'Proposal to allocate treasury funds for Q1 2024 initiatives',
      endDate: new Date('2024-03-15'),
      status: 'active'
    }
  ];
  
  res.status(200).json({ success: true, data: mockProposals });
});

interface Vote {
  id: string;
  proposalId: string;
  userId: string;
  choice: 'yes' | 'no' | 'abstain';
  timestamp: Date;
}

// Mock votes endpoint
app.get('/api/votes', (_req: Request, res: Response) => {
  const mockVotes: Vote[] = [
    {
      id: '1',
      proposalId: '1',
      userId: '1',
      choice: 'yes',
      timestamp: new Date('2024-03-01')
    }
  ];
  
  res.status(200).json({ success: true, data: mockVotes });
});

interface VoteRequest {
  proposal_id: string;
  choice: string;
  email: string;
}

// Mock vote endpoint
app.post('/api/votes', (req, res) => {
  const { proposal_id, choice, email } = req.body as VoteRequest;
  
  if (!proposal_id || !choice || !email) {
    return res.status(400).json({ success: false, error: 'Proposal ID, choice, and email are required' });
  }
  
  // Mock data
  const vote: Vote = {
    id: Math.floor(Math.random() * 1000).toString(),
    proposalId: proposal_id,
    userId: email,
    choice: choice as 'yes' | 'no' | 'abstain',
    timestamp: new Date()
  };
  
  res.status(201).json({ success: true, data: vote });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the dashboard`);
  console.log(`Open http://localhost:${PORT}/onboarding in your browser to view the onboarding flow`);
}); 