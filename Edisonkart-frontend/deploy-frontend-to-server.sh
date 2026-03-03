#!/bin/bash
# Run this from your Windows machine (Git Bash) from the repo root or from Edisonkart-frontend/
# Syncs frontend source to the server so build uses correct code, then builds and deploys.
# Usage: bash deploy-frontend-to-server.sh   (or from Edisonkart folder: bash Edisonkart-frontend/deploy-frontend-to-server.sh)

set -e
KEY="${KEY:-/c/Users/chaga/OneDrive/Documents/ecommers2.pem}"
HOST="${HOST:-ubuntu@13.53.116.48}"
REMOTE_DIR="${REMOTE_DIR:-edison-kart-main/Edisonkart-frontend}"
NGINX_ROOT="${NGINX_ROOT:-/var/www/edisonkart}"

# If we're in Edisonkart-frontend, use . ; if in repo root, use Edisonkart-frontend
if [ -d "src" ]; then
  FRONTEND_DIR="."
elif [ -d "Edisonkart-frontend/src" ]; then
  FRONTEND_DIR="Edisonkart-frontend"
else
  echo "Run this script from the repo root or from Edisonkart-frontend/"
  exit 1
fi

echo "Syncing src/ to $HOST:$REMOTE_DIR/ ..."
scp -i "$KEY" -r "$FRONTEND_DIR/src" "$HOST:~/$REMOTE_DIR/"

echo "Running build and deploy on server..."
ssh -i "$KEY" "$HOST" "cd ~/$REMOTE_DIR && npm run build && sudo rm -rf $NGINX_ROOT/* && sudo cp -r dist/* $NGINX_ROOT/ && sudo systemctl reload nginx && echo Done."
