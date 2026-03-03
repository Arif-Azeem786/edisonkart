#!/bin/bash
# Run this ON THE LIVE SERVER (13.53.116.48) after SSH: ssh -i ecmmers.pem ubuntu@13.53.116.48
# Then: chmod +x deploy-razorpay-on-live-server.sh && ./deploy-razorpay-on-live-server.sh

set -e
echo "=== Deploying Razorpay on live server ==="

# 1) Backend
BACKEND="$HOME/edison-kart-main/Edisonkart-backend"
if [ -d "$BACKEND" ]; then
  cd "$BACKEND"
  grep -q "RAZORPAY_KEY_ID" .env 2>/dev/null || echo "RAZORPAY_KEY_ID=rzp_live_SKgijfd7RnXSpO" >> .env
  grep -q "RAZORPAY_KEY_SECRET" .env 2>/dev/null || echo "RAZORPAY_KEY_SECRET=lLc873bE47FYesXqZaH60hAe" >> .env
  npm install --silent
  pm2 restart all 2>/dev/null || true
  echo "Backend done."
else
  echo "Backend path not found: $BACKEND (edit script if different)."
fi

# 2) Frontend — replace Cashfree text in source
FRONTEND="$HOME/edison-kart-main/Edisonkart-frontend"
if [ ! -d "$FRONTEND" ]; then
  echo "Frontend not found: $FRONTEND. Aborting."
  exit 1
fi
cd "$FRONTEND"
# Fix use-toast import (wrong path causes build failure)
sed -i "s|from '../components/ui/use-toast'|from '../ui/use-toast'|g" src/components/pages/Checkout.jsx
sed -i 's/Secure Payment via Cashfree/Secure Payment via Razorpay/g' src/components/pages/Checkout.jsx
sed -i 's|You will be redirected to Cashfree'"'"'s secure payment gateway to complete your transaction utilizing 128-bit encryption.|You will complete your payment securely using Razorpay UPI / Cards / Netbanking with industry-standard encryption.|g' src/components/pages/Checkout.jsx
rm -rf dist
npm install --silent
npm run build
echo "Frontend build done."

# 3) Nginx root (default)
NGINX_ROOT="/usr/share/nginx/html"
sudo rm -rf "$NGINX_ROOT"/*
sudo cp -r dist/* "$NGINX_ROOT"/
sudo sed -i 's/Secure Payment via Cashfree/Secure Payment via Razorpay/g' "$NGINX_ROOT"/index.html "$NGINX_ROOT"/assets/*.js 2>/dev/null || true
sudo sed -i 's|You will be redirected to Cashfree'"'"'s secure payment gateway to complete your transaction utilizing 128-bit encryption.|You will complete your payment securely using Razorpay UPI / Cards / Netbanking with industry-standard encryption.|g' "$NGINX_ROOT"/index.html "$NGINX_ROOT"/assets/*.js 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx reloaded."

# 4) Verify
grep -r "Cashfree" "$NGINX_ROOT"/ 2>/dev/null && echo "WARNING: Cashfree still present" || echo "NO_CASHFREE - OK"
grep -r "Razorpay" "$NGINX_ROOT"/ | head -1
echo "=== Done. Open https://edisonkart.com/checkout in incognito. ==="
