# Coolify / production image. Installs on Linux so optional native
# bindings (oxc-parser, rollup, esbuild) match the build server.
FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV NODE_ENV=production \
    NPM_CONFIG_PRODUCTION=false \
    NUXT_DEVTOOLS=false \
    NODE_OPTIONS=--max-old-space-size=2048

# npm 11.3+ installs optional platform bindings correctly
RUN npm install -g npm@11

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
