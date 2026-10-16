ARG NODE_IMAGE=node:22.20.0-bookworm-slim@sha256:b21fe589dfbe5cc39365d0544b9be3f1f33f55f3c86c87a76ff65a02f8f5848e
FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app/experiments/pi-sdk
COPY experiments/pi-sdk/package.json experiments/pi-sdk/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production PI_OFFLINE=1
COPY --from=dependencies /app/experiments/pi-sdk/node_modules ./experiments/pi-sdk/node_modules
COPY src ./src
COPY dist ./dist
COPY experiments ./experiments
COPY manifest.json ./manifest.json
RUN mkdir -p /app/experiments/pi-sdk/.state/container && chown -R node:node /app/experiments/pi-sdk/.state
USER node
STOPSIGNAL SIGTERM
CMD ["node", "experiments/pi-sdk/run.mjs", "website", "--env-file", "/run/secrets/model.env"]
