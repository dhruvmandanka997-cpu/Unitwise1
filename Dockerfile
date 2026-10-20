# Production Dockerfile for UnitWise (LessonCraft AI) Backend
FROM node:22-alpine

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy package descriptors
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Copy backend source code
COPY backend/ ./backend/

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the persistent Node.js backend server
CMD ["npm", "run", "backend:start"]
