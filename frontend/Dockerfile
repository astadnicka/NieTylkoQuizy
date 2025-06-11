FROM --platform=$BUILDPLATFORM node:18-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM --platform=$TARGETPLATFORM node:18-alpine AS app

ARG PORT=3000
ENV PORT=${PORT}
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY . .

EXPOSE ${PORT}

CMD ["npm", "run", "dev"]
