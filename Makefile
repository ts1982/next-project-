.PHONY: help dev build start lint db-* prisma-* seed clean install

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
	@echo "Database:"
	@echo "  make db-up            - Start MySQL container"
	@echo "  make db-down          - Stop MySQL container"
	@echo "  make db-restart       - Restart MySQL container"
	@echo "  make db-logs          - Show MySQL logs"
	@echo "  make db-shell         - Open MySQL shell"
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
db-up:
	docker-compose up -d
	@echo "✅ MySQL container started"

db-down:
	docker-compose down
	@echo "✅ MySQL container stopped"

db-restart:
	docker-compose restart
	@echo "✅ MySQL container restarted"

db-logs:
	docker-compose logs -f mysql

db-shell:
	docker exec -it next-project-mysql mysql -u root -prootpassword nextdb

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
