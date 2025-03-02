# Agent DAO - Email-Driven DAO Governance

A frictionless, email-driven governance solution that enables users to participate in DAO governance without needing to manually sign transactions. Users receive visually stunning, card-based email digests of governance proposals, reply to vote, and the agent autonomously executes their votes across multiple chains using Chainlink CCIP.

## Features

- **Email-Based Voting**: Vote on DAO proposals by simply replying to digest emails
- **Smart Wallet Creation**: Automatic Biconomy Smart Account (ERC-4337) creation for new users
- **Cross-Chain Execution**: Vote execution across multiple chains via Chainlink CCIP
- **AI-Powered Insights**: Proposal summaries and recommendations using LangChain + OpenAI
- **Gasless Transactions**: All transactions are gasless via Biconomy Paymaster

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/agent-dao.git
cd agent-dao
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Email Service

#### POST /api/email/webhook/inbound
Webhook endpoint for processing incoming email replies.

**Headers:**
- `x-postmark-signature`: Postmark webhook signature for verification

**Body:**
```json
{
  "From": "user@example.com",
  "Subject": "Re: DAO Governance Digest",
  "TextBody": "Vote YES on 123",
  "StrippedTextReply": "Vote YES on 123",
  "MessageID": "message-id"
}
```

#### POST /api/email/digest
Manually trigger a governance digest email.

**Body:**
```json
{
  "recipientEmail": "user@example.com",
  "proposals": [
    {
      "id": "123",
      "title": "Proposal Title",
      "summary": "Proposal summary...",
      "deadline": "2024-03-20T00:00:00Z",
      "voteLink": "https://vote.link"
    }
  ]
}
```

#### POST /api/email/welcome
Send a welcome email to a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "walletAddress": "0x..."
}
```

## Environment Variables

Required environment variables:

```env
# AI Services
OPENAI_API_KEY=your-openai-key
LANGCHAIN_API_KEY=your-langchain-key

# Blockchain
WALLET_CONNECT_PROJECT_ID=your-wallet-connect-id
BICONOMY_API_KEY=your-biconomy-key
BICONOMY_BUNDLER_URL=your-bundler-url
BICONOMY_PAYMASTER_URL=your-paymaster-url
CCIP_ROUTER_ADDRESS=your-ccip-router
BASE_RPC_URL=your-base-rpc
ETH_RPC_URL=your-eth-rpc

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
SUPABASE_SERVICE_KEY=your-service-key

# Email
POSTMARK_API_KEY=your-postmark-key
POSTMARK_INBOUND_ADDRESS=your-inbound-address
POSTMARK_WEBHOOK_SECRET=your-webhook-secret

# DAO APIs
BOARDROOM_API_KEY=your-boardroom-key
```

## Development

- Backend code is in `backend/src/`
- Frontend code is in `src/`
- Smart contracts are in `contracts/`

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details 