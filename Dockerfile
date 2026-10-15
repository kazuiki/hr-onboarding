# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_BASE_PATH empty = serve from root (http://localhost:3000)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# uploads live here (lib/server-db.ts: storage/uploads or UPLOAD_DIR)
RUN mkdir -p /app/storage/uploads /app/.next/cache/images && chown -R nextjs:nodejs /app/.next /app/storage/uploads
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
