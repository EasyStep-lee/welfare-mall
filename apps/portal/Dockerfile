FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/portal/package.json apps/portal/package.json

RUN pnpm install --frozen-lockfile --filter @welfare-mall/portal...

COPY apps/portal apps/portal

ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN pnpm --filter @welfare-mall/portal run build

EXPOSE 5175

CMD ["pnpm", "--filter", "@welfare-mall/portal", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5175"]
