FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN chown -R nodeuser:nodejs /app
USER nodeuser
EXPOSE 5000
CMD ["node", "server.js"]
