import axios from 'axios';
import { saveProposalToDb, getProposalsByWalletFromDb } from '../database/supabaseService';
import { generateProposalSummary, analyzeUserPreferences } from '../ai/openaiService';
import { getUserByWallet } from '../user/userService';
import { getPersonalizedProposalRecommendations } from '../ai/langchainService';

// Boardroom API base URL
const BOARDROOM_API_BASE_URL = 'https://api.boardroom.info/v1';
const BOARDROOM_API_KEY = process.env.BOARDROOM_API_KEY;

// Define interfaces for proposal data
interface ProposalData {
  id: string;
  refId: string;
  title: string;
  content: string;
  summary: string;
  protocol: string;
  adapter: string;
  proposer: string;
  status: string;
  startTimestamp: number;
  endTimestamp: number;
  choices: string[];
  wallet_address: string;
  created_at: string;
  updated_at: string;
  dao: string;
  [key: string]: any;
}

// Fetch proposals for a wallet address
export const fetchProposals = async (walletAddress: string): Promise<ProposalData[]> => {
  try {
    // First, check if we have cached proposals for this wallet
    const cachedProposals = await getProposalsByWalletFromDb(walletAddress);
    if (cachedProposals && cachedProposals.length > 0) {
      console.log(`Found ${cachedProposals.length} cached proposals for wallet ${walletAddress}`);
      
      // Get user and personalize proposals if we have a user
      const user = await getUserByWallet(walletAddress);
      if (user) {
        // Use our new AI-powered personalization algorithm
        const personalizedProposals = await getPersonalizedProposalRecommendations(
          user.id, 
          cachedProposals as any
        );
        return personalizedProposals as ProposalData[];
      }
      
      return cachedProposals as ProposalData[];
    }
    
    // Fetch proposals from Boardroom API
    console.log(`Fetching proposals for wallet ${walletAddress} from Boardroom API`);
    const response = await axios.get(`${BOARDROOM_API_BASE_URL}/voters/${walletAddress}/pendingVotes`, {
      headers: {
        'key': BOARDROOM_API_KEY
      }
    });
    
    if (!response.data || !response.data.data) {
      console.log('No proposals found from Boardroom API');
      return [];
    }
    
    // Process and enrich the proposals
    const proposals = await Promise.all(
      response.data.data.map(async (proposal: any) => {
        // Generate AI summary for the proposal
        let summary = '';
        if (proposal.content) {
          summary = await generateProposalSummary(proposal.content);
        }
        
        // Create a processed proposal object
        const processedProposal: ProposalData = {
          id: proposal.id,
          refId: proposal.refId,
          title: proposal.title,
          content: proposal.content,
          summary,
          protocol: proposal.protocol,
          adapter: proposal.adapter,
          proposer: proposal.proposer,
          status: proposal.currentState,
          startTimestamp: proposal.startTimestamp,
          endTimestamp: proposal.endTimestamp,
          choices: proposal.choices,
          wallet_address: walletAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Add DAO field for consistency with our template
          dao: proposal.protocol
        };
        
        // Save to database
        await saveProposalToDb(processedProposal);
        
        return processedProposal;
      })
    );
    
    console.log(`Fetched and processed ${proposals.length} proposals for wallet ${walletAddress}`);
    
    // Get user and personalize proposals if we have a user
    const user = await getUserByWallet(walletAddress);
    if (user) {
      // Use our new AI-powered personalization algorithm
      const personalizedProposals = await getPersonalizedProposalRecommendations(
        user.id, 
        proposals as any
      );
      return personalizedProposals as ProposalData[];
    }
    
    return proposals as ProposalData[];
  } catch (error) {
    console.error('Error fetching proposals:', error);
    throw new Error(`Failed to fetch proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get a single proposal by ID
export const getProposalById = async (proposalId: string): Promise<any> => {
  try {
    const response = await axios.get(`${BOARDROOM_API_BASE_URL}/proposals/${proposalId}`, {
      headers: {
        'key': BOARDROOM_API_KEY
      }
    });
    
    if (!response.data || !response.data.data) {
      throw new Error('Proposal not found');
    }
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching proposal ${proposalId}:`, error);
    throw new Error(`Failed to fetch proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 