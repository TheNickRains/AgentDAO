require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const { OpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { AgentKit } = require('@coinbase/agentkit');
const app = express();
const port = process.env.PORT || 3000;

// Config from environment
const BOARDROOM_API_KEY = process.env.BOARDROOM_API_KEY;
const TEST_WALLET = process.env.TEST_WALLET;
const DOMAIN = 'basedvoter.com';

if (!BOARDROOM_API_KEY) {
    throw new Error('BOARDROOM_API_KEY is required');
}

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Initialize AI tools
const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0
});

const agent = new AgentKit({
    apiKey: process.env.COINBASE_AGENT_API_KEY
});

// Boardroom API client
const boardroom = axios.create({
    baseURL: 'https://api.boardroom.info/v1',
    headers: {
        'Accept': 'application/json',
        'x-api-key': BOARDROOM_API_KEY
    }
});

// Protocol metadata cache
const protocolMetadata = new Map();

// Helper: Get protocol metadata with caching
async function getProtocolMetadata(protocolId) {
    if (protocolMetadata.has(protocolId)) {
        return protocolMetadata.get(protocolId);
    }

    try {
        const { data } = await boardroom.get(`/protocols/${protocolId}`);
        const metadata = {
            name: data.name,
            logo: data.branding?.logo || `https://${DOMAIN}/assets/default-dao-logo.png`,
            token: {
                symbol: data.token?.symbol,
                logo: data.token?.logo || `https://${DOMAIN}/assets/default-token-logo.png`
            },
            theme: {
                primary: data.branding?.primaryColor || '#3B82F6',
                secondary: data.branding?.secondaryColor || '#1E40AF'
            },
            socials: data.socials || {},
            cname: data.cname || protocolId
        };
        protocolMetadata.set(protocolId, metadata);
        return metadata;
    } catch (error) {
        console.error(`Error fetching protocol metadata for ${protocolId}:`, error);
        return {
            name: protocolId,
            logo: `https://${DOMAIN}/assets/default-dao-logo.png`,
            token: {
                symbol: 'UNKNOWN',
                logo: `https://${DOMAIN}/assets/default-token-logo.png`
            },
            theme: {
                primary: '#3B82F6',
                secondary: '#1E40AF'
            },
            socials: {},
            cname: protocolId
        };
    }
}

// Helper: Fetch and analyze proposals
async function getEnhancedProposals(address) {
    try {
        console.log(`Fetching proposals for address: ${address}`);
        
        // Get all active proposals for the address
        const { data: proposals } = await boardroom.get(`/voters/${address}/pendingVotes`);
        console.log(`Found ${proposals.length} pending votes`);
        
        // Get voter's history for context
        const { data: history } = await boardroom.get(`/voters/${address}/votes`);
        console.log(`Found ${history.length} historical votes`);
        
        // Use LangChain to analyze voting patterns
        const votingPatternPrompt = PromptTemplate.fromTemplate(
            `Analyze the following voting history and extract key preferences and patterns:
            {history}
            Output the analysis in JSON format.`
        );
        
        const votingPattern = await model.invoke(
            await votingPatternPrompt.format({ history: JSON.stringify(history) })
        );
        console.log('Generated voting pattern analysis');

        // Use AgentKit to get on-chain context
        const chainContext = await agent.getGovernanceContext(address);
        console.log('Retrieved on-chain governance context');

        // Enhance each proposal with AI insights and protocol metadata
        const enhancedProposals = await Promise.all(proposals.map(async (proposal) => {
            console.log(`Analyzing proposal: ${proposal.id}`);
            
            // Get protocol metadata
            const protocol = await getProtocolMetadata(proposal.protocol);
            
            // Generate AI recommendation
            const recommendationPrompt = PromptTemplate.fromTemplate(
                `Given the following context:
                - Proposal: {proposal}
                - User's voting pattern: {votingPattern}
                - On-chain context: {chainContext}
                
                Generate a personalized voting recommendation for this user in JSON format with the following fields:
                - recommendation: A clear YES/NO/ABSTAIN recommendation
                - confidence: A number between 0-100 indicating confidence
                - reasoning: A brief explanation of the recommendation
                - impact: Expected impact on the protocol (HIGH/MEDIUM/LOW)
                - risks: Any potential risks or concerns`
            );
            
            const recommendation = await model.invoke(
                await recommendationPrompt.format({
                    proposal: JSON.stringify(proposal),
                    votingPattern: votingPattern,
                    chainContext: JSON.stringify(chainContext)
                })
            );

            // Calculate time remaining
            const endDate = new Date(proposal.end_time);
            const now = new Date();
            const timeRemaining = endDate - now;
            const daysRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60 * 24)));
            const hoursRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

            return {
                ...proposal,
                protocol_metadata: protocol,
                ai_recommendation: JSON.parse(recommendation),
                chain_context: chainContext[proposal.protocol],
                voting_power: await agent.getVotingPower(address, proposal.protocol),
                time_remaining: {
                    days: daysRemaining,
                    hours: hoursRemaining,
                    total_hours: Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60))),
                    is_urgent: daysRemaining <= 2
                },
                vote_url: `https://${protocol.cname}.${DOMAIN}/vote/${proposal.id}`,
                discussion_url: proposal.discussion_url || `https://${protocol.cname}.${DOMAIN}/proposals/${proposal.id}`,
                quorum_progress: {
                    current: proposal.votes_count || 0,
                    required: proposal.quorum || 0,
                    percentage: proposal.quorum ? ((proposal.votes_count || 0) / proposal.quorum) * 100 : 0
                }
            };
        }));

        // Sort proposals by urgency and importance
        enhancedProposals.sort((a, b) => {
            // First by urgency (time remaining)
            if (a.time_remaining.is_urgent !== b.time_remaining.is_urgent) {
                return a.time_remaining.is_urgent ? -1 : 1;
            }
            // Then by AI-determined impact
            const impactScore = {
                'HIGH': 3,
                'MEDIUM': 2,
                'LOW': 1
            };
            return impactScore[b.ai_recommendation.impact] - impactScore[a.ai_recommendation.impact];
        });

        console.log('Enhanced all proposals with AI insights and metadata');
        return enhancedProposals;
    } catch (error) {
        console.error('Error in getEnhancedProposals:', error);
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/email', (req, res) => {
    res.sendFile(path.join(__dirname, 'email-template.html'));
});

// API Routes
app.get('/api/proposals', async (req, res) => {
    try {
        // Use test wallet for demo
        const proposals = await getEnhancedProposals(TEST_WALLET);
        res.json({ 
            success: true, 
            data: proposals,
            meta: {
                wallet: TEST_WALLET,
                timestamp: new Date().toISOString(),
                domain: DOMAIN
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            meta: {
                wallet: TEST_WALLET,
                timestamp: new Date().toISOString(),
                domain: DOMAIN
            }
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        meta: {
            timestamp: new Date().toISOString(),
            domain: DOMAIN
        }
    });
});

// Start server
app.listen(port, '127.0.0.1', () => {
    console.log(`
Server running! 🚀

View the templates at:
- Dashboard: http://localhost:${port}/
- Email Template: http://localhost:${port}/email
- Live Proposals API: http://localhost:${port}/api/proposals

Using test wallet: ${TEST_WALLET}
Domain: ${DOMAIN}
Environment: ${process.env.NODE_ENV || 'development'}

Press Ctrl+C to stop the server.
    `);
}); 