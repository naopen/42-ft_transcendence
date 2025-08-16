FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY nodemon.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
