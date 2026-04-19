# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Build tools required by bcrypt (native C++ addon)
RUN apk add --no-cache python3 make g++

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/.next/cache/images && \
    chown -R appuser:appgroup /app
USER appuser

# Expose port 8080 (Google Cloud Run default)
EXPOSE 8080

# Set environment variable for Next.js
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
