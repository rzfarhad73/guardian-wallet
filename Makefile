.DEFAULT_GOAL := help

help:
	@echo ""
	@echo "  Guardian Wallet Firewall — available commands"
	@echo ""
	@echo "  make start          Start the app (http://localhost:3000)"
	@echo "  make preview        Start the app and expose to local network for mobile review"
	@echo "  make stop           Stop the app"
	@echo "  make install        Install dependencies"
	@echo "  make build          Build for production"
	@echo "  make test           Run tests"
	@echo "  make check          Check types and lint"
	@echo "  make clean          Delete build cache"
	@echo "  make qvac-test      Smoke-test QVAC AI connection"
	@echo "  make eval           Run deterministic risk engine benchmark"
	@echo "  make threat-intel   Verify signed local threat-intel bundle"
	@echo ""

install:
	npm install

start:
	npm run dev

preview:
	@IP=$$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null); \
	if [ -z "$$IP" ]; then echo "Could not detect local IP. Make sure you are on WiFi."; exit 1; fi; \
	echo ""; \
	echo "  Local:   http://localhost:3000"; \
	echo "  Network: http://$$IP:3000"; \
	echo ""; \
	echo "  Open http://$$IP:3000 on your mobile device (same WiFi required)."; \
	echo ""; \
	npm run dev -- --hostname 0.0.0.0

stop:
	@pkill -f "next dev" 2>/dev/null && echo "Stopped." || echo "App was not running."

build:
	npm run build

test:
	npm test

check:
	npm run typecheck
	npm run lint

clean:
	rm -rf apps/web/.next

qvac-test:
	npm run qvac:test

eval:
	npm run eval

threat-intel:
	npm run threat:intel:verify

.PHONY: help install start preview stop build test check clean qvac-test eval threat-intel
