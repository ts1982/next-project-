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

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/VAPID_PUBLIC_KEY" --value "BPEnVvygr6XeU_OK3iUx5KDyzcF-CSgmt19ooePUSq6Dquv-jA2fwGYblPwISX5oLIHyOzz0rlNI9GPut5FC06M"
  
aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/VAPID_PRIVATE_KEY" --value "GSJL02uWKRT3A6dApPqu5a7H63WmxSPIlGtlsWYdco0"

aws ssm put-parameter --region $R --type SecureString --overwrite \
  --name "/$P/VAPID_SUBJECT" --value "mailto:admin@studify.click"
echo "✓ VAPID_SUBJECT"

echo ""
echo "Done! DATABASE_URL will be set after base stack completes."
echo "⚠️  VAPID_PUBLIC_KEY と VAPID_PRIVATE_KEY は PLACEHOLDER です。"
echo "   デプロイ前に実際の鍵に差し替えてください: npx web-push generate-vapid-keys"
