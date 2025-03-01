import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { base } from 'wagmi/chains';
import { WalletConnect } from './WalletConnect';
import { useGovernance } from './useGovernance';
import { fetchPendingVotes, fetchProposals } from './boardroomApi';
import { getDAO, getChainName } from './daoUtils';

/**
 * Component to display and interact with DAO proposals
 * @param {Object} props - Component props
 * @param {string} props.daoId - The DAO identifier
 * @param {number} props.chainId - The chain ID where the DAO is deployed
 */
export const ProposalList = ({ daoId, chainId = base.id }) => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get DAO information
  const dao = getDAO(daoId, chainId);
  
  // Use our custom governance hook
  const governance = useGovernance(dao?.governorAddress, chainId);
  
  // Fetch proposals when wallet is connected
  useEffect(() => {
    const loadProposals = async () => {
      if (!isConnected || !address || !dao) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch pending votes first (proposals the user can vote on)
        const pendingVotes = await fetchPendingVotes(address);
        
        if (pendingVotes && pendingVotes.length > 0) {
          // Filter to only include proposals for the selected DAO if daoId is provided
          const filteredProposals = daoId 
            ? pendingVotes.filter(p => p.daoId === daoId) 
            : pendingVotes;
            
          setProposals(filteredProposals);
        } else {
          // Fallback to fetching active proposals from the specific DAO
          const activeProposals = await fetchProposals(daoId || 'uniswap', { state: 'active', limit: 5 });
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
  }, [address, isConnected, daoId, dao]);
  
  // Handle voting on a proposal
  const handleVote = (proposalId, support) => {
    governance.vote(proposalId, support);
  };
  
  // Render chain badge
  const renderChainBadge = () => {
    const chainName = getChainName(chainId);
    const isBaseChain = chainId === base.id;
    
    return (
      <span className={`chain-badge ${isBaseChain ? 'base-chain' : ''}`}>
        {chainName}
      </span>
    );
  };
  
  return (
    <div className="proposal-list">
      <h2>
        {dao ? `${dao.name} Proposals` : 'DAO Governance Proposals'} 
        {renderChainBadge()}
      </h2>
      
      {/* Wallet Connection Button */}
      <div className="wallet-connect-container">
        <WalletConnect />
      </div>
      
      {/* Chain Warning */}
      {isConnected && !governance.isCorrectChain && (
        <div className="chain-warning">
          <p>
            You are currently on {getChainName(chain?.id)} but these proposals are on {governance.chainName}.
            Please switch your network to interact with these proposals.
          </p>
        </div>
      )}
      
      {/* Base Chain Promotion */}
      {chainId === base.id && (
        <div className="base-promotion">
          <h3>Base Chain - Low-Cost Governance</h3>
          <p>
            Voting on Base costs just pennies in gas fees, making governance accessible to all.
          </p>
        </div>
      )}
      
      {/* Error from governance hook */}
      {governance.error && (
        <p className="error">{governance.error}</p>
      )}
      
      {!isConnected ? (
        <p>Connect your wallet to view proposals you can vote on.</p>
      ) : loading ? (
        <p>Loading proposals...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : proposals.length === 0 ? (
        <p>No active proposals found for {dao?.name || 'this DAO'}.</p>
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
                <button 
                  onClick={() => handleVote(proposal.id, 1)}
                  disabled={!governance.isCorrectChain}
                  className={governance.isBaseChain ? 'base-button' : ''}
                >
                  Vote For
                </button>
                <button 
                  onClick={() => handleVote(proposal.id, 0)}
                  disabled={!governance.isCorrectChain}
                  className={governance.isBaseChain ? 'base-button' : ''}
                >
                  Vote Against
                </button>
                <button 
                  onClick={() => handleVote(proposal.id, 2)}
                  disabled={!governance.isCorrectChain}
                  className={governance.isBaseChain ? 'base-button' : ''}
                >
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