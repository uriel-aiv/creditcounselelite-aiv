import os
# Make a footage-test film from an approved film: python3 tools/mkft.py <src-film-dir> <prep-name> <new-film-dir>
# Copies the style's code and art, links the prepared founder track (motion-kit/footage-tests/<prep>/footage, made by prep.py),
# copies voice + silent music + word timings, sets duration and frame count. Sections are then rewritten by hand.
import sys, os, json, shutil, subprocess
src, prep, dst = sys.argv[1:4]
P = os.path.join(os.environ.get('FT_OUT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'footage-tests')), prep); plan = json.load(open(f'{P}/plan.json'))
if os.path.exists(dst): shutil.rmtree(dst)
shutil.copytree(src, dst, symlinks=True, ignore=shutil.ignore_patterns('footage', '*.wav', '*.bak'))
f = f'{dst}/assets/footage'
if os.path.lexists(f): os.remove(f) if os.path.islink(f) else shutil.rmtree(f)
os.symlink(os.path.relpath(f'{P}/footage', os.path.dirname(f)), f)
os.makedirs(f'{dst}/audio', exist_ok=True)
for a in ('vo.wav', 'music.wav'): shutil.copy(f'{P}/audio/{a}', f'{dst}/audio/{a}')
shutil.copy(f'{P}/words.json', f'{dst}/assets/words.json')
shutil.copy(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'brand.js'), f'{dst}/lib/brand.js')
j = json.load(open(f'{dst}/film.json')); j['duration'] = plan['duration']; j['title'] = j['title'].replace(' (Brand)', '') + f" — footage test ({prep})"; j['poster'] = round(plan['end'] / 2, 2)
json.dump(j, open(f'{dst}/film.json', 'w'), indent=2)
print(dst, plan['duration'], 'end', plan['end'], 'frames', plan['frames'])
