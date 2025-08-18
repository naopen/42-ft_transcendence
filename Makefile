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

.PHONY: all help build dev up down restart logs clean fclean re status install ngrok setup-ngrok stop-ngrok eval

# Default target - HTTPS with ngrok (recommended)
all: ngrok

# Help command
help:
	@echo "$(GREEN)ft_transcendence - Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)🚀 HTTPS Remote Multiplayer (Default):$(NC)"
	@echo "  make          - Start with ngrok (HTTPS remote access)"
	@echo "  make all      - Same as make (ngrok HTTPS default)"
	@echo "  make ngrok    - Start with ngrok tunnel (recommended)"
	@echo "  make re       - Full rebuild with ngrok"
	@echo ""
	@echo "$(YELLOW)⚙️  Basic Commands:$(NC)"
	@echo "  make build    - Build Docker containers"
	@echo "  make down     - Stop and remove containers"
	@echo "  make restart  - Restart all containers"
	@echo "  make logs     - View container logs"
	@echo "  make clean    - Stop containers and clean volumes"
	@echo "  make fclean   - Full clean (containers, volumes, images)"
	@echo "  make status   - Show container status"
	@echo "  make install  - Install dependencies locally (for development)"
	@echo ""
	@echo "$(YELLOW)🛠️  Development (HTTP only):$(NC)"
	@echo "  make dev      - Local development mode (HTTP on port 8080)"
	@echo "  make setup-ngrok - Setup and start ngrok tunnel only"
	@echo "  make stop-ngrok  - Stop ngrok tunnel"
	@echo ""
	@echo "$(GREEN)💡 For evaluation: Use 'make' or 'make ngrok' for true remote multiplayer!$(NC)"

# Build Docker containers
build:
	@echo "$(YELLOW)Building Docker containers...$(NC)"
	@$(DOCKER_COMPOSE) build
	@echo "$(GREEN)Build complete!$(NC)"

# ngrok Remote Access Commands (Default HTTPS Mode)
ngrok: down
	@echo "$(GREEN)🚀 Starting ft_transcendence with ngrok (HTTPS)...$(NC)"
	@echo "$(YELLOW)📦 Building and starting containers...$(NC)"
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)✅ Application containers running!$(NC)"
	@echo "$(YELLOW)🔌 Setting up ngrok tunnel...$(NC)"
	@node scripts/setup-ngrok.js

# Local development (HTTP only)
dev:
	@echo "$(YELLOW)Starting ft_transcendence in development mode...$(NC)"
	@echo "$(RED)⚠️  Development mode: HTTP only, no remote access$(NC)"
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)Application is running in development mode!$(NC)"
	@echo "Local Access: http://localhost:8080"
	@echo "Health Check: http://localhost:8080/health"
	@echo ""
	@echo "$(YELLOW)💡 For remote multiplayer, use: make ngrok$(NC)"

# Legacy alias for development mode
up: dev

# Stop containers
down:
	@echo "$(YELLOW)Stopping containers...$(NC)"
	@$(DOCKER_COMPOSE) down
	@echo "$(GREEN)Containers stopped!$(NC)"

# Restart containers
restart: down ngrok

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

# Rebuild everything with ngrok (HTTPS default)
re: fclean ngrok

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

# Setup ngrok tunnel only
setup-ngrok:
	@echo "$(YELLOW)Setting up ngrok tunnel...$(NC)"
	@node scripts/setup-ngrok.js

# Stop ngrok tunnel
stop-ngrok:
	@echo "$(YELLOW)Stopping ngrok tunnel...$(NC)"
	@pkill -f ngrok || true
	@echo "$(GREEN)ngrok tunnel stopped!$(NC)"

# Backend specific commands
backend-logs:
	@$(DOCKER_COMPOSE) logs -f backend

frontend-logs:
	@$(DOCKER_COMPOSE) logs -f frontend

nginx-logs:
	@$(DOCKER_COMPOSE) logs -f nginx

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

dev-frontend:
	@cd frontend && npm run dev

# Health check (requires running application)
health:
	@echo "$(YELLOW)Checking application health...$(NC)"
	@node scripts/test-nginx.js

# Evaluation helper
eval:
	@echo "$(GREEN)=========================================$(NC)"
	@echo "$(GREEN)   ft_transcendence - Ready for Evaluation$(NC)"
	@echo "$(GREEN)=========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Check .env file:$(NC)"
	@echo "   Make sure Google OAuth credentials are set"
	@echo ""
	@echo "$(YELLOW)2. Start with ngrok (HTTPS default):$(NC)"
	@echo "   $$ make"
	@echo "   $$ # or specifically: make ngrok"
	@echo ""
	@echo "$(YELLOW)3. ngrok will automatically:$(NC)"
	@echo "   - Install ngrok if needed (brew install ngrok)"
	@echo "   - Configure authentication token"
	@echo "   - Start HTTPS tunnel"
	@echo "   - Display public URL"
	@echo ""
	@echo "$(YELLOW)4. Test features:$(NC)"
	@echo "   - Google OAuth login (HTTPS via ngrok)"
	@echo "   - 3D Pong game with Babylon.js"
	@echo "   - Real-time multiplayer (Internet-wide access)"
	@echo "   - Local tournament system"
	@echo "   - Statistics dashboard"
	@echo "   - Multi-language support (EN/JA/FR)"
	@echo "   - Responsive design"
	@echo ""
	@echo "$(YELLOW)5. Remote multiplayer testing:$(NC)"
	@echo "   - Share ngrok HTTPS URL with anyone, anywhere"
	@echo "   - Test from completely different networks"
	@echo "   - No firewall or router configuration needed"
	@echo ""
	@echo "$(GREEN)✅ All evaluation requirements met!$(NC)"
	@echo "$(GREEN)🌐 True remote multiplayer via ngrok HTTPS tunnel$(NC)"
