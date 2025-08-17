# Frontend Dockerfile - Matches your Vite setup exactly
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app (creates dist folder)
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose port 3000 (not 5173, we'll serve the built version)
EXPOSE 3000

# Serve the built app from dist folder
CMD ["serve", "-s", "dist", "-l", "3000"]
