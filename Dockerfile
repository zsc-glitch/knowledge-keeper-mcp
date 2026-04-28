FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist/ ./dist/

ENV KK_VAULT_PATH=/data
RUN mkdir -p /data

EXPOSE 3000

# MCP servers communicate over stdio
CMD ["node", "dist/index.js"]
