import React from 'react';
import { WagmiConfig } from 'wagmi';
import {
  RainbowKitProvider,
  ConnectButton,
  darkTheme
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { config, chains } from './wagmiConfig';

// Wallet connection component with RainbowKit
export const WalletConnect = () => {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <ConnectButton />
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

// Wrapper component to provide wagmi context to children
export const WagmiProvider = ({ children }) => {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}; 