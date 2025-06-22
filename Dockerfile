# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Install dependencies
RUN npm install

# Build the React app
RUN npm run build

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
