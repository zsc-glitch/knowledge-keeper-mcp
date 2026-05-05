FROM node:22-slim

WORKDIR /app

# Copy dependency files first for better Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled code
COPY dist/ ./dist/

# Vault directory for knowledge storage
ENV KK_VAULT_PATH=/data
RUN mkdir -p /data

# MCP servers communicate over stdio (no HTTP port needed)
ENTRYPOINT ["node", "dist/index.js"]
