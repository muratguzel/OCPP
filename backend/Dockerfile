# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---- Dependencies ----
FROM base AS deps
RUN npm ci

# ---- Build ----
FROM deps AS build
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
RUN npm run build

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]

# ---- Development ----
FROM deps AS development
WORKDIR /app
ENV NODE_ENV=development

COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle

EXPOSE 3000
CMD ["npx", "tsx", "src/index.ts"]
