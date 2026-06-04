$ErrorActionPreference = 'Stop'

# Docker Compose can fail to build from this non-ASCII Windows workspace path
# when bake is enabled. Keep the preflight aligned with the runtime launcher.
$env:COMPOSE_BAKE = 'false'

$requiredServices = @('api', 'admin', 'merchant', 'portal')
$imageNames = @{
  api = 'welfare-mall-v2-api'
  admin = 'welfare-mall-v2-admin'
  merchant = 'welfare-mall-v2-merchant'
  portal = 'welfare-mall-v2-portal'
}

if (-not $env:WELFARE_MALL_IMAGE_TAG) {
  $shortSha = git rev-parse --short=12 HEAD
  if ($LASTEXITCODE -ne 0) {
    throw 'git rev-parse --short=12 HEAD failed.'
  }

  $env:WELFARE_MALL_IMAGE_TAG = "git-$shortSha"
}

Write-Host "Using Docker image tag: $env:WELFARE_MALL_IMAGE_TAG"

Write-Host 'Verifying Docker Compose service set...'
$configuredServices = docker compose config --services
if ($LASTEXITCODE -ne 0) {
  throw 'docker compose config --services failed.'
}

foreach ($service in $requiredServices) {
  if ($configuredServices -notcontains $service) {
    throw "docker-compose.yml is missing required build service: $service"
  }
}

foreach ($service in $requiredServices) {
  Write-Host "Building Docker image for service: $service"
  docker compose build $service
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose build failed for service: $service"
  }

  $imageRef = "$($imageNames[$service]):$env:WELFARE_MALL_IMAGE_TAG"
  docker image inspect $imageRef | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Expected Docker image was not found after build: $imageRef"
  }
}

Write-Host 'Docker image build preflight verified.'
