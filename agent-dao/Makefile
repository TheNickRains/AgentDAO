# Email-Driven DAO Governance Agent Makefile

.PHONY: help build start stop restart logs status clean deploy backup update test

# Default target
help:
	@echo "Email-Driven DAO Governance Agent - Production Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make build        - Build the application"
	@echo "  make start        - Start the application"
	@echo "  make stop         - Stop the application"
	@echo "  make restart      - Restart the application"
	@echo "  make logs         - View application logs"
	@echo "  make status       - Check application status"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make deploy       - Deploy to production"
	@echo "  make backup       - Backup database"
	@echo "  make update       - Update dependencies"
	@echo "  make test         - Run tests"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make contracts    - Deploy smart contracts"

# Build the application
build:
	@echo "Building the application..."
	npm install
	npm run build

# Start the application
start:
	@echo "Starting the application..."
	pm2 delete agent-dao || true
	pm2 start dist/index.js --name "agent-dao" --log-date-format "YYYY-MM-DD HH:mm:ss"
	pm2 delete dashboard-server || true
	pm2 start dashboard-server.js --name "dashboard-server" --log-date-format "YYYY-MM-DD HH:mm:ss"
	pm2 save

# Stop the application
stop:
	@echo "Stopping the application..."
	pm2 stop agent-dao dashboard-server

# Restart the application
restart:
	@echo "Restarting the application..."
	pm2 restart agent-dao dashboard-server

# View application logs
logs:
	@echo "Viewing application logs..."
	pm2 logs

# Check application status
status:
	@echo "Checking application status..."
	pm2 status

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist
	rm -rf node_modules

# Deploy to production
deploy:
	@echo "Deploying to production..."
	./deploy.sh

# Backup database
backup:
	@echo "Backing up database..."
	@mkdir -p backups
	@echo "This would normally run a database backup command"
	@echo "For Supabase, you would use their backup API or dashboard"

# Update dependencies
update:
	@echo "Updating dependencies..."
	npm update

# Run tests
test:
	@echo "Running tests..."
	npm test

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

# Deploy smart contracts
contracts:
	@echo "Deploying smart contracts..."
	@echo "This would normally run your contract deployment script"
	@echo "Example: npx hardhat run scripts/deploy.js --network base" 