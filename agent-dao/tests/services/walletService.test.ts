import { 
  verifySignature, 
  generateAuthMessage, 
  isValidWalletAddress, 
  getChecksumAddress 
} from '../../src/services/blockchain/walletService';
import { ethers } from 'ethers';

describe('Wallet Service', () => {
  // Test wallet for verification
  const testWallet = new ethers.Wallet(ethers.utils.randomBytes(32));
  const walletAddress = testWallet.address;
  
  describe('verifySignature', () => {
    it('should verify a valid signature', async () => {
      // Create a message to sign
      const message = `Sign this message to authenticate with Agent DAO: 123456`;
      
      // Sign the message with the test wallet
      const signature = await testWallet.signMessage(message);
      
      // Verify the signature
      const result = verifySignature(walletAddress, message, signature);
      
      expect(result).toBe(true);
    });
    
    it('should reject an invalid signature', async () => {
      const message = `Sign this message to authenticate with Agent DAO: 123456`;
      const signature = await testWallet.signMessage(message);
      
      // Try to verify with a different message
      const differentMessage = `Sign this message to authenticate with Agent DAO: 654321`;
      const result = verifySignature(walletAddress, differentMessage, signature);
      
      expect(result).toBe(false);
    });
    
    it('should reject a signature from a different wallet', async () => {
      const message = `Sign this message to authenticate with Agent DAO: 123456`;
      const signature = await testWallet.signMessage(message);
      
      // Create a different wallet
      const differentWallet = new ethers.Wallet(ethers.utils.randomBytes(32));
      
      // Try to verify with a different wallet address
      const result = verifySignature(differentWallet.address, message, signature);
      
      expect(result).toBe(false);
    });
    
    it('should handle invalid signature format', () => {
      const message = `Sign this message to authenticate with Agent DAO: 123456`;
      const invalidSignature = 'invalid-signature-format';
      
      // This should not throw an error but return false
      expect(() => {
        const result = verifySignature(walletAddress, message, invalidSignature);
        expect(result).toBe(false);
      }).not.toThrow();
    });
    
    it('should handle empty inputs gracefully', () => {
      expect(verifySignature('', '', '')).toBe(false);
      expect(verifySignature(walletAddress, '', '')).toBe(false);
      expect(verifySignature('', 'message', '')).toBe(false);
    });
  });
  
  describe('generateAuthMessage', () => {
    it('should generate a message with the nonce', () => {
      const nonce = '123456';
      const message = generateAuthMessage(walletAddress, nonce);
      
      expect(message).toBe(`Sign this message to authenticate with Agent DAO: ${nonce}`);
    });
  });
  
  describe('isValidWalletAddress', () => {
    it('should validate a correct Ethereum address', () => {
      expect(isValidWalletAddress(walletAddress)).toBe(true);
    });
    
    it('should reject an invalid Ethereum address', () => {
      expect(isValidWalletAddress('0xinvalid')).toBe(false);
      expect(isValidWalletAddress('not-an-address')).toBe(false);
      expect(isValidWalletAddress('')).toBe(false);
    });
  });
  
  describe('getChecksumAddress', () => {
    it('should return the checksummed address for a valid address', () => {
      const lowercaseAddress = walletAddress.toLowerCase();
      const checksummed = getChecksumAddress(lowercaseAddress);
      
      expect(checksummed).toBe(walletAddress);
    });
    
    it('should return null for an invalid address', () => {
      expect(getChecksumAddress('0xinvalid')).toBeNull();
      expect(getChecksumAddress('not-an-address')).toBeNull();
      expect(getChecksumAddress('')).toBeNull();
    });
  });
}); 