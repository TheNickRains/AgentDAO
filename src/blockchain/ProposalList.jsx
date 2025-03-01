import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnect } from './WalletConnect';
import { useGovernance } from './useGovernance';
import { fetchPendingVotes, fetchProposals } from './boardroomApi';

// Example governance contract address (Uniswap Governor)
const EXAMPLE_GOVERNOR_ADDRESS = '0x408ED6354d4973f66138C91495F2f2FCbd8724C3';

export const ProposalList = () => {
  const { address, isConnected } = useAccount();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use our custom governance hook
  const governance = useGovernance(EXAMPLE_GOVERNOR_ADDRESS);
  
  // Fetch proposals when wallet is connected
  useEffect(() => {
    const loadProposals = async () => {
      if (!isConnected || !address) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch pending votes first (proposals the user can vote on)
        const pendingVotes = await fetchPendingVotes(address);
        
        if (pendingVotes && pendingVotes.length > 0) {
          setProposals(pendingVotes);
        } else {
          // Fallback to fetching active proposals from a specific DAO
          const activeProposals = await fetchProposals('uniswap', { state: 'active', limit: 5 });
          setProposals(activeProposals || []);
        }
      } catch (err) {
        console.error('Error loading proposals:', err);
        setError('Failed to load proposals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProposals();
  }, [address, isConnected]);
  
  // Handle voting on a proposal
  const handleVote = (proposalId, support) => {
    governance.vote(proposalId, support);
  };
  
  return (
    <div className="proposal-list">
      <h2>DAO Governance Proposals</h2>
      
      {/* Wallet Connection Button */}
      <div className="wallet-connect-container">
        <WalletConnect />
      </div>
      
      {!isConnected ? (
        <p>Connect your wallet to view proposals you can vote on.</p>
      ) : loading ? (
        <p>Loading proposals...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : proposals.length === 0 ? (
        <p>No active proposals found.</p>
      ) : (
        <div className="proposals">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="proposal-card">
              <h3>{proposal.title}</h3>
              <p>{proposal.description?.substring(0, 150)}...</p>
              
              <div className="proposal-details">
                <span>Status: {proposal.state || 'Active'}</span>
                <span>End Date: {new Date(proposal.end * 1000).toLocaleDateString()}</span>
              </div>
              
              <div className="voting-buttons">
                <button onClick={() => handleVote(proposal.id, 1)}>
                  Vote For
                </button>
                <button onClick={() => handleVote(proposal.id, 0)}>
                  Vote Against
                </button>
                <button onClick={() => handleVote(proposal.id, 2)}>
                  Abstain
                </button>
              </div>
              
              {governance.isVoting && <p>Submitting your vote...</p>}
              {governance.isConfirming && <p>Confirming your vote on the blockchain...</p>}
              {governance.voteConfirmed && <p>Your vote has been confirmed!</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 