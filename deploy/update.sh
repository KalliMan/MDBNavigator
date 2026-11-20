#!/bin/sh
# Rebuilds the public demo on its server with fresh base images and restarts what changed (docs/hosting.md).
#   sh deploy/update.sh
# The weekly timer (mdbnavigator-update.timer) runs it too. It never pulls code: new code goes live only when the
# owner runs git pull first.
set -eu
cd "$(dirname "$0")/.."

compose() {
    docker compose -f docker-compose.yml -f compose.demo.yaml "$@"
}

# Caddy is a ready-made image. The app and the sample database are built here on fresh base images (.NET, Node,
# PostgreSQL 17), so their security fixes arrive without a code change.
compose pull --ignore-buildable
compose build --pull
# Recreates only the containers whose image or settings changed. Data stays in the volumes.
compose up -d --remove-orphans
# Old images and build cache would fill the disk over the weeks.
docker image prune -f
docker builder prune -f
