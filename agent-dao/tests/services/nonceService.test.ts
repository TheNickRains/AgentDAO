import { 
  generateNonce, 
  validateNonce, 
  cleanupExpiredNonces 
} from '../../src/services/auth/nonceService';
import { supabase } from '../../src/services/database/supabaseService';

// Mock the supabase client
jest.mock('../../src/services/database/supabaseService', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn(),
    data: null,
    error: null
  }
}));

describe('Nonce Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNonce', () => {
    it('should generate a unique nonce for a wallet address', async () => {
      // Mock the insert response
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: { nonce: '123456', expires_at: new Date(Date.now() + 15 * 60 * 1000) },
        error: null
      });

      const result = await generateNonce('0x1234567890abcdef');
      
      expect(supabase.from).toHaveBeenCalledWith('auth_nonces');
      expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        wallet_address: '0x1234567890abcdef',
        nonce: expect.any(String),
        expires_at: expect.any(Date)
      }));
      
      expect(result).toEqual({
        nonce: '123456',
        expiresAt: expect.any(Date)
      });
    });

    it('should handle database errors when generating nonce', async () => {
      // Mock the insert response with an error
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(generateNonce('0x1234567890abcdef')).rejects.toThrow('Failed to generate nonce: Database error');
      
      expect(supabase.from).toHaveBeenCalledWith('auth_nonces');
    });
  });

  describe('validateNonce', () => {
    it('should validate a valid nonce', async () => {
      // Mock the select response
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: { 
          id: '1', 
          wallet_address: '0x1234567890abcdef', 
          nonce: '123456', 
          expires_at: new Date(Date.now() + 5 * 60 * 1000) 
        },
        error: null
      });

      // Mock the delete response
      (supabase.delete as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockResolvedValue({
        data: null,
        error: null
      });

      const result = await validateNonce('0x1234567890abcdef', '123456');
      
      expect(supabase.from).toHaveBeenCalledWith('auth_nonces');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('wallet_address', '0x1234567890abcdef');
      expect(supabase.eq).toHaveBeenCalledWith('nonce', '123456');
      
      expect(result).toBe(true);
    });

    it('should return false for an invalid nonce', async () => {
      // Mock the select response with no data
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      const result = await validateNonce('0x1234567890abcdef', 'invalid-nonce');
      
      expect(result).toBe(false);
    });

    it('should return false for an expired nonce', async () => {
      // Mock the select response with expired nonce
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: { 
          id: '1', 
          wallet_address: '0x1234567890abcdef', 
          nonce: '123456', 
          expires_at: new Date(Date.now() - 5 * 60 * 1000) // Expired
        },
        error: null
      });

      const result = await validateNonce('0x1234567890abcdef', '123456');
      
      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredNonces', () => {
    it('should delete expired nonces', async () => {
      // Mock the delete response
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.delete as jest.Mock).mockReturnThis();
      (supabase.lt as jest.Mock).mockResolvedValue({
        data: { count: 5 },
        error: null
      });

      await cleanupExpiredNonces();
      
      expect(supabase.from).toHaveBeenCalledWith('auth_nonces');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.lt).toHaveBeenCalledWith('expires_at', expect.any(Date));
    });

    it('should handle database errors when cleaning up nonces', async () => {
      // Mock the delete response with an error
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.delete as jest.Mock).mockReturnThis();
      (supabase.lt as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(cleanupExpiredNonces()).rejects.toThrow('Failed to clean up expired nonces: Database error');
      
      expect(supabase.from).toHaveBeenCalledWith('auth_nonces');
    });
  });
}); 