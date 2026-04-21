#!/bin/bash
for link in $(cat movie_links.txt); do
  status=$(curl -o /dev/null -s -w "%{http_code}" "$link")
  if [ $status -ne 200 ]; then
    echo "[-] Broken Link Detected: $link (Status: $status)"
    # هنا يمكنك إضافة أمر لإرسال تنبيه لـ Firebase بحذف الرابط
  fi
done
