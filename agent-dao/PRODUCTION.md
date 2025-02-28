# Email-Driven DAO Governance Agent - Production Deployment

This document outlines the steps to deploy the Email-Driven DAO Governance Agent to a production environment.

## Prerequisites

- Node.js v18+
- Docker and Docker Compose
- Domain name with DNS configured
- SSL certificates for your domains
- Supabase account
- Postmark account
- OpenAI API key
- Biconomy account
- Boardroom API key
- Ethereum wallet with funds for contract deployment

## Deployment Options

### Option 1: Direct Server Deployment

1. Clone the repository to your server:
   ```bash
   git clone https://github.com/yourusername/agent-dao.git
   cd agent-dao
   ```

2. Configure your production environment:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production credentials
   ```

3. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

4. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

### Option 2: Docker Deployment

1. Clone the repository to your server:
   ```bash
   git clone https://github.com/yourusername/agent-dao.git
   cd agent-dao
   ```

2. Configure your production environment:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production credentials
   ```

3. Create the necessary directories for Nginx:
   ```bash
   mkdir -p nginx/conf.d nginx/ssl nginx/www
   ```

4. Place your SSL certificates in the `nginx/ssl` directory:
   ```bash
   cp /path/to/your/certificates/api.yourdomain.com.crt nginx/ssl/
   cp /path/to/your/certificates/api.yourdomain.com.key nginx/ssl/
   cp /path/to/your/certificates/app.yourdomain.com.crt nginx/ssl/
   cp /path/to/your/certificates/app.yourdomain.com.key nginx/ssl/
   ```

5. Start the Docker containers:
   ```bash
   docker-compose up -d
   ```

## Smart Contract Deployment

The Email-Driven DAO Governance Agent requires several smart contracts to be deployed:

1. Biconomy Smart Accounts (ERC-4337) for user wallet management
2. Voting Hub contract on Base
3. CCIP Receiver contracts on Ethereum, Optimism, Arbitrum, Polygon, etc.

To deploy these contracts:

1. Configure your wallet private key in `.env.production`
2. Run the contract deployment script:
   ```bash
   cd agent-dao
   npx hardhat run scripts/deploy.js --network base
   ```

3. Update the contract addresses in your `.env.production` file

## Email Configuration

1. Configure Postmark for sending emails:
   - Set up a verified sending domain
   - Configure the inbound webhook to point to `https://api.yourdomain.com/api/email-reply`
   - Create email templates for governance digests

2. Test the email flow:
   ```bash
   curl -X POST https://api.yourdomain.com/api/users \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

## Monitoring and Maintenance

1. View application logs:
   ```bash
   # For direct deployment
   pm2 logs
   
   # For Docker deployment
   docker-compose logs -f
   ```

2. Monitor the application:
   ```bash
   # For direct deployment
   pm2 monit
   
   # For Docker deployment
   docker stats
   ```

3. Update the application:
   ```bash
   # For direct deployment
   git pull
   ./deploy.sh
   
   # For Docker deployment
   git pull
   docker-compose down
   docker-compose up -d --build
   ```

## Security Considerations

1. Regularly update dependencies:
   ```bash
   npm audit fix
   ```

2. Backup your database regularly
3. Monitor smart contract interactions
4. Set up alerts for failed transactions
5. Implement rate limiting for API endpoints
6. Use secure environment variables for sensitive information

## Troubleshooting

1. If the API server fails to start, check the logs:
   ```bash
   pm2 logs agent-dao
   ```

2. If the dashboard server fails to start, check the logs:
   ```bash
   pm2 logs dashboard-server
   ```

3. If emails are not being sent, verify your Postmark configuration

4. If smart contract transactions fail, check the gas price and network status

## Support

For additional support, please contact the development team at support@yourdomain.com. 