FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/i18n/package.json packages/i18n/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/admin apps/admin
COPY packages packages
RUN pnpm --filter @zhiyu/admin build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/apps/admin/dist ./dist
COPY apps/admin/static-server.mjs ./static-server.mjs
USER node
ENV NODE_ENV=production
EXPOSE 80
CMD ["node", "static-server.mjs"]

FROM deps AS dev
COPY --chown=node:node apps/admin apps/admin
COPY --chown=node:node packages packages
RUN chown -R node:node /app/apps/admin /app/packages
WORKDIR /app/apps/admin
USER node
ENV NODE_ENV=development
EXPOSE 80
CMD ["pnpm", "dev"]