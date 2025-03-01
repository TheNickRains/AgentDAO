# Agent DAO

An email-driven DAO governance agent that allows users to interact with DAO proposals via email.

## Features

- **Web3 Authentication**: Connect and verify your wallet
- **Email Registration**: Register your email to receive governance updates
- **Smart Wallet Creation**: Automatically creates an abstracted wallet for each user
- **Token Delegation**: Delegate your governance tokens to your smart wallet
- **Proposal Viewing**: View active proposals in the dashboard
- **Vote History**: Track your voting history

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB
- Ethereum RPC URL (for connecting to the blockchain)

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

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/agent-dao
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   RPC_URL=https://mainnet.infura.io/v3/your-infura-key
   ```

4. Build the project:
   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```

6. Access the application at `http://localhost:3000`

## Development

For development with hot reloading:
```
npm run dev
```

## Project Structure

- `src/`: Source code
  - `api/`: API routes
  - `config/`: Configuration files
  - `middleware/`: Express middleware
  - `services/`: Business logic
    - `auth/`: Authentication services
    - `blockchain/`: Blockchain interaction
    - `user/`: User management
  - `index.ts`: Entry point
- `dashboard.html`: Dashboard UI
- `onboarding.html`: Onboarding UI

## Authentication Flow

1. User visits the dashboard
2. If not authenticated, redirected to onboarding
3. User connects wallet or creates an email-only account
4. After successful authentication, user is redirected to dashboard

## API Endpoints

### Authentication
- `POST /api/auth/nonce`: Get a nonce for wallet signature
- `POST /api/auth/verify`: Verify wallet signature
- `GET /api/auth/validate`: Validate authentication token

### Users
- `POST /api/users`: Create a new user
- `GET /api/users/details`: Get user details
- `POST /api/users/update-wallet`: Update user wallet
- `POST /api/users/update-delegation`: Update delegation status

### Tokens
- `GET /api/tokens`: Get governance tokens for a wallet
- `POST /api/delegate`: Delegate governance tokens

## License

This project is licensed under the MIT License - see the LICENSE file for details. 