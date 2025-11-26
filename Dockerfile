FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install postgresql-client for migrations
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations

# Copy migration runner script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create logs directory
RUN mkdir -p logs

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 9090

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/app.js"]

