#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VPS_HOST="${VPS_HOST:-31.97.243.51}"
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_vps_social}"
APP_HOST="${APP_HOST:-tiktokanalytics.ickanz.easypanel.host}"
SUPABASE_HOST="${SUPABASE_HOST:-tiktokanalytics-supabase.ickanz.easypanel.host}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/tiktokanalytics-web}"
REMOTE_NETWORK="${REMOTE_NETWORK:-easypanel}"
REMOTE_CONTAINER_NAME="${REMOTE_CONTAINER_NAME:-tiktokanalytics-web}"
REMOTE_SUPABASE_SERVER_URL="${REMOTE_SUPABASE_SERVER_URL:-http://tiktokanalytics_supabase_kong:8000}"

SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes)

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Missing required file: $path" >&2
    exit 1
  fi
}

require_file "$PROJECT_ROOT/.env"
require_file "$PROJECT_ROOT/ops/traefik/tiktokanalytics-web.yaml"
require_file "$PROJECT_ROOT/ops/traefik/tiktokanalytics-supabase.yaml"
require_file "$PROJECT_ROOT/Dockerfile"

tmp_env="$(mktemp)"
trap 'rm -f "$tmp_env"' EXIT

grep -vE '^(SUPABASE_SERVER_URL|PORT)=' "$PROJECT_ROOT/.env" > "$tmp_env"
printf '\nSUPABASE_SERVER_URL=%s\nPORT=3000\n' "$REMOTE_SUPABASE_SERVER_URL" >> "$tmp_env"

echo "Syncing project files to VPS..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "mkdir -p '$REMOTE_ROOT/app' /etc/easypanel/traefik/config"

tar -czf - \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.vercel \
  --exclude=.env \
  --exclude='.env.*' \
  --exclude=.DS_Store \
  --exclude=coverage \
  --exclude=playwright-report \
  --exclude=test-results \
  -C "$PROJECT_ROOT" . \
  | ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "rm -rf '$REMOTE_ROOT/app' && mkdir -p '$REMOTE_ROOT/app' && tar -xzf - -C '$REMOTE_ROOT/app'"

scp "${SSH_OPTS[@]}" "$tmp_env" "${VPS_USER}@${VPS_HOST}:$REMOTE_ROOT/.env.runtime" >/dev/null
scp "${SSH_OPTS[@]}" "$PROJECT_ROOT/ops/traefik/tiktokanalytics-web.yaml" \
  "${VPS_USER}@${VPS_HOST}:/etc/easypanel/traefik/config/tiktokanalytics-web.yaml" >/dev/null
scp "${SSH_OPTS[@]}" "$PROJECT_ROOT/ops/traefik/tiktokanalytics-supabase.yaml" \
  "${VPS_USER}@${VPS_HOST}:/etc/easypanel/traefik/config/tiktokanalytics-supabase.yaml" >/dev/null

ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "
  rm -f \
    /etc/easypanel/traefik/config/tiktokanalytics-web.json \
    /etc/easypanel/traefik/config/tiktokanalytics-supabase.json
"

echo "Building image and recreating container..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "
  set -euo pipefail
  if docker service inspect '$REMOTE_CONTAINER_NAME' >/dev/null 2>&1; then
    docker service rm '$REMOTE_CONTAINER_NAME' >/dev/null
    sleep 5
  fi
  docker rm -f '$REMOTE_CONTAINER_NAME' >/dev/null 2>&1 || true
  cd '$REMOTE_ROOT/app'
  docker build -t '$REMOTE_CONTAINER_NAME:latest' .
  docker run -d \
    --name '$REMOTE_CONTAINER_NAME' \
    --restart unless-stopped \
    --network '$REMOTE_NETWORK' \
    --env-file '$REMOTE_ROOT/.env.runtime' \
    '$REMOTE_CONTAINER_NAME:latest' >/dev/null
"

echo "Waiting for Traefik to reload routes..."
sleep 5

echo "Validating internal container and public routes..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_HOST}" "
  set -euo pipefail
  traefik_container=\$(docker ps --filter name=easypanel-traefik --format '{{.Names}}' | head -n1)
  if [ -z \"\$traefik_container\" ]; then
    echo 'Unable to find the EasyPanel Traefik container.' >&2
    exit 1
  fi
  docker exec \"\$traefik_container\" wget -qO- http://$REMOTE_CONTAINER_NAME:3000/api/health >/dev/null
"

app_root_status="$(curl -sS -o /tmp/tiktokanalytics-root.out -w '%{http_code}' "https://$APP_HOST/")"
app_health_body="$(curl -sS "https://$APP_HOST/api/health")"
supabase_status="$(curl -sS -o /tmp/tiktokanalytics-supabase.out -w '%{http_code}' "https://$SUPABASE_HOST/auth/v1/health")"
supabase_body="$(cat /tmp/tiktokanalytics-supabase.out)"

rm -f /tmp/tiktokanalytics-root.out /tmp/tiktokanalytics-supabase.out

if [[ "$app_root_status" != "200" ]]; then
  echo "App root health failed with status $app_root_status" >&2
  exit 1
fi

if [[ "$app_health_body" != '{"ok":true}' ]]; then
  echo "App health returned unexpected body: $app_health_body" >&2
  exit 1
fi

if [[ "$supabase_status" == "404" ]] || grep -q "Make sure you have the correct URL" <<<"$supabase_body"; then
  echo "Supabase public route is still returning the EasyPanel 404 page." >&2
  exit 1
fi

echo "Deploy complete."
echo "App: https://$APP_HOST"
echo "Supabase: https://$SUPABASE_HOST"
