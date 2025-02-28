import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabase: SupabaseClient;

export const initializeSupabase = async (): Promise<void> => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key not found in environment variables');
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    await supabase.from('users').select('count').single();
    console.log('Supabase connection successful');
  } catch (error: any) {
    console.error('Error connecting to Supabase:', error);
  }
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
};

// User-related database operations
export const createUserInDb = async (email: string, walletAddress: string, smartWalletAddress: string) => {
  const { data, error } = await supabase
    .from('users')
    .insert([
      { 
        email, 
        wallet_address: walletAddress,
        smart_wallet_address: smartWalletAddress,
        created_at: new Date().toISOString()
      }
    ])
    .select();
    
  if (error) {
    throw new Error(`Error creating user: ${error.message}`);
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