FROM node:22-alpine as builder

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate

WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy frontend package files
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source code
COPY packages/frontend ./packages/frontend

# Build
RUN pnpm --filter frontend build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
