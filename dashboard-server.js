"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const userService_1 = require("./src/services/user/userService");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname)));
// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});
// Serve the dashboard HTML file
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'dashboard.html'));
});
// Serve the onboarding HTML file
app.get('/onboarding', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'onboarding.html'));
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// User onboarding endpoint
app.post('/api/users', async (req, res) => {
    try {
        const { email, walletAddress } = req.body;
        console.log(`Creating mock user with email: ${email}`);
        // Use mock user service for testing
        const user = await (0, userService_1.createMockUser)(email, walletAddress);
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
});
// Mock proposals endpoint
app.get('/api/proposals', (req, res) => {
    // Dummy data
    res.json({
        success: true,
        data: [
            {
                id: "OP-123",
                title: "Protocol Fee Adjustment",
                description: "Proposal to adjust protocol fees from 0.3% to 0.25% to remain competitive in the market.",
                status: "active",
                chain: "optimism",
                endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
                quorum: "75%"
            },
            {
                id: "BASE-45",
                title: "Governance Upgrade",
                description: "Implement new voting mechanisms and improve proposal creation process.",
                status: "active",
                chain: "base",
                endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
                quorum: "60%"
            },
            {
                id: "ETH-789",
                title: "Treasury Expansion",
                description: "Proposal to allocate additional funds for ecosystem growth.",
                status: "completed",
                chain: "ethereum",
                endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                result: "Passed with 92% approval"
            }
        ]
    });
});
// Mock votes endpoint
app.get('/api/votes', (_req, res) => {
    const mockVotes = [
        {
            id: '1',
            proposalId: '1',
            userId: '1',
            choice: 'yes',
            timestamp: new Date('2024-03-01')
        }
    ];
    res.status(200).json({ success: true, data: mockVotes });
});
// Mock vote endpoint
app.post('/api/votes', (req, res) => {
    const { proposal_id, choice, email } = req.body;
    if (!proposal_id || !choice || !email) {
        return res.status(400).json({ success: false, error: 'Proposal ID, choice, and email are required' });
    }
    // Mock data
    const vote = {
        id: Math.floor(Math.random() * 1000).toString(),
        proposalId: proposal_id,
        userId: email,
        choice: choice,
        timestamp: new Date()
    };
    res.status(201).json({ success: true, data: vote });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Dashboard server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to view the dashboard`);
    console.log(`Open http://localhost:${PORT}/onboarding in your browser to view the onboarding flow`);
});
