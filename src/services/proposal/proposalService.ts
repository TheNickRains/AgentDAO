import axios from 'axios';
import config from '../../config/config';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  startTime: number;
  endTime: number;
  choices: string[];
  dao: {
    id: string;
    name: string;
    network: string;
  };
  discussion?: string;
  votes?: {
    choice: string;
    voter: string;
    power: string;
  }[];
}

export class ProposalService {
  private apiClient: axios.AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://api.boardroom.info/v1',
      headers: {
        'x-api-key': config.boardroom.apiKey,
      },
    });
  }

  /**
   * Get active proposals for a user's address
   */
  async getActiveProposals(userAddress: string): Promise<Proposal[]> {
    try {
      const response = await this.apiClient.get(`/voters/${userAddress}/pendingVotes`);
      return response.data.data.map(this.transformProposal);
    } catch (error) {
      console.error('Error fetching active proposals:', error);
      throw new Error('Failed to fetch active proposals');
    }
  }

  /**
   * Get proposal details by ID
   */
  async getProposalById(proposalId: string): Promise<Proposal> {
    try {
      const response = await this.apiClient.get(`/proposals/${proposalId}`);
      return this.transformProposal(response.data.data);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      throw new Error('Failed to fetch proposal');
    }
  }

  /**
   * Get proposals by DAO
   */
  async getProposalsByDao(daoId: string, status: 'active' | 'closed' = 'active'): Promise<Proposal[]> {
    try {
      const response = await this.apiClient.get(`/protocols/${daoId}/proposals`, {
        params: { status },
      });
      return response.data.data.map(this.transformProposal);
    } catch (error) {
      console.error('Error fetching DAO proposals:', error);
      throw new Error('Failed to fetch DAO proposals');
    }
  }

  /**
   * Get user's voting power in a DAO
   */
  async getUserVotingPower(userAddress: string, daoId: string): Promise<string> {
    try {
      const response = await this.apiClient.get(`/protocols/${daoId}/voters/${userAddress}`);
      return response.data.data.votingPower;
    } catch (error) {
      console.error('Error fetching voting power:', error);
      throw new Error('Failed to fetch voting power');
    }
  }

  /**
   * Get user's voting history
   */
  async getUserVotingHistory(userAddress: string): Promise<{
    proposalId: string;
    choice: string;
    timestamp: number;
  }[]> {
    try {
      const response = await this.apiClient.get(`/voters/${userAddress}/votes`);
      return response.data.data.map((vote: any) => ({
        proposalId: vote.proposalId,
        choice: vote.choice,
        timestamp: vote.timestamp,
      }));
    } catch (error) {
      console.error('Error fetching voting history:', error);
      throw new Error('Failed to fetch voting history');
    }
  }

  /**
   * Get proposal discussion from various sources
   */
  async getProposalDiscussion(proposalId: string): Promise<{
    source: string;
    content: string;
    timestamp: number;
  }[]> {
    try {
      const response = await this.apiClient.get(`/proposals/${proposalId}/discussion`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching proposal discussion:', error);
      throw new Error('Failed to fetch proposal discussion');
    }
  }

  /**
   * Transform raw proposal data to our format
   */
  private transformProposal(rawProposal: any): Proposal {
    return {
      id: rawProposal.id,
      title: rawProposal.title,
      description: rawProposal.body || rawProposal.description,
      status: rawProposal.status,
      startTime: rawProposal.startTime,
      endTime: rawProposal.endTime,
      choices: rawProposal.choices || [],
      dao: {
        id: rawProposal.protocolId || rawProposal.dao?.id,
        name: rawProposal.protocolName || rawProposal.dao?.name,
        network: rawProposal.network || rawProposal.dao?.network,
      },
      discussion: rawProposal.discussion,
      votes: rawProposal.votes?.map((vote: any) => ({
        choice: vote.choice,
        voter: vote.voter,
        power: vote.votingPower || vote.power,
      })),
    };
  }
} 