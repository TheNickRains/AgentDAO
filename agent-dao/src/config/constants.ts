// Governance token addresses
export const GOVERNANCE_TOKEN_ADDRESSES: Record<string, string> = {
  'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  'COMP': '0xc00e94Cb662C3520282E6f5717214004A7f26888',
  'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  'MKR': '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
  'ENS': '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72'
};

// Smart wallet factory address
export const SMART_WALLET_FACTORY_ADDRESS = '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B';

// API rate limits
export const RATE_LIMIT = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // limit each IP to 10 requests per windowMs
  },
  NONCE: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5 // limit each IP to 5 requests per windowMs
  },
  API: {
    windowMs: 60 * 1000, // 1 minute
    max: 60 // limit each IP to 60 requests per windowMs
  },
  EMAIL_WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    max: 10 // limit each IP to 10 requests per windowMs
  }
}; 