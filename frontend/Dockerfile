FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY next.config.mjs ./
COPY jsconfig.json ./
COPY postcss.config.mjs ./
RUN npm ci

# --- development ---
FROM node:18-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/next.config.mjs ./
COPY --from=deps /app/jsconfig.json ./
COPY --from=deps /app/postcss.config.mjs ./
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- produkcja ---
FROM deps AS prod-static
ENV NODE_ENV=production
RUN npm run build
FROM nginx:alpine AS static
COPY --from=prod-static /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

