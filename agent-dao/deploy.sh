#!/bin/bash

# Email-Driven DAO Governance Agent Production Deployment Script

echo "Starting deployment process..."

# 1. Install dependencies
echo "Installing dependencies..."
npm install --production

# 2. Build the project
echo "Building the project..."
npm run build

# 3. Set up environment
echo "Setting up environment..."
if [ ! -f .env.production ]; then
  echo "Error: .env.production file not found!"
  exit 1
fi
cp .env.production .env

# 4. Run database migrations (if applicable)
# echo "Running database migrations..."
# npm run migrate

# 5. Deploy smart contracts (if needed)
echo "Deploying smart contracts..."
# Add your contract deployment commands here
# Example: npx hardhat run scripts/deploy.js --network base

# 6. Start the application
echo "Starting the application..."
pm2 delete agent-dao || true
pm2 start dist/index.js --name "agent-dao" --log-date-format "YYYY-MM-DD HH:mm:ss"

# 7. Start the dashboard server
echo "Starting the dashboard server..."
pm2 delete dashboard-server || true
pm2 start dashboard-server.js --name "dashboard-server" --log-date-format "YYYY-MM-DD HH:mm:ss"

# 8. Set up monitoring
echo "Setting up monitoring..."
pm2 save
pm2 startup

echo "Deployment completed successfully!"
echo "API server running at: http://localhost:3000"
echo "Dashboard server running at: http://localhost:8080"
echo "Use 'pm2 logs' to view application logs"
echo "Use 'pm2 monit' to monitor the application" 