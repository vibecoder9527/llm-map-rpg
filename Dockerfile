# 圖誌 — production image
#   docker build -t tuzhi .
#   docker run --rm -p 8080:8080 -e XAI_API_KEY=... tuzhi
#
# Dev (hot reload):
#   docker compose --profile dev up --build

# ---- dependencies -----------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- development (optional, not the default target) -------------------------
FROM deps AS development
WORKDIR /app
COPY . .
ENV HOST=0.0.0.0 \
    PORT=8080
EXPOSE 8080
CMD ["npm", "run", "dev"]

# ---- production build -------------------------------------------------------
FROM deps AS build
COPY . .
# Node HTTP server instead of the Vercel preset.
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production
RUN npm run build

# ---- production runtime (default `docker build` target) ---------------------
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=8080
RUN useradd --system --uid 1001 --create-home tuzhi
COPY --from=build --chown=tuzhi:tuzhi /app/.output ./.output
COPY --from=build --chown=tuzhi:tuzhi /app/public ./public
USER tuzhi
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
