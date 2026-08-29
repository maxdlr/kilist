#debug flags:
#a for all debugging (same as make -d and make --debug).
#b for basic debugging.
#v for slightly more verbose basic debugging.
#i for implicit rules.
#j for invocation information.
#m for information during makefile remakes.
DOCKER = docker
MAKEFLAGS += --no-print-directory -s
#MAKEFLAGS += --debug=v
# MAKEFLAGS += -s
include .env
export $(shell sed 's/=.*//' .env)
.DEFAULT_GOAL := help
#.PHONY: all
ARG=$(filter-out $@, $(MAKECMDGOALS))

define EXEC
    $(DOCKER) exec -w / $(DB_CONTAINER_NAME) $(1)
endef

start-android: ## Start the android emulator
	npx expo run:android

expo-start: ## Start the expo development server
	npx expo start

android-wait: ## Wait for the Android emulator to be ready
	@echo "Waiting for Android emulator to be ready..."
	@adb wait-for-device
	@for i in $$(seq 1 60); do \
		boot_completed=$$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r\n'); \
		if [ "$$boot_completed" = "1" ]; then \
			echo "✔ Android emulator is ready" && exit 0; \
		fi; \
		echo "  ...waiting ($$i/60)"; \
		sleep 2; \
	done; \
	echo "✘ Android emulator did not become ready in time"; exit 1


dev: ## Start working (launch emulator, build, and run the app)
	npx expo run:android

%:
	@:

help: ## This menu
	@echo "Usage: make [target]"
	@echo
	@echo "Available targets:"
	@echo
	@awk -F ':|##' '/^[a-zA-Z_-]+:.*?##/ && !/##hidden/ {printf "  %-20s %s\n", $$1, $$NF}' $(MAKEFILE_LIST) | sort

