# Base image for Node.js
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose Vite's development server port
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host"]
