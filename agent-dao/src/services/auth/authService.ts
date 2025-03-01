import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Generate a random nonce for wallet verification
 * @returns Random nonce
 */
export const generateNonce = (): string => {
  // Generate a random string
  const nonce = crypto.randomBytes(32).toString('hex');
  
  return nonce;
};

/**
 * Verify a signature against a message and wallet address
 * @param walletAddress Wallet address
 * @param signature Signature
 * @param message Message that was signed
 * @returns Whether the signature is valid
 */
export const verifySignature = async (
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> => {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
    // Check if the recovered address matches the wallet address
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Generate a message for wallet verification
 * @param walletAddress Wallet address
 * @param nonce Nonce
 * @returns Message to sign
 */
export const generateSignatureMessage = (walletAddress: string, nonce: string): string => {
  return `Sign this message to verify your wallet ownership: ${nonce}`;
}; 