FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/franchise/package.json apps/franchise/package.json

RUN pnpm install --frozen-lockfile --filter @welfare-mall/franchise...

COPY apps/franchise apps/franchise

ARG VITE_FRANCHISE_API_BASE_URL=http://localhost:3000/api
ENV VITE_FRANCHISE_API_BASE_URL=${VITE_FRANCHISE_API_BASE_URL}

RUN pnpm --filter @welfare-mall/franchise run build

EXPOSE 5176

CMD ["pnpm", "--filter", "@welfare-mall/franchise", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5176"]
