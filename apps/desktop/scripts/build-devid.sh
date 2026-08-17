#!/usr/bin/env bash
# Build a Developer ID signed, notarized, stapled DMG for direct distribution
# from the OpenGnothia website. Not for the Mac App Store.
#
# Prerequisites (one-time setup):
#   xcrun notarytool store-credentials "opengnothia-notary" \
#       --apple-id edurusoy@neoskola.com \
#       --team-id TBV5TAGQ74 \
#       --password "<your-app-specific-password>"
#
# Usage:
#   ./apps/desktop/scripts/build-devid.sh (from apps/desktop: ./scripts/build-devid.sh)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_TAURI="$PROJECT_ROOT/src-tauri"
ENTITLEMENTS="$SRC_TAURI/Entitlements.DevID.plist"
SIGN_APP="Developer ID Application: Emirhan Durusoy (TBV5TAGQ74)"
NOTARY_PROFILE="opengnothia-notary"

APP_NAME="OpenGnothia.app"
BUNDLE_DIR="$SRC_TAURI/target/universal-apple-darwin/release/bundle/macos"
APP_PATH="$BUNDLE_DIR/$APP_NAME"
DMG_OUTPUT="$PROJECT_ROOT/OpenGnothia.dmg"

echo "==> [1/9] Checking prerequisites"
[[ -f "$ENTITLEMENTS" ]] || { echo "FAIL: missing $ENTITLEMENTS"; exit 1; }
security find-identity -p codesigning -v | grep -q "Developer ID Application" \
    || { echo "FAIL: 'Developer ID Application' cert not in keychain"; exit 1; }
xcrun notarytool history --keychain-profile "$NOTARY_PROFILE" >/dev/null 2>&1 \
    || { echo "FAIL: notarytool profile '$NOTARY_PROFILE' not found."; \
         echo "Run this first (one-time):"; \
         echo "  xcrun notarytool store-credentials \"$NOTARY_PROFILE\" \\"; \
         echo "      --apple-id edurusoy@neoskola.com \\"; \
         echo "      --team-id TBV5TAGQ74 \\"; \
         echo "      --password \"<your-app-specific-password>\""; \
         exit 1; }

echo "==> [2/9] Building universal binary with Tauri (Developer ID config)"
cd "$PROJECT_ROOT"
pnpm tauri build \
    --config src-tauri/tauri.devid.conf.json \
    --target universal-apple-darwin

[[ -d "$APP_PATH" ]] || { echo "FAIL: .app not found at $APP_PATH"; exit 1; }

echo "==> [3/9] Cleaning extended attributes (e.g. quarantine)"
xattr -cr "$APP_PATH"

echo "==> [4/9] Re-signing nested binaries (inside-out, hardened runtime)"
find "$APP_PATH/Contents" -type f \
    \( -name "*.dylib" -o -name "*.so" \) \
    -exec codesign --force --options runtime --timestamp \
        --sign "$SIGN_APP" {} \; 2>/dev/null || true

echo "==> [5/9] Signing main app bundle (hardened runtime + timestamp + entitlements)"
codesign --force --options runtime --timestamp \
    --entitlements "$ENTITLEMENTS" \
    --sign "$SIGN_APP" \
    "$APP_PATH"

echo "==> [6/9] Verifying app signature"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"
codesign --display --verbose=2 "$APP_PATH" 2>&1 \
    | grep -E "Authority|Identifier=|TeamIdentifier|Runtime Version|flags=" || true

echo "==> [7/9] Creating DMG (drag-to-Applications layout)"
rm -f "$DMG_OUTPUT"
TMP_DMG_DIR=$(mktemp -d)
cp -R "$APP_PATH" "$TMP_DMG_DIR/"
ln -s /Applications "$TMP_DMG_DIR/Applications"
hdiutil create \
    -volname "OpenGnothia" \
    -srcfolder "$TMP_DMG_DIR" \
    -ov \
    -format UDZO \
    "$DMG_OUTPUT"
rm -rf "$TMP_DMG_DIR"

echo "==> Signing the DMG"
codesign --force --sign "$SIGN_APP" --timestamp "$DMG_OUTPUT"

echo "==> [8/9] Submitting for notarization (this can take 1-5 minutes)"
xcrun notarytool submit "$DMG_OUTPUT" \
    --keychain-profile "$NOTARY_PROFILE" \
    --wait

echo "==> [9/9] Stapling notarization ticket"
xcrun stapler staple "$DMG_OUTPUT"
xcrun stapler validate "$DMG_OUTPUT"

echo ""
echo "--- Final verification ---"
spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG_OUTPUT" || true

SIZE=$(du -h "$DMG_OUTPUT" | awk '{print $1}')

echo ""
echo "Build complete."
echo "DMG: $DMG_OUTPUT (${SIZE})"
echo "This DMG is signed with Developer ID, notarized by Apple, and stapled."
echo "It is ready to be uploaded to your website for direct download."
