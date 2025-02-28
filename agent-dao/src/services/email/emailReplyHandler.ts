import { getUserByEmailFromDb } from '../database/supabaseService';
import { processVoteCommand } from '../governance/voteService';
import { generateAIResponse } from '../ai/openaiService';
import { sendVoteConfirmationEmail } from './postmarkService';

interface EmailReplyData {
  From: string;
  FromFull: {
    Email: string;
    Name?: string;
  };
  Subject: string;
  TextBody: string;
  HtmlBody?: string;
  StrippedTextReply?: string;
  MessageID: string;
}

export const handleEmailReply = async (emailData: EmailReplyData): Promise<void> => {
  try {
    console.log('Processing email reply:', emailData.MessageID);
    
    // Extract the user's email
    const userEmail = emailData.FromFull.Email;
    
    // Get the user from the database
    const user = await getUserByEmailFromDb(userEmail);
    if (!user) {
      console.error(`User not found for email: ${userEmail}`);
      throw new Error('User not found');
    }
    
    // Extract the message content (prefer stripped reply if available)
    const messageContent = emailData.StrippedTextReply || emailData.TextBody;
    
    // Determine the type of command in the email
    const commandType = determineCommandType(messageContent);
    
    switch (commandType.type) {
      case 'vote':
        // Process vote command
        if (commandType.proposalId && commandType.choice) {
          const voteResult = await processVoteCommand(
            user.id,
            user.smart_wallet_address,
            commandType.proposalId,
            commandType.choice
          );
          
          // Send confirmation email
          await sendVoteConfirmationEmail(
            userEmail,
            voteResult.proposalTitle,
            commandType.choice,
            voteResult.txHash
          );
        } else {
          console.error('Missing proposalId or choice in vote command');
        }
        break;
        
      case 'question':
        // Process question with AI
        const aiResponse = await generateAIResponse(messageContent, user.id);
        
        // Send response email (implementation would be in postmarkService)
        // await sendAIResponseEmail(userEmail, aiResponse);
        break;
        
      case 'show_more':
        // Handle request to show more proposals
        // Implementation would fetch more proposals and send a new digest
        break;
        
      default:
        console.log(`Unrecognized command in email: ${messageContent.substring(0, 100)}...`);
        // Could send a help email explaining valid commands
        break;
    }
    
    console.log('Email reply processed successfully');
  } catch (error) {
    console.error('Error handling email reply:', error);
    throw error;
  }
};

// Helper function to determine the type of command in the email
const determineCommandType = (messageContent: string): { 
  type: 'vote' | 'question' | 'show_more' | 'unknown';
  proposalId?: string;
  choice?: string;
} => {
  // Check for vote command (e.g., "Vote YES on Proposal 123")
  const voteRegex = /vote\s+(yes|no|abstain)\s+on\s+(?:proposal\s+)?(\w+)/i;
  const voteMatch = messageContent.match(voteRegex);
  
  if (voteMatch) {
    return {
      type: 'vote',
      choice: voteMatch[1].toUpperCase(),
      proposalId: voteMatch[2]
    };
  }
  
  // Check for "show more proposals" command
  if (/show\s+more\s+proposals/i.test(messageContent)) {
    return { type: 'show_more' };
  }
  
  // If no specific command is detected, treat it as a question
  return { type: 'question' };
}; 