$ErrorActionPreference = 'Stop'

# Docker Compose v5 can fail to build from this non-ASCII workspace path when
# bake is enabled. Keep the local runtime entrypoint deterministic on Windows.
$env:COMPOSE_BAKE = 'false'

docker compose build api
docker compose build admin
docker compose build merchant
docker compose build portal
docker compose up -d --no-build api admin merchant portal
