#!/bin/bash
set -euo pipefail

P=next-project
R=ap-northeast-1

echo "Registering SSM parameters..."

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/ADMIN_AUTH_SECRET" --value "$(openssl rand -base64 32)"
echo "✓ ADMIN_AUTH_SECRET"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/ADMIN_AUTH_URL" --value "https://admin.studify.click"
echo "✓ ADMIN_AUTH_URL"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/USER_AUTH_SECRET" --value "$(openssl rand -base64 32)"
echo "✓ USER_AUTH_SECRET"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/NEXTAUTH_URL" --value "https://app.studify.click"
echo "✓ NEXTAUTH_URL"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/INTERNAL_API_SECRET" --value "$(openssl rand -hex 16)"
echo "✓ INTERNAL_API_SECRET"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/CRON_SECRET" --value "$(openssl rand -hex 16)"
echo "✓ CRON_SECRET"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/USER_APP_URL" --value "https://app.studify.click"
echo "✓ USER_APP_URL"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/ADMIN_URL" --value "https://admin.studify.click"
echo "✓ ADMIN_URL"

# VAPID keys placeholder - ユーザが後で実際の値を設定する必要あり
aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/VAPID_PUBLIC_KEY" --value "PLACEHOLDER"
echo "✓ VAPID_PUBLIC_KEY (placeholder)"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/VAPID_PRIVATE_KEY" --value "PLACEHOLDER"
echo "✓ VAPID_PRIVATE_KEY (placeholder)"

echo ""
echo "Done! DATABASE_URL will be set after base stack completes."
