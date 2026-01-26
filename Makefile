.PHONY: up down run-api run-web migrate-up migrate-down

up:
	docker-compose up -d

# Start only the database (useful for local development)
db:
	docker-compose up -d db

down:
	docker-compose down

run-api:
	go run cmd/api/main.go

# Assumes you have install golang-migrate
# https://github.com/golang-migrate/migrate/tree/master/cmd/migrate
MIGRATE_CMD=migrate -path migrations -database "mysql://user:password@tcp(localhost:3307)/schoolcrm"

migrate-up:
	$(MIGRATE_CMD) up

migrate-down:
	$(MIGRATE_CMD) down

migrate-force:
	$(MIGRATE_CMD) force $(VERSION)

# Frontend commands
run-web:
	cd web && npm run dev
