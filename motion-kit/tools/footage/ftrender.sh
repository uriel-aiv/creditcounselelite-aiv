#!/usr/bin/env bash
# Render a footage-test film: hits -> SFX -> 720x1280 picture -> mix -> deliveries/<name>
# Usage (from motion-kit/): tools/footage/ftrender.sh <film-dir> <delivery-name.mp4> [sfx-db, -12 for VSLs with their own music]
set -euo pipefail
KIT="$(cd "$(dirname "$0")/../.." && pwd)"; F=$1; N=$2; DB=${3:--10}
cd "$KIT/films"
node ../tools/render.mjs --film $F --hits >/dev/null
node ../tools/sfx.mjs $F >/dev/null
node ../tools/render.mjs --film $F --format 720x1280 --fps 23.976023976 --video-only >/dev/null
node ../tools/mix.mjs $F --sfx-db $DB >/dev/null
mkdir -p "$KIT/deliveries" && cp out/$F/final.mp4 "$KIT/deliveries/$N"
echo "DONE $N $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$KIT/deliveries/$N")"
