.PHONY: help dev build start lint db-* prisma-* seed clean install infra-start infra-stop infra-status

# デフォルトターゲット
help:
	@echo "📖 Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start development server"
	@echo "  make build            - Build for production"
	@echo "  make start            - Start production server"
	@echo "  make lint             - Run ESLint"
	@echo ""
	@echo "AWS Infrastructure:"
	@echo "  make infra-start      - Start AWS environment (Lambda → RDS → Edge Stack)"
	@echo "  make infra-stop       - Stop AWS environment (Edge Stack → RDS)"
	@echo "  make infra-status     - Show current AWS environment status"
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
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

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
	npx prisma migrate dev --name $$name

prisma-reset:
	@echo "⚠️  This will delete all data in the database!"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		npx prisma migrate reset; \
	else \
		echo "Cancelled."; \
	fi

prisma-studio:
	npx prisma studio

prisma-generate:
	npx prisma generate

prisma-format:
	npx prisma format

repl:
	npm run repl

seed:
	npx tsx prisma/seed.ts

# Utility
clean:
	rm -rf .next
	rm -rf node_modules/.cache
	@echo "✅ Cleaned build artifacts"

install:
	npm install

update:
	npm update
	@echo "✅ Dependencies updated"

# Setup (初回セットアップ用)
setup: install db-up prisma-migrate seed
	@echo "✅ Setup completed!"
	@echo "Run 'make dev' to start development server"

# ============================================================
# AWS Infrastructure (本番環境 start / stop)
# ============================================================
AWS_REGION ?= ap-northeast-1
AWS_STACK   = next-project-edge
START_FN    = next-project-start
STOP_FN     = next-project-stop

infra-start:
	@echo "🚀 Starting AWS environment..."
	@aws lambda invoke \
	  --function-name $(START_FN) \
	  --payload '{}' \
	  --cli-binary-format raw-in-base64-out \
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
	@echo "   admin : https://admin.studify.click"
	@echo "   user  : https://app.studify.click"

infra-stop:
	@echo "🛑 Stopping AWS environment..."
	@aws lambda invoke \
	  --function-name $(STOP_FN) \
	  --payload '{"source":"manual"}' \
	  --cli-binary-format raw-in-base64-out \
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

infra-status:
	@echo "🔍 AWS Environment Status:"
	@STACK_STATUS=$$(aws cloudformation describe-stacks \
	  --stack-name $(AWS_STACK) \
	  --region $(AWS_REGION) \
	  --query 'Stacks[0].StackStatus' \
	  --output text 2>&1); \
	  echo "   Edge Stack  : $$STACK_STATUS"
	@RDS_STATUS=$$(aws rds describe-db-instances \
	  --region $(AWS_REGION) \
	  --query 'DBInstances[?contains(DBInstanceIdentifier, `next-project`)].DBInstanceStatus | [0]' \
	  --output text 2>&1); \
	  echo "   RDS         : $$RDS_STATUS"
	@SCHEDULE=$$(aws scheduler get-schedule \
	  --name next-project-auto-stop \
	  --region $(AWS_REGION) \
	  --query 'ScheduleExpression' \
	  --output text 2>&1 || echo "(no auto-stop scheduled)"); \
	  echo "   Auto-stop   : $$SCHEDULE"
