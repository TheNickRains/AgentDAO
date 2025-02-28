import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { getVotesByUserFromDb } from '../database/supabaseService';

dotenv.config();

let openai: OpenAI;

export const initializeOpenAI = (): void => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found in environment variables');
  }
  
  openai = new OpenAI({ apiKey });
};

export const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  return openai;
};

// Define interfaces for vote and proposal objects
interface Vote {
  proposal_title: string;
  proposal_summary: string;
  choice: string;
  dao: string;
  [key: string]: any;
}

interface Proposal {
  id: string;
  title: string;
  summary: string;
  protocol: string;
  [key: string]: any;
}

// Generate a summary of a proposal
export const generateProposalSummary = async (proposalContent: string): Promise<string> => {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a governance assistant that summarizes DAO proposals concisely and objectively.'
        },
        {
          role: 'user',
          content: `Summarize the following DAO proposal in 1-2 sentences:\n\n${proposalContent}`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });
    
    return response.choices[0]?.message?.content?.trim() || 'Summary not available';
  } catch (error) {
    console.error('Error generating proposal summary:', error);
    return 'Summary not available due to an error';
  }
};

// Generate a response to a user's question
export const generateAIResponse = async (userQuestion: string, userId: string): Promise<string> => {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  try {
    // Get user's voting history for context
    const votingHistory = await getVotesByUserFromDb(userId);
    const votingHistoryContext = votingHistory.length > 0 
      ? `The user has previously voted on ${votingHistory.length} proposals. Their most recent votes were: ${votingHistory.slice(0, 3).map((v: Vote) => `"${v.proposal_title}" (${v.choice})`).join(', ')}.`
      : 'The user has no voting history yet.';
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful DAO governance assistant. You help users understand proposals and governance processes. 
          
          ${votingHistoryContext}
          
          Provide concise, accurate information. If you don't know something, say so clearly.`
        },
        {
          role: 'user',
          content: userQuestion
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    return response.choices[0]?.message?.content?.trim() || 'I apologize, but I was unable to generate a response at this time.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I apologize, but I encountered an error while processing your question. Please try again later.';
  }
};

// Analyze a user's voting history to recommend proposals
export const analyzeUserPreferences = async (userId: string, availableProposals: Proposal[]): Promise<Proposal[]> => {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  try {
    // Get user's voting history
    const votingHistory = await getVotesByUserFromDb(userId);
    
    if (votingHistory.length === 0 || availableProposals.length <= 3) {
      // If no voting history or few proposals, just return all available proposals (up to 3)
      return availableProposals.slice(0, 3);
    }
    
    // Prepare data for the AI
    const votingHistoryData = votingHistory.map((vote: Vote) => ({
      proposal_title: vote.proposal_title,
      proposal_summary: vote.proposal_summary,
      choice: vote.choice,
      dao: vote.dao
    }));
    
    const availableProposalsData = availableProposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      summary: proposal.summary,
      dao: proposal.protocol
    }));
    
    // Ask the AI to rank the proposals based on user's voting history
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a governance recommendation system. Based on a user's voting history, rank the available proposals by likely relevance to the user.`
        },
        {
          role: 'user',
          content: `User's voting history: ${JSON.stringify(votingHistoryData)}
          
          Available proposals: ${JSON.stringify(availableProposalsData)}
          
          Return a JSON array of proposal IDs ranked by relevance to the user, with the most relevant first. Include only the top 3 proposals.`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3
    });
    
    // Parse the response
    const content = response.choices[0]?.message?.content || '{"ranked_proposals": []}';
    const parsedResponse = JSON.parse(content);
    const rankedProposalIds = parsedResponse.ranked_proposals || [];
    
    // Filter and sort the original proposals based on the AI ranking
    const rankedProposals = rankedProposalIds
      .map((id: string) => availableProposals.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 3);
    
    // If we don't have 3 proposals yet, add more from the original list
    if (rankedProposals.length < 3) {
      const remainingProposals = availableProposals
        .filter(p => !rankedProposals.some((rp: Proposal) => rp.id === p.id))
        .slice(0, 3 - rankedProposals.length);
      
      rankedProposals.push(...remainingProposals);
    }
    
    return rankedProposals;
  } catch (error) {
    console.error('Error analyzing user preferences:', error);
    // Fall back to returning the first 3 proposals
    return availableProposals.slice(0, 3);
  }
}; 