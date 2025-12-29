# --- Stage 1: Build Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Arguments for Home Assistant
ARG VITE_HA_URL
ARG VITE_HA_TOKEN

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN VITE_HA_URL=$VITE_HA_URL VITE_HA_TOKEN=$VITE_HA_TOKEN npm run build

# --- Stage 2: Final Image ---
FROM node:20-slim

# Install dependencies for Puppeteer/Chromium
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy backend source code
COPY . .

# Copy built frontend from Stage 1 to the backend's public directory
RUN mkdir -p public
COPY --from=frontend-builder /app/frontend/dist ./public

# Environment variables for Puppeteer and NVIDIA GPU
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics

# Expose the API port
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]
