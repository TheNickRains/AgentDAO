# Email-Driven DAO Governance Agent

A frictionless, email-driven governance solution that enables users to participate in DAO governance without needing to manually sign transactions. Users receive visually stunning, card-based email digests of governance proposals, reply to vote, and the agent autonomously executes their votes across multiple chains using Chainlink CCIP.

## Features

- **Email-Based Governance**: Receive proposal digests via email and vote by simply replying.
- **Smart Wallet Creation**: Automatic creation of Biconomy Smart Accounts (ERC-4337) for users.
- **Cross-Chain Voting**: Execute votes across multiple chains using Chainlink CCIP.
- **AI-Powered Recommendations**: Get personalized proposal recommendations based on your voting history.
- **Gasless Transactions**: Vote without worrying about gas fees, powered by Biconomy Paymaster.

## Tech Stack

- **Backend**: Node.js + Express
- **Deployment**: Vercel (Serverless) or Docker
- **Database**: Supabase (PostgreSQL)
- **Email Service**: Postmark
- **AI/ML**: LangChain + OpenAI
- **Blockchain**: Biconomy Smart Accounts, Chainlink CCIP
- **Data Source**: Boardroom API for DAO proposal data

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Postmark account
- OpenAI API key
- Biconomy API key
- Boardroom API key
- RPC URLs for Base, Ethereum, Optimism, Arbitrum, and Polygon

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/agent-dao.git
   cd agent-dao
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your API keys and configuration.

4. Set up the Supabase database:
   - Create a new Supabase project
   - Run the SQL scripts in the `database` directory to set up the tables

5. Build the project:
   ```
   npm run build
   ```

6. Start the server:
   ```
   npm start
   ```

### Development

For development with hot-reloading:
```
npm run dev
```

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /api/users`: Create a new user
- `GET /api/users/:email`: Get user by email
- `GET /api/proposals`: Get governance proposals for a wallet
- `POST /api/email-reply`: Webhook for processing email replies

## Production Deployment

### Option 1: Direct Server Deployment

For a traditional server deployment, we provide a deployment script and Makefile:

1. Configure your production environment:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production credentials
   ```

2. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

4. Alternatively, use the Makefile for common tasks:
   ```bash
   make build    # Build the application
   make start    # Start the application
   make stop     # Stop the application
   make logs     # View application logs
   make deploy   # Deploy to production
   ```

### Option 2: Docker Deployment

For containerized deployment:

1. Configure your production environment:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production credentials
   ```

2. Build and start the Docker containers:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

3. Or use the Makefile:
   ```bash
   make docker-build  # Build Docker images
   make docker-up     # Start Docker containers
   make docker-down   # Stop Docker containers
   ```

### Smart Contract Deployment

Deploy the required smart contracts:

1. Configure your wallet private key in `.env.production`
2. Deploy the contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network base
   ```

3. Or use the Makefile:
   ```bash
   make contracts
   ```

### Production Checklist

Before going live, make sure to go through our [Production Checklist](CHECKLIST.md) to ensure everything is properly configured and secured.

For detailed deployment instructions, see [PRODUCTION.md](PRODUCTION.md).

## Dashboard and Onboarding

The project includes a dashboard and onboarding flow:

- **Dashboard**: Access at `http://localhost:8080` when running locally
- **Onboarding**: Access at `http://localhost:8080/onboarding` when running locally

In production, these will be available at your configured domain.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Boardroom](https://boardroom.io/) for the governance data API
- [Biconomy](https://www.biconomy.io/) for smart accounts and gasless transactions
- [Chainlink](https://chain.link/) for cross-chain communication
- [OpenAI](https://openai.com/) for AI capabilities
- [Postmark](https://postmarkapp.com/) for email services
- [Supabase](https://supabase.com/) for database services 