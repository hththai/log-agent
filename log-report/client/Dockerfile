# # --- Stage 1: Build the Application ---
# FROM node:22-alpine AS builder
# WORKDIR /app

# # Ensure Vite/TanStack assigns absolute paths during compilation
# ARG VITE_BASE_URL=/
# ENV VITE_BASE_URL=$VITE_BASE_URL

# # Copy package configurations
# COPY package*.json ./

# # Install dev and production dependencies for building
# RUN npm ci

# # Copy codebase
# COPY . .

# # Compiles directly into dist/client and dist/server
# RUN npm run build

# # --- Stage 2: Production Runtime ---
# FROM node:22-alpine AS runner
# WORKDIR /app

# ENV NODE_ENV=production

# # 1. Copy package files into the runner stage
# COPY --from=builder /app/package*.json ./

# # 2. Install ONLY production dependencies
# RUN npm ci --omit=dev

# # 3. Install nginx and srvx
# RUN apk add --no-cache nginx && npm install -g srvx@0.11.20

# # 4. Copy the compiled build artifacts
# COPY --from=builder /app/dist ./dist

# # 5. Copy nginx config and entrypoint
# COPY nginx.conf /etc/nginx/http.d/default.conf
# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# EXPOSE 3000

# # nginx serves static assets; srvx handles SSR on internal port 3001
# CMD ["/entrypoint.sh"]



# Build stage
# FROM oven/bun:1 AS builder

# WORKDIR /app

# COPY package.json ./
# RUN bun install

# COPY . .

# RUN bun run build

# FROM oven/bun:1

# WORKDIR /app

# COPY package.json ./
# RUN bun install --production

# COPY --from=builder /app/dist ./dist

# ENV NODE_ENV=production
# ENV PORT=3000

# EXPOSE 3000

# CMD ["bun", "dist/server/server.js"]

# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm install -g npm@11.18.0 && npm ci

# Build application
FROM deps AS builder

ARG INTERNAL_API_URL=http://log_report:8000
ENV INTERNAL_API_URL=$INTERNAL_API_URL

COPY . .
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built Nitro output
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]