import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { BufferMemory } from 'langchain/memory';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI
const openai = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4',
  temperature: 0.2,
});

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize vector store
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: 'proposals_embeddings',
  queryName: 'match_proposals',
});

// Memory for conversation context
const memory = new BufferMemory({
  memoryKey: 'chat_history',
  returnMessages: true,
});

// Prompt templates
const proposalSummaryTemplate = `
You are an expert in DAO governance. Summarize the following proposal in a concise, easy-to-understand way.
Focus on the key points, potential impact, and what a vote FOR or AGAINST would mean.
Keep your summary to 2-3 sentences maximum.

Proposal: {proposal}

Summary:
`;

const proposalSummaryPrompt = new PromptTemplate({
  template: proposalSummaryTemplate,
  inputVariables: ['proposal'],
});

const emailReplyTemplate = `
You are a helpful DAO governance assistant. The user has replied to a governance digest email.
Analyze their reply and determine their intent. They might be:
1. Voting on a proposal (e.g., "Vote YES on Proposal 123")
2. Asking a question about a proposal
3. Requesting more information
4. Something else

User email: {email}

Relevant proposals: {proposals}

Determine the user's intent and extract any relevant information (proposal ID, vote choice, question).
If they are voting, extract the proposal ID and vote choice.
If they are asking a question, extract the question and the proposal it relates to.

Intent:
`;

const emailReplyPrompt = new PromptTemplate({
  template: emailReplyTemplate,
  inputVariables: ['email', 'proposals'],
});

// LLM Chains
const proposalSummaryChain = new LLMChain({
  llm: openai,
  prompt: proposalSummaryPrompt,
});

const emailReplyChain = new LLMChain({
  llm: openai,
  prompt: emailReplyPrompt,
});

// Prompt for analyzing user voting patterns
const votingPatternTemplate = `
You are an expert in analyzing DAO governance voting patterns. 
Analyze the following voting history for a user and identify their preferences and patterns.
Focus on the types of proposals they tend to support or oppose, the DAOs they engage with most,
and any other patterns you can identify.

Voting History:
{votingHistory}

Analysis:
`;

const votingPatternPrompt = PromptTemplate.fromTemplate(votingPatternTemplate);
const votingPatternChain = new LLMChain({
  llm: openai,
  prompt: votingPatternPrompt,
});

// Prompt for ranking proposals based on user preferences
const proposalRankingTemplate = `
You are an expert in DAO governance and personalization algorithms.
Based on a user's voting patterns and preferences, rank the following proposals in order of relevance and interest to the user.
Consider the DAOs they engage with, the types of proposals they support, and their overall governance participation.

User Voting Patterns:
{votingPatterns}

Proposals to Rank:
{proposals}

Return a JSON array of proposal IDs in order of relevance, with the most relevant first.
Format: ["proposal-id-1", "proposal-id-2", "proposal-id-3", ...]
`;

const proposalRankingPrompt = PromptTemplate.fromTemplate(proposalRankingTemplate);
const proposalRankingChain = new LLMChain({
  llm: openai,
  prompt: proposalRankingPrompt,
});

/**
 * Summarizes a governance proposal
 * @param proposalText The full text of the proposal
 * @returns A concise summary of the proposal
 */
export async function summarizeProposal(proposalText: string): Promise<string> {
  try {
    const result = await proposalSummaryChain.call({
      proposal: proposalText,
    });
    return result.text;
  } catch (error) {
    console.error('Error summarizing proposal:', error);
    return 'Unable to generate summary at this time.';
  }
}

/**
 * Analyzes an email reply to determine user intent
 * @param emailText The text of the email reply
 * @param relevantProposals Array of relevant proposals for context
 * @returns An object containing the detected intent and extracted information
 */
export async function analyzeEmailReply(emailText: string, relevantProposals: any[]): Promise<any> {
  try {
    const proposalsContext = relevantProposals.map(p => 
      `ID: ${p.id}, Title: ${p.title}, Choices: ${p.choices.join(', ')}`
    ).join('\n');

    const result = await emailReplyChain.call({
      email: emailText,
      proposals: proposalsContext,
    });

    // Parse the result to extract structured information
    const intentText = result.text;
    
    if (intentText.includes('VOTE') || intentText.toLowerCase().includes('voting')) {
      // Extract proposal ID and vote choice
      const proposalIdMatch = intentText.match(/Proposal[:\s]+([A-Za-z0-9\-]+)/i);
      const voteChoiceMatch = intentText.match(/(FOR|AGAINST|ABSTAIN)/i);
      
      return {
        intent: 'vote',
        proposalId: proposalIdMatch ? proposalIdMatch[1] : null,
        choice: voteChoiceMatch ? voteChoiceMatch[1].toUpperCase() : null,
      };
    } else if (intentText.includes('QUESTION') || intentText.includes('?')) {
      // Extract question
      const questionMatch = intentText.match(/Question[:\s]+(.*?)(?=\n|$)/i);
      const proposalIdMatch = intentText.match(/Proposal[:\s]+([A-Za-z0-9\-]+)/i);
      
      return {
        intent: 'question',
        question: questionMatch ? questionMatch[1] : emailText,
        proposalId: proposalIdMatch ? proposalIdMatch[1] : null,
      };
    } else if (intentText.includes('MORE PROPOSALS') || intentText.includes('SHOW MORE')) {
      return {
        intent: 'show_more',
      };
    } else {
      return {
        intent: 'unknown',
        originalText: emailText,
      };
    }
  } catch (error) {
    console.error('Error analyzing email reply:', error);
    return {
      intent: 'error',
      error: error.message,
    };
  }
}

/**
 * Generates a personalized AI recommendation for a proposal based on user's voting history
 * @param proposalText The proposal text
 * @param userVotingHistory Array of user's previous votes
 * @returns A personalized recommendation
 */
export async function generateRecommendation(proposalText: string, userVotingHistory: any[]): Promise<string> {
  const recommendationTemplate = `
  You are an AI governance assistant helping a DAO member decide how to vote.
  Based on their voting history and the current proposal, provide a brief, personalized recommendation.
  
  Current Proposal: {proposal}
  
  User's Voting History:
  {votingHistory}
  
  Provide a brief, personalized recommendation (1-2 sentences) on how they might want to vote based on their past preferences.
  Do not explicitly tell them to vote FOR or AGAINST, but highlight relevant patterns in their voting history.
  `;

  const recommendationPrompt = new PromptTemplate({
    template: recommendationTemplate,
    inputVariables: ['proposal', 'votingHistory'],
  });

  const recommendationChain = new LLMChain({
    llm: openai,
    prompt: recommendationPrompt,
  });

  try {
    const votingHistoryText = userVotingHistory.map(vote => 
      `Proposal: ${vote.proposal_title}, Vote: ${vote.choice}, Topic: ${vote.topic}`
    ).join('\n');

    const result = await recommendationChain.call({
      proposal: proposalText,
      votingHistory: votingHistoryText,
    });

    return result.text;
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return 'Based on your voting history, you might want to review this proposal carefully.';
  }
}

/**
 * Answers a user's question about a governance proposal
 * @param question The user's question
 * @param proposalText The proposal text for context
 * @returns An answer to the user's question
 */
export async function answerGovernanceQuestion(question: string, proposalText: string): Promise<string> {
  const answerTemplate = `
  You are an expert in DAO governance. Answer the following question about a governance proposal.
  Be concise, accurate, and helpful. If you don't know the answer, say so.
  
  Proposal: {proposal}
  
  Question: {question}
  
  Answer:
  `;

  const answerPrompt = new PromptTemplate({
    template: answerTemplate,
    inputVariables: ['proposal', 'question'],
  });

  const answerChain = new LLMChain({
    llm: openai,
    prompt: answerPrompt,
  });

  try {
    const result = await answerChain.call({
      proposal: proposalText,
      question: question,
    });

    return result.text;
  } catch (error) {
    console.error('Error answering governance question:', error);
    return 'I apologize, but I am unable to answer your question at this time. Please try again later or contact the DAO administrators for more information.';
  }
}

/**
 * Analyzes a user's voting history to identify patterns and preferences
 * @param votingHistory Array of user's past votes
 * @returns Analysis of voting patterns
 */
export async function analyzeVotingPatterns(votingHistory: any[]): Promise<string> {
  try {
    // Format voting history for the prompt
    const formattedHistory = votingHistory.map(vote => 
      `Proposal: ${vote.proposal_title} (${vote.dao})
       Vote: ${vote.choice}
       Date: ${new Date(vote.timestamp * 1000).toISOString().split('T')[0]}
       Category: ${vote.category || 'Unknown'}
      `
    ).join('\n\n');
    
    // Run the chain
    const result = await votingPatternChain.call({
      votingHistory: formattedHistory,
    });
    
    return result.text;
  } catch (error) {
    console.error('Error analyzing voting patterns:', error);
    return 'Unable to analyze voting patterns due to an error.';
  }
}

/**
 * Ranks proposals based on user preferences and voting history
 * @param proposals Array of proposals to rank
 * @param votingPatterns Analysis of user's voting patterns
 * @returns Ranked array of proposal IDs
 */
export async function rankProposalsByPreference(
  proposals: any[],
  votingPatterns: string
): Promise<string[]> {
  try {
    // Format proposals for the prompt
    const formattedProposals = proposals.map(proposal => 
      `ID: ${proposal.id}
       Title: ${proposal.title}
       DAO: ${proposal.dao}
       Summary: ${proposal.summary}
       Category: ${proposal.category || 'Unknown'}
      `
    ).join('\n\n');
    
    // Run the chain
    const result = await proposalRankingChain.call({
      votingPatterns,
      proposals: formattedProposals,
    });
    
    // Parse the result as JSON
    try {
      const rankedIds = JSON.parse(result.text);
      return rankedIds;
    } catch (jsonError) {
      console.error('Error parsing ranked proposals JSON:', jsonError);
      // Fallback: return proposals in original order
      return proposals.map(p => p.id);
    }
  } catch (error) {
    console.error('Error ranking proposals:', error);
    // Fallback: return proposals in original order
    return proposals.map(p => p.id);
  }
}

/**
 * Gets personalized proposal recommendations for a user
 * @param userId User ID to get recommendations for
 * @param allProposals Array of all available proposals
 * @param limit Maximum number of proposals to return
 * @returns Array of ranked proposals
 */
export async function getPersonalizedProposalRecommendations(
  userId: string,
  allProposals: any[],
  limit: number = 3
): Promise<any[]> {
  try {
    // Get user's voting history from database
    const { getUserVotingHistory } = require('../database/supabaseService');
    const votingHistory = await getUserVotingHistory(userId);
    
    if (!votingHistory || votingHistory.length === 0) {
      console.log('No voting history found, returning default proposals');
      // If no voting history, return proposals sorted by end time (closest to expiration first)
      return allProposals
        .sort((a, b) => a.endTimestamp - b.endTimestamp)
        .slice(0, limit);
    }
    
    // Analyze voting patterns
    const votingPatterns = await analyzeVotingPatterns(votingHistory);
    
    // Rank proposals based on user preferences
    const rankedIds = await rankProposalsByPreference(allProposals, votingPatterns);
    
    // Map ranked IDs back to full proposal objects
    const proposalMap = allProposals.reduce((map, proposal) => {
      map[proposal.id] = proposal;
      return map;
    }, {});
    
    // Create ranked array of proposals
    const rankedProposals = rankedIds
      .map(id => proposalMap[id])
      .filter(Boolean) // Remove any undefined entries
      .slice(0, limit);
    
    // If we don't have enough ranked proposals, add more from the original list
    if (rankedProposals.length < limit) {
      const remainingProposals = allProposals
        .filter(p => !rankedIds.includes(p.id))
        .sort((a, b) => a.endTimestamp - b.endTimestamp)
        .slice(0, limit - rankedProposals.length);
      
      rankedProposals.push(...remainingProposals);
    }
    
    // Generate AI recommendations for each proposal based on voting history
    for (const proposal of rankedProposals) {
      if (!proposal.aiRecommendation) {
        proposal.aiRecommendation = await generateRecommendation(
          proposal.description || proposal.summary,
          votingHistory
        );
      }
    }
    
    return rankedProposals;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    // Fallback: return proposals sorted by end time
    return allProposals
      .sort((a, b) => a.endTimestamp - b.endTimestamp)
      .slice(0, limit);
  }
}

export default {
  summarizeProposal,
  analyzeEmailReply,
  generateRecommendation,
  answerGovernanceQuestion,
  getPersonalizedProposalRecommendations,
}; 