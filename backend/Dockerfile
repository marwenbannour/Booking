FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# `prisma generate` loads prisma.config.ts, which resolves env('DATABASE_URL').
# Generation never connects to the database, so a placeholder is enough here;
# the real URL is injected at runtime (docker-compose / the runtime env).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
# Reuse the dependency tree from the build stage. It keeps the Prisma CLI
# available so `prisma migrate deploy` can run at container start.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Prisma 7 with the `prisma-client` generator + driver adapter emits the client
# into src/generated/prisma (no node_modules/.prisma engine directory).
COPY --from=build /app/src/generated/prisma ./src/generated/prisma
# Needed by `prisma migrate deploy` at runtime.
COPY prisma ./prisma
COPY prisma.config.ts ./
USER node
EXPOSE 3000
# nest build compiles src/ to dist/ (entrypoint at dist/main.js).
CMD ["node", "dist/main.js"]
