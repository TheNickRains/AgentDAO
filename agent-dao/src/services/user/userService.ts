import { createUserInDb, getUserByEmailFromDb, getUserByWalletFromDb } from '../database/supabaseService';
import { createSmartWallet } from '../blockchain/biconomyService';

// Create a new user with a smart wallet
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
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    created_at: new Date().toISOString()
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