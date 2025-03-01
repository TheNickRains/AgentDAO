import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Verifies a signature against a wallet address and message
 * @param walletAddress The wallet address that supposedly signed the message
 * @param message The message that was signed
 * @param signature The signature to verify
 * @returns True if the signature is valid, false otherwise
 */
export function verifySignature(walletAddress: string, message: string, signature: string): boolean {
  try {
    // Input validation
    if (!walletAddress || !message || !signature) {
      return false;
    }
    
    // Normalize the wallet address to lowercase for comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature).toLowerCase();
    
    // Compare the recovered address with the provided wallet address
    return recoveredAddress === normalizedWalletAddress;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Alias for verifySignature to maintain backward compatibility
export const verifyWalletSignature = verifySignature;

/**
 * Generates a random nonce for authentication
 * @returns A random nonce string
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a message to be signed for authentication
 * @param walletAddress The wallet address to authenticate
 * @param nonce A unique nonce for this authentication attempt
 * @returns The message to be signed
 */
export function generateAuthMessage(walletAddress: string, nonce: string): string {
  return `Sign this message to authenticate with Agent DAO: ${nonce}`;
}

/**
 * Validates a wallet address format
 * @param walletAddress The wallet address to validate
 * @returns True if the wallet address is valid, false otherwise
 */
export function isValidWalletAddress(walletAddress: string): boolean {
  try {
    // Check if the address is a valid Ethereum address
    return ethers.utils.isAddress(walletAddress);
  } catch (error) {
    return false;
  }
}

/**
 * Gets the checksummed version of a wallet address
 * @param walletAddress The wallet address to get the checksummed version of
 * @returns The checksummed wallet address, or null if invalid
 */
export function getChecksumAddress(walletAddress: string): string | null {
  try {
    if (!isValidWalletAddress(walletAddress)) {
      return null;
    }
    
    return ethers.utils.getAddress(walletAddress);
  } catch (error) {
    return null;
  }
}

/**
 * Get the balance of a wallet
 * @param walletAddress The wallet address to check
 * @param provider The Ethereum provider to use
 * @returns The wallet balance in ETH
 */
export const getWalletBalance = async (
  walletAddress: string,
  provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL)
): Promise<string> => {
  try {
    const balance = await provider.getBalance(walletAddress);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw new Error(`Failed to get wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if a wallet has a specific token
 * @param walletAddress The wallet address to check
 * @param tokenAddress The token contract address
 * @param provider The Ethereum provider to use
 * @returns True if the wallet has the token, false otherwise
 */
export const hasToken = async (
  walletAddress: string,
  tokenAddress: string,
  provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL)
): Promise<boolean> => {
  try {
    // ERC20 token ABI (minimal for balanceOf)
    const tokenAbi = [
      'function balanceOf(address owner) view returns (uint256)'
    ];
    
    // Create contract instance
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
    
    // Get token balance
    const balance = await tokenContract.balanceOf(walletAddress);
    
    // Return true if balance is greater than 0
    return balance.gt(0);
  } catch (error) {
    console.error('Error checking token balance:', error);
    return false;
  }
}; 