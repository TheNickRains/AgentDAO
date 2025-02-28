import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Import ABI definitions
import votingHubAbi from '../../contracts/abis/VotingHub.json';

dotenv.config();

// Chain IDs
const CHAIN_IDS = {
  BASE: 8453,
  ETHEREUM: 1,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  POLYGON: 137
};

// Contract addresses (these would be the actual deployed contract addresses)
const CONTRACT_ADDRESSES = {
  VOTING_HUB: '0x0000000000000000000000000000000000000000', // Placeholder
  CCIP_RECEIVERS: {
    [CHAIN_IDS.ETHEREUM]: '0x0000000000000000000000000000000000000000', // Placeholder
    [CHAIN_IDS.OPTIMISM]: '0x0000000000000000000000000000000000000000', // Placeholder
    [CHAIN_IDS.ARBITRUM]: '0x0000000000000000000000000000000000000000', // Placeholder
    [CHAIN_IDS.POLYGON]: '0x0000000000000000000000000000000000000000'  // Placeholder
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
const getTargetChainId = (protocol: string): number => {
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

// Execute a vote transaction via CCIP
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
    
    // In a real implementation, you would use the user's smart wallet to sign the transaction
    // For this example, we'll use a placeholder private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Private key not found in environment variables');
    }
    
    // Create a wallet with the private key
    const wallet = new ethers.Wallet(privateKey, baseProvider);
    
    // Create a contract instance for the Voting Hub
    const votingHub = new ethers.Contract(
      CONTRACT_ADDRESSES.VOTING_HUB,
      votingHubAbi,
      wallet
    );
    
    // Prepare the vote data
    const voteData = {
      voter: smartWalletAddress,
      proposalId,
      choice,
      protocol,
      targetChainId
    };
    
    // Estimate the CCIP fee
    const ccipFee = await votingHub.estimateCrossChainVoteFee(
      targetChainId,
      voteData
    );
    
    // Execute the cross-chain vote
    const tx = await votingHub.castCrossChainVote(
      targetChainId,
      voteData,
      { value: ccipFee.mul(11).div(10) } // Add 10% buffer to the fee
    );
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Vote transaction sent: ${receipt.transactionHash}`);
    
    return receipt.transactionHash;
  } catch (error) {
    console.error('Error executing vote transaction:', error);
    throw new Error(`Failed to execute vote transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 