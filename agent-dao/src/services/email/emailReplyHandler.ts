import { getUserByEmailFromDb } from '../database/supabaseService';
import { processVoteCommand } from '../governance/voteService';
import { sendVoteConfirmationEmail, sendAIResponseEmail, sendMoreProposalsEmail } from './postmarkService';
import { getProposalsByWalletFromDb } from '../database/supabaseService';
import { analyzeEmailReply, answerGovernanceQuestion } from '../ai/langchainService';

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
    
    // Get the user's proposals for context
    const userProposals = await getProposalsByWalletFromDb(user.wallet_address);
    
    // Use LangChain to analyze the email reply
    const analysisResult = await analyzeEmailReply(messageContent, userProposals);
    
    switch (analysisResult.intent) {
      case 'vote':
        // Process vote command
        if (analysisResult.proposalId && analysisResult.choice) {
          const voteResult = await processVoteCommand(
            user.id,
            user.smart_wallet_address,
            analysisResult.proposalId,
            analysisResult.choice
          );
          
          // Send confirmation email
          await sendVoteConfirmationEmail(
            userEmail,
            voteResult.proposalTitle,
            analysisResult.choice,
            voteResult.txHash
          );
          
          console.log(`Vote processed for proposal ${analysisResult.proposalId}, choice: ${analysisResult.choice}`);
        } else {
          console.error('Missing proposalId or choice in vote command');
          
          // Send error email
          await sendAIResponseEmail(
            userEmail,
            "I couldn't process your vote because I couldn't identify the proposal ID or your choice. Please try again with a clearer format, such as 'Vote YES on Proposal 123'."
          );
        }
        break;
        
      case 'question':
        // Process question with AI
        const relevantProposal = userProposals.find(p => p.id === analysisResult.proposalId);
        
        // Generate AI response
        const aiResponse = await answerGovernanceQuestion(
          analysisResult.question || messageContent,
          relevantProposal ? JSON.stringify(relevantProposal) : ''
        );
        
        // Send response email
        await sendAIResponseEmail(userEmail, aiResponse);
        
        console.log('AI response sent for question');
        break;
        
      case 'show_more':
        // Handle request to show more proposals
        // Get more proposals and send a new digest
        await sendMoreProposalsEmail(userEmail, user.wallet_address);
        
        console.log('More proposals email sent');
        break;
        
      default:
        console.log(`Unrecognized command in email: ${messageContent.substring(0, 100)}...`);
        
        // Send a help email explaining valid commands
        await sendAIResponseEmail(
          userEmail,
          "I couldn't understand your request. You can:\n\n" +
          "- Vote on a proposal by replying with 'Vote YES/NO/ABSTAIN on Proposal ID'\n" +
          "- Ask a question about a proposal\n" +
          "- Request more proposals by replying with 'SHOW MORE PROPOSALS'"
        );
        break;
    }
    
    console.log('Email reply processed successfully');
  } catch (error) {
    console.error('Error handling email reply:', error);
    throw error;
  }
}; 