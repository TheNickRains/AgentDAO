// Simple Express server to test our user onboarding endpoint
const express = require('express');
const { createMockUser } = require('./dist/services/user/userService');

const app = express();
app.use(express.json());

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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 