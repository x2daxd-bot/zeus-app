#!/bin/bash
TARGET_URL="https://zeus-app-sigma.vercel.app"
STATUS=$(curl -o /dev/null -s -w "%{http_code}" $TARGET_URL)
if [ $STATUS -ne 200 ]; then
  echo "[!] Alert: ZEUS is down (Status $STATUS). Rebuilding..."
  vercel --prod --force
  curl -s -X POST -H "Content-Type: application/json" -d '{"text":"System Recovered Successfully"}' https://discord.com/api/webhooks/YOUR_ID
fi
