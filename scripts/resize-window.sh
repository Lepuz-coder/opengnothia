#!/usr/bin/env bash
# Resize the running OpenGnothia window to App Store screenshot size.
# Usage: ./scripts/resize-window.sh [width height]
# Default: 1440x900  → 2880x1800 PNG on Retina (App Store accepted size)

WIDTH="${1:-1440}"
HEIGHT="${2:-900}"

echo "Finding OpenGnothia process..."
PROCNAME=$(osascript -e '
tell application "System Events"
    set procs to name of every process
end tell
return procs
' | tr ',' '\n' | sed 's/^ *//' | grep -i opengnothia | head -1)

if [[ -z "$PROCNAME" ]]; then
    echo "ERROR: OpenGnothia process not found."
    echo "Launch the app first:"
    echo "  open /Users/emirhan/Desktop/opengnothia/src-tauri/target/universal-apple-darwin/release/bundle/macos/OpenGnothia.app"
    exit 1
fi

echo "Process: $PROCNAME"
echo "Resizing to ${WIDTH}x${HEIGHT}..."

osascript <<EOF
tell application "System Events"
    tell process "$PROCNAME"
        set frontmost to true
        delay 0.3
        set position of front window to {100, 100}
        set size of front window to {$WIDTH, $HEIGHT}
    end tell
end tell
EOF

echo "Done. Take screenshot with: Cmd+Shift+4, Space, hold Option, click window."
