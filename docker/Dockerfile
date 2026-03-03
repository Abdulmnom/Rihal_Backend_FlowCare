# Use Node.js 18 Alpine (lightweight)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker cache)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source
COPY src/ ./src/
COPY knexfile.js ./

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user for security
RUN addgroup -S flowcare && adduser -S flowcare -G flowcare
RUN chown -R flowcare:flowcare /app
USER flowcare

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
