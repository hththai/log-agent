# --- Stage 1: Build the Application ---
FROM node:22-alpine AS builder
WORKDIR /app

# Ensure Vite/TanStack assigns absolute paths during compilation
ARG VITE_BASE_URL=/
ENV VITE_BASE_URL=$VITE_BASE_URL

# Copy package configurations
COPY package*.json ./

# Install dev and production dependencies for building
RUN npm ci

# Copy codebase
COPY . .

# Compiles directly into dist/client and dist/server
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 1. Copy package files into the runner stage
COPY --from=builder /app/package*.json ./

# 2. Install ONLY production dependencies
RUN npm ci --omit=dev

# 3. Install nginx and srvx
RUN apk add --no-cache nginx && npm install -g srvx@0.11.20

# 4. Copy the compiled build artifacts
COPY --from=builder /app/dist ./dist

# 5. Copy nginx config and entrypoint
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

# nginx serves static assets; srvx handles SSR on internal port 3001
CMD ["/entrypoint.sh"]
