#!/bin/sh
set -e

if command -v lsof >/dev/null 2>&1; then
  PIDS=$(lsof -ti:3000 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null || true
  fi
fi

# Stop orphaned Next.js server processes without matching this script.
for pattern in "node.*\\.bin/next dev" "next-server \\(v"; do
  PIDS=$(pgrep -f "$pattern" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    kill -9 $PIDS 2>/dev/null || true
  fi
done

sleep 1
rm -rf .next
exec next dev -p 3000
