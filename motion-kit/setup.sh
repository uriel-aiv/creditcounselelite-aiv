#!/usr/bin/env bash
# One-time setup for the CCE code motion kit.
# Usage: ./setup.sh /path/to/highlights_1x1.mp4
#   (in the team's shared folder: $CCE_ROOT/highlights/highlights_1x1.mp4)
# Needs: node 18+, ffmpeg/ffprobe, python3 with Pillow (only for the tools/*fx.py asset scripts).
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"; SRC="${1:?give the path to highlights_1x1.mp4}"
command -v ffmpeg >/dev/null || { echo "ffmpeg is missing"; exit 1; }
cd "$KIT" && npm ci
npx playwright install chromium || echo "WARNING: Chromium download failed; fine if a matching browser is already installed (e.g. PLAYWRIGHT_BROWSERS_PATH)"
# founder footage -> JPEG frames the films read (1080x1080, 23.976 fps, f_00001.jpg ...). Not committed (large).
mkdir -p "$KIT/footage"
ffmpeg -v error -y -i "$SRC" -q:v 2 "$KIT/footage/f_%05d.jpg"
echo "frames: $(ls "$KIT/footage" | wc -l)  (the films expect 1358)"
# audio stems for mix.mjs: voice = the footage audio padded to 59 s; music = 59 s of silence (no music bed in these tests)
for d in "$KIT"/films/cce-*/; do
  mkdir -p "$d/audio"
  ffmpeg -v error -y -i "$SRC" -vn -ar 48000 -ac 2 -af apad -t 59 "$d/audio/vo.wav"
  ffmpeg -v error -y -f lavfi -i anullsrc=r=48000:cl=stereo -t 59 "$d/audio/music.wav"
done
echo "setup done"
