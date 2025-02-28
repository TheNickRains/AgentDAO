const express = require('express');
const path = require('path');
const { createMockUser } = require('./dist/services/user/userService');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Serve the dashboard HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve the onboarding HTML file
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'onboarding.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User onboarding endpoint
app.post('/api/users', async (req, res) => {
  try {
    const { email, walletAddress } = req.body;
    console.log(`Creating mock user with email: ${email}`);
    
    // Use mock user service for testing
    const user = await createMockUser(email, walletAddress);
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Mock proposals endpoint
app.get('/api/proposals', (req, res) => {
  const { walletAddress } = req.query;
  
  if (!walletAddress) {
    return res.status(400).json({ success: false, error: 'Wallet address is required' });
  }
  
  // Mock data
  const proposals = [
    {
      id: 'UNI-P-123',
      title: 'Increase Liquidity Mining Rewards',
      description: 'This proposal aims to increase liquidity mining rewards by 20% for the next quarter to incentivize more liquidity providers.',
      protocol: 'Uniswap',
      status: 'active',
      end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      choices: ['FOR', 'AGAINST', 'ABSTAIN']
    },
    {
      id: 'AIP-87',
      title: 'Add Support for Base Chain',
      description: 'This proposal suggests adding support for Base Chain to the Aave protocol, expanding its cross-chain capabilities.',
      protocol: 'Aave',
      status: 'active',
      end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      choices: ['FOR', 'AGAINST', 'ABSTAIN']
    },
    {
      id: 'OP-P-45',
      title: 'Retroactive Public Goods Funding Round',
      description: 'This proposal outlines the next round of retroactive public goods funding, allocating 5M OP tokens to projects that have provided value to the ecosystem.',
      protocol: 'Optimism',
      status: 'active',
      end_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      choices: ['FOR', 'AGAINST', 'ABSTAIN']
    }
  ];
  
  res.status(200).json({ success: true, data: proposals });
});

// Mock votes endpoint
app.get('/api/votes', (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  
  // Mock data
  const votes = [
    {
      id: 1,
      proposal_id: 'UNI-P-122',
      choice: 'FOR',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      proposal_id: 'AAVE-P-86',
      choice: 'AGAINST',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      proposal_id: 'OP-P-44',
      choice: 'ABSTAIN',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  res.status(200).json({ success: true, data: votes });
});

// Mock vote endpoint
app.post('/api/votes', (req, res) => {
  const { proposal_id, choice, email } = req.body;
  
  if (!proposal_id || !choice || !email) {
    return res.status(400).json({ success: false, error: 'Proposal ID, choice, and email are required' });
  }
  
  // Mock data
  const vote = {
    id: Math.floor(Math.random() * 1000),
    proposal_id,
    choice,
    email,
    timestamp: new Date().toISOString()
  };
  
  res.status(201).json({ success: true, data: vote });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the dashboard`);
  console.log(`Open http://localhost:${PORT}/onboarding in your browser to view the onboarding flow`);
}); 