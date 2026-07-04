#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_TAURI="$PROJECT_ROOT/src-tauri"
PROFILE="$SRC_TAURI/embedded.provisionprofile"
ENTITLEMENTS="$SRC_TAURI/Entitlements.MAS.plist"
SIGN_APP="3rd Party Mac Developer Application: Emirhan Durusoy (TBV5TAGQ74)"
SIGN_PKG="3rd Party Mac Developer Installer: Emirhan Durusoy (TBV5TAGQ74)"

APP_NAME="OpenGnothia.app"
BUNDLE_DIR="$SRC_TAURI/target/universal-apple-darwin/release/bundle/macos"
APP_PATH="$BUNDLE_DIR/$APP_NAME"
PKG_OUTPUT="$PROJECT_ROOT/OpenGnothia-MAS.pkg"

echo "==> [1/7] Checking prerequisites"
[[ -f "$PROFILE" ]] || { echo "FAIL: missing $PROFILE"; exit 1; }
[[ -f "$ENTITLEMENTS" ]] || { echo "FAIL: missing $ENTITLEMENTS"; exit 1; }
security find-identity -p codesigning -v | grep -q "3rd Party Mac Developer Application" \
    || { echo "FAIL: app signing identity not in keychain"; exit 1; }
security find-identity -v | grep -q "3rd Party Mac Developer Installer" \
    || { echo "FAIL: installer signing identity not in keychain"; exit 1; }

echo "==> [2/7] Building universal binary with Tauri (Mac App Store config)"
cd "$PROJECT_ROOT"
pnpm tauri build \
    --config src-tauri/tauri.mas.conf.json \
    --target universal-apple-darwin

[[ -d "$APP_PATH" ]] || { echo "FAIL: .app not found at $APP_PATH"; exit 1; }

echo "==> [3/7] Embedding provisioning profile"
cp "$PROFILE" "$APP_PATH/Contents/embedded.provisionprofile"
# Strip extended attributes (e.g. com.apple.quarantine from browser downloads)
# App Store rejects bundles containing quarantine xattrs
xattr -cr "$APP_PATH"

echo "==> [4/7] Re-signing nested binaries (inside-out)"
find "$APP_PATH/Contents" -type f \
    \( -name "*.dylib" -o -name "*.so" \) \
    -exec codesign --force --options runtime \
        --sign "$SIGN_APP" {} \; 2>/dev/null || true

echo "==> [5/7] Signing main app bundle with entitlements"
codesign --force --options runtime \
    --entitlements "$ENTITLEMENTS" \
    --sign "$SIGN_APP" \
    "$APP_PATH"

echo "==> [6/7] Verifying app signature and entitlements"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"
echo "--- Embedded entitlements ---"
codesign --display --entitlements :- "$APP_PATH"

echo "==> [7/7] Building signed .pkg installer"
rm -f "$PKG_OUTPUT"
productbuild --component "$APP_PATH" /Applications \
    --sign "$SIGN_PKG" \
    "$PKG_OUTPUT"

echo "--- PKG signature check ---"
pkgutil --check-signature "$PKG_OUTPUT"

echo ""
echo "Build complete."
echo "PKG: $PKG_OUTPUT"
echo "Next: open Transporter.app and upload this file."
