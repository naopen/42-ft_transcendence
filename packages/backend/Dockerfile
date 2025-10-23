FROM node:22-alpine

# Install build dependencies for native modules
RUN apk add --no-cache build-base python3 sqlite-dev

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml .npmrc ./

# Copy backend package files
COPY packages/backend/package.json ./packages/backend/

# Install dependencies (allow build scripts for native modules like better-sqlite3)
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# Copy backend source code
COPY packages/backend ./packages/backend

# Build TypeScript
RUN pnpm --filter backend build

# Expose port
EXPOSE 3000

# Create data directory for SQLite
RUN mkdir -p /app/data

WORKDIR /app/packages/backend

CMD ["pnpm", "start"]
