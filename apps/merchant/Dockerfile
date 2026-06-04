FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/merchant/package.json apps/merchant/package.json

RUN pnpm install --frozen-lockfile --filter @welfare-mall/merchant...

COPY apps/merchant apps/merchant

ARG VITE_MERCHANT_API_BASE_URL=http://localhost:3000/api
ENV VITE_MERCHANT_API_BASE_URL=${VITE_MERCHANT_API_BASE_URL}

RUN pnpm --filter @welfare-mall/merchant run build

EXPOSE 5174

CMD ["pnpm", "--filter", "@welfare-mall/merchant", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5174"]
