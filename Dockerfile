# Stage 1: Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Set Next.js build-time environment variables as arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
# استخدام npm install بدلاً من npm ci للتغلب على مشاكل عدم تطابق ملف package-lock.json
RUN NODE_ENV=development npm install

COPY . .
RUN npm run build

# Stage 2: Production stage
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Create directory and assign ownership to node user
RUN mkdir -p /app && chown -R node:node /app

# Copy public folder and static assets
COPY --chown=node:node --from=builder /app/public ./public
# Copy standalone build (contains server.js and minimal code needed)
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static

# Switch to non-privileged node user
USER node

# Expose port 3000 (default Next.js port)
EXPOSE 3000

# Healthcheck for Coolify using IPv4 loopback
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-3000}/ || exit 1

# Start Next.js standalone server
CMD ["node", "server.js"]