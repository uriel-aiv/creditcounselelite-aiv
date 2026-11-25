# build a pixel film from the 19 engine: python3 build.py <film-dir> <scenes.js> <title>
import sys, re
film, scenes, title = sys.argv[1:4]
base = open('films/cce-ft19-pixel/film.js').read()
sc = open(scenes).read()
ex = open('tools/pixel/extras.js').read()
def cut(s, a, b, new):
    i = s.index(a); j = s.index(b, i); return s[:i] + new + s[j:]
s = base
s = re.sub(r"^// CCE — \"19 Pixel Wealth\".*?\nimport", "// CCE — " + title + " (19 Pixel Wealth engine, see cce-ft19-pixel). Pure function of time.\nimport", s, count=1, flags=re.S)
s = s.replace("for (const n of ['penthouse', 'vault', 'airfield', 'villa']) {", "for (const n of ROOMS) {")
# scene block (timeline .. layout) + layout/hits replaced by the scene file's own
s = cut(s, "// ================================================================== timeline (seconds; Video 3 word timings)", "// ================================================================== captions", ex + "\n" + sc + "\n")
s = s.replace("  images: { badge: 'assets/badge.png', penthouse: 'assets/bg/penthouse.png', vault: 'assets/bg/vault.png', airfield: 'assets/bg/airfield.png', villa: 'assets/bg/villa.png' },",
              "  images: { badge: 'assets/badge.png', ...Object.fromEntries(ROOM_FILES.map((n) => [n, `assets/bg/${n}.png`])) },")
s = s.replace("    for (const n of ['penthouse', 'vault', 'airfield', 'villa']) if (!BG[n] && IMG[n]) BG[n] = IMG[n];\n    if (!AMB.villa && BG.villa) buildAmbient();",
              "    for (const n of ROOM_FILES) if (!BG[n] && IMG[n]) BG[n] = IMG[n];\n    if (!AMB.__done && ROOMS.every((n) => BG[n])) { buildAmbient(); if (BG.office) findBoxes(); AMB.__done = 1; }")
s = s.replace("  SPR.bubble = toCanvas(bubble(26, 16));", "  buildExtras(); SPR.bubble = toCanvas(bubble(26, 16));")
s = s.replace("const SRC_FPS = 24000 / 1001, SRC_FRAMES = 478;", "const SRC_FPS = 24000 / 1001, SRC_FRAMES = __SRC_FRAMES__;")
s = s.replace("    const dk = P(t, 2.75, 3.0) * (1 - P(t, END - 0.2, END));\n    if (dk > 0.01) { ctx.globalAlpha = 0.9 * dk; ctx.fillStyle = 'rgba(10,8,30,0.75)'; ctx.fillRect(300, Y(858) - 22, 480, 34); ctx.globalAlpha = dk; ctx.font = font(22, 500, UI); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Individual results vary. Education only.', 540, Y(858)); ctx.globalAlpha = 1; }",
              "    const dk = P(t, DISC[0], DISC[0] + 0.25) * (1 - P(t, END - 0.2, END)), dy = fh < SEAM ? 1560 : Y(858);\n    if (dk > 0.01) { ctx.globalAlpha = 0.9 * dk; ctx.fillStyle = 'rgba(10,8,30,0.75)'; ctx.fillRect(300, dy - 22, 480, 34); ctx.globalAlpha = dk; ctx.font = font(22, 500, UI); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText('Individual results vary. Education only.', 540, dy); ctx.globalAlpha = 1; }")
m = re.search(r"//SRC_FRAMES=(\d+)", sc); s = s.replace("__SRC_FRAMES__", m.group(1))
for k in ["ROOMS", "DISC", "buildHits", "camAt", "mosaicAt", "drawPixels", "const END", "FH_KEYS", "FULL_WINDOWS"]: assert k in s, k
open(film + '/film.js', 'w').write(s)
print('ok', len(s))
