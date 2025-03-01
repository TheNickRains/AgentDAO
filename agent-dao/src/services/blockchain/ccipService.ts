import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getSmartAccount, executeGaslessTransaction } from './biconomyService';

// Import ABI definitions
import votingHubAbi from '../../contracts/abis/VotingHub.json';

dotenv.config();

// Chain IDs
export const CHAIN_IDS = {
  BASE: 8453,
  ETHEREUM: 1,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  POLYGON: 137
};

// Contract addresses (these would be the actual deployed contract addresses)
const CONTRACT_ADDRESSES = {
  VOTING_HUB: process.env.VOTING_HUB_ADDRESS || '0x0000000000000000000000000000000000000000',
  CCIP_RECEIVERS: {
    [CHAIN_IDS.ETHEREUM]: process.env.CCIP_RECEIVER_ETH_ADDRESS || '0x0000000000000000000000000000000000000000',
    [CHAIN_IDS.OPTIMISM]: process.env.CCIP_RECEIVER_OPTIMISM_ADDRESS || '0x0000000000000000000000000000000000000000',
    [CHAIN_IDS.ARBITRUM]: process.env.CCIP_RECEIVER_ARBITRUM_ADDRESS || '0x0000000000000000000000000000000000000000',
    [CHAIN_IDS.POLYGON]: process.env.CCIP_RECEIVER_POLYGON_ADDRESS || '0x0000000000000000000000000000000000000000'
  }
};

// RPC providers
let providers: { [chainId: number]: ethers.providers.JsonRpcProvider } = {};

// Initialize providers
export const initializeCCIP = (): void => {
  try {
    // Initialize providers for each chain
    providers = {
      [CHAIN_IDS.BASE]: new ethers.providers.JsonRpcProvider(process.env.BASE_RPC_URL),
      [CHAIN_IDS.ETHEREUM]: new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL),
      [CHAIN_IDS.OPTIMISM]: new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL),
      [CHAIN_IDS.ARBITRUM]: new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL),
      [CHAIN_IDS.POLYGON]: new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL)
    };
    
    console.log('CCIP service initialized successfully');
  } catch (error) {
    console.error('Error initializing CCIP service:', error);
    throw new Error(`Failed to initialize CCIP service: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get the target chain ID for a protocol
export const getTargetChainId = (protocol: string): number => {
  // This is a simplified mapping - in a real implementation, you would have a more comprehensive mapping
  const protocolChainMap: { [protocol: string]: number } = {
    'uniswap': CHAIN_IDS.ETHEREUM,
    'aave': CHAIN_IDS.ETHEREUM,
    'compound': CHAIN_IDS.ETHEREUM,
    'optimism': CHAIN_IDS.OPTIMISM,
    'arbitrum': CHAIN_IDS.ARBITRUM,
    'polygon': CHAIN_IDS.POLYGON
  };
  
  return protocolChainMap[protocol.toLowerCase()] || CHAIN_IDS.ETHEREUM;
};

// Execute a vote transaction via CCIP with gasless transactions
export const executeVoteTransaction = async (
  smartWalletAddress: string,
  protocol: string,
  proposalId: string,
  choice: number
): Promise<string> => {
  try {
    // Get the target chain ID for the protocol
    const targetChainId = getTargetChainId(protocol);
    
    // Get the Base provider
    const baseProvider = providers[CHAIN_IDS.BASE];
    if (!baseProvider) {
      throw new Error('Base provider not initialized');
    }
    
    // Get the private key for the agent's wallet
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Private key not found in environment variables');
    }
    
    // Get the smart account for gasless transactions
    const smartAccount = await getSmartAccount(privateKey);
    
    // Create a contract instance for the Voting Hub
    const votingHubInterface = new ethers.utils.Interface(votingHubAbi);
    
    // Encode the castCrossChainVote function call
    const data = votingHubInterface.encodeFunctionData('castCrossChainVote', [
      targetChainId,
      {
        voter: smartWalletAddress,
        proposalId,
        choice,
        protocol,
        targetChainId
      }
    ]);
    
    // Execute the gasless transaction
    const txHash = await executeGaslessTransaction(
      smartAccount,
      CONTRACT_ADDRESSES.VOTING_HUB,
      data
    );
    
    console.log(`Cross-chain vote transaction sent: ${txHash}`);
    
    return txHash;
  } catch (error) {
    console.error('Error executing vote transaction:', error);
    throw new Error(`Failed to execute vote transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Check the status of a CCIP message
export const checkCcipMessageStatus = async (
  messageId: string,
  sourceChainId: number = CHAIN_IDS.BASE
): Promise<string> => {
  try {
    // Get the provider for the source chain
    const provider = providers[sourceChainId];
    if (!provider) {
      throw new Error(`Provider not initialized for chain ID ${sourceChainId}`);
    }
    
    // Create a contract instance for the Voting Hub
    const votingHub = new ethers.Contract(
      CONTRACT_ADDRESSES.VOTING_HUB,
      votingHubAbi,
      provider
    );
    
    // Call the getCcipMessageStatus function
    const status = await votingHub.getCcipMessageStatus(messageId);
    
    return status;
  } catch (error) {
    console.error('Error checking CCIP message status:', error);
    throw new Error(`Failed to check CCIP message status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Verify that a vote was executed on the target chain
export const verifyVoteExecution = async (
  txHash: string,
  targetChainId: number
): Promise<boolean> => {
  try {
    // Get the provider for the target chain
    const provider = providers[targetChainId];
    if (!provider) {
      throw new Error(`Provider not initialized for chain ID ${targetChainId}`);
    }
    
    // Get the transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    // Check if the transaction was successful
    return receipt && receipt.status === 1;
  } catch (error) {
    console.error('Error verifying vote execution:', error);
    throw new Error(`Failed to verify vote execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 