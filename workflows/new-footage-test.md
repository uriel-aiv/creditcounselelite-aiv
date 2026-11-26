# New footage test — from a raw clip to the AIVideo canvas

Purpose: the full, ordered process to turn a new CCE founder clip into a finished motion test in any style, at the approved quality, and file it where the team expects it.
Owner: CCE creative lead (reviews every delivery). Source: the CCE code motion tests, Nov 19–25 2026. Last updated: 2026-11-25.

**Inputs:** a founder clip (podcast cut or VSL cutdown), the chosen style, `$CCE_ROOT` (the team's shared CCE folder).
**Outputs:** `cce_<NN>-<style>_footage-<clip>_vNN_720p.mp4` in `$CCE_ROOT/motion-tests/footage-tests/` and `.../for-aivideo-latest/`, a row on the AIVideo canvas, and updated docs in this repo.

## 0. Setup (once per machine)
```bash
cd motion-kit
npm ci && npx playwright install chromium          # renderer (node 18+)
pip install -r requirements.txt                    # python tools (whisper, opencv, rembg, pymatting, scipy, Pillow)
export CCE_ROOT=~/CCE                              # your copy of the shared folder; never write personal paths into the repo
export FT_SRC="$CCE_ROOT/footage-tests"            # raw clips, named like 11_video03.mp4
```
Also needed: ffmpeg/ffprobe. For an existing footage film, rebuild its founder frames with step 2 (frames and audio are not committed).

## 1. Choose the clip and check it
- Podcast cuts (horizontal, Brandon in a single or side-by-side shot) or VSL cutdowns (vertical, burned-in captions and b-roll).
- Skip clips that claim removals, guaranteed outcomes or anything credit-repair (`../business/compliance-and-legal.md`).
- Name it `<NN>_<clipname>.mp4` (NN = the style number it is for, `r2` for a second round) in `$FT_SRC`.

## 2. Prepare the founder track (run in `motion-kit/footage-tests/`)
The tools read and write `shots.json`, `faces.json` and `<clip>.words.json` in the current folder.
```bash
cd motion-kit/footage-tests
python3 ../tools/footage/tr.py          # word timings for every clip in $FT_SRC -> <clip>.words.json (faster-whisper)
python3 ../tools/footage/shots.py       # cuts + thumbnails -> shots.json, shots_<clip>.png   (look at every shot)
python3 ../tools/footage/faces.py       # Brandon's face per shot -> faces.json
# add the clip to CFG in tools/footage/prep.py (offset to skip a title card; SPLIT for side-by-side shots;
# VSL_CROP_BY / VSL_TRACK for VSLs whose captions sit elsewhere or where he moves)
python3 ../tools/footage/prep.py <clip> # -> footage-tests/<clip>/{footage/, audio/vo.wav, words.json, plan.json}
cp <clip>.words.json <clip>/raw.words.json
```
- Podcast crops: square ≈ 3.4x the face box, face at 36% from the top; side-by-side shots stay inside the source's white frame lines. Host-only shots become motion-only moments.
- VSL crops stay above the burned captions; check a 4 fps sheet for spans where graphics cover the face (those become motion-only). Never show a VSL founder full screen.
- To rebuild an existing clip: `cp <clip>/raw.words.json <clip>.words.json && python3 ../tools/footage/prep.py <clip>`.

## 3. Make the film
```bash
cd motion-kit
python3 tools/footage/mkft.py films/<newest film of the style> <clip> films/cce-ftNN-<style>
```
Then follow the style's playbook in `../motion-kit/styles/` (it says which film to copy and how to write the scenes). For every style:
1. Fix mishears in `films/<film>/assets/words.json` (and strip "$").
2. Set `END`, `SRC_FRAMES` (from `plan.json`), `FH_KEYS` (layout), the claim window, `HITS`.
3. Write the scenes: one specific visual per spoken idea, landing on its word.
4. If the style needs generated art (19, 20; sometimes 09, 11, 12), generate it in AIVideo with the prompts in `../prompts/` — **say the cost first, images only, never video unless asked** — and process it with the style's tools.

## 4. Check, render, QA
```bash
./stills.sh cce-ftNN-<style> 0.5,2.1,4.8,...        # every beat; look at all of them (the first can be a warm-up glitch)
tools/footage/ftrender.sh cce-ftNN-<style> cce_<NN>-<style>_footage-<clip>_v01_720p.mp4 -9    # -12 for VSLs
```
Run `motion-qa-checklist.md` on the encoded MP4 (2–4 fps contact sheet, read every frame). Fix and re-render until clean.

## 5. Deliver
- Copy to `$CCE_ROOT/motion-tests/footage-tests/` **and** `$CCE_ROOT/motion-tests/footage-tests/for-aivideo-latest/` (the folder the creative lead drags into AIVideo). Never overwrite: every change is a new `_vNN_`.
- From a Claude cloud session: `SendUserFile` the MP4, then `device_commit_files` with the returned **fileUuid** to the same folder (a stagedPath fails for large files).
- Reply with what changed in a few lines and where the file is.

## 6. Organise the AIVideo canvas (project "Final CCE Directions" `29c40ecf12724d03bec9c2e5cada7c31`)
- The creative lead uploads the files (drag and drop); the files land in the "New Videos" folder.
- Each style has a frame titled `<NN> <Style> · Footage tests · <Claude code motion only | Image gen + Claude motion>`, frames stacked down the board (x = -24, each new frame below the last). Inside: one column per clip, a bold 22 px title `<Clip name> (<Video N | VSL #N>) · <seconds>s` and the video node (360x640) below it, columns 400 px apart.
- Never replace existing nodes: add improved versions as new nodes or frames titled "(V2)". Use the newest upload if a file was uploaded twice (`_1`), and tell the lead which duplicate can go.

## 7. Record it in the repo
- New feedback → `code-motion-tests.md` (rules history) and the style's playbook (current state).
- New prompts → `../prompts/`.
- Version table → `../motion-kit/README.md`.
- Copy the film into `motion-kit/films/` (no footage, no audio), commit and push to the working branch. Never write personal machine paths.

## QA checklist
`motion-qa-checklist.md`, plus the "Extra QA" lines in the style's playbook.
