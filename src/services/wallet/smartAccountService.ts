import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account';
import { Bundler } from '@biconomy/bundler';
import { BiconomyPaymaster } from '@biconomy/paymaster';
import { ethers } from 'ethers';
import config from '../../config/config';

export class SmartAccountService {
  private bundler: Bundler;
  private paymaster: BiconomyPaymaster;
  private provider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpc.base);
    
    this.bundler = new Bundler({
      bundlerUrl: config.blockchain.biconomy.bundlerUrl,
      chainId: 84532, // Base Sepolia
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    });

    this.paymaster = new BiconomyPaymaster({
      paymasterUrl: config.blockchain.biconomy.paymasterUrl,
    });
  }

  /**
   * Create a new smart account for a user
   */
  async createSmartAccount(ownerAddress: string): Promise<{
    address: string;
    smartAccount: BiconomySmartAccountV2;
  }> {
    try {
      const smartAccount = await BiconomySmartAccountV2.create({
        chainId: 84532, // Base Sepolia
        bundler: this.bundler,
        paymaster: this.paymaster,
        entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
        defaultValidationModule: ownerAddress,
        activeValidationModule: ownerAddress,
      });

      const address = await smartAccount.getAccountAddress();
      
      return {
        address,
        smartAccount,
      };
    } catch (error) {
      console.error('Error creating smart account:', error);
      throw new Error('Failed to create smart account');
    }
  }

  /**
   * Send a transaction using the smart account
   */
  async sendTransaction(
    smartAccount: BiconomySmartAccountV2,
    to: string,
    data: string,
    value: string = '0'
  ): Promise<ethers.providers.TransactionResponse> {
    try {
      const tx = {
        to,
        data,
        value,
      };

      // Prepare the transaction
      const userOp = await smartAccount.buildUserOp([tx]);

      // Get paymaster data for gasless transaction
      const paymasterAndDataResponse = await this.paymaster.getPaymasterAndData(userOp);
      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;

      // Send the transaction
      const userOpResponse = await smartAccount.sendUserOp(userOp);
      return await userOpResponse.wait();

    } catch (error) {
      console.error('Error sending transaction:', error);
      throw new Error('Failed to send transaction');
    }
  }

  /**
   * Get the nonce of a smart account
   */
  async getNonce(smartAccount: BiconomySmartAccountV2): Promise<number> {
    try {
      return await smartAccount.getNonce();
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw new Error('Failed to get nonce');
    }
  }

  /**
   * Enable session key for automated transactions
   */
  async enableSessionKey(
    smartAccount: BiconomySmartAccountV2,
    sessionKeyAddress: string,
    permissions: any[]
  ): Promise<ethers.providers.TransactionResponse> {
    try {
      const sessionKeyData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'bytes[]'],
        [sessionKeyAddress, permissions]
      );

      const tx = {
        to: await smartAccount.getAccountAddress(),
        data: sessionKeyData,
      };

      return await this.sendTransaction(
        smartAccount,
        tx.to,
        tx.data
      );
    } catch (error) {
      console.error('Error enabling session key:', error);
      throw new Error('Failed to enable session key');
    }
  }
} 