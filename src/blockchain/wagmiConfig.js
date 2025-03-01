import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, mainnet, optimism, arbitrum } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';

// Configure chains for the application - prioritize Base
const chains = [base, mainnet, optimism, arbitrum];

// Create wagmi config with RainbowKit
export const config = getDefaultConfig({
  appName: 'Agent DAO',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Get one at https://cloud.walletconnect.com
  chains,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
  },
});

// Export chains for use in other components
export { chains }; 