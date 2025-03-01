import * as postmark from 'postmark';
import dotenv from 'dotenv';
import { getProposalsByWalletFromDb } from '../database/supabaseService';
import { getUserByEmailFromDb } from '../database/supabaseService';

dotenv.config();

let client: postmark.ServerClient;

export const initializePostmark = (): void => {
  const postmarkToken = process.env.POSTMARK_API_TOKEN;
  
  if (!postmarkToken) {
    throw new Error('Postmark API token not found in environment variables');
  }
  
  client = new postmark.ServerClient(postmarkToken);
};

export const getPostmarkClient = (): postmark.ServerClient => {
  if (!client) {
    throw new Error('Postmark client not initialized');
  }
  return client;
};

export const sendProposalDigestEmail = async (
  to: string,
  proposals: any[],
  userName: string
): Promise<postmark.Models.MessageSendingResponse> => {
  if (!client) {
    throw new Error('Postmark client not initialized');
  }
  
  // Generate HTML content for the email
  const htmlContent = generateProposalDigestHtml(proposals, userName);
  
  // Send the email
  return await client.sendEmail({
    From: 'governance@agent-dao.com',
    To: to,
    Subject: 'Your DAO Governance Digest',
    HtmlBody: htmlContent,
    TextBody: generateProposalDigestText(proposals, userName),
    MessageStream: 'outbound',
    ReplyTo: 'reply@agent-dao.com'
  });
};

export const sendVoteConfirmationEmail = async (
  to: string,
  proposalTitle: string,
  choice: string,
  txHash?: string
): Promise<postmark.Models.MessageSendingResponse> => {
  if (!client) {
    throw new Error('Postmark client not initialized');
  }
  
  // Generate HTML content for the email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Vote Confirmation</h2>
      <p>Your vote has been successfully processed:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Proposal:</strong> ${proposalTitle}</p>
        <p><strong>Your vote:</strong> ${choice}</p>
        ${txHash ? `<p><strong>Transaction Hash:</strong> ${txHash}</p>` : ''}
      </div>
      <p>Thank you for participating in governance!</p>
    </div>
  `;
  
  // Send the email
  return await client.sendEmail({
    From: 'governance@agent-dao.com',
    To: to,
    Subject: 'Vote Confirmation: ' + proposalTitle,
    HtmlBody: htmlContent,
    TextBody: `Vote Confirmation\n\nYour vote has been successfully processed:\n\nProposal: ${proposalTitle}\nYour vote: ${choice}\n${txHash ? `Transaction Hash: ${txHash}\n` : ''}\nThank you for participating in governance!`,
    MessageStream: 'outbound'
  });
};

export const sendAIResponseEmail = async (
  to: string,
  responseText: string
): Promise<postmark.Models.MessageSendingResponse> => {
  if (!client) {
    throw new Error('Postmark client not initialized');
  }
  
  // Generate HTML content for the email
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Response to Your Question</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p>${responseText.replace(/\n/g, '<br>')}</p>
      </div>
      <p>Feel free to ask any other questions about governance proposals!</p>
    </div>
  `;
  
  // Send the email
  return await client.sendEmail({
    From: 'governance@agent-dao.com',
    To: to,
    Subject: 'Response to Your Governance Question',
    HtmlBody: htmlContent,
    TextBody: `Response to Your Question\n\n${responseText}\n\nFeel free to ask any other questions about governance proposals!`,
    MessageStream: 'outbound',
    ReplyTo: 'reply@agent-dao.com'
  });
};

export const sendMoreProposalsEmail = async (
  to: string,
  walletAddress: string
): Promise<postmark.Models.MessageSendingResponse> => {
  if (!client) {
    throw new Error('Postmark client not initialized');
  }
  
  // Get the user
  const user = await getUserByEmailFromDb(to);
  if (!user) {
    throw new Error(`User not found for email: ${to}`);
  }
  
  // Get more proposals for the user
  const proposals = await getProposalsByWalletFromDb(walletAddress);
  
  // Sort proposals by end time (closest to expiration first)
  const sortedProposals = proposals.sort((a, b) => a.endTimestamp - b.endTimestamp);
  
  // Take the next batch of proposals (e.g., 5 more)
  const moreProposals = sortedProposals.slice(0, 5);
  
  // Generate HTML content for the email
  const htmlContent = generateProposalDigestHtml(moreProposals, user.email.split('@')[0]);
  
  // Send the email
  return await client.sendEmail({
    From: 'governance@agent-dao.com',
    To: to,
    Subject: 'More Governance Proposals for You',
    HtmlBody: htmlContent,
    TextBody: generateProposalDigestText(moreProposals, user.email.split('@')[0]),
    MessageStream: 'outbound',
    ReplyTo: 'reply@agent-dao.com'
  });
};

// Helper function to generate HTML content for proposal digest
const generateProposalDigestHtml = (proposals: any[], userName: string): string => {
  // Read the email template file
  const fs = require('fs');
  const path = require('path');
  const Mustache = require('mustache');
  
  const templatePath = path.resolve(process.cwd(), 'email-template.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Format proposals for the template
  const formattedProposals = proposals.map(proposal => {
    // Calculate deadline text
    const endDate = new Date(proposal.endTimestamp * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const deadlineText = daysRemaining <= 1 
      ? 'Ends in 1 day' 
      : `Ends in ${daysRemaining} days`;
    
    // Format vote options
    const voteOptions = [
      { 
        option_name: 'FOR', 
        proposal_id: proposal.id,
        option_class: 'vote-for'
      },
      { 
        option_name: 'AGAINST', 
        proposal_id: proposal.id,
        option_class: 'vote-against'
      },
      { 
        option_name: 'ABSTAIN', 
        proposal_id: proposal.id,
        option_class: 'vote-abstain'
      }
    ];
    
    // Get DAO icon
    const daoIcons: {[key: string]: string} = {
      'uniswap': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
      'aave': 'https://cryptologos.cc/logos/aave-aave-logo.png',
      'optimism': 'https://cryptologos.cc/logos/optimism-op-logo.png',
      'compound': 'https://cryptologos.cc/logos/compound-comp-logo.png',
      'maker': 'https://cryptologos.cc/logos/maker-mkr-logo.png',
      'arbitrum': 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
      'base': 'https://cryptologos.cc/logos/base-logo.png',
      // Add more DAOs as needed
      'default': 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
    };
    
    const daoIcon = daoIcons[proposal.dao.toLowerCase()] || daoIcons.default;
    
    return {
      status: 'Active',
      dao_name: proposal.dao,
      dao_icon: daoIcon,
      deadline: deadlineText,
      title: proposal.title,
      summary: proposal.summary,
      ai_recommendation: proposal.aiRecommendation || 'Based on your voting history, this proposal aligns with your previous governance decisions.',
      vote_options: voteOptions,
      proposal_id: proposal.id
    };
  });
  
  // Generate impact message based on user's voting history
  const generateImpactMessage = () => {
    // This would ideally come from analyzing the user's actual voting history
    const impactMessages = [
      "Your last vote helped approve a proposal that increased treasury diversification by 15%.",
      "Your participation in governance has contributed to a 20% increase in community engagement.",
      "Thanks to voters like you, the DAO successfully launched 3 new initiatives last month.",
      "Your consistent voting has helped shape the direction of multiple protocols.",
      "Your governance participation puts you in the top 10% of active DAO members."
    ];
    
    // For now, randomly select a message
    return impactMessages[Math.floor(Math.random() * impactMessages.length)];
  };
  
  // Prepare template data
  const templateData = {
    current_date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    user_name: userName,
    impact_message: generateImpactMessage(),
    proposals: formattedProposals,
    dashboard_url: process.env.DASHBOARD_URL || 'http://localhost:8080'
  };
  
  // Render the template with Mustache
  return Mustache.render(template, templateData);
};

// Helper function to generate plain text content for proposal digest
const generateProposalDigestText = (proposals: any[], userName: string): string => {
  const proposalTexts = proposals.map(proposal => `
* ${proposal.title}
  ${proposal.summary}
  Status: ${proposal.status}
  Voting ends: ${new Date(proposal.endTimestamp * 1000).toLocaleString()}
  
  To vote, reply with:
  "Vote YES on ${proposal.id}" or "Vote NO on ${proposal.id}"
  `).join('\n\n');

  return `
Hello ${userName},

Here are your top governance proposals that need your attention:

${proposalTexts}

To see more proposals or for more information, reply with "Show more proposals".
You can also ask questions about any proposal by replying to this email.

---
This email was sent by Agent DAO Governance. To unsubscribe, reply with "unsubscribe".
  `;
}; 