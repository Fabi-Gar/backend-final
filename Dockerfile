# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- deps: instala deps según NODE_ENV ----------
FROM base AS deps
COPY package*.json ./
ARG NODE_ENV=development
ENV NODE_ENV=$NODE_ENV
# en dev instala TODO; en prod omite devDeps
RUN if [ "$NODE_ENV" = "production" ]; then npm ci --omit=dev; else npm ci; fi

# ---------- build: compila TS ----------
FROM base AS build
WORKDIR /app
# 👇 necesitas package.json para poder correr "npm run build"
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- runner: runtime final ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Guatemala

# Herramientas usadas en healthcheck/entrypoint
RUN apk add --no-cache wget netcat-openbsd

# entrypoint (usado en compose dev)
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh

# copiamos package*.json para permitir prune si es prod
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules

# si se construyó con NODE_ENV=production, podar devDeps; y validar typeorm
ARG NODE_ENV=production
RUN if [ "$NODE_ENV" = "production" ]; then npm prune --omit=dev; fi \
  && node -e "console.log('typeorm =>', require.resolve('typeorm'))"

# build compilado
COPY --from=build /app/dist ./dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD wget -qO- http://localhost:4000/health/liveness || exit 1

# Si necesitas correr como node, descomenta:
# USER node

CMD ["node","dist/server.js"]
