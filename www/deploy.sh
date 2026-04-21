#!/bin/bash
echo "[+] Starting ZEUS Power-Up..."
# تنظيف الأكواد من التعليقات البرمجية لتقليل الحجم
sed -i 's/\/\/.*$//g' app.js
# تحديث رقم الإصدار تلقائياً
VERSION=$(date +%Y%m%d%H%M)
sed -i "s/ZEUS -/ZEUS v$VERSION -/g" index.html
# رفع المشروع (يتطلب وجود Vercel CLI)
vercel --prod
echo "[!] ZEUS is now LIVE on Planet Earth."
