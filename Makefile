.PHONY: help dev build start lint format format-check db-* prisma-* seed clean install infra-start infra-stop infra-status dns-flush deploy-admin deploy-user deploy-lambda deploy-all deploy-infra-lambda

# デフォルトターゲット
help:
	@echo "📖 Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start development server"
	@echo "  make build            - Build for production"
	@echo "  make start            - Start production server"
	@echo "  make lint             - Run ESLint"
	@echo "  make format           - Auto-format code (Prettier)"
	@echo "  make format-check     - Check formatting (CI)"
	@echo ""
	@echo "Deploy (Docker images):"
	@echo "  make deploy-admin    - Build & push admin image to ECR"
	@echo "  make deploy-user     - Build & push user image to ECR"
	@echo "  make deploy-lambda   - Build & push notification-lambda image to ECR"
	@echo "  make deploy-all      - Build & push all images to ECR"
	@echo ""
	@echo "AWS Infrastructure:"
	@echo "  make infra-start                  - Start AWS environment (Lambda → RDS → Edge Stack)"
	@echo "  make infra-stop                   - Stop AWS environment (Edge Stack → RDS)"
	@echo "  make infra-status                 - Show current AWS environment status"
	@echo "  make infra-deploy-control-plane   - Update control-plane stack (IAM / Lambda)"
	@echo "  make deploy-infra-lambda          - Package & deploy start/stop/notify Lambda code"
	@echo "  make dns-flush                    - Flush local DNS cache (macOS)"
	@echo ""
	@echo "Database:"
	@echo "  make db-up            - Start PostgreSQL container"
	@echo "  make db-down          - Stop PostgreSQL container"
	@echo "  make db-restart       - Restart PostgreSQL container"
	@echo "  make db-logs          - Show PostgreSQL logs"
	@echo "  make db-shell         - Open PostgreSQL shell"
	@echo ""
	@echo "Prisma:"
	@echo "  make prisma-migrate   - Create and apply migration"
	@echo "  make prisma-reset     - Reset database (⚠️  development only)"
	@echo "  make prisma-studio    - Open Prisma Studio"
	@echo "  make prisma-generate  - Generate Prisma Client"
	@echo "  make prisma-format    - Format schema file"
	@echo "  make repl             - Open Prisma REPL"
	@echo "  make seed             - Run database seed"
	@echo ""
	@echo "Utility:"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make install          - Install dependencies"
	@echo "  make update           - Update dependencies"

# Development
dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

lint:
	pnpm lint

format:
	pnpm exec prettier --write .

format-check:
	pnpm exec prettier --check .

# Database (Docker)
up:
	docker-compose up -d
	@echo "✅ PostgreSQL container started"

down:
	docker-compose down
	@echo "✅ PostgreSQL container stopped"

restart:
	docker-compose restart
	@echo "✅ PostgreSQL container restarted"

db-logs:
	docker-compose logs -f postgres

db-shell:
	docker exec -it next-project-postgres psql -U nextuser -d nextdb

# Prisma
prisma-migrate:
	@read -p "Enter migration name: " name; \
	cd packages/database && pnpm exec prisma migrate dev --name $$name

prisma-reset:
	@echo "⚠️  This will delete all data in the database!"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		cd packages/database && pnpm exec prisma migrate reset; \
	else \
		echo "Cancelled."; \
	fi

prisma-studio:
	cd packages/database && pnpm exec prisma studio

prisma-generate:
	cd packages/database && pnpm exec prisma generate

prisma-format:
	cd packages/database && pnpm exec prisma format

repl:
	pnpm repl

seed:
	pnpm exec tsx prisma/seed.ts

# Utility
clean:
	rm -rf .next
	rm -rf node_modules/.cache
	@echo "✅ Cleaned build artifacts"

install:
	pnpm install

update:
	pnpm update
	@echo "✅ Dependencies updated"

# Setup (初回セットアップ用)
setup: install db-up prisma-migrate seed
	@echo "✅ Setup completed!"
	@echo "Run 'make dev' to start development server"

# ============================================================
# AWS Infrastructure (本番環境 start / stop)
# ============================================================
AWS_REGION  ?= ap-northeast-1
AWS_ACCOUNT ?= $(shell aws sts get-caller-identity --query Account --output text 2>/dev/null)
ECR_BASE     = $(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com
PROJECT      = next-project
AWS_STACK    = next-project-edge
START_FN     = next-project-start
STOP_FN      = next-project-stop
CONTROL_PLANE_STACK = $(PROJECT)-ctrl
EDGE_TEMPLATE_S3URL = https://$(PROJECT)-lambda-deploy.s3.$(AWS_REGION).amazonaws.com/edge-stack.yaml
AUTO_STOP_HOURS    ?= 3

infra-start:
	@echo "🚀 Starting AWS environment..."
	@aws lambda invoke \
	  --function-name $(START_FN) \
	  --payload '{}' \
	  --cli-binary-format raw-in-base64-out \
	  --cli-read-timeout 0 \
	  --region $(AWS_REGION) \
	  /tmp/infra-start-output.json > /dev/null
	@echo "   Lambda response: $$(cat /tmp/infra-start-output.json)"
	@echo "⏳ Waiting for Edge Stack (this can take 10–20 min)..."
	@while true; do \
	  STATUS=$$(aws cloudformation describe-stacks \
	    --stack-name $(AWS_STACK) \
	    --region $(AWS_REGION) \
	    --query 'Stacks[0].StackStatus' \
	    --output text 2>&1); \
	  echo "   $$(date '+%H:%M:%S')  Stack: $$STATUS"; \
	  if [ "$$STATUS" = "CREATE_COMPLETE" ] || [ "$$STATUS" = "UPDATE_COMPLETE" ]; then \
	    break; \
	  fi; \
	  if echo "$$STATUS" | grep -qE "FAILED|ROLLBACK"; then \
	    echo "❌ Stack operation failed! Run 'make infra-status' for details."; exit 1; \
	  fi; \
	  sleep 30; \
	done
	@echo "✅ Environment is UP!"
	@echo ""
	@echo "🔍 Checking DNS resolution (via 8.8.8.8)..."
	@DNS_OK=true; \
	for DOMAIN in admin.studify.click app.studify.click; do \
	  RESOLVED=false; \
	  for i in 1 2 3; do \
	    if nslookup $$DOMAIN 8.8.8.8 2>/dev/null | grep -v "#53" | grep -q "Address:"; then \
	      echo "   ✅ $$DOMAIN → OK"; \
	      RESOLVED=true; \
	      break; \
	    fi; \
	    sleep 5; \
	  done; \
	  if [ "$$RESOLVED" = "false" ]; then \
	    echo "   ❌ $$DOMAIN → DNS resolution failed"; \
	    DNS_OK=false; \
	  fi; \
	done; \
	if [ "$$DNS_OK" = "false" ]; then \
	  echo ""; \
	  echo "⚠️  DNS not yet propagated. Try:"; \
	  echo "      make dns-flush"; \
	  echo ""; \
	  ALB_DNS=$$(aws cloudformation describe-stacks \
	    --stack-name $(AWS_STACK) \
	    --region $(AWS_REGION) \
	    --query 'Stacks[0].Outputs[?OutputKey==`ALBDnsName`].OutputValue' \
	    --output text 2>/dev/null); \
	  if [ -n "$$ALB_DNS" ]; then \
	    echo "   Alternatively, access via ALB directly:"; \
	    echo "   admin : https://$$ALB_DNS"; \
	    echo "   user  : https://$$ALB_DNS"; \
	  fi; \
	fi
	@echo ""
	@echo "   admin : https://admin.studify.click"
	@echo "   user  : https://app.studify.click"

infra-stop:
	@echo "🛑 Stopping AWS environment..."
	@aws lambda invoke \
	  --function-name $(STOP_FN) \
	  --payload '{"source":"manual"}' \
	  --cli-binary-format raw-in-base64-out \
	  --cli-read-timeout 0 \
	  --region $(AWS_REGION) \
	  /tmp/infra-stop-output.json > /dev/null
	@echo "   Lambda response: $$(cat /tmp/infra-stop-output.json)"
	@echo "⏳ Waiting for Edge Stack deletion (this can take 5–10 min)..."
	@while true; do \
	  STATUS=$$(aws cloudformation describe-stacks \
	    --stack-name $(AWS_STACK) \
	    --region $(AWS_REGION) \
	    --query 'Stacks[0].StackStatus' \
	    --output text 2>&1); \
	  if echo "$$STATUS" | grep -q "does not exist"; then \
	    break; \
	  fi; \
	  echo "   $$(date '+%H:%M:%S')  Stack: $$STATUS"; \
	  if echo "$$STATUS" | grep -qE "FAILED"; then \
	    echo "❌ Stack deletion failed! Check CloudFormation console."; exit 1; \
	  fi; \
	  sleep 30; \
	done
	@echo "✅ Environment is DOWN."

infra-deploy-control-plane:
	@echo "🔧 Deploying control-plane stack (IAM roles / Lambda config)..."
	@aws cloudformation deploy \
	  --stack-name $(CONTROL_PLANE_STACK) \
	  --template-file infra/control-plane-stack.yaml \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --parameter-overrides EdgeTemplateS3URL=$(EDGE_TEMPLATE_S3URL) AutoStopHours=$(AUTO_STOP_HOURS) \
	  --region $(AWS_REGION) \
	  --no-fail-on-empty-changeset
	@echo "✅ control-plane stack deployed"

LAMBDA_DIR  = infra/lambda
LAMBDA_S3   = s3://$(PROJECT)-lambda-deploy/lambda

deploy-infra-lambda:
	@echo "📦 Packaging Lambda functions..."
	@cd $(LAMBDA_DIR) && zip -j start.zip start.py slack_notify.py
	@cd $(LAMBDA_DIR) && zip -j stop.zip stop.py slack_notify.py
	@cd $(LAMBDA_DIR) && zip -j infra_notify.zip infra_notify.py slack_notify.py
	@echo "☁️  Uploading to S3..."
	@aws s3 cp $(LAMBDA_DIR)/start.zip $(LAMBDA_S3)/start.zip --region $(AWS_REGION)
	@aws s3 cp $(LAMBDA_DIR)/stop.zip $(LAMBDA_S3)/stop.zip --region $(AWS_REGION)
	@aws s3 cp $(LAMBDA_DIR)/infra_notify.zip $(LAMBDA_S3)/infra_notify.zip --region $(AWS_REGION)
	@echo "🔄 Updating Lambda functions..."
	@aws lambda update-function-code --function-name $(PROJECT)-start \
	  --s3-bucket $(PROJECT)-lambda-deploy --s3-key lambda/start.zip \
	  --region $(AWS_REGION) > /dev/null
	@aws lambda update-function-code --function-name $(PROJECT)-stop \
	  --s3-bucket $(PROJECT)-lambda-deploy --s3-key lambda/stop.zip \
	  --region $(AWS_REGION) > /dev/null
	@aws lambda update-function-code --function-name $(PROJECT)-infra-notify \
	  --s3-bucket $(PROJECT)-lambda-deploy --s3-key lambda/infra_notify.zip \
	  --region $(AWS_REGION) > /dev/null 2>&1 || echo "   ⚠️  infra-notify Lambda not found (deploy control-plane first)"
	@echo "✅ Lambda functions deployed"

infra-status:
	@echo "🔍 AWS Environment Status:"
	@STACK_STATUS=$$(aws cloudformation describe-stacks \
	  --stack-name $(AWS_STACK) \
	  --region $(AWS_REGION) \
	  --query 'Stacks[0].StackStatus' \
	  --output text 2>&1); \
	  if echo "$$STACK_STATUS" | grep -q "does not exist"; then \
	    echo "   Edge Stack  : (not running)"; \
	  else \
	    echo "   Edge Stack  : $$STACK_STATUS"; \
	  fi
	@RDS_STATUS=$$(aws rds describe-db-instances \
	  --region $(AWS_REGION) \
	  --query 'DBInstances[?contains(DBInstanceIdentifier, `next-project`)].DBInstanceStatus | [0]' \
	  --output text 2>&1); \
	  if [ "$$RDS_STATUS" = "None" ] || echo "$$RDS_STATUS" | grep -q "error\|Error"; then \
	    echo "   RDS         : (not found)"; \
	  else \
	    echo "   RDS         : $$RDS_STATUS"; \
	  fi
	@SCHEDULE=$$(aws scheduler get-schedule \
	  --name next-project-auto-stop \
	  --region $(AWS_REGION) \
	  --query 'ScheduleExpression' \
	  --output text 2>/dev/null) || SCHEDULE=""; \
	  if [ -z "$$SCHEDULE" ]; then \
	    echo "   Auto-stop   : (not scheduled)"; \
	  else \
	    echo "   Auto-stop   : $$SCHEDULE"; \
	  fi
	@for DOMAIN in admin.studify.click app.studify.click; do \
	  if nslookup $$DOMAIN 2>/dev/null | grep -v "#53" | grep -q "Address:"; then \
	    echo "   DNS $$DOMAIN : OK"; \
	  else \
	    echo "   DNS $$DOMAIN : ❌ unresolved (run: sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder)"; \
	  fi; \
	done

dns-flush:
	@echo "🔄 Flushing local DNS cache..."
	@sudo sh -c 'dscacheutil -flushcache && killall -HUP mDNSResponder'
	@echo "✅ DNS cache flushed"
	@echo "🔍 Checking DNS via Google Public DNS (8.8.8.8)..."
	@ALL_OK=true; \
	for DOMAIN in admin.studify.click app.studify.click; do \
	  RESOLVED=false; \
	  for i in 1 2 3; do \
	    if nslookup $$DOMAIN 8.8.8.8 2>/dev/null | grep -v "#53" | grep -q "Address:"; then \
	      echo "   ✅ $$DOMAIN → OK"; \
	      RESOLVED=true; \
	      break; \
	    fi; \
	    sleep 5; \
	  done; \
	  if [ "$$RESOLVED" = "false" ]; then \
	    echo "   ❌ $$DOMAIN → unresolved (Route53 propagation may still be in progress)"; \
	    ALL_OK=false; \
	  fi; \
	done; \
	if [ "$$ALL_OK" = "false" ]; then \
	  echo ""; \
	  echo "   💡 Route53 records may not have propagated yet."; \
	  echo "      Wait a few minutes after 'make infra-start' and retry."; \
	fi

# ============================================================
# Deploy (Docker images → ECR)
# ============================================================

# ECR ログイン（各ターゲットから依存）
ecr-login:
	@aws ecr get-login-password --region $(AWS_REGION) | \
	  docker login --username AWS --password-stdin $(ECR_BASE)

deploy-admin: ecr-login
	@echo "🐳 Building admin..."
	docker build --build-arg APP_NAME=admin --target runner-admin -f Dockerfile -t $(ECR_BASE)/$(PROJECT)/admin:latest .
	docker push $(ECR_BASE)/$(PROJECT)/admin:latest
	@echo "✅ admin image pushed"

deploy-user: ecr-login
	@echo "🐳 Building user..."
	docker build --build-arg APP_NAME=user --target runner-user -f Dockerfile -t $(ECR_BASE)/$(PROJECT)/user:latest .
	docker push $(ECR_BASE)/$(PROJECT)/user:latest
	@echo "✅ user image pushed"

deploy-lambda: ecr-login
	@echo "🐳 Building notification-lambda..."
	DOCKER_BUILDKIT=1 docker build \
	  -f Dockerfile.notification-lambda \
	  -t $(ECR_BASE)/$(PROJECT)/notification-lambda:latest \
	  .
	docker push $(ECR_BASE)/$(PROJECT)/notification-lambda:latest
	@echo "✅ notification-lambda image pushed"

deploy-all: deploy-admin deploy-user deploy-lambda
	@echo "✅ All images pushed"
