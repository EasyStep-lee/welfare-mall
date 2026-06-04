$ErrorActionPreference = 'Stop'

# Docker Compose can fail to build from this non-ASCII Windows workspace path
# when bake is enabled. Keep the preflight aligned with the runtime launcher.
$env:COMPOSE_BAKE = 'false'

$requiredServices = @('api', 'admin', 'merchant', 'portal')

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
}

Write-Host 'Docker image build preflight verified.'
