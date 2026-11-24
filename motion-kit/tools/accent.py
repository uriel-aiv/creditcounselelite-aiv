import sys, json
# usage: accent.py film.js patches.json  -> patches: [[lineno, old, new], ...]; also adds Playbook colours to C
f, pj = sys.argv[1], sys.argv[2]
L = open(f).read().split('\n'); P = json.load(open(pj))
for n, old, new in P:
    i = n - 1
    if old not in L[i]: sys.exit(f'line {n}: {old!r} not found in {L[i][:120]!r}')
    L[i] = L[i].replace(old, new, 1)
s = '\n'.join(L)
if 'maroon:' not in s.split('const C = {')[1].split('};')[0]:
    s = s.replace('const C = {', "const C = { maroon: '#6B0505', green: '#266235', teal: '#008C96', pbBlue: '#114BA7', gold: '#CB9938', light: '#ADC8E3', ", 1)
open(f, 'w').write(s); print('ok', f, len(P))
