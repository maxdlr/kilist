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
-include .env.release.local
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
BUNDLED_CATALOG = src/offline/bundledCatalog.json
ANDROID_SDK ?= $(or $(ANDROID_HOME),$(HOME)/Library/Android/sdk)
APKSIGNER = $(lastword $(sort $(wildcard $(ANDROID_SDK)/build-tools/*/apksigner)))
RELEASE_SIGNING = -Pandroid.injected.signing.store.file=$(RELEASE_KEYSTORE) -Pandroid.injected.signing.store.password=$(RELEASE_KEYSTORE_PASSWORD) -Pandroid.injected.signing.key.alias=$(RELEASE_KEY_ALIAS) -Pandroid.injected.signing.key.password=$(RELEASE_KEYSTORE_PASSWORD)
IOS_BUNDLE_ID ?= com.maxdlr.kilist
IOS_EXPORT_METHOD ?= release-testing
IOS_BUILD_DIR = ios/build/release
IOS_ARCHIVE = $(IOS_BUILD_DIR)/kilist.xcarchive

release: ## Build a release APK against the production API
	$(eval VERSION := $(shell node -p "require('./app.json').expo.version"))
	$(eval COMMIT := $(shell git rev-parse --short HEAD)$(shell git diff --quiet HEAD || echo -dirty))
	[ -n "$(RELEASE_KEYSTORE)" ] && [ -f "$(RELEASE_KEYSTORE)" ] || { echo "✘ No release keystore. Set RELEASE_KEYSTORE, RELEASE_KEY_ALIAS and RELEASE_KEYSTORE_PASSWORD in .env.release.local"; exit 1; }
	[ -n "$(APKSIGNER)" ] || { echo "✘ apksigner not found in $(ANDROID_SDK)/build-tools"; exit 1; }
	echo "Building Kilist $(VERSION) ($(COMMIT)) for $(RELEASE_API_URL)"
	CI=1 EXPO_NO_GIT_STATUS=1 npx expo prebuild -p android --no-install
	curl -fsS $(RELEASE_API_URL)/catalog -o $(BUNDLED_CATALOG) || { echo null > $(BUNDLED_CATALOG); echo "✘ Could not download the pack from $(RELEASE_API_URL)/catalog"; exit 1; }
	node -e "const pack = require('./$(BUNDLED_CATALOG)'); if (!pack || !pack.foodBanks || !pack.rules || !Array.isArray(pack.prizes)) process.exit(1)" || { echo null > $(BUNDLED_CATALOG); echo "✘ The downloaded pack is not valid"; exit 1; }
	(cd android && EXPO_PUBLIC_API_URL=$(RELEASE_API_URL) NODE_ENV=production ./gradlew assembleRelease -PreactNativeArchitectures=$(RELEASE_ABIS) $(RELEASE_SIGNING) --console=plain) || { echo null > $(BUNDLED_CATALOG); exit 1; }
	echo null > $(BUNDLED_CATALOG)
	unzip -p $(RELEASE_APK) assets/index.android.bundle | grep -aq '$(RELEASE_API_URL)' || { echo "✘ APK does not contain $(RELEASE_API_URL)"; exit 1; }
	! unzip -p $(RELEASE_APK) assets/index.android.bundle | grep -aq '10\.0\.2\.2' || { echo "✘ APK still points at the emulator"; exit 1; }
	[ "$$($(APKSIGNER) verify --print-certs $(RELEASE_APK) | sed -n 's/^.*certificate SHA-256 digest: //p' | head -1)" = "$$(keytool -list -v -keystore $(RELEASE_KEYSTORE) -alias $(RELEASE_KEY_ALIAS) -storepass $(RELEASE_KEYSTORE_PASSWORD) | sed -n 's/^.*SHA256: //p' | tr -d ':' | tr 'A-F' 'a-f')" ] || { echo "✘ APK is not signed with the release keystore"; exit 1; }
	mkdir -p $(RELEASE_DIR)
	cp $(RELEASE_APK) $(RELEASE_DIR)/kilist-$(VERSION)-$(COMMIT).apk
	echo "✔ $(RELEASE_DIR)/kilist-$(VERSION)-$(COMMIT).apk"

bump: ## Bump the version in app.json, package.json and package-lock.json, and the versionCode (optional: make bump 0.1.0-beta.1)
	node scripts/bump-version.js $(ARG)

publish: ## Build the release APK and publish it as a GitHub release for testers
	$(eval VERSION := $(shell node -p "require('./app.json').expo.version"))
	$(eval COMMIT := $(shell git rev-parse --short HEAD))
	[ -z "$$(git status --porcelain)" ] || { echo "✘ Commit your changes first"; exit 1; }
	git fetch -q origin
	git branch -r --contains HEAD | grep -q . || { echo "✘ Push your commits first"; exit 1; }
	! gh release view $(VERSION) > /dev/null 2>&1 || { echo "✘ Release $(VERSION) already exists. Run make bump, commit and push"; exit 1; }
	$(MAKE) release
	gh release create $(VERSION) $(RELEASE_DIR)/kilist-$(VERSION)-$(COMMIT).apk --title "Kilist $(VERSION)" --generate-notes --target $$(git rev-parse HEAD)

ios-release: ## Build a signed iPhone IPA against the production API (needs IOS_TEAM_ID)
	xcodebuild -version > /dev/null 2>&1 || { echo "✘ Full Xcode is required. Install it, then run: sudo xcode-select -s /Applications/Xcode.app"; exit 1; }
	[ -n "$(IOS_TEAM_ID)" ] || { echo "✘ Set your Apple team id: make ios-release IOS_TEAM_ID=XXXXXXXXXX"; exit 1; }
	$(eval VERSION := $(shell node -p "require('./app.json').expo.version"))
	$(eval COMMIT := $(shell git rev-parse --short HEAD)$(shell git diff --quiet HEAD || echo -dirty))
	echo "Building Kilist $(VERSION) ($(COMMIT)) as $(IOS_BUNDLE_ID) for $(RELEASE_API_URL)"
	CI=1 EXPO_NO_GIT_STATUS=1 npx expo prebuild -p ios
	curl -fsS $(RELEASE_API_URL)/catalog -o $(BUNDLED_CATALOG) || { echo null > $(BUNDLED_CATALOG); echo "✘ Could not download the pack from $(RELEASE_API_URL)/catalog"; exit 1; }
	node -e "const pack = require('./$(BUNDLED_CATALOG)'); if (!pack || !pack.foodBanks || !pack.rules || !Array.isArray(pack.prizes)) process.exit(1)" || { echo null > $(BUNDLED_CATALOG); echo "✘ The downloaded pack is not valid"; exit 1; }
	rm -rf $(IOS_BUILD_DIR)
	mkdir -p $(IOS_BUILD_DIR)
	EXPO_PUBLIC_API_URL=$(RELEASE_API_URL) NODE_ENV=production xcodebuild archive -workspace ios/kilist.xcworkspace -scheme kilist -configuration Release -destination 'generic/platform=iOS' -archivePath $(IOS_ARCHIVE) -allowProvisioningUpdates DEVELOPMENT_TEAM=$(IOS_TEAM_ID) CODE_SIGN_STYLE=Automatic PRODUCT_BUNDLE_IDENTIFIER=$(IOS_BUNDLE_ID) || { echo null > $(BUNDLED_CATALOG); exit 1; }
	echo null > $(BUNDLED_CATALOG)
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

