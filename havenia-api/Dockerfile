# ---- Build stage ----
FROM node:20-bookworm AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- Runtime stage ----
FROM node:20-bookworm AS runner
ENV NODE_ENV=production
WORKDIR /app
# Copy only what runtime needs
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# App listens on PORT (default 4000)
EXPOSE 4000
CMD ["node", "dist/server.js"]