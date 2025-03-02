import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    domain: process.env.DOMAIN || 'basedvoter.com',
  },

  // AI Services
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    langchainApiKey: process.env.LANGCHAIN_API_KEY,
  },

  // Blockchain
  blockchain: {
    walletConnectProjectId: process.env.WALLET_CONNECT_PROJECT_ID,
    biconomy: {
      apiKey: process.env.BICONOMY_API_KEY!,
      bundlerUrl: process.env.BICONOMY_BUNDLER_URL!,
      paymasterUrl: process.env.BICONOMY_PAYMASTER_URL!,
      paymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    },
    ccip: {
      routerAddress: process.env.CCIP_ROUTER_ADDRESS!,
    },
    rpc: {
      base: process.env.BASE_RPC_URL!,
      ethereum: process.env.ETH_RPC_URL!,
    },
    privateKey: process.env.PRIVATE_KEY!,
    mnemonic: process.env.MNEMONIC,
  },

  // Database
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },

  // Email
  postmark: {
    apiKey: process.env.POSTMARK_API_KEY!,
    inboundAddress: process.env.POSTMARK_INBOUND_ADDRESS!,
    templates: {
      welcome: process.env.POSTMARK_WELCOME_TEMPLATE_ID!,
      digest: process.env.POSTMARK_DIGEST_TEMPLATE_ID!,
      unknownIntent: process.env.POSTMARK_UNKNOWN_INTENT_TEMPLATE_ID!,
    },
    webhookSecret: process.env.POSTMARK_WEBHOOK_SECRET!,
  },

  // Contract Verification
  verification: {
    etherscan: process.env.ETHERSCAN_API_KEY,
    basescan: process.env.BASESCAN_API_KEY,
    optimism: process.env.OPTIMISM_API_KEY,
    arbitrum: process.env.ARBITRUM_API_KEY,
  },

  // DAO APIs
  boardroom: {
    apiKey: process.env.BOARDROOM_API_KEY!,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'POSTMARK_API_KEY',
  'BICONOMY_API_KEY',
  'BOARDROOM_API_KEY',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

export default config; 