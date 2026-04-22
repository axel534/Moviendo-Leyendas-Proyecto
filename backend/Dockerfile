# syntax=docker/dockerfile:1.6

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage 3: production ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S fastify -u 1001

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

USER fastify
EXPOSE 8000

CMD ["node", "dist/server.js"]

# ---------- Stage 4: dev ----------
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev"]
