# Frontend build stage
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Backend build stage
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend ./
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package*.json ./backend/
# Only copy Prisma schema and migrations (avoid local .db)
RUN mkdir -p ./backend/prisma
COPY --from=backend-build /app/backend/prisma/schema.prisma ./backend/prisma/schema.prisma
COPY --from=backend-build /app/backend/prisma/migrations ./backend/prisma/migrations

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set working directory to backend
WORKDIR /app/backend

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV DATABASE_URL="file:/app/data/dev.db"
ENV PORT=3000

EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
