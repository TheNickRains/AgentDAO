import { ethers } from 'ethers';
import { IRouterClient } from '@chainlink/ccip-interfaces';
import config from '../../config/config';

// ABI for the CCIP Router
const CCIP_ROUTER_ABI = [
  'function ccipSend(uint64 destinationChainSelector, address receiver, bytes calldata data) external payable returns (bytes32)',
  'function getFee(uint64 destinationChainSelector, address receiver, bytes calldata data) external view returns (uint256)',
];

// Chain selectors for supported networks
const CHAIN_SELECTORS = {
  ETHEREUM: '16015286601757825753',
  BASE: '15971525489660198786',
  OPTIMISM: '3734403246176062136',
  ARBITRUM: '4949039107694359620',
};

export class CCIPService {
  private provider: ethers.providers.JsonRpcProvider;
  private router: IRouterClient;
  private signer: ethers.Wallet;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpc.base);
    this.signer = new ethers.Wallet(config.blockchain.privateKey, this.provider);
    
    this.router = new ethers.Contract(
      config.blockchain.ccip.routerAddress,
      CCIP_ROUTER_ABI,
      this.signer
    ) as IRouterClient;
  }

  /**
   * Send a cross-chain vote transaction
   */
  async sendVote(
    destinationChain: keyof typeof CHAIN_SELECTORS,
    receiverAddress: string,
    voteData: {
      proposalId: string;
      support: boolean;
      reason?: string;
    }
  ): Promise<ethers.providers.TransactionResponse> {
    try {
      const destinationChainSelector = CHAIN_SELECTORS[destinationChain];
      if (!destinationChainSelector) {
        throw new Error('Unsupported destination chain');
      }

      // Encode the vote data
      const encodedVoteData = ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'bool', 'string'],
        [voteData.proposalId, voteData.support, voteData.reason || '']
      );

      // Get the fee for the CCIP transaction
      const fee = await this.router.getFee(
        destinationChainSelector,
        receiverAddress,
        encodedVoteData
      );

      // Send the cross-chain transaction
      const tx = await this.router.ccipSend(
        destinationChainSelector,
        receiverAddress,
        encodedVoteData,
        { value: fee }
      );

      return tx;
    } catch (error) {
      console.error('Error sending cross-chain vote:', error);
      throw new Error('Failed to send cross-chain vote');
    }
  }

  /**
   * Get the fee for a cross-chain transaction
   */
  async getMessageFee(
    destinationChain: keyof typeof CHAIN_SELECTORS,
    receiverAddress: string,
    data: string
  ): Promise<ethers.BigNumber> {
    try {
      const destinationChainSelector = CHAIN_SELECTORS[destinationChain];
      if (!destinationChainSelector) {
        throw new Error('Unsupported destination chain');
      }

      return await this.router.getFee(
        destinationChainSelector,
        receiverAddress,
        data
      );
    } catch (error) {
      console.error('Error getting message fee:', error);
      throw new Error('Failed to get message fee');
    }
  }

  /**
   * Verify if a cross-chain message was delivered
   */
  async verifyMessageDelivery(
    messageId: string,
    destinationChain: keyof typeof CHAIN_SELECTORS
  ): Promise<boolean> {
    try {
      // TODO: Implement message verification using CCIP Reader
      // This will require checking the status on the destination chain
      return true;
    } catch (error) {
      console.error('Error verifying message delivery:', error);
      throw new Error('Failed to verify message delivery');
    }
  }

  /**
   * Get supported chains for cross-chain voting
   */
  getSupportedChains(): string[] {
    return Object.keys(CHAIN_SELECTORS);
  }
} 