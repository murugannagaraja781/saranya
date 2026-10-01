# Naga AI Assistant — Deployment Guide

This document details running **Naga AI Assistant (Saranya)** locally for development and deploying it to production environments.

---

## 1. Local Development Run

### Prerequisites
- Node.js v18+ (Node v20 or v24 recommended)
- npm v9+

### Quick Start
```bash
# 1. Clone repository and install dependencies
cd saranya
npm install

# 2. Verify or edit environment variables
cp .env.example .env

# 3. Start both backend (port 5001) and frontend (port 5173) concurrently
npm run dev
```

Open your browser at `http://localhost:5173`.
The dashboard will load immediately in **MOCK_MODE** with live interactive simulation tools.

---

## 2. Running Automated Tests

Run the full Jest & Supertest test suite:
```bash
# Run server test suite
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 3. Production Build & Execution

```bash
# 1. Compile backend and bundle frontend assets
npm run build

# 2. Start production server
cd server
npm start
```

---

## 4. Production Docker Deployment

### Dockerfile (Sample for Root)
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/client/dist ./client/dist
RUN cd server && npm install --production
EXPOSE 5001
CMD ["node", "server/dist/index.js"]
```
