FROM node:18

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies (this will compile bcrypt for Linux)
RUN npm install

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["npx", "nodemon", "index.js"]
