# ─── Stage 1: Install all dependencies (including devDeps for build) ──────────
FROM node:20.10.0-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─── Stage 2: Build both apps ─────────────────────────────────────────────────
FROM deps AS builder
COPY nest-cli.json tsconfig*.json ./
COPY apps/ ./apps/
RUN npm run build && npx nest build kiwi-batch

# ─── Stage 3: Lean production image ───────────────────────────────────────────
FROM node:20.10.0-alpine AS production
WORKDIR /app

# Install only production dependencies (clean slate)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Pre-create upload directories (volume will overlay at runtime)
RUN mkdir -p uploads/member uploads/product uploads/vendor

# Drop root privileges
USER node

EXPOSE 3007 3008
