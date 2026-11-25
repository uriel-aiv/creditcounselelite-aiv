# Make <film>-brand copies: brand fonts (Anton = Display, Poppins = UI), brand kit, brand captions/end card, palette swaps.
import os
FILMS = os.environ.get('CCE_FILMS', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'films'))  # motion-kit/films
import os, re, shutil, subprocess, sys
ROOT = FILMS; POP = os.environ.get('POPPINS_DIR', 'fonts/poppins/'); ANTON = ROOT + '/cce-moneygreen/fonts/display.woff2'
PAL = {
 'cce-diagrams': [("blue: '#1150C2'", "blue: '#004AAD'"), ("ink: '#151515'", "ink: '#000000'")],
 'cce-bricks': [("red: '#E0303F'", "red: '#004AAD'"), ("yellow: '#F4CB2F'", "yellow: '#CB9938'"), ("red: 0xC4131F", "red: 0x7A0A0A"), ("blue: 0x0B57C2", "blue: 0x004AAD"), ("yellow: 0xF5C21A", "yellow: 0xCB9938"),
                ("green: 0x26893B", "green: 0x266235"), ("gold: 0xE2A21C", "gold: 0xCB9938"), ("sky: 0x5DB8E6", "sky: 0xADC8E3"), ("navy: 0x1D3A6E", "navy: 0x114BA7")],
 'cce-moneygreen': [("bg: '#0E5634', bg2: '#0A4429', mint: '#86F5B8', mintHi: '#C9FFE0', dim: '#2E7D52', white: '#EAF6EF', orange: '#F0682A', capBg: '#0A3A24'",
                     "bg: '#004AAD', bg2: '#003A8A', mint: '#ADC8E3', mintHi: '#FFFFFF', dim: '#2F64B8', white: '#F4F7FB', orange: '#CB9938', capBg: '#000000'"), ("'#12663E'", "'#1557B8'"), ("rgba(160,255,200,0.05)", "rgba(173,200,227,0.05)")],
 'cce-desktop': [("sel: '#2F6BEE'", "sel: '#004AAD'"), ("g.addColorStop(0, '#071A3D'); g.addColorStop(0.5, '#062B6F'); g.addColorStop(1, '#020C22');", "g.addColorStop(0, '#00163A'); g.addColorStop(0.5, '#004AAD'); g.addColorStop(1, '#000000');"),
                 ("rgba(47,107,238,", "rgba(0,74,173,"), ("'#FF9F0A'", "'#CB9938'"), ("if (m === 18 && t > 16.95) { const kc = clamp(sp(t, 16.95, SPRING.bouncy)); ctx.fillStyle = '#E5484D';", "if (m === 18 && t > 16.95) { const kc = clamp(sp(t, 16.95, SPRING.bouncy)); ctx.fillStyle = '#004AAD';")],
 'cce-oddone': [("blue: '#1F6BFF', glow: '#3D86FF'", "blue: '#004AAD', glow: '#3A78D6'"), ("if (fill > 0.001) { ctx.fillStyle = C.white;", "if (fill > 0.001) { ctx.fillStyle = C.blue;"),
                ("ctx.save(); ctx.fillStyle = C.white;\n  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a1", "ctx.save(); ctx.fillStyle = C.blue;\n  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a1"),
                ("ctx.fillStyle = C.white; ctx.fillRect(715", "ctx.fillStyle = C.blue; ctx.fillRect(715"), ("const lvl = 1 - drain; ctx.fillStyle = C.white;", "const lvl = 1 - drain; ctx.fillStyle = C.blue;"),
                ("ctx.clip(); ctx.fillStyle = C.white; const h = 2 * rr * drain;", "ctx.clip(); ctx.fillStyle = C.blue; const h = 2 * rr * drain;"), ("ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText('0%'", "ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.fillText('0%'")],
 'cce-vox': [("pen: '#2547D9', yellow: '#F6E43C'", "pen: '#004AAD', yellow: '#CB9938'"), ("rgba(246,228,60,0.85)", "rgba(203,153,56,0.7)")],
 'cce-soft': [("const B = { royal: [31, 79, 216], sky: [110, 190, 240], teal: [22, 160, 152], navy: [20, 40, 100], peri: [130, 150, 240], ice: [190, 225, 250], cyan: [40, 190, 220] };",
               "const B = { royal: [0, 74, 173], sky: [173, 200, 227], teal: [0, 140, 150], navy: [17, 75, 167], peri: [110, 140, 210], ice: [214, 228, 242], cyan: [0, 140, 150] };"),
              ("'rgb(31,79,216)'", "'rgb(0,74,173)'"), ("ctx.font = font(size, italic ? 300 : 600, UI);", "ctx.font = font(size, 400, 'Display');")],
 'cce-retroos': [("blue: '#0B4DB0', blue2: '#083E91', cream: '#F1ECDD'", "blue: '#004AAD', blue2: '#003A8A', cream: '#F4F6FA'")],
 'cce-board': [("felt: '#1E4A3A', board: '#D4EAD3'", "felt: '#0A0A0A', board: '#E6EEF7'"), ("card: '#F6A43A', gold: '#E8B530'", "card: '#CB9938', gold: '#CB9938'"),
               ("const G = { brown: '#8A4B2B', lblue: '#9FD6F2', pink: '#D93D8F', orange: '#F28B26', red: '#E0241B', yellow: '#F6DC33', green: '#1E9C4A', dblue: '#1F4BAA' };",
                "const G = { brown: '#6B0505', lblue: '#ADC8E3', pink: '#008C96', orange: '#CB9938', red: '#9C1C1C', yellow: '#E2C887', green: '#266235', dblue: '#004AAD' };"),
               ("x.fillStyle = G.red; x.fillRect(-520", "x.fillStyle = '#004AAD'; x.fillRect(-520"), ("const STOCK = { yellow: '#EED67C', orange: '#F0A35C' };", "const STOCK = { yellow: '#E2C887', orange: '#ADC8E3' };"),
               ("pawn(ctx, tk.pos[0], tk.pos[1], tk.lift, '#1E3A8A',", "pawn(ctx, tk.pos[0], tk.pos[1], tk.lift, '#004AAD',"), ("'#16A39A', 0.85", "'#008C96', 0.85")],
}
def make(f):
    src, dst = f'{ROOT}/{f}', f'{ROOT}/{f}-brand'
    if os.path.exists(dst): shutil.rmtree(dst)
    shutil.copytree(src, dst, symlinks=True, ignore=shutil.ignore_patterns('*.bak'))
    # fonts
    shutil.copy(ANTON, f'{dst}/fonts/display.woff2')
    for w in (400, 500, 600, 700): shutil.copy(f'{POP}poppins-latin-{w}-normal.woff2', f'{dst}/fonts/poppins-{w}.woff2')
    h = open(f'{dst}/index.html').read()
    h = re.sub(r"\s*@font-face \{ font-family: UI;[^}]*\}", "", h)
    h = re.sub(r"\s*@font-face \{ font-family: Card;[^}]*\}", "", h)
    h = re.sub(r"\s*@font-face \{ font-family: Display; src: url\(fonts/display-italic[^}]*\}", "", h)
    faces = ''.join(f"\n  @font-face {{ font-family: {fam}; src: url(fonts/poppins-{w}.woff2) format('woff2'); font-weight: {w}; }}" for fam in ('UI', 'Card') for w in (400, 500, 600, 700))
    h = h.replace('<style>', '<style>' + faces, 1)
    open(f'{dst}/index.html', 'w').write(h)
    # harness hook + kit
    m = open(f'{dst}/lib/motion.js').read()
    if '__after' not in m: m = m.replace("    draw(ctx, U(t), t, IMG);\n", "    draw(ctx, U(t), t, IMG);\n    if (window.__after) { ctx.setTransform(1, 0, 0, 1, 0, 0); window.__after(ctx, t, IMG); }\n", 1)
    open(f'{dst}/lib/motion.js', 'w').write(m)
    shutil.copy(f'{ROOT}/tools/brand.js', f'{dst}/lib/brand.js')
    s = open(f'{dst}/film.js').read()
    s = s.replace("import * as M from './lib/motion.js';", "import * as M from './lib/motion.js';\nimport * as BR from './lib/brand.js';", 1)
    s = s.replace("function captions(ctx, t, fh) {", "function captionsOld(ctx, t, fh) {", 1)
    s += "\n// brand captions (black overlay, Poppins) — CCE Brand Style Guidelines 2025\nfunction captions(ctx, t, fh) { BR.captions(ctx, t, fh, CAPS); }\n"
    for a, b in PAL.get(f, []):
        if a not in s: print('  MISSING', f, a[:60]); continue
        s = s.replace(a, b)
    open(f'{dst}/film.js', 'w').write(s)
    j = open(f'{dst}/film.json').read(); j = re.sub(r'"title": "([^"]*)"', r'"title": "\1 (Brand)"', j); open(f'{dst}/film.json', 'w').write(j)
    print('ok', f)
for f in sys.argv[1:]: make(f)
