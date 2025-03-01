import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// AgentKit API configuration
const AGENTKIT_API_KEY = process.env.COINBASE_AGENTKIT_API_KEY;
const AGENTKIT_API_URL = 'https://api.coinbase.com/agentkit/v1';

// Headers for API requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AGENTKIT_API_KEY}`
};

/**
 * Initialize a new agent session
 * @returns Session ID for subsequent requests
 */
export async function initializeAgentSession(): Promise<string> {
  try {
    const response = await axios.post(
      `${AGENTKIT_API_URL}/sessions`,
      {},
      { headers }
    );
    
    return response.data.sessionId;
  } catch (error) {
    console.error('Error initializing AgentKit session:', error);
    throw new Error('Failed to initialize AgentKit session');
  }
}

/**
 * Execute a blockchain transaction using AgentKit
 * @param sessionId The agent session ID
 * @param chainId The chain ID (e.g., 1 for Ethereum, 8453 for Base)
 * @param to The recipient address
 * @param data The transaction data
 * @param value The transaction value in wei (optional)
 * @returns Transaction hash
 */
export async function executeTransaction(
  sessionId: string,
  chainId: number,
  to: string,
  data: string,
  value: string = '0'
): Promise<string> {
  try {
    const response = await axios.post(
      `${AGENTKIT_API_URL}/transactions`,
      {
        sessionId,
        chainId,
        to,
        data,
        value
      },
      { headers }
    );
    
    return response.data.transactionHash;
  } catch (error) {
    console.error('Error executing transaction with AgentKit:', error);
    throw new Error('Failed to execute transaction');
  }
}

/**
 * Cast a vote on a governance proposal
 * @param sessionId The agent session ID
 * @param chainId The chain ID of the governance contract
 * @param governorAddress The address of the governor contract
 * @param proposalId The proposal ID
 * @param support The vote support value (0: Against, 1: For, 2: Abstain)
 * @returns Transaction hash
 */
export async function castVote(
  sessionId: string,
  chainId: number,
  governorAddress: string,
  proposalId: string,
  support: number
): Promise<string> {
  // Governor contract castVote function signature: castVote(uint256 proposalId, uint8 support)
  const data = `0x56781388${proposalId.padStart(64, '0')}${support.toString().padStart(64, '0')}`;
  
  return executeTransaction(sessionId, chainId, governorAddress, data);
}

/**
 * Cast a vote with reason
 * @param sessionId The agent session ID
 * @param chainId The chain ID of the governance contract
 * @param governorAddress The address of the governor contract
 * @param proposalId The proposal ID
 * @param support The vote support value (0: Against, 1: For, 2: Abstain)
 * @param reason The reason for the vote
 * @returns Transaction hash
 */
export async function castVoteWithReason(
  sessionId: string,
  chainId: number,
  governorAddress: string,
  proposalId: string,
  support: number,
  reason: string
): Promise<string> {
  // Encode the function call for castVoteWithReason(uint256 proposalId, uint8 support, string reason)
  const abiCoder = new (require('web3')).utils.AbiCoder();
  const data = abiCoder.encodeFunctionCall(
    {
      name: 'castVoteWithReason',
      type: 'function',
      inputs: [
        { type: 'uint256', name: 'proposalId' },
        { type: 'uint8', name: 'support' },
        { type: 'string', name: 'reason' }
      ]
    },
    [proposalId, support, reason]
  );
  
  return executeTransaction(sessionId, chainId, governorAddress, data);
}

/**
 * Get transaction status
 * @param sessionId The agent session ID
 * @param transactionHash The transaction hash
 * @returns Transaction status
 */
export async function getTransactionStatus(
  sessionId: string,
  transactionHash: string
): Promise<any> {
  try {
    const response = await axios.get(
      `${AGENTKIT_API_URL}/transactions/${transactionHash}`,
      {
        params: { sessionId },
        headers
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting transaction status from AgentKit:', error);
    throw new Error('Failed to get transaction status');
  }
}

/**
 * Get agent wallet address
 * @param sessionId The agent session ID
 * @returns Wallet address
 */
export async function getAgentWalletAddress(sessionId: string): Promise<string> {
  try {
    const response = await axios.get(
      `${AGENTKIT_API_URL}/wallet`,
      {
        params: { sessionId },
        headers
      }
    );
    
    return response.data.address;
  } catch (error) {
    console.error('Error getting agent wallet address from AgentKit:', error);
    throw new Error('Failed to get agent wallet address');
  }
}

/**
 * Execute a cross-chain vote via CCIP
 * @param sessionId The agent session ID
 * @param sourceChainId The source chain ID (e.g., 8453 for Base)
 * @param votingHubAddress The address of the voting hub contract on the source chain
 * @param targetChainId The target chain ID where the vote will be executed
 * @param governorAddress The address of the governor contract on the target chain
 * @param proposalId The proposal ID
 * @param support The vote support value (0: Against, 1: For, 2: Abstain)
 * @returns Transaction hash
 */
export async function executeCrossChainVote(
  sessionId: string,
  sourceChainId: number,
  votingHubAddress: string,
  targetChainId: number,
  governorAddress: string,
  proposalId: string,
  support: number
): Promise<string> {
  // Encode the function call for the voting hub contract
  const abiCoder = new (require('web3')).utils.AbiCoder();
  const data = abiCoder.encodeFunctionCall(
    {
      name: 'castCrossChainVote',
      type: 'function',
      inputs: [
        { type: 'uint64', name: 'targetChainId' },
        { type: 'address', name: 'governorAddress' },
        { type: 'uint256', name: 'proposalId' },
        { type: 'uint8', name: 'support' }
      ]
    },
    [targetChainId, governorAddress, proposalId, support]
  );
  
  return executeTransaction(sessionId, sourceChainId, votingHubAddress, data);
}

export default {
  initializeAgentSession,
  executeTransaction,
  castVote,
  castVoteWithReason,
  getTransactionStatus,
  getAgentWalletAddress,
  executeCrossChainVote
}; 