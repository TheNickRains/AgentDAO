# Email-Driven DAO Governance Agent Dashboard

This dashboard provides a visual interface for the Email-Driven DAO Governance Agent. While the primary interface for this application is through email, this dashboard allows you to:

1. Register your email address
2. View recommended governance proposals
3. Cast votes directly from the dashboard
4. See your voting history
5. Interact with the AI governance assistant

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Make sure you have all the dependencies installed:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

### Running the Dashboard

1. Start the dashboard server:
   ```
   node dashboard-server.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## Features

### User Registration

1. Click the "Register Email" button
2. Enter your email address
3. A mock smart wallet will be created for you

### Viewing Proposals

The dashboard displays recommended governance proposals based on your voting history. Each proposal shows:
- The DAO/protocol it belongs to
- Current status
- Deadline
- Summary
- Voting options

### Casting Votes

Click the "Vote FOR", "Vote AGAINST", or "Abstain" buttons on any proposal to cast your vote. In a real implementation, this would:
1. Sign the vote with your smart wallet
2. Execute the vote across chains using Chainlink CCIP
3. Record your vote in the database

### AI Governance Assistant

Use the AI assistant to:
- Ask questions about proposals
- Get voting recommendations
- Set up automated voting rules

## Email Interface

To see what the email interface looks like, open the `email-template.html` file in your browser. This shows the email digest that users would receive, containing:

1. Personalized proposal recommendations
2. AI-powered voting suggestions
3. Simple voting instructions (reply with "Vote FOR [proposal-id]")

## Note

This dashboard is a demonstration of the UI/UX for the Email-Driven DAO Governance Agent. In a production environment, it would connect to:

- Supabase for user data and voting history
- Biconomy for smart wallet management
- Chainlink CCIP for cross-chain vote execution
- Boardroom API for governance proposal data
- OpenAI for AI-powered recommendations

The current implementation uses mock data for demonstration purposes. 