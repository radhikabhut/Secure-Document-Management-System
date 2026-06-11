APP_NAME := docuvault
GOCACHE ?= /tmp/docuvault-go-cache

.PHONY: run build test lint migrate swagger docker clean

run:
	GOCACHE=$(GOCACHE) go run -buildvcs=false ./cmd/server

build:
	GOCACHE=$(GOCACHE) go build -buildvcs=false -trimpath -o bin/$(APP_NAME) ./cmd/server

test:
	GOCACHE=$(GOCACHE) go test ./...

lint:
	GOCACHE=$(GOCACHE) go vet ./...

migrate:
	docker compose exec -T postgres psql -U $${DB_USER:-postgres} -d $${DB_NAME:-secure_docs} < migrations/001_init.up.sql

swagger:
	GOCACHE=$(GOCACHE) go run -buildvcs=false github.com/swaggo/swag/cmd/swag init -g cmd/server/main.go -o docs

docker:
	docker compose up --build

clean:
	rm -rf bin coverage.out
