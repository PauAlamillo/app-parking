#!/bin/sh
BASE="/home/cerebrumpocket/tmp-app-parking-partner/app"
LOG="$BASE/data/watchdog.log"
while true; do
  if ! curl -fsS --max-time 2 http://127.0.0.1:18971/api/health >/dev/null 2>&1; then
    printf '%s app down; restarting\n' "$(date -Is)" >> "$LOG"
    cd "$BASE" || exit 1
    nohup python3 -m uvicorn server:app --host 127.0.0.1 --port 18971 >> "$BASE/data/app.log" 2>&1 &
    sleep 3
  fi
  sleep 20
done
