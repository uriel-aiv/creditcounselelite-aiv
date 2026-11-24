import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
await p.goto('file://' + process.argv[2]); await p.waitForTimeout(400);
for (const t of process.argv.slice(4)) { await p.evaluate(() => document.getElementById('play').click()); await p.evaluate((t) => window.seek(+t), t); await p.screenshot({ path: `${process.argv[3]}_${t}.png`, fullPage: true }); await p.evaluate(() => document.getElementById('play').click()); }
await b.close();
