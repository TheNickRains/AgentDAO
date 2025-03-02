import express from 'express';
import { json } from 'body-parser';
import { EmailService } from './services/emailService';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const emailService = new EmailService();

app.use(json());

// Webhook endpoint for inbound emails
app.post('/inbound-email', async (req, res) => {
  try {
    const { from, subject, textBody, htmlBody } = req.body;
    
    // Extract vote command from email body
    const voteMatch = textBody.match(/Vote (YES|NO|ABSTAIN) on Proposal (\d+)/i);
    
    if (voteMatch) {
      const [_, choice, proposalId] = voteMatch;
      
      // Process the vote (implement your voting logic here)
      // For now, just send a confirmation
      await emailService.sendVoteConfirmation(from, proposalId, choice);
      
      res.status(200).json({ message: 'Vote processed successfully' });
    } else {
      res.status(400).json({ message: 'Invalid vote command' });
    }
  } catch (error) {
    console.error('Error processing inbound email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to manually trigger digest emails (for testing)
app.post('/send-digest', async (req, res) => {
  try {
    const { to, proposals, userAddress } = req.body;
    await emailService.sendDigest(to, proposals, userAddress);
    res.status(200).json({ message: 'Digest sent successfully' });
  } catch (error) {
    console.error('Error sending digest:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 