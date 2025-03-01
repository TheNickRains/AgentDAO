import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction, useNetwork, useSwitchNetwork } from 'wagmi';
import { base } from 'wagmi/chains';
import { getChainName, isChainSupported } from './daoUtils';

// Governor contract ABI (simplified for common functions)
const governorAbi = [
  // Read functions
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }],
    name: 'state',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }],
    name: 'proposalVotes',
    outputs: [
      { internalType: 'uint256', name: 'againstVotes', type: 'uint256' },
      { internalType: 'uint256', name: 'forVotes', type: 'uint256' },
      { internalType: 'uint256', name: 'abstainVotes', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'uint8', name: 'support', type: 'uint8' },
    ],
    name: 'castVote',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// Map of proposal states to readable strings
const proposalStateMap = {
  0: 'Pending',
  1: 'Active',
  2: 'Canceled',
  3: 'Defeated',
  4: 'Succeeded',
  5: 'Queued',
  6: 'Expired',
  7: 'Executed',
};

/**
 * Custom hook for interacting with DAO governance contracts across chains
 * @param {string} governorAddress - The address of the governor contract
 * @param {number} chainId - The chain ID where the governor contract is deployed
 * @returns {Object} Governance functions and state
 */
export function useGovernance(governorAddress, chainId) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [proposalStates, setProposalStates] = useState({});
  const [error, setError] = useState(null);
  
  // Check if we're on the correct chain
  const isCorrectChain = chain?.id === chainId;
  
  // Check if the chain is supported
  const isSupported = isChainSupported(chainId);
  
  // Read the governor name
  const { data: governorName } = useContractRead({
    address: governorAddress,
    abi: governorAbi,
    functionName: 'name',
    chainId,
    enabled: Boolean(governorAddress) && isSupported,
  });

  // Function to get proposal state
  const getProposalState = async (proposalId) => {
    if (!governorAddress || !proposalId || !isSupported) return null;
    
    try {
      const { data } = await useContractRead({
        address: governorAddress,
        abi: governorAbi,
        functionName: 'state',
        args: [proposalId],
        chainId,
      });
      
      return proposalStateMap[data] || 'Unknown';
    } catch (error) {
      console.error('Error fetching proposal state:', error);
      return 'Error';
    }
  };

  // Function to get proposal votes
  const getProposalVotes = async (proposalId) => {
    if (!governorAddress || !proposalId || !isSupported) return null;
    
    try {
      const { data } = await useContractRead({
        address: governorAddress,
        abi: governorAbi,
        functionName: 'proposalVotes',
        args: [proposalId],
        chainId,
      });
      
      return {
        against: data[0],
        for: data[1],
        abstain: data[2],
      };
    } catch (error) {
      console.error('Error fetching proposal votes:', error);
      return null;
    }
  };

  // Function to cast a vote
  const { write: castVote, data: voteData, isLoading: isVoting, isSuccess: voteSubmitted } = useContractWrite({
    address: governorAddress,
    abi: governorAbi,
    functionName: 'castVote',
    chainId,
    enabled: isConnected && Boolean(governorAddress) && isSupported,
  });

  // Wait for transaction to be confirmed
  const { isLoading: isConfirming, isSuccess: voteConfirmed } = useWaitForTransaction({
    hash: voteData?.hash,
    enabled: Boolean(voteData?.hash),
  });

  // Function to vote on a proposal
  const vote = async (proposalId, support) => {
    setError(null);
    
    if (!isConnected) {
      setError('Wallet not connected');
      return;
    }
    
    if (!isSupported) {
      setError(`Chain ${getChainName(chainId)} is not supported`);
      return;
    }
    
    // If we're not on the correct chain, try to switch
    if (!isCorrectChain) {
      try {
        if (switchNetwork) {
          await switchNetwork(chainId);
        } else {
          setError(`Please switch to ${getChainName(chainId)} network manually`);
          return;
        }
      } catch (err) {
        setError(`Failed to switch to ${getChainName(chainId)}: ${err.message}`);
        return;
      }
    }
    
    // Support: 0 = Against, 1 = For, 2 = Abstain
    try {
      castVote({ args: [proposalId, support] });
    } catch (err) {
      setError(`Failed to cast vote: ${err.message}`);
    }
  };

  // Special handling for Base chain
  const isBaseChain = chainId === base.id;

  return {
    governorName,
    getProposalState,
    getProposalVotes,
    vote,
    isVoting,
    isConfirming,
    voteSubmitted,
    voteConfirmed,
    walletConnected: isConnected,
    walletAddress: address,
    isCorrectChain,
    isBaseChain,
    chainName: getChainName(chainId),
    error,
    isSupported,
  };
} 