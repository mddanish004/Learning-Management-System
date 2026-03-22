FROM node:20-bookworm-slim AS client-builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-bookworm-slim AS server-prod
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-builder /app/client/dist /app/client/dist
RUN chown -R node:node /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "src/index.js"]
