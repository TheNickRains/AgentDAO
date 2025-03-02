import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from '@langchain/core/chains';
import { BufferMemory } from '@langchain/community/memory/buffer';
import config from '../../config/config';

export class AIService {
  private llm: ChatOpenAI;
  private memory: BufferMemory;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openai.apiKey,
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });

    this.memory = new BufferMemory({
      memoryKey: 'chat_history',
      returnMessages: true,
    });
  }

  /**
   * Summarize a governance proposal
   */
  async summarizeProposal(proposal: {
    title: string;
    description: string;
    discussion?: string;
  }): Promise<string> {
    const template = `Summarize the following DAO governance proposal in 2-3 clear, concise sentences. Focus on the key points and potential impact:

Title: {title}
Description: {description}
Discussion: {discussion}

Summary:`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = new LLMChain({
      llm: this.llm,
      prompt: promptTemplate,
    });

    const result = await chain.call({
      title: proposal.title,
      description: proposal.description,
      discussion: proposal.discussion || 'No discussion available',
    });

    return result.text;
  }

  /**
   * Answer a governance-related question
   */
  async answerQuestion(question: string, context: {
    proposal?: any;
    previousVotes?: any[];
    daoInfo?: any;
  }): Promise<string> {
    const template = `You are a helpful DAO governance assistant. Answer the following question about governance proposals or DAO operations.
Use the provided context to give accurate, relevant information.

Context:
Proposal: {proposal}
Previous Votes: {previousVotes}
DAO Info: {daoInfo}

Question: {question}

Answer:`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = new LLMChain({
      llm: this.llm,
      prompt: promptTemplate,
      memory: this.memory,
    });

    const result = await chain.call({
      question,
      proposal: JSON.stringify(context.proposal || {}),
      previousVotes: JSON.stringify(context.previousVotes || []),
      daoInfo: JSON.stringify(context.daoInfo || {}),
    });

    return result.text;
  }

  /**
   * Generate voting recommendations based on user's history
   */
  async generateRecommendations(proposals: any[], userHistory: {
    previousVotes: any[];
    preferences?: string[];
  }): Promise<{
    recommendations: any[];
    reasoning: string;
  }> {
    const template = `Analyze these governance proposals and the user's voting history to recommend which proposals they should prioritize.
Consider their past voting patterns and stated preferences.

Proposals: {proposals}
User's Previous Votes: {previousVotes}
User's Preferences: {preferences}

Provide recommendations in JSON format with reasoning:`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = new LLMChain({
      llm: this.llm,
      prompt: promptTemplate,
    });

    const result = await chain.call({
      proposals: JSON.stringify(proposals),
      previousVotes: JSON.stringify(userHistory.previousVotes),
      preferences: JSON.stringify(userHistory.preferences || []),
    });

    // Parse the JSON response
    const parsed = JSON.parse(result.text);
    return {
      recommendations: parsed.recommendations || [],
      reasoning: parsed.reasoning || '',
    };
  }

  /**
   * Analyze sentiment and extract key points from governance discussions
   */
  async analyzeDiscussion(discussionText: string): Promise<{
    sentiment: string;
    keyPoints: string[];
    controversialPoints: string[];
  }> {
    const template = `Analyze this DAO governance discussion. Extract the overall sentiment, key points of agreement, and any controversial aspects.

Discussion: {text}

Provide analysis in JSON format with:
- Overall sentiment (positive/negative/neutral)
- Key points of agreement
- Controversial points or concerns`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const chain = new LLMChain({
      llm: this.llm,
      prompt: promptTemplate,
    });

    const result = await chain.call({
      text: discussionText,
    });

    // Parse the JSON response
    return JSON.parse(result.text);
  }
} 