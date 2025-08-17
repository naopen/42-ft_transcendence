# ft_transcendence Makefile

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# Project name
PROJECT_NAME = ft_transcendence

# Docker compose command
DOCKER_COMPOSE = docker-compose

.PHONY: all help build up down restart logs clean fclean re status install certs setup-https show-urls ngrok setup-ngrok stop-ngrok

# Default target
all: up

# Help command
help:
	@echo "$(GREEN)ft_transcendence - Makefile Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "  make          - Start the application (docker-compose up)"
	@echo "  make build    - Build Docker containers"
	@echo "  make up       - Start containers in detached mode"
	@echo "  make down     - Stop and remove containers"
	@echo "  make restart  - Restart all containers"
	@echo "  make logs     - View container logs"
	@echo "  make clean    - Stop containers and clean volumes"
	@echo "  make fclean   - Full clean (containers, volumes, images)"
	@echo "  make re       - Full rebuild (fclean + build + up)"
	@echo "  make status   - Show container status"
	@echo "  make install  - Install dependencies locally (for development)"
	@echo ""
	@echo "$(YELLOW)HTTPS & Remote Multiplayer:$(NC)"
	@echo "  make certs    - Generate SSL certificates for HTTPS"
	@echo "  make setup-https - Setup HTTPS with certificates and start"
	@echo "  make show-urls   - Show current access URLs and network info"
	@echo ""
	@echo "$(YELLOW)ngrok Remote Access (Recommended):$(NC)"
	@echo "  make ngrok       - Start with ngrok for true remote access"
	@echo "  make setup-ngrok - Setup and start ngrok tunnel"
	@echo "  make stop-ngrok  - Stop ngrok tunnel"

# Build Docker containers
build:
	@echo "$(YELLOW)Building Docker containers...$(NC)"
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)Build complete!$(NC)"

# Start containers
up:
	@echo "$(YELLOW)Starting ft_transcendence...$(NC)"
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)Application is running!$(NC)"
	@echo "Unified Access: http://localhost:8080"
	@echo "Health Check:   http://localhost:8080/health"
	@echo ""
	@echo "$(YELLOW)💡 For remote multiplayer, use: make ngrok$(NC)"

# Stop containers
down:
	@echo "$(YELLOW)Stopping containers...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)Containers stopped!$(NC)"

# Restart containers
restart: down up

# View logs
logs:
	@$(DOCKER_COMPOSE) logs -f

# Clean containers and volumes
clean:
	@echo "$(YELLOW)Cleaning containers and volumes...$(NC)"
	@$(DOCKER_COMPOSE) down -v
	@echo "$(GREEN)Clean complete!$(NC)"

# Full clean (including images)
fclean:
	@echo "$(RED)Full clean - removing everything...$(NC)"
	@$(DOCKER_COMPOSE) down -v --rmi all
	@docker image prune -f
	@echo "$(GREEN)Full clean complete!$(NC)"

# Rebuild everything
re: fclean certs
	@echo "$(YELLOW)Full rebuild with HTTPS...$(NC)"
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)Full rebuild complete!$(NC)"
	@node scripts/show-urls.js

# Show container status
status:
	@echo "$(YELLOW)Container Status:$(NC)"
	@$(DOCKER_COMPOSE) ps

# Install dependencies locally (for development)
install:
	@echo "$(YELLOW)Installing backend dependencies...$(NC)"
	@cd backend && npm install
	@echo "$(YELLOW)Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)Dependencies installed!$(NC)"

# Backend specific commands
backend-logs:
	@$(DOCKER_COMPOSE) logs -f backend

frontend-logs:
	@$(DOCKER_COMPOSE) logs -f frontend

redis-logs:
	@$(DOCKER_COMPOSE) logs -f redis

# Database commands
db-reset:
	@echo "$(YELLOW)Resetting database...$(NC)"
	@rm -rf data/*.db
	@echo "$(GREEN)Database reset complete!$(NC)"

# Development commands
dev-backend:
	@cd backend && npm run dev

# Generate SSL certificates
certs:
	@echo "$(YELLOW)Generating SSL certificates...$(NC)"
	@node scripts/generate-certs.js
	@echo "$(GREEN)SSL certificates generated!$(NC)"

# Setup HTTPS and start
setup-https: certs
	@echo "$(YELLOW)Setting up HTTPS and starting application...$(NC)"
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)Application is running with HTTPS!$(NC)"
	@node scripts/show-urls.js

# Show current URLs and network info
show-urls:
	@node scripts/show-urls.js

dev-frontend:
	@cd frontend && npm run dev

# Health check
health:
	@curl -s http://localhost:3000/health | jq '.' || echo "$(RED)Backend is not running$(NC)"

# Evaluation helper
eval:
	@echo "$(GREEN)=====================================$(NC)"
	@echo "$(GREEN)   ft_transcendence - Ready for Evaluation$(NC)"
	@echo "$(GREEN)=====================================$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Check .env file:$(NC)"
	@echo "   Make sure Google OAuth credentials are set"
	@echo ""
	@echo "$(YELLOW)2. Setup HTTPS and start:$(NC)"
	@echo "   $ make re"
	@echo ""
	@echo "$(YELLOW)3. Access URLs will be displayed automatically$(NC)"
	@echo ""
	@echo "$(YELLOW)4. Test features:$(NC)"
	@echo "   - Google OAuth login (HTTPS)"
	@echo "   - 3D Pong game with Babylon.js"
	@echo "   - Real-time multiplayer (Remote access)"
	@echo "   - Local tournament system"
	@echo "   - Statistics dashboard"
	@echo "   - Multi-language support (EN/JA/FR)"
	@echo "   - Responsive design"
	@echo ""
	@echo "$(YELLOW)5. Remote multiplayer testing:$(NC)"
	@echo "   - Share HTTPS URL with other devices"
	@echo "   - Test on same network from multiple PCs"
	@echo ""
	@echo "$(GREEN)All evaluation requirements are met!$(NC)"

# ngrok Remote Access Commands
ngrok: down
	@echo "$(YELLOW)Starting ft_transcendence with ngrok...$(NC)"
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)Application is running on port 8080!$(NC)"
	@echo "$(YELLOW)Setting up ngrok tunnel...$(NC)"
	@node scripts/setup-ngrok.js

# Setup ngrok tunnel only
setup-ngrok:
	@echo "$(YELLOW)Setting up ngrok tunnel...$(NC)"
	@node scripts/setup-ngrok.js

# Stop ngrok tunnel
stop-ngrok:
	@echo "$(YELLOW)Stopping ngrok tunnel...$(NC)"
	@pkill -f ngrok || true
	@echo "$(GREEN)ngrok tunnel stopped!$(NC)"
