import { createUserInDb, getUserByEmailFromDb, getUserByWalletFromDb, updateUserInDb } from '../database/supabaseService';
import { createSmartWallet, getSmartAccount, delegateGovernanceTokens, checkDelegationStatus } from '../blockchain/biconomyService';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Governance token addresses for supported DAOs
const GOVERNANCE_TOKENS = {
  UNISWAP: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE token
  COMPOUND: '0xc00e94Cb662C3520282E6f5717214004A7f26888', // COMP token
  OPTIMISM: '0x4200000000000000000000000000000000000042', // OP token
  ARBITRUM: '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB token
};

// Create a new user with a smart wallet and mandatory delegation
export const createUser = async (email: string, walletAddress?: string): Promise<any> => {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmailFromDb(email);
    if (existingUser) {
      return existingUser;
    }
    
    // Create a smart wallet for the user
    const smartWalletAddress = await createSmartWallet(walletAddress);
    
    // Store user in database
    const user = await createUserInDb(email, walletAddress || '', smartWalletAddress);
    
    // If the user provided a wallet address, check for governance tokens and delegate
    if (walletAddress) {
      await checkAndDelegateGovernanceTokens(walletAddress, smartWalletAddress);
    }
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Check for governance tokens and delegate them to the smart wallet
export const checkAndDelegateGovernanceTokens = async (
  ownerAddress: string,
  smartWalletAddress: string
): Promise<void> => {
  try {
    // Get the provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
    
    // Check for governance tokens
    for (const [dao, tokenAddress] of Object.entries(GOVERNANCE_TOKENS)) {
      try {
        // Create a contract instance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        
        // Check if the user has any tokens
        const balance = await tokenContract.balanceOf(ownerAddress);
        
        if (balance.gt(0)) {
          console.log(`User has ${dao} governance tokens. Delegating to smart wallet...`);
          
          // Check if already delegated
          const isDelegated = await checkDelegationStatus(tokenAddress, ownerAddress, provider);
          
          if (!isDelegated) {
            // Get the user's private key (in a real app, this would be securely provided by the user)
            // For this example, we'll use a placeholder
            const privateKey = process.env.PRIVATE_KEY || '';
            
            // Get the smart account
            const smartAccount = await getSmartAccount(privateKey);
            
            // Delegate the tokens to the smart wallet
            await delegateGovernanceTokens(smartAccount, tokenAddress, smartWalletAddress);
            
            console.log(`Successfully delegated ${dao} tokens to smart wallet`);
          } else {
            console.log(`${dao} tokens already delegated`);
          }
        }
      } catch (tokenError) {
        console.error(`Error checking ${dao} token balance:`, tokenError);
        // Continue with other tokens
      }
    }
  } catch (error) {
    console.error('Error checking and delegating governance tokens:', error);
    throw new Error(`Failed to check and delegate governance tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Mock function for testing - doesn't depend on external services
export const createMockUser = async (email: string, walletAddress?: string): Promise<any> => {
  console.log(`Creating mock user with email: ${email}`);
  
  // Generate a mock smart wallet address if none provided
  const mockSmartWalletAddress = '0x' + Array(40).fill(0).map(() => 
    Math.floor(Math.random() * 16).toString(16)).join('');
  
  // Return a mock user object
  return {
    id: `mock-${Date.now()}`,
    email,
    wallet_address: walletAddress || '',
    smart_wallet_address: mockSmartWalletAddress,
    created_at: new Date().toISOString(),
    delegation_status: {
      UNISWAP: false,
      AAVE: false,
      COMPOUND: false,
      OPTIMISM: false,
      ARBITRUM: false
    }
  };
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<any> => {
  try {
    return await getUserByEmailFromDb(email);
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get user by wallet address
export const getUserByWallet = async (walletAddress: string): Promise<any> => {
  try {
    return await getUserByWalletFromDb(walletAddress);
  } catch (error) {
    console.error('Error getting user by wallet:', error);
    throw new Error(`Failed to get user by wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update user delegation status
export const updateDelegationStatus = async (
  userId: string,
  dao: string,
  status: boolean
): Promise<void> => {
  try {
    // Get the user
    const user = await getUserByEmailFromDb(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Update the delegation status
    const delegationStatus = user.delegation_status || {};
    delegationStatus[dao] = status;
    
    // Update the user in the database
    await updateUserInDb(userId, { delegation_status: delegationStatus });
    
    console.log(`Updated delegation status for ${dao} to ${status}`);
  } catch (error) {
    console.error('Error updating delegation status:', error);
    throw new Error(`Failed to update delegation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 