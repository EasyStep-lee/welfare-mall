FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/merchant/package.json apps/merchant/package.json
COPY apps/portal/package.json apps/portal/package.json
COPY apps/user-miniprogram/package.json apps/user-miniprogram/package.json

RUN pnpm install --frozen-lockfile --filter @welfare-mall/api...

COPY apps/api apps/api

RUN pnpm --filter @welfare-mall/api run prisma:generate && pnpm --filter @welfare-mall/api run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/api/dist/src/main.js"]
