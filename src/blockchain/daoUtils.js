import { base, mainnet, optimism, arbitrum } from 'wagmi/chains';

/**
 * Utility functions for working with multiple DAOs across different chains
 */

// Common DAO platforms and their supported chains
export const DAO_PLATFORMS = {
  SNAPSHOT: 'Snapshot',
  TALLY: 'Tally',
  COMPOUND: 'Compound Governor',
  ARAGON: 'Aragon',
  DAOHAUS: 'DAOhaus',
  NOUNS: 'Nouns',
  AAVE: 'Aave',
  UNISWAP: 'Uniswap',
  ENS: 'ENS',
  GITCOIN: 'Gitcoin',
  CUSTOM: 'Custom Governor'
};

// Map of known DAOs with their governance contract addresses on different chains
export const DAO_ADDRESSES = {
  // Base DAOs
  [base.id]: {
    // Example DAOs on Base - replace with actual addresses
    'baseGov': {
      name: 'Base Governance',
      platform: DAO_PLATFORMS.COMPOUND,
      governorAddress: '0x1234567890123456789012345678901234567890', // Replace with actual address
      tokenAddress: '0x0987654321098765432109876543210987654321', // Replace with actual address
      description: 'Governance for the Base ecosystem',
      website: 'https://base.org',
    },
    // Add more Base DAOs as they become available
  },
  
  // Ethereum Mainnet DAOs
  [mainnet.id]: {
    'uniswap': {
      name: 'Uniswap',
      platform: DAO_PLATFORMS.COMPOUND,
      governorAddress: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
      tokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token
      description: 'Governance for the Uniswap Protocol',
      website: 'https://uniswap.org',
    },
    'compound': {
      name: 'Compound',
      platform: DAO_PLATFORMS.COMPOUND,
      governorAddress: '0xc0Da02939E1441F497fd74F78cE7Decb17B66529',
      tokenAddress: '0xc00e94Cb662C3520282E6f5717214004A7f26888', // COMP token
      description: 'Governance for the Compound Protocol',
      website: 'https://compound.finance',
    },
    'aave': {
      name: 'Aave',
      platform: DAO_PLATFORMS.AAVE,
      governorAddress: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
      tokenAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE token
      description: 'Governance for the Aave Protocol',
      website: 'https://aave.com',
    },
    // Add more mainnet DAOs as needed
  },
  
  // Optimism DAOs
  [optimism.id]: {
    'optimismDAO': {
      name: 'Optimism Collective',
      platform: DAO_PLATFORMS.CUSTOM,
      governorAddress: '0xcDF27F107725988f2261Ce2256bDfCdE8B382B10', // OP Governor
      tokenAddress: '0x4200000000000000000000000000000000000042', // OP token
      description: 'Governance for the Optimism ecosystem',
      website: 'https://optimism.io',
    },
    // Add more Optimism DAOs as needed
  },
  
  // Arbitrum DAOs
  [arbitrum.id]: {
    'arbitrumDAO': {
      name: 'Arbitrum DAO',
      platform: DAO_PLATFORMS.CUSTOM,
      governorAddress: '0x789fC99093B09F71B08436D0656864b60C05C05B', // ARB Governor
      tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548', // ARB token
      description: 'Governance for the Arbitrum ecosystem',
      website: 'https://arbitrum.foundation',
    },
    // Add more Arbitrum DAOs as needed
  }
};

/**
 * Get all supported DAOs across all chains
 * @returns {Array} Array of DAO objects with chain information
 */
export function getAllDAOs() {
  const allDAOs = [];
  
  Object.entries(DAO_ADDRESSES).forEach(([chainId, daos]) => {
    Object.entries(daos).forEach(([daoId, daoInfo]) => {
      allDAOs.push({
        id: daoId,
        chainId: parseInt(chainId),
        ...daoInfo
      });
    });
  });
  
  return allDAOs;
}

/**
 * Get all DAOs on a specific chain
 * @param {number} chainId - The chain ID to filter by
 * @returns {Array} Array of DAOs on the specified chain
 */
export function getDAOsByChain(chainId) {
  const chainDAOs = DAO_ADDRESSES[chainId] || {};
  
  return Object.entries(chainDAOs).map(([daoId, daoInfo]) => ({
    id: daoId,
    chainId,
    ...daoInfo
  }));
}

/**
 * Get all Base DAOs
 * @returns {Array} Array of DAOs on Base
 */
export function getBaseDAOs() {
  return getDAOsByChain(base.id);
}

/**
 * Get a specific DAO by ID and chain
 * @param {string} daoId - The DAO identifier
 * @param {number} chainId - The chain ID
 * @returns {Object|null} The DAO information or null if not found
 */
export function getDAO(daoId, chainId) {
  const chainDAOs = DAO_ADDRESSES[chainId] || {};
  const daoInfo = chainDAOs[daoId];
  
  if (!daoInfo) return null;
  
  return {
    id: daoId,
    chainId,
    ...daoInfo
  };
}

/**
 * Get the chain name for a chain ID
 * @param {number} chainId - The chain ID
 * @returns {string} The chain name
 */
export function getChainName(chainId) {
  const chainMap = {
    [base.id]: 'Base',
    [mainnet.id]: 'Ethereum',
    [optimism.id]: 'Optimism',
    [arbitrum.id]: 'Arbitrum',
  };
  
  return chainMap[chainId] || 'Unknown Chain';
}

/**
 * Check if a chain is supported
 * @param {number} chainId - The chain ID to check
 * @returns {boolean} Whether the chain is supported
 */
export function isChainSupported(chainId) {
  return Object.keys(DAO_ADDRESSES).includes(chainId.toString());
}

/**
 * Get the explorer URL for a transaction on a specific chain
 * @param {number} chainId - The chain ID
 * @param {string} txHash - The transaction hash
 * @returns {string} The explorer URL
 */
export function getExplorerUrl(chainId, txHash) {
  const explorers = {
    [base.id]: 'https://basescan.org',
    [mainnet.id]: 'https://etherscan.io',
    [optimism.id]: 'https://optimistic.etherscan.io',
    [arbitrum.id]: 'https://arbiscan.io',
  };
  
  const baseUrl = explorers[chainId] || explorers[mainnet.id];
  return `${baseUrl}/tx/${txHash}`;
} 