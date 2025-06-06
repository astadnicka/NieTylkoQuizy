FROM --platform=$BUILDPLATFORM node:18-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM --platform=$TARGETPLATFORM node:18-alpine AS app

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 3000

CMD ["npm", "run", "dev"]