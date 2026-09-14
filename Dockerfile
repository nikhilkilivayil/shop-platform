# Production Dockerfile for Shop Platform
# Uses Node 22 Alpine (native node:sqlite & node:http support, ~50MB image footprint)
FROM node:22-alpine

# Set production environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_PATH=/data/shop.db

# Create application and data directories
WORKDIR /app
RUN mkdir -p /data /app

# Copy application source code
COPY package.json ./
COPY db.js ./
COPY server.js ./
COPY seed.js ./
COPY public ./public

# Persist database across container recreation
VOLUME ["/data"]

# Expose HTTP port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "server.js"]
