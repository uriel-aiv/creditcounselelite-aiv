#!/usr/bin/env bash
# Render one film to a delivery MP4: picture -> SFX from the film's HITS -> mix (-14 LUFS) -> copy.
# Usage: ./render-film.sh <film-dir> <delivery-name.mp4> [out-dir] [sfx-db]
#   sfx-db: SFX level under the voice; -9 for podcast clips (default), -12 for VSLs (they carry their own music bed)
#   e.g. ./render-film.sh cce-brandnative cce_17-brand-native_split_v04_720p.mp4
# Output format for all CCE tests: 720x1280, 23.976 fps (the footage rate), H.264 + AAC, 59 s.
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"; FILM="${1:?film dir}"; NAME="${2:?delivery file name}"; DEST="${3:-$KIT/deliveries}"; SFXDB="${4:--9}"
cd "$KIT/films"
node ../tools/render.mjs --film "$FILM" --hits >/dev/null
node ../tools/sfx.mjs "$FILM"
node ../tools/render.mjs --film "$FILM" --format 720x1280 --fps 23.976023976 --video-only
node ../tools/mix.mjs "$FILM" --sfx-db "$SFXDB"
mkdir -p "$DEST" && cp "out/$FILM/final.mp4" "$DEST/$NAME"
ffprobe -v error -show_entries format=duration:stream=codec_name -of csv=p=0 "$DEST/$NAME"
echo "-> $DEST/$NAME"
