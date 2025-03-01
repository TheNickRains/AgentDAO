import { supabase } from '../database/supabaseService';
import crypto from 'crypto';

// Define the nonce record type
interface NonceRecord {
  id: string;
  wallet_address: string;
  nonce: string;
  expires_at: string | Date;
  created_at: string | Date;
}

/**
 * Generates a random nonce for wallet authentication
 * @param walletAddress The wallet address to generate a nonce for
 * @returns The generated nonce and its expiration time
 */
export async function generateNonce(walletAddress: string): Promise<{ nonce: string; expiresAt: Date }> {
  try {
    // Generate a random nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    // Store the nonce in the database
    const { data, error } = await supabase
      .from('auth_nonces')
      .insert({
        wallet_address: walletAddress,
        nonce,
        expires_at: expiresAt
      })
      .single();
    
    if (error) {
      throw new Error(`Failed to generate nonce: ${error.message}`);
    }
    
    const record = data as NonceRecord;
    
    return {
      nonce: record.nonce,
      expiresAt: new Date(record.expires_at)
    };
  } catch (error: any) {
    throw new Error(`Failed to generate nonce: ${error.message}`);
  }
}

/**
 * Validates a nonce for a wallet address
 * @param walletAddress The wallet address to validate the nonce for
 * @param nonce The nonce to validate
 * @returns True if the nonce is valid, false otherwise
 */
export async function validateNonce(walletAddress: string, nonce: string): Promise<boolean> {
  try {
    // Get the nonce from the database
    const { data, error } = await supabase
      .from('auth_nonces')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('nonce', nonce)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    const record = data as NonceRecord;
    
    // Check if the nonce has expired
    const expiresAt = new Date(record.expires_at);
    if (expiresAt < new Date()) {
      return false;
    }
    
    // Delete the nonce after use (one-time use)
    await supabase
      .from('auth_nonces')
      .delete()
      .eq('id', record.id);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Cleans up expired nonces from the database
 */
export async function cleanupExpiredNonces(): Promise<void> {
  try {
    const { error } = await supabase
      .from('auth_nonces')
      .delete()
      .lt('expires_at', new Date());
    
    if (error) {
      throw new Error(`Failed to clean up expired nonces: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to clean up expired nonces: ${error.message}`);
  }
}

/**
 * Schedules periodic cleanup of expired nonces
 * @param intervalMinutes How often to clean up expired nonces (in minutes)
 */
export function scheduleNonceCleanup(intervalMinutes: number = 60): NodeJS.Timer {
  return setInterval(async () => {
    try {
      await cleanupExpiredNonces();
      console.log('Cleaned up expired nonces');
    } catch (error) {
      console.error('Failed to clean up expired nonces:', error);
    }
  }, intervalMinutes * 60 * 1000);
} 