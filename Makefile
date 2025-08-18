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

.PHONY: all clean fclean re http logs status help

# Default target - HTTPS with ngrok
all:
	@echo "$(GREEN)🚀 Starting ft_transcendence with ngrok (HTTPS)...$(NC)"
	@pkill -f ngrok || true
	@$(DOCKER_COMPOSE) down --remove-orphans || true
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)✅ Application containers running!$(NC)"
	@echo "$(YELLOW)🔌 Setting up ngrok tunnel...$(NC)"
	@node scripts/setup-ngrok.js

# HTTP mode - local development without ngrok
http:
	@echo "$(YELLOW)🛠️ Starting ft_transcendence in HTTP mode (localhost:8080)...$(NC)"
	@pkill -f ngrok || true
	@$(DOCKER_COMPOSE) down --remove-orphans || true
	@$(DOCKER_COMPOSE) up --build -d
	@echo "$(GREEN)✅ Application running in HTTP mode!$(NC)"
	@echo "Local Access: http://localhost:8080"
	@echo "Health Check: http://localhost:8080/health"
	@echo "$(YELLOW)💡 For remote multiplayer, use: make$(NC)"

# Clean containers and volumes
clean:
	@echo "$(YELLOW)🧹 Cleaning containers and volumes...$(NC)"
	@pkill -f ngrok || true
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@echo "$(GREEN)✅ Clean complete!$(NC)"

# Full clean - removes everything including cached environment variables
fclean:
	@echo "$(RED)💫 Full clean - removing all resources and cached environment...$(NC)"
	@pkill -f ngrok || true
	@$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans
	@docker image prune -f
	@docker container prune -f
	@docker volume prune -f
	@docker system prune -f
	@echo "$(GREEN)✅ Full clean complete! All caches cleared.$(NC)"

# Rebuild everything from scratch
re: fclean all

# Show container logs
logs:
	@$(DOCKER_COMPOSE) logs -f

# Show container status
status:
	@echo "$(YELLOW)Container Status:$(NC)"
	@$(DOCKER_COMPOSE) ps

# Help command
help:
	@echo "$(GREEN)ft_transcendence - Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)🚀 Main Commands:$(NC)"
	@echo "  make          - Start with ngrok (HTTPS remote access)"
	@echo "  make all      - Same as make"
	@echo "  make http     - Local HTTP mode (localhost:8080)"
	@echo "  make re       - Full rebuild from scratch"
	@echo ""
	@echo "$(YELLOW)🧹 Cleanup Commands:$(NC)"
	@echo "  make clean    - Clean containers and volumes"
	@echo "  make fclean   - Full clean (fixes all cache issues)"
	@echo ""
	@echo "$(YELLOW)🔍 Debug Commands:$(NC)"
	@echo "  make logs     - View container logs"
	@echo "  make status   - Show container status"
	@echo "  make help     - Show this help"
	@echo ""
	@echo "$(GREEN)💡 Quick Start: Run 'make' for ngrok HTTPS mode$(NC)"
	@echo "$(RED)🔧 Having issues? Run 'make re' to fix all problems$(NC)"
