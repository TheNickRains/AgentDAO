import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';

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

/**
 * Custom hook for interacting with DAO governance contracts
 * @param {string} governorAddress - The address of the governor contract
 * @returns {Object} Governance functions and state
 */
export function useGovernance(governorAddress) {
  const { address, isConnected } = useAccount();
  const [proposalStates, setProposalStates] = useState({});

  // Read the governor name
  const { data: governorName } = useContractRead({
    address: governorAddress,
    abi: governorAbi,
    functionName: 'name',
    enabled: Boolean(governorAddress),
  });

  // Function to get proposal state
  const getProposalState = async (proposalId) => {
    if (!governorAddress || !proposalId) return null;
    
    try {
      const { data } = await useContractRead({
        address: governorAddress,
        abi: governorAbi,
        functionName: 'state',
        args: [proposalId],
      });
      
      // Map state numbers to readable strings
      const stateMap = {
        0: 'Pending',
        1: 'Active',
        2: 'Canceled',
        3: 'Defeated',
        4: 'Succeeded',
        5: 'Queued',
        6: 'Expired',
        7: 'Executed',
      };
      
      return stateMap[data] || 'Unknown';
    } catch (error) {
      console.error('Error fetching proposal state:', error);
      return 'Error';
    }
  };

  // Function to cast a vote
  const { write: castVote, data: voteData, isLoading: isVoting, isSuccess: voteSubmitted } = useContractWrite({
    address: governorAddress,
    abi: governorAbi,
    functionName: 'castVote',
    enabled: isConnected && Boolean(governorAddress),
  });

  // Wait for transaction to be confirmed
  const { isLoading: isConfirming, isSuccess: voteConfirmed } = useWaitForTransaction({
    hash: voteData?.hash,
    enabled: Boolean(voteData?.hash),
  });

  // Function to vote on a proposal
  const vote = (proposalId, support) => {
    if (!isConnected) {
      console.error('Wallet not connected');
      return;
    }
    
    // Support: 0 = Against, 1 = For, 2 = Abstain
    castVote({ args: [proposalId, support] });
  };

  return {
    governorName,
    getProposalState,
    vote,
    isVoting,
    isConfirming,
    voteSubmitted,
    voteConfirmed,
    walletConnected: isConnected,
    walletAddress: address,
  };
} 