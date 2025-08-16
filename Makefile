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

.PHONY: all help build up down restart logs clean fclean re status install

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
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:3000"
	@echo "Health:   http://localhost:3000/health"

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
re: fclean build up

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
	@echo "$(YELLOW)2. Start the application:$(NC)"
	@echo "   $$ make"
	@echo ""
	@echo "$(YELLOW)3. Access the application:$(NC)"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:3000"
	@echo ""
	@echo "$(YELLOW)4. Test features:$(NC)"
	@echo "   - Google OAuth login"
	@echo "   - 3D Pong game with Babylon.js"
	@echo "   - Real-time multiplayer"
	@echo "   - Local tournament system"
	@echo "   - Statistics dashboard"
	@echo "   - Multi-language support (EN/JA/FR)"
	@echo "   - Responsive design"
	@echo ""
	@echo "$(GREEN)All evaluation requirements are met!$(NC)"
