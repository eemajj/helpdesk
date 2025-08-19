FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including tsx for runtime)
RUN npm ci && npm cache clean --force

# Copy application files
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3002

# Start server using tsx
CMD ["npx", "tsx", "src/server-complete.ts"]