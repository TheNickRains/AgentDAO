/**
 * Utility functions for interacting with the Boardroom API
 * to fetch DAO governance data
 */

// Base URL for Boardroom API
const BOARDROOM_API_BASE_URL = 'https://api.boardroom.info/v1';

/**
 * Fetch all protocols (DAOs) from Boardroom
 * @returns {Promise<Array>} List of protocols
 */
export async function fetchProtocols() {
  try {
    const response = await fetch(`${BOARDROOM_API_BASE_URL}/protocols`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching protocols:', error);
    return [];
  }
}

/**
 * Fetch details for a specific protocol
 * @param {string} protocolName - The name of the protocol
 * @returns {Promise<Object>} Protocol details
 */
export async function fetchProtocolDetails(protocolName) {
  try {
    const response = await fetch(`${BOARDROOM_API_BASE_URL}/protocols/${protocolName}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching details for protocol ${protocolName}:`, error);
    return null;
  }
}

/**
 * Fetch proposals for a specific protocol
 * @param {string} protocolName - The name of the protocol
 * @param {Object} options - Query options
 * @param {string} options.state - Filter by proposal state (active, closed, pending)
 * @param {number} options.limit - Number of proposals to return
 * @returns {Promise<Array>} List of proposals
 */
export async function fetchProposals(protocolName, options = {}) {
  const { state = 'active', limit = 10 } = options;
  
  try {
    const queryParams = new URLSearchParams({
      state,
      limit: limit.toString(),
    });
    
    const response = await fetch(
      `${BOARDROOM_API_BASE_URL}/protocols/${protocolName}/proposals?${queryParams}`
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching proposals for protocol ${protocolName}:`, error);
    return [];
  }
}

/**
 * Fetch pending votes for a specific wallet address
 * @param {string} address - Wallet address
 * @returns {Promise<Array>} List of pending votes
 */
export async function fetchPendingVotes(address) {
  try {
    const response = await fetch(`${BOARDROOM_API_BASE_URL}/voters/${address}/pendingVotes`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching pending votes for address ${address}:`, error);
    return [];
  }
}

/**
 * Fetch voting power for a specific wallet address across protocols
 * @param {string} address - Wallet address
 * @returns {Promise<Array>} List of voting power by protocol
 */
export async function fetchVotingPower(address) {
  try {
    const response = await fetch(`${BOARDROOM_API_BASE_URL}/voters/${address}`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching voting power for address ${address}:`, error);
    return [];
  }
} 