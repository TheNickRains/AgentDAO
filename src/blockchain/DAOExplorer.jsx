import React, { useState, useEffect } from 'react';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { base } from 'wagmi/chains';
import { WalletConnect } from './WalletConnect';
import { getAllDAOs, getBaseDAOs, getDAOsByChain, getChainName } from './daoUtils';

/**
 * Component to explore DAOs across different chains with a focus on Base
 */
export const DAOExplorer = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [selectedChain, setSelectedChain] = useState(base.id);
  const [daos, setDaos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load DAOs based on selected chain
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      let daoList = [];
      
      if (selectedChain === 'all') {
        daoList = getAllDAOs();
      } else {
        daoList = getDAOsByChain(selectedChain);
      }
      
      setDaos(daoList);
    } catch (err) {
      console.error('Error loading DAOs:', err);
      setError('Failed to load DAOs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedChain]);
  
  // Handle chain selection
  const handleChainChange = (chainId) => {
    setSelectedChain(chainId);
    
    // If user is connected and chainId is a specific chain (not 'all'), 
    // try to switch their wallet to that chain
    if (isConnected && chainId !== 'all' && switchNetwork) {
      switchNetwork(chainId);
    }
  };
  
  // Render chain selection buttons
  const renderChainSelector = () => {
    const chains = [
      { id: base.id, name: 'Base', primary: true },
      { id: 1, name: 'Ethereum' },
      { id: 10, name: 'Optimism' },
      { id: 42161, name: 'Arbitrum' },
      { id: 'all', name: 'All Chains' }
    ];
    
    return (
      <div className="chain-selector">
        <h3>Select Chain</h3>
        <div className="chain-buttons">
          {chains.map((chainInfo) => (
            <button
              key={chainInfo.id}
              onClick={() => handleChainChange(chainInfo.id)}
              className={`chain-button ${selectedChain === chainInfo.id ? 'active' : ''} ${chainInfo.primary ? 'primary' : ''}`}
            >
              {chainInfo.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Render a single DAO card
  const renderDAOCard = (dao) => {
    return (
      <div key={`${dao.id}-${dao.chainId}`} className="dao-card">
        <h3>{dao.name}</h3>
        <p className="dao-description">{dao.description}</p>
        
        <div className="dao-details">
          <span className="dao-chain">Chain: {getChainName(dao.chainId)}</span>
          <span className="dao-platform">Platform: {dao.platform}</span>
        </div>
        
        <div className="dao-actions">
          <a 
            href={dao.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="dao-link"
          >
            Visit Website
          </a>
          
          <button 
            className="view-proposals-btn"
            onClick={() => window.location.href = `/proposals/${dao.chainId}/${dao.id}`}
          >
            View Proposals
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="dao-explorer">
      <h2>Explore DAOs</h2>
      
      {/* Wallet Connection Button */}
      <div className="wallet-connect-container">
        <WalletConnect />
      </div>
      
      {/* Chain Selector */}
      {renderChainSelector()}
      
      {/* Base Chain Promotion */}
      {selectedChain === base.id && (
        <div className="base-promotion">
          <h3>Base Chain - The Future of DAO Governance</h3>
          <p>
            Base offers low-cost, high-speed transactions for DAO governance.
            Vote on proposals for just pennies and experience near-instant confirmations.
          </p>
        </div>
      )}
      
      {/* DAO List */}
      {loading ? (
        <p>Loading DAOs...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : daos.length === 0 ? (
        <p>No DAOs found on {selectedChain === 'all' ? 'any chain' : getChainName(selectedChain)}.</p>
      ) : (
        <div className="dao-grid">
          {daos.map(renderDAOCard)}
        </div>
      )}
    </div>
  );
}; 