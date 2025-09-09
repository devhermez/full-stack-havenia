# --- deps stage: install only production deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- build stage: install all deps + build TS
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# --- runtime stage: minimal, production-only
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000
RUN apk add --no-cache wget
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/healthz || exit 1
CMD ["node", "dist/server.js"]