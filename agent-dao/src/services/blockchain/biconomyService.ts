import { ethers } from 'ethers';
import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account';
import { Bundler } from '@biconomy/bundler';
import { BiconomyPaymaster } from '@biconomy/paymaster';
import { ECDSAOwnershipValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE } from '@biconomy/modules';
import dotenv from 'dotenv';

dotenv.config();

// Initialize providers and clients
let provider: ethers.providers.JsonRpcProvider;
let bundler: Bundler;
let paymaster: BiconomyPaymaster;

export const initializeBiconomy = (): void => {
  const biconomyApiKey = process.env.BICONOMY_API_KEY;
  const baseRpcUrl = process.env.BASE_RPC_URL;
  
  if (!biconomyApiKey) {
    throw new Error('Biconomy API key not found in environment variables');
  }
  
  if (!baseRpcUrl) {
    throw new Error('Base RPC URL not found in environment variables');
  }
  
  try {
    // Initialize provider
    provider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
    
    // Initialize bundler
    bundler = new Bundler({
      bundlerUrl: `https://bundler.biconomy.io/api/v2/${1}/`, // Base chain ID is 8453
      chainId: 8453, // Base chain ID
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    });
    
    // Initialize paymaster
    paymaster = new BiconomyPaymaster({
      paymasterUrl: `https://paymaster.biconomy.io/api/v1/${8453}/${biconomyApiKey}`,
    });
    
    console.log('Biconomy services initialized successfully');
  } catch (error) {
    console.error('Error initializing Biconomy:', error);
    throw new Error(`Failed to initialize Biconomy: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create a new smart wallet for a user
export const createSmartWallet = async (ownerAddress?: string): Promise<string> => {
  try {
    // If no owner address is provided, create a random wallet
    let wallet: ethers.Wallet;
    if (!ownerAddress) {
      wallet = ethers.Wallet.createRandom().connect(provider);
      ownerAddress = wallet.address;
    } else {
      // For existing wallets, we'd need the private key, but for this example
      // we'll just create a new wallet with the owner address as a placeholder
      wallet = new ethers.Wallet(ethers.utils.randomBytes(32)).connect(provider);
    }
    
    // Create the ownership module
    const ownershipModule = await ECDSAOwnershipValidationModule.create({
      signer: wallet,
      moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
    });
    
    // Create the smart account
    const smartAccount = await BiconomySmartAccountV2.create({
      chainId: 8453, // Base chain ID
      bundler: bundler as any,
      paymaster: paymaster as any,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: ownershipModule as any,
      activeValidationModule: ownershipModule as any,
    });
    
    // Get the smart account address
    const smartAccountAddress = await smartAccount.getAccountAddress();
    console.log(`Smart wallet created: ${smartAccountAddress}`);
    
    return smartAccountAddress;
  } catch (error) {
    console.error('Error creating smart wallet:', error);
    throw new Error(`Failed to create smart wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get a smart account instance for a given address
export const getSmartAccount = async (ownerPrivateKey: string): Promise<BiconomySmartAccountV2> => {
  try {
    // Create a wallet with the owner's private key
    const wallet = new ethers.Wallet(ownerPrivateKey, provider);
    
    // Create the ownership module
    const ownershipModule = await ECDSAOwnershipValidationModule.create({
      signer: wallet,
      moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE,
    });
    
    // Create the smart account
    const smartAccount = await BiconomySmartAccountV2.create({
      chainId: 8453, // Base chain ID
      bundler: bundler as any,
      paymaster: paymaster as any,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: ownershipModule as any,
      activeValidationModule: ownershipModule as any,
    });
    
    return smartAccount;
  } catch (error) {
    console.error('Error getting smart account:', error);
    throw new Error(`Failed to get smart account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 