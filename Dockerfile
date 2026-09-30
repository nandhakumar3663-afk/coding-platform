# Multi-language Judge & API Backend Dockerfile
FROM ubuntu:24.04

# Avoid interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install compilers and runtimes: GCC, G++, OpenJDK 21, Python 3, curl, build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    gcc \
    g++ \
    default-jdk \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy source code
COPY backend ./backend
COPY database ./database

# Build TypeScript backend
RUN cd backend && npm run build

# Expose backend port
EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

# Start backend (auto-seeds 109 questions if fresh database)
CMD ["node", "backend/dist/index.js"]
