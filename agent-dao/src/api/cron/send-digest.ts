import { Request, Response } from 'express';
import { fetchProposals } from '../../services/governance/proposalService';
import { sendProposalDigestEmail } from '../../services/email/postmarkService';
import { supabase } from '../../services/database/supabaseService';

// This function is called by Vercel Cron Jobs
export default async function handler(
  req: Request,
  res: Response
) {
  // Verify that this is a cron job request
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting daily governance digest cron job');
    
    // Get all users from the database
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .not('wallet_address', 'eq', '');
    
    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
    
    console.log(`Found ${users.length} users with wallet addresses`);
    
    // Process each user
    for (const user of users) {
      try {
        // Fetch proposals for the user
        const proposals = await fetchProposals(user.wallet_address);
        
        // Sort proposals by end time (closest to expiration first)
        const sortedProposals = proposals.sort((a, b) => a.endTimestamp - b.endTimestamp);
        
        // Take the top 3 proposals
        const topProposals = sortedProposals.slice(0, 3);
        
        if (topProposals.length > 0) {
          // Send the email
          await sendProposalDigestEmail(
            user.email,
            topProposals,
            user.email.split('@')[0]
          );
          
          console.log(`Sent governance digest to ${user.email}`);
        } else {
          console.log(`No active proposals for ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        // Continue with next user
      }
    }
    
    console.log('Completed daily governance digest cron job');
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in governance digest cron job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 