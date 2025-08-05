FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3002

# Start server
CMD ["npm", "start"]