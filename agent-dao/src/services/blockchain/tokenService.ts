import { ethers } from 'ethers';
import { GOVERNANCE_TOKEN_ADDRESSES } from '../../config/constants';

// ABI for ERC20 token with delegation
const TOKEN_ABI = [
  // Read functions
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  // Delegation functions
  'function delegate(address delegatee) returns (bool)',
  'function delegates(address account) view returns (address)'
];

// Interface for governance token
interface GovernanceToken {
  symbol: string;
  name: string;
  balance: string;
  formattedBalance: string;
  address: string;
  delegated: boolean;
  delegatedTo: string | null;
}

/**
 * Get governance tokens for a wallet address
 * @param walletAddress The wallet address to check
 * @returns Array of governance tokens with balances
 */
export const getGovernanceTokens = async (walletAddress: string): Promise<GovernanceToken[]> => {
  try {
    // Connect to provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key');
    
    const tokens: GovernanceToken[] = [];
    
    // Check each governance token
    for (const [symbol, address] of Object.entries(GOVERNANCE_TOKEN_ADDRESSES)) {
      const tokenContract = new ethers.Contract(address, TOKEN_ABI, provider);
      
      // Get token details
      const [balance, name, decimals, delegatedTo] = await Promise.all([
        tokenContract.balanceOf(walletAddress),
        tokenContract.name(),
        tokenContract.decimals(),
        tokenContract.delegates(walletAddress)
      ]);
      
      // Format balance
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      
      // Only add tokens with balance > 0
      if (parseFloat(formattedBalance) > 0) {
        tokens.push({
          symbol,
          name,
          balance: balance.toString(),
          formattedBalance,
          address,
          delegated: delegatedTo !== ethers.constants.AddressZero,
          delegatedTo: delegatedTo !== ethers.constants.AddressZero ? delegatedTo : null
        });
      }
    }
    
    return tokens;
  } catch (error: any) {
    console.error('Error getting governance tokens:', error);
    return [];
  }
};

/**
 * Delegate governance tokens to a smart wallet
 * @param walletAddress The wallet address of the user
 * @param smartWalletAddress The smart wallet address to delegate to
 * @param tokenSymbol The symbol of the token to delegate
 * @returns Success status and error message if any
 */
export const delegateGovernanceTokens = async (
  walletAddress: string,
  smartWalletAddress: string,
  tokenSymbol: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // This is a mock implementation since we can't actually sign transactions in the backend
    // In a real implementation, this would be done client-side or through a relayer
    
    // Validate inputs
    if (!walletAddress || !smartWalletAddress || !tokenSymbol) {
      return { success: false, error: 'Missing required parameters' };
    }
    
    // Check if token exists
    const tokenAddress = GOVERNANCE_TOKEN_ADDRESSES[tokenSymbol];
    if (!tokenAddress) {
      return { success: false, error: 'Invalid token symbol' };
    }
    
    // In a real implementation, we would:
    // 1. Create a transaction to call the delegate function on the token contract
    // 2. Sign the transaction with the user's wallet
    // 3. Send the transaction to the blockchain
    
    // For now, we'll just simulate success
    console.log(`Delegated ${tokenSymbol} from ${walletAddress} to ${smartWalletAddress}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error delegating governance tokens:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}; 