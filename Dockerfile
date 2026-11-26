FROM node:24-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM node:24-bookworm-slim

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/backend/data/reading.db

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/server.js ./
COPY backend/databaseConf/ ./databaseConf/
COPY --from=frontend-build /app/frontend/dist/ /app/frontend/dist/

RUN mkdir -p /app/backend/data && chown node:node /app/backend/data
USER node

EXPOSE 3001

# Initialize SQLite after Docker mounts the volume. The seed preserves existing progress.
CMD ["sh", "-c", "node databaseConf/setup.js && node databaseConf/database.js && exec node server.js"]