FROM node:18-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy only necessary files
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./

# Install dev dependencies only for build
RUN npm ci && \
    npx prisma generate && \
    npm run build && \
    npm prune --production && \
    npm cache clean --force

# Remove source files after build
RUN rm -rf src/ tsconfig.json

# Expose port
EXPOSE 3002

# Start server
CMD ["npm", "start"]