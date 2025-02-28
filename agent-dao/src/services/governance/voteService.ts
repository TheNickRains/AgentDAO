import { ethers } from 'ethers';
import { saveVoteToDb } from '../database/supabaseService';
import { getProposalById } from './proposalService';
import { executeVoteTransaction } from '../blockchain/ccipService';

// Process a vote command from an email
export const processVoteCommand = async (
  userId: string,
  smartWalletAddress: string,
  proposalId: string,
  choice: string
): Promise<{ proposalTitle: string; txHash?: string }> => {
  try {
    console.log(`Processing vote command for proposal ${proposalId}, choice: ${choice}`);
    
    // Get the proposal details
    const proposal = await getProposalById(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    // Convert choice to numeric value based on proposal choices
    const choiceIndex = getChoiceIndex(proposal.choices, choice);
    if (choiceIndex === -1) {
      throw new Error(`Invalid choice "${choice}" for proposal ${proposalId}`);
    }
    
    // Execute the vote transaction via CCIP
    const txHash = await executeVoteTransaction(
      smartWalletAddress,
      proposal.protocol,
      proposalId,
      choiceIndex
    );
    
    // Save the vote to the database
    await saveVoteToDb({
      user_id: userId,
      proposal_id: proposalId,
      proposal_title: proposal.title,
      proposal_summary: proposal.summary || '',
      choice,
      choice_index: choiceIndex,
      smart_wallet_address: smartWalletAddress,
      dao: proposal.protocol,
      tx_hash: txHash,
      created_at: new Date().toISOString()
    });
    
    console.log(`Vote processed successfully for proposal ${proposalId}`);
    
    return {
      proposalTitle: proposal.title,
      txHash
    };
  } catch (error) {
    console.error('Error processing vote command:', error);
    throw new Error(`Failed to process vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to convert a choice string to its index in the proposal choices
const getChoiceIndex = (choices: string[], choice: string): number => {
  // Normalize the choice (uppercase)
  const normalizedChoice = choice.toUpperCase();
  
  // First, try direct matching
  const directIndex = choices.findIndex(c => c.toUpperCase() === normalizedChoice);
  if (directIndex !== -1) {
    return directIndex;
  }
  
  // Handle YES/NO/ABSTAIN mapping to common choices
  if (normalizedChoice === 'YES' || normalizedChoice === 'FOR') {
    // Look for similar positive choices
    const positiveIndex = choices.findIndex(c => 
      ['YES', 'FOR', 'YAE', 'YAY', 'APPROVE', 'SUPPORT'].includes(c.toUpperCase())
    );
    if (positiveIndex !== -1) {
      return positiveIndex;
    }
  } else if (normalizedChoice === 'NO' || normalizedChoice === 'AGAINST') {
    // Look for similar negative choices
    const negativeIndex = choices.findIndex(c => 
      ['NO', 'AGAINST', 'NAY', 'REJECT', 'OPPOSE'].includes(c.toUpperCase())
    );
    if (negativeIndex !== -1) {
      return negativeIndex;
    }
  } else if (normalizedChoice === 'ABSTAIN') {
    // Look for abstain option
    const abstainIndex = choices.findIndex(c => 
      ['ABSTAIN', 'PASS'].includes(c.toUpperCase())
    );
    if (abstainIndex !== -1) {
      return abstainIndex;
    }
  }
  
  // If we can't find a match, return -1
  return -1;
}; 