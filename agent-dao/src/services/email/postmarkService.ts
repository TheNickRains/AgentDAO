import * as postmark from 'postmark';
import dotenv from 'dotenv';

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

// Helper function to generate HTML content for proposal digest
const generateProposalDigestHtml = (proposals: any[], userName: string): string => {
  const proposalCards = proposals.map(proposal => `
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <h3 style="margin-top: 0;">${proposal.title}</h3>
      <p>${proposal.summary}</p>
      <p><strong>Status:</strong> ${proposal.status}</p>
      <p><strong>Voting ends:</strong> ${new Date(proposal.endTimestamp * 1000).toLocaleString()}</p>
      <div style="margin-top: 15px;">
        <p><strong>To vote, reply with:</strong></p>
        <code style="background-color: #e0e0e0; padding: 5px; border-radius: 3px;">Vote YES on ${proposal.id}</code>
        <br>
        <code style="background-color: #e0e0e0; padding: 5px; border-radius: 3px; margin-top: 5px; display: inline-block;">Vote NO on ${proposal.id}</code>
      </div>
    </div>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${userName},</h2>
      <p>Here are your top governance proposals that need your attention:</p>
      
      ${proposalCards}
      
      <p>To see more proposals or for more information, reply with "Show more proposals".</p>
      <p>You can also ask questions about any proposal by replying to this email.</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>This email was sent by Agent DAO Governance. To unsubscribe, reply with "unsubscribe".</p>
      </div>
    </div>
  `;
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