import { Request, Response } from 'express';
import { supabase } from '../../services/database/supabaseService';
import { checkCcipMessageStatus, verifyVoteExecution, getTargetChainId } from '../../services/blockchain/ccipService';
import { sendVoteConfirmationEmail } from '../../services/email/postmarkService';

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
    console.log('Starting check pending votes cron job');
    
    // Get all pending votes from the database
    const { data: pendingVotes, error } = await supabase
      .from('votes')
      .select('*, users(email)')
      .eq('status', 'pending');
    
    if (error) {
      throw new Error(`Error fetching pending votes: ${error.message}`);
    }
    
    console.log(`Found ${pendingVotes.length} pending votes`);
    
    // Process each pending vote
    for (const vote of pendingVotes) {
      try {
        // Check the CCIP message status
        const messageStatus = await checkCcipMessageStatus(vote.ccip_message_id);
        
        if (messageStatus === 'executed') {
          // Verify the vote execution on the target chain
          const targetChainId = getTargetChainId(vote.dao);
          const isExecuted = await verifyVoteExecution(vote.target_tx_hash, targetChainId);
          
          if (isExecuted) {
            // Update the vote status in the database
            await supabase
              .from('votes')
              .update({ status: 'executed' })
              .eq('id', vote.id);
            
            // Send confirmation email
            await sendVoteConfirmationEmail(
              vote.users.email,
              vote.proposal_title,
              vote.choice,
              vote.target_tx_hash
            );
            
            console.log(`Vote ${vote.id} executed successfully`);
          } else {
            console.log(`Vote ${vote.id} execution verification failed`);
          }
        } else if (messageStatus === 'failed') {
          // Update the vote status in the database
          await supabase
            .from('votes')
            .update({ status: 'failed' })
            .eq('id', vote.id);
          
          console.log(`Vote ${vote.id} failed`);
        } else {
          console.log(`Vote ${vote.id} still pending (status: ${messageStatus})`);
        }
      } catch (voteError) {
        console.error(`Error processing vote ${vote.id}:`, voteError);
        // Continue with next vote
      }
    }
    
    console.log('Completed check pending votes cron job');
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in check pending votes cron job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 