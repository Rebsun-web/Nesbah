# Use Node.js base image
FROM node:20

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy everything else
COPY . .

# Build the React app
RUN pnpm run build

# Expose port
EXPOSE 8080

# Start the server
CMD ["pnpm", "start"]
