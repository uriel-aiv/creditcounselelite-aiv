import os
import sys, json, glob, os
from faster_whisper import WhisperModel
import subprocess, numpy as np
def load(f):
    b = subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','16000','-f','f32le','-'], capture_output=True).stdout
    return np.frombuffer(b, np.float32)
m = WhisperModel(os.environ.get('WHISPER_MODEL', 'small.en'), device='cpu', compute_type='int8')
for f in sorted(glob.glob(os.path.join(os.environ.get('FT_SRC', os.path.expanduser('~/UU/creditcounsel/footage-tests')), '*.mp4'))):
    n = os.path.basename(f)[:-4]
    segs, info = m.transcribe(load(f), language='en', word_timestamps=True, vad_filter=False)
    W = [[round(w.start, 2), round(w.end, 2), w.word.strip()] for s in segs for w in s.words]
    json.dump(W, open(f'{n}.words.json', 'w'))
    print(f'== {n}: ' + ' '.join(f'{a:.1f}:{w}' for a, b, w in W), flush=True)
