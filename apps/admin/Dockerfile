FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/package.json

RUN pnpm install --frozen-lockfile --filter @welfare-mall/admin...

COPY apps/admin apps/admin

ARG VITE_ADMIN_API_BASE_URL=http://localhost:3000/api
ENV VITE_ADMIN_API_BASE_URL=${VITE_ADMIN_API_BASE_URL}

RUN pnpm --filter @welfare-mall/admin run build

EXPOSE 5173

CMD ["pnpm", "--filter", "@welfare-mall/admin", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
