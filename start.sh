#!/bin/bash
# Start script for chickens

PROJECT_NAME="chickens"
PID_FILE="/tmp/${PROJECT_NAME}.pid"
PORT=5177

cd "$(dirname "$0")"

# Stop existing if running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping existing $PROJECT_NAME (PID: $OLD_PID)..."
        kill "$OLD_PID"
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# Start Python HTTP server on port 5177
nohup python3 -m http.server $PORT > /dev/null 2>&1 &
NEW_PID=$!
echo $NEW_PID > "$PID_FILE"

echo "$PROJECT_NAME started (PID: $NEW_PID, Port: $PORT)"
