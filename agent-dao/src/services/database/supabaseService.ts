import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Returns the Supabase client instance
 * @returns Supabase client
 */
export function getSupabaseClient() {
  return supabase;
}

/**
 * Initializes the Supabase connection
 * @returns True if initialization was successful
 */
export async function initializeSupabase(): Promise<boolean> {
  try {
    // Test the connection by making a simple query
    const { error } = await supabase.from('health_check').select('count').single();
    if (error) {
      console.error('Failed to initialize Supabase:', error.message);
      return false;
    }
    console.log('Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
}

/**
 * Executes a database query with error handling
 * @param queryFn Function that performs the database query
 * @returns The result of the query
 */
export async function executeQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>): Promise<T> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from database');
    }
    
    return data;
  } catch (error: any) {
    console.error('Database query failed:', error.message);
    throw error;
  }
}

/**
 * Checks if the database connection is working
 * @returns True if the connection is working, false otherwise
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('health_check').select('count').single();
    return !error;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// User-related database operations
export const createUserInDb = async (email: string, walletAddress: string, smartWalletAddress: string) => {
  const { data, error } = await supabase
    .from('users')
    .insert([
      { 
        email, 
        wallet_address: walletAddress,
        smart_wallet_address: smartWalletAddress,
        created_at: new Date().toISOString(),
        delegation_status: {
          UNISWAP: false,
          AAVE: false,
          COMPOUND: false,
          OPTIMISM: false,
          ARBITRUM: false
        }
      }
    ])
    .select();
    
  if (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
  
  return data?.[0];
};

export const updateUserInDb = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select();
    
  if (error) {
    throw new Error(`Error updating user: ${error.message}`);
  }
  
  return data?.[0];
};

export const getUserByEmailFromDb = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error code
    throw new Error(`Error fetching user: ${error.message}`);
  }
  
  return data;
};

export const getUserByWalletFromDb = async (walletAddress: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching user: ${error.message}`);
  }
  
  return data;
};

// Proposal-related database operations
export const saveProposalToDb = async (proposal: any) => {
  const { data, error } = await supabase
    .from('proposals')
    .insert([proposal])
    .select();
    
  if (error) {
    throw new Error(`Error saving proposal: ${error.message}`);
  }
  
  return data?.[0];
};

export const getProposalsByWalletFromDb = async (walletAddress: string) => {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('wallet_address', walletAddress);
    
  if (error) {
    throw new Error(`Error fetching proposals: ${error.message}`);
  }
  
  return data;
};

// Vote-related database operations
export const saveVoteToDb = async (vote: any) => {
  const { data, error } = await supabase
    .from('votes')
    .insert([vote])
    .select();
    
  if (error) {
    throw new Error(`Error saving vote: ${error.message}`);
  }
  
  return data?.[0];
};

export const getVotesByUserFromDb = async (userId: string) => {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    throw new Error(`Error fetching votes: ${error.message}`);
  }
  
  return data;
};

/**
 * Get a user's voting history from the database
 * @param userId User ID to get voting history for
 * @returns Array of user's past votes
 */
export const getUserVotingHistory = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*, proposals(title, dao, category)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Format the data to include proposal title and dao
    return data.map(vote => ({
      id: vote.id,
      proposal_id: vote.proposal_id,
      proposal_title: vote.proposals?.title || 'Unknown Proposal',
      dao: vote.proposals?.dao || 'Unknown DAO',
      category: vote.proposals?.category || 'Unknown',
      choice: vote.choice,
      timestamp: new Date(vote.created_at).getTime() / 1000,
    }));
  } catch (error) {
    console.error('Error getting user voting history:', error);
    return [];
  }
};

/**
 * Store a nonce for wallet authentication
 * @param walletAddress Wallet address
 * @param nonce Generated nonce
 * @param expiresAt Expiration timestamp
 * @returns Success status
 */
export const storeNonce = async (
  walletAddress: string,
  nonce: string,
  expiresAt: Date
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('auth_nonces')
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        nonce,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing nonce:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error storing nonce:', error);
    return false;
  }
};

/**
 * Get a stored nonce for wallet authentication
 * @param walletAddress Wallet address
 * @returns Nonce if found and valid, null otherwise
 */
export const getNonce = async (walletAddress: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('auth_nonces')
      .select('nonce, expires_at')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error || !data) {
      console.error('Error retrieving nonce:', error);
      return null;
    }

    // Check if nonce is expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.log('Nonce expired for wallet:', walletAddress);
      return null;
    }

    return data.nonce;
  } catch (error) {
    console.error('Error retrieving nonce:', error);
    return null;
  }
};

/**
 * Invalidate a nonce after use
 * @param walletAddress Wallet address
 * @returns Success status
 */
export const invalidateNonce = async (walletAddress: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('auth_nonces')
      .delete()
      .eq('wallet_address', walletAddress.toLowerCase());

    if (error) {
      console.error('Error invalidating nonce:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error invalidating nonce:', error);
    return false;
  }
}; 