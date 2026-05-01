COMPOSE      = docker compose
IMAGE        = stroygetter
CONTAINER    = stroygetter

# ── Dev (local Next.js, no Docker) ───────────────────────────────────────────

.PHONY: dev
dev:
	pnpm dev

.PHONY: build
build:
	pnpm build

.PHONY: start
start:
	pnpm start

.PHONY: lint
lint:
	pnpm lint

# ── Database ──────────────────────────────────────────────────────────────────

.PHONY: db
db:
	pnpm db:deploy

# ── Docker (production compose) ───────────────────────────────────────────────

.PHONY: up
up:
	$(COMPOSE) up -d

.PHONY: down
down:
	$(COMPOSE) down

.PHONY: restart
restart:
	$(COMPOSE) restart

.PHONY: logs
logs:
	$(COMPOSE) logs -f $(CONTAINER)

.PHONY: ps
ps:
	$(COMPOSE) ps

# ── Docker image ──────────────────────────────────────────────────────────────

## Build the image without using the layer cache
.PHONY: docker-build
docker-build:
	docker build --no-cache -t $(IMAGE) .

## Build and (re)start via compose — rebuilds the image first
.PHONY: docker-up
docker-up:
	$(COMPOSE) up -d --build

## Stop containers and remove images built by compose
.PHONY: docker-clean
docker-clean:
	$(COMPOSE) down --rmi local

# ── Docker shell / exec ───────────────────────────────────────────────────────

.PHONY: shell
shell:
	docker exec -it $(CONTAINER) sh

# ── Help ──────────────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo ""
	@echo "  Local dev"
	@echo "    make dev           pnpm dev (Next.js dev server)"
	@echo "    make build         pnpm build"
	@echo "    make start         pnpm start (production Next.js)"
	@echo "    make lint          Biome lint"
	@echo "    make db            prisma migrate deploy + generate"
	@echo ""
	@echo "  Docker (compose)"
	@echo "    make up            docker compose up -d"
	@echo "    make down          docker compose down"
	@echo "    make restart       docker compose restart"
	@echo "    make logs          Follow container logs"
	@echo "    make ps            Show running containers"
	@echo ""
	@echo "  Docker (image)"
	@echo "    make docker-build  Build image (no cache)"
	@echo "    make docker-up     Build image then compose up"
	@echo "    make docker-clean  Compose down + remove local images"
	@echo "    make shell         Open sh inside running container"
	@echo ""

.DEFAULT_GOAL := help
