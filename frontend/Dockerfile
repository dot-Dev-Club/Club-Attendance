# ──────────────────────────────────────────────
# Stage 1: Build the React / Vite application
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cache friendly)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

# Build production bundle
# VITE_API_BASE is injected at build time via --build-arg / docker-compose env
ARG VITE_API_BASE=http://localhost:8000
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Serve with Nginx (lightweight)
# ──────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config: handle SPA client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
