#!/usr/bin/env bash
# Take an App Store ready screenshot of the running OpenGnothia window.
# Output: 2880x1800 PNG (Retina) — guaranteed accepted by App Store Connect.
# Usage: ./scripts/capture-screenshot.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTDIR="$HOME/Desktop/opengnothia-screenshots"
mkdir -p "$OUTDIR"

# Target logical size (will become 2x on Retina)
W=1440
H=900
X=100
Y=100

# Step 1: resize app window to exactly W x H at (X, Y)
echo "==> Resizing OpenGnothia window to ${W}x${H} at (${X},${Y})..."
"$SCRIPT_DIR/resize-window.sh" "$W" "$H" >/dev/null

# Reposition (resize script positions to 100,100 by default but make sure)
PROCNAME=$(osascript -e 'tell application "System Events" to set procs to name of every process' \
    | tr ',' '\n' | sed 's/^ *//' | grep -i opengnothia | head -1)

osascript <<EOF >/dev/null
tell application "System Events"
    tell process "$PROCNAME"
        set frontmost to true
        delay 0.3
        set position of front window to {$X, $Y}
        set size of front window to {$W, $H}
    end tell
end tell
EOF

sleep 0.8  # give the window a moment to settle

# Step 2: capture exact rectangle (X, Y, W, H) — on Retina this is 2*W x 2*H pixels
DEST="$OUTDIR/screenshot-$(date +%Y%m%d-%H%M%S).png"
echo "==> Capturing region ${W}x${H} at (${X},${Y}) to $DEST..."
screencapture -R "${X},${Y},${W},${H}" -t png "$DEST"

# Step 3: verify dimensions
PW=$(sips -g pixelWidth "$DEST" 2>/dev/null | awk '/pixelWidth/ {print $2}')
PH=$(sips -g pixelHeight "$DEST" 2>/dev/null | awk '/pixelHeight/ {print $2}')
echo "==> Raw capture: ${PW}x${PH}"

# Step 4: force exact 2880x1800 if anything is off
if [[ "$PW" != "2880" || "$PH" != "1800" ]]; then
    echo "==> Resizing to exact 2880x1800 with sips..."
    sips --resampleHeightWidth 1800 2880 "$DEST" >/dev/null
    PW=$(sips -g pixelWidth "$DEST" | awk '/pixelWidth/ {print $2}')
    PH=$(sips -g pixelHeight "$DEST" | awk '/pixelHeight/ {print $2}')
fi

echo ""
echo "Done."
echo "File: $DEST"
echo "Dimensions: ${PW}x${PH}"
