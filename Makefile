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

RELEASE_API_URL ?= https://kilist.maxdlr.com/api
RELEASE_ABIS ?= arm64-v8a,armeabi-v7a
RELEASE_DIR ?= $(HOME)/Desktop
RELEASE_APK = android/app/build/outputs/apk/release/app-release.apk
IOS_BUNDLE_ID ?= com.maxdlr.kilist
IOS_EXPORT_METHOD ?= release-testing
IOS_BUILD_DIR = ios/build/release
IOS_ARCHIVE = $(IOS_BUILD_DIR)/kilist.xcarchive

release: ## Build a release APK against the production API
	$(eval VERSION := $(shell node -p "require('./app.json').expo.version"))
	$(eval COMMIT := $(shell git rev-parse --short HEAD)$(shell git diff --quiet HEAD || echo -dirty))
	echo "Building Kilist $(VERSION) ($(COMMIT)) for $(RELEASE_API_URL)"
	CI=1 EXPO_NO_GIT_STATUS=1 npx expo prebuild -p android --no-install
	cd android && EXPO_PUBLIC_API_URL=$(RELEASE_API_URL) NODE_ENV=production ./gradlew assembleRelease -PreactNativeArchitectures=$(RELEASE_ABIS) --console=plain
	unzip -p $(RELEASE_APK) assets/index.android.bundle | grep -aq '$(RELEASE_API_URL)' || { echo "✘ APK does not contain $(RELEASE_API_URL)"; exit 1; }
	! unzip -p $(RELEASE_APK) assets/index.android.bundle | grep -aq '10\.0\.2\.2' || { echo "✘ APK still points at the emulator"; exit 1; }
	mkdir -p $(RELEASE_DIR)
	cp $(RELEASE_APK) $(RELEASE_DIR)/kilist-$(VERSION)-$(COMMIT).apk
	echo "✔ $(RELEASE_DIR)/kilist-$(VERSION)-$(COMMIT).apk"

ios-release: ## Build a signed iPhone IPA against the production API (needs IOS_TEAM_ID)
	xcodebuild -version > /dev/null 2>&1 || { echo "✘ Full Xcode is required. Install it, then run: sudo xcode-select -s /Applications/Xcode.app"; exit 1; }
	[ -n "$(IOS_TEAM_ID)" ] || { echo "✘ Set your Apple team id: make ios-release IOS_TEAM_ID=XXXXXXXXXX"; exit 1; }
	$(eval VERSION := $(shell node -p "require('./app.json').expo.version"))
	$(eval COMMIT := $(shell git rev-parse --short HEAD)$(shell git diff --quiet HEAD || echo -dirty))
	echo "Building Kilist $(VERSION) ($(COMMIT)) as $(IOS_BUNDLE_ID) for $(RELEASE_API_URL)"
	CI=1 EXPO_NO_GIT_STATUS=1 npx expo prebuild -p ios
	rm -rf $(IOS_BUILD_DIR)
	mkdir -p $(IOS_BUILD_DIR)
	EXPO_PUBLIC_API_URL=$(RELEASE_API_URL) NODE_ENV=production xcodebuild archive -workspace ios/kilist.xcworkspace -scheme kilist -configuration Release -destination 'generic/platform=iOS' -archivePath $(IOS_ARCHIVE) -allowProvisioningUpdates DEVELOPMENT_TEAM=$(IOS_TEAM_ID) CODE_SIGN_STYLE=Automatic PRODUCT_BUNDLE_IDENTIFIER=$(IOS_BUNDLE_ID)
	grep -aq '$(RELEASE_API_URL)' $(IOS_ARCHIVE)/Products/Applications/kilist.app/main.jsbundle || { echo "✘ App does not contain $(RELEASE_API_URL)"; exit 1; }
	! grep -aq '10\.0\.2\.2' $(IOS_ARCHIVE)/Products/Applications/kilist.app/main.jsbundle || { echo "✘ App still points at the emulator"; exit 1; }
	printf '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>method</key><string>$(IOS_EXPORT_METHOD)</string><key>teamID</key><string>$(IOS_TEAM_ID)</string><key>signingStyle</key><string>automatic</string></dict></plist>' > $(IOS_BUILD_DIR)/ExportOptions.plist
	xcodebuild -exportArchive -archivePath $(IOS_ARCHIVE) -exportPath $(IOS_BUILD_DIR)/export -exportOptionsPlist $(IOS_BUILD_DIR)/ExportOptions.plist -allowProvisioningUpdates
	mkdir -p $(RELEASE_DIR)
	cp $(IOS_BUILD_DIR)/export/kilist.ipa $(RELEASE_DIR)/kilist-$(VERSION)-$(COMMIT).ipa
	echo "✔ $(RELEASE_DIR)/kilist-$(VERSION)-$(COMMIT).ipa"

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

