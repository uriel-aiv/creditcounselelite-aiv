// CCE brand kit for the motion tests (from CCE Brand Style Guidelines 2025).
// Corporate: blue #004AAD (main), black, white. Accents: light blue #ADC8E3, gold #CB9938.
// 0% Capital Playbook: blue #114BA7, maroon #6B0505, green #266235, teal #008C96 (sampled from the swatches).
// Fonts: ANTON for headers, always ALL CAPS (family "Display"); Poppins for body (family "UI").
// Rules: the official logo sits on black; titles in corporate colours only; text over images gets a black overlay.
import * as M from './motion.js';

export const BRAND = { blue: '#004AAD', black: '#000000', white: '#FFFFFF', light: '#ADC8E3', gold: '#CB9938', pbBlue: '#114BA7', maroon: '#6B0505', green: '#266235', teal: '#008C96' };

// Anton is a caps-only header face in this brand: uppercase anything drawn in the Display family.
{
  const P = CanvasRenderingContext2D.prototype, up = (ctx, s) => (/Display/.test(ctx.font) ? String(s).toUpperCase() : s);
  const ft = P.fillText, st = P.strokeText, mt = P.measureText;
  P.fillText = function (s, ...a) { return ft.call(this, up(this, s), ...a); };
  P.strokeText = function (s, ...a) { return st.call(this, up(this, s), ...a); };
  P.measureText = function (s) { return mt.call(this, up(this, s)); };
}

const DH = 1920, SEAM = 980;
// 0% Capital Playbook step colours as a small detail: Foundation, Fix, Build, Leverage (0.35s crossfade)
const STEPS = [[0, [17, 75, 167]], [7.0, [107, 5, 5]], [12.3, [38, 98, 53]], [32.35, [0, 140, 150]]];
export function stepColor(t) {
  let i = 0; while (i + 1 < STEPS.length && t >= STEPS[i + 1][0]) i++;
  const c = STEPS[i][1], p = i ? STEPS[i - 1][1] : c, k = i ? M.clamp((t - STEPS[i][0]) / 0.35) : 1;
  return `rgb(${c.map((v, j) => Math.round(M.lerp(p[j], v, k))).join(',')})`;
}
// captions: white Poppins on a black overlay pill with a thin brand-blue rule
export function captions(ctx, t, fh, CAPS) {
  if (t > 56.6) return;
  const fs = M.clamp((fh - SEAM) / (DH - SEAM)), sy = DH - fh;
  const c = CAPS.find((c) => t >= c.start - 0.04 && t < c.until);
  if (!c) return;
  const f = M.clamp((fh - SEAM) / (DH - SEAM)), y = M.lerp(DH - fh, 1600, f);
  const k = Math.max(0, Math.min(1.06, M.spring(t - c.start + 0.04, { stiffness: 420, damping: 26 })));
  const text = c.text.length > 1 && c.text === c.text.toUpperCase() ? c.text.charAt(0) + c.text.slice(1).toLowerCase() : c.text;
  ctx.save(); ctx.font = M.font(46, 600, 'UI'); ctx.letterSpacing = '0px'; const w = ctx.measureText(text).width + 64;
  ctx.translate(540, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,0.8)'; M.rrect(ctx, -w / 2, -44, w, 88, 14); ctx.fill();
  ctx.fillStyle = BRAND.blue; ctx.fillRect(-w / 2 + 22, 30, w - 44, 5);
  ctx.fillStyle = BRAND.white; ctx.textAlign = 'center'; ctx.fillText(text, 0, 14); ctx.restore();
}

// end card: the official metal logo on black, ANTON title in corporate colours, Poppins line + disclaimer
export function endCard(ctx, t, IMG) {
  if (t < 56.6) return;
  const S = ctx.canvas.width / 1080, a = M.clamp((t - 56.6) / 0.2);
  ctx.save(); ctx.setTransform(S, 0, 0, S, 0, 0);
  ctx.globalAlpha = a; ctx.fillStyle = BRAND.black; ctx.fillRect(0, 0, 1080, 1920);
  const g = ctx.createRadialGradient(540, 760, 40, 540, 760, 700); g.addColorStop(0, 'rgba(0,74,173,0.35)'); g.addColorStop(1, 'rgba(0,74,173,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);
  ctx.globalAlpha = 1;
  const k = t < 56.9 ? 0 : M.clamp(M.spring(t - 56.9, { stiffness: 200, damping: 16 }), 0, 1.08);
  if (IMG.badge && k > 0.01) { const s = 560 * M.lerp(0.8, 1, Math.min(1, k)), ar = IMG.badge.height / IMG.badge.width; ctx.save(); ctx.globalAlpha = M.clamp(k * 2); ctx.drawImage(IMG.badge, 540 - s / 2, 760 - s * ar / 2, s, s * ar); ctx.restore(); }
  const ta = M.clamp((t - 57.25) / 0.35), ty = (1 - M.E.outCubic(ta)) * 30;
  ctx.globalAlpha = ta; ctx.textAlign = 'center'; ctx.font = M.font(96, 400, 'Display'); ctx.letterSpacing = '2px';
  ctx.fillStyle = BRAND.white; ctx.fillText('Learn the', 540, 1180 + ty); ctx.fillStyle = BRAND.blue; ctx.fillText('Playbook', 540, 1285 + ty);
  ctx.letterSpacing = '0px'; ctx.globalAlpha = M.clamp((t - 57.6) / 0.35); ctx.font = M.font(34, 500, 'UI'); ctx.fillStyle = BRAND.light; ctx.fillText('creditcounselelite.com', 540, 1370);
  ctx.globalAlpha = M.clamp((t - 57.9) / 0.35) * 0.7; ctx.font = M.font(22, 500, 'UI'); ctx.fillStyle = BRAND.white; ctx.fillText('Education and coaching. Not a lender. Individual results vary.', 540, 1690);
  ctx.restore();
}
if (typeof window !== 'undefined') window.__after = endCard;
