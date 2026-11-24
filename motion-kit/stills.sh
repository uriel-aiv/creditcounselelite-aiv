#!/usr/bin/env bash
# QA stills before any full render. Usage: ./stills.sh <film-dir> 3.5,10.2,17.8,23.5,35.6,44.1,54.6
# -> films/out/<film>/stills/t<time>_9x16.png  (look at every one before rendering)
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT/films"
node ../tools/render.mjs --film "${1:?film dir}" --format 9x16 --at "${2:?comma separated seconds}" --noblur
