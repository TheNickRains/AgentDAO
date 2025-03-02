import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../../config/config';

interface User {
  id: string;
  email: string;
  wallet_address: string;
  smart_account_address: string;
  created_at: string;
  preferences?: string[];
}

interface Vote {
  id: string;
  user_id: string;
  proposal_id: string;
  choice: string;
  power: string;
  transaction_hash?: string;
  status: 'pending' | 'executed' | 'failed';
  created_at: string;
}

interface Delegation {
  id: string;
  user_id: string;
  dao_id: string;
  token_address: string;
  delegated_to: string;
  amount: string;
  chain_id: number;
  created_at: string;
}

interface ProposalCache {
  id: string;
  dao_id: string;
  title: string;
  description: string;
  status: string;
  start_time: number;
  end_time: number;
  choices: string[];
  network: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );
  }

  /**
   * User Management
   */
  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserByWallet(walletAddress: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select()
      .or(`wallet_address.eq.${walletAddress},smart_account_address.eq.${walletAddress}`)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserPreferences(userId: string, preferences: string[]): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .update({ preferences })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Vote Management
   */
  async createVote(vote: Omit<Vote, 'id' | 'created_at'>): Promise<Vote> {
    const { data, error } = await this.client
      .from('votes')
      .insert([vote])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVoteStatus(
    voteId: string,
    status: Vote['status'],
    transactionHash?: string
  ): Promise<Vote> {
    const { data, error } = await this.client
      .from('votes')
      .update({ status, transaction_hash: transactionHash })
      .eq('id', voteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserVotes(userId: string): Promise<Vote[]> {
    const { data, error } = await this.client
      .from('votes')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Delegation Management
   */
  async createDelegation(delegation: Omit<Delegation, 'id' | 'created_at'>): Promise<Delegation> {
    const { data, error } = await this.client
      .from('delegations')
      .insert([delegation])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserDelegations(userId: string): Promise<Delegation[]> {
    const { data, error } = await this.client
      .from('delegations')
      .select()
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  /**
   * Proposal Cache Management
   */
  async cacheProposal(proposal: Omit<ProposalCache, 'id' | 'created_at' | 'updated_at'>): Promise<ProposalCache> {
    const { data, error } = await this.client
      .from('proposal_cache')
      .insert([proposal])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCachedProposal(proposalId: string): Promise<ProposalCache | null> {
    const { data, error } = await this.client
      .from('proposal_cache')
      .select()
      .eq('id', proposalId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCachedProposal(
    proposalId: string,
    updates: Partial<Omit<ProposalCache, 'id' | 'created_at'>>
  ): Promise<ProposalCache> {
    const { data, error } = await this.client
      .from('proposal_cache')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 