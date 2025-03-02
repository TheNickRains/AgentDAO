/**
 * Agent DAO Authentication Example
 * 
 * This example demonstrates how to authenticate with the Agent DAO API
 * using wallet signatures and JWT tokens.
 */

// Configuration
const API_URL = 'http://localhost:3000';

/**
 * Request a nonce for wallet authentication
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<string>} - Nonce for signing
 */
async function requestNonce(walletAddress) {
  try {
    const response = await fetch(`${API_URL}/api/auth/nonce?walletAddress=${walletAddress}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get nonce');
    }

    return data.data.nonce;
  } catch (error) {
    console.error('Error requesting nonce:', error);
    throw error;
  }
}

/**
 * Sign a message with the user's wallet
 * @param {string} message - Message to sign
 * @param {object} web3Provider - Web3 provider (e.g., from MetaMask)
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<string>} - Signature
 */
async function signMessage(message, web3Provider, walletAddress) {
  try {
    // This example uses ethers.js, but you can use web3.js or other libraries
    const signer = web3Provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
}

/**
 * Login with wallet signature
 * @param {string} walletAddress - User's wallet address
 * @param {string} signature - Signature of the message
 * @param {string} message - Message that was signed
 * @returns {Promise<object>} - User data and JWT token
 */
async function login(walletAddress, signature, message) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress,
        signature,
        message
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }

    // Store the token in localStorage or a secure cookie
    localStorage.setItem('auth_token', data.data.token);
    
    return data.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @returns {Promise<object>} - API response
 */
async function authenticatedRequest(endpoint, method = 'GET', body = null) {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error making authenticated request:', error);
    throw error;
  }
}

/**
 * Complete authentication flow example
 */
async function completeAuthFlow() {
  try {
    // 1. Connect to wallet (e.g., MetaMask)
    // This is a simplified example - in a real app, you would use a library like Web3Modal
    if (!window.ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask.');
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const walletAddress = await signer.getAddress();
    
    // 2. Request a nonce
    const nonce = await requestNonce(walletAddress);
    
    // 3. Create a message to sign
    const message = `Sign this message to authenticate with Agent DAO: ${nonce}`;
    
    // 4. Sign the message
    const signature = await signMessage(message, provider, walletAddress);
    
    // 5. Login with the signature
    const userData = await login(walletAddress, signature, message);
    
    console.log('Authentication successful!', userData);
    
    // 6. Make an authenticated request
    const proposals = await authenticatedRequest('/api/proposals?walletAddress=' + walletAddress);
    console.log('Fetched proposals:', proposals);
    
    return {
      user: userData.user,
      token: userData.token,
      proposals
    };
  } catch (error) {
    console.error('Authentication flow failed:', error);
    throw error;
  }
}

// Example usage in a browser environment
document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('login-button');
  
  if (loginButton) {
    loginButton.addEventListener('click', async () => {
      try {
        const result = await completeAuthFlow();
        
        // Update UI with user info
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
          userInfoElement.innerHTML = `
            <h3>Authenticated User</h3>
            <p>ID: ${result.user.id}</p>
            <p>Email: ${result.user.email}</p>
            <p>Wallet: ${result.user.walletAddress}</p>
          `;
        }
        
        // Display proposals
        const proposalsElement = document.getElementById('proposals');
        if (proposalsElement && result.proposals) {
          proposalsElement.innerHTML = `
            <h3>Your Proposals</h3>
            <ul>
              ${result.proposals.map(p => `<li>${p.title}</li>`).join('')}
            </ul>
          `;
        }
      } catch (error) {
        alert(`Authentication failed: ${error.message}`);
      }
    });
  }
}); 