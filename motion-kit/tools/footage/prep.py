# Founder track per test film: 1080x1080 frames at 23.976 fps that follow Brandon shot by shot,
# the voice trimmed after the last word, word timings shifted to film time, and a layout plan.
import json, subprocess, os, sys, math
import numpy as np
from PIL import Image
import os
SRC=os.environ.get('FT_SRC', os.path.expanduser('~/UU/creditcounsel/footage-tests'))
FPS=24000/1001
OUT=os.environ.get('FT_OUT', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'footage-tests'))
faces=json.load(open('faces.json'))
VSL_CROP=(200,30,680)
VSL_TRACK={'09r2_vsl5':545}   # square side for face-tracked VSL crops (bottom stays above the captions)
VSL_CROP_BY={'09r2_vsl5':(245,0,590),'10r2_vsl1':(220,60,720)}   # cutdowns burn captions at different heights: keep the crop above them
SPLIT={'05b_video24':[1],'11_video03':[0],'12_video08':[0],'05br2_video17':[0],'06r2_video12':[1],'11r2_video14':[0],'17r2_video13':[2]}  # shots that are side-by-side (Brandon = right half)
CFG={ # name: (offset, list of shots for vsl = fixed crop)
 '04_video04':0,'05b_video24':0,'06_video29':0,'11_video03':0,'12_video08':0,'09_vsl2':0,'10_vsl6':2.75,'17_vsl4':0,'04r2_video19':0,'05br2_video17':0,'06r2_video12':0,'09r2_vsl5':0,'10r2_vsl1':0,'11r2_video14':0,'12r2_video6':0,'17r2_video13':0}
def crops(n):
    """list of (t0,t1,(x,y,s)) in source time"""
    if 'vsl' in n:
        d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'{SRC}/{n}.mp4'],capture_output=True,text=True).stdout)
        if n in VSL_TRACK and n in faces:   # follow his face shot by shot (he moves); keep the crop above the burned captions
            s_=VSL_TRACK[n]; out=[]
            for sh in faces[n]:
                a,e=sh['shot']; fs=[b for fr in sh['faces'] for b in fr if b[2]>200]
                if not fs: out.append((a,e,VSL_CROP_BY.get(n,VSL_CROP))); continue
                f=np.median(np.array(fs),axis=0); cx=f[0]+f[2]/2
                out.append((a,e,(int(min(max(cx-s_/2,0),1080-s_)),0,s_)))
            out=[(a,(out[i+1][0] if i+1<len(out) else d),c) for i,(a,e,c) in enumerate(out)]; return out
        return [(0,d,VSL_CROP_BY.get(n,VSL_CROP))]
    out=[]
    for i,s in enumerate(faces[n]):
        a,e=s['shot']; fs=[b for fr in s['faces'] for b in fr if b[2]>120]
        split=i in SPLIT.get(n,[])
        if not fs: out.append((a,e,(420,0,1080))); continue   # no Brandon in shot (host) - hidden by layout
        if split: fs=[b for b in fs if b[0]>960] or fs
        f=np.median(np.array(fs),axis=0); cx=f[0]+f[2]/2; cy=f[1]+f[3]/2
        s_=min(1080, 3.4*f[2]); lo,hi=(970,1882) if split else (0,1920); ylo,yhi=(46,1034) if split else (0,1080)   # split: inside the source's white frame lines
        s_=min(s_, hi-lo, yhi-ylo); x=min(max(cx-s_/2,lo),hi-s_); y=min(max(cy-0.36*s_,ylo),yhi-s_)
        out.append((a,e,(int(x),int(y),int(s_))))
    return out
def build(n, outdir):
    off=CFG[n]; W=json.load(open(f'{n}.words.json'))
    end=W[-1][1]-off+0.45; dur=round(end+2.6,2)
    os.makedirs(f'{outdir}/footage',exist_ok=True)
    C=crops(n); N=int(math.ceil(dur*FPS))+1
    # decode source at FPS (frame-exact) into raw RGB pipe
    src=f'{SRC}/{n}.mp4'
    info=subprocess.run(['ffprobe','-v','error','-select_streams','v','-show_entries','stream=width,height','-of','csv=p=0',src],capture_output=True,text=True).stdout.strip().split(',')
    w,h=int(info[0]),int(info[1])
    p=subprocess.Popen(['ffmpeg','-v','error','-ss',str(off),'-i',src,'-vf',f'fps={FPS}','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
    last=None
    for k in range(N):
        b=p.stdout.read(w*h*3)
        if len(b)<w*h*3: fr=last
        else: fr=Image.frombuffer('RGB',(w,h),b)
        last=fr; ts=k/FPS+off
        x,y,s=next((c for a,e,c in C if a<=ts<e), C[-1][2])
        fr.crop((x,y,x+s,y+s)).resize((1080,1080),Image.LANCZOS).save(f'{outdir}/footage/f_{k+1:05d}.jpg',quality=90)
    p.stdout.close(); p.wait()
    os.makedirs(f'{outdir}/audio',exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(off),'-i',src,'-vn','-ar','48000','-ac','2','-af',f'atrim=0:{end-0.05},afade=t=out:st={end-0.35}:d=0.3,apad','-t',str(dur),f'{outdir}/audio/vo.wav'])
    subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',str(dur),f'{outdir}/audio/music.wav'])
    json.dump([[round(a-off,2),round(b-off,2),x] for a,b,x in W if a>=off-0.05],open(f'{outdir}/words.json','w'))
    json.dump({'name':n,'offset':off,'end':round(end,2),'duration':dur,'frames':N,'crops':[(round(a-off,2),round(e-off,2),c) for a,e,c in C]},open(f'{outdir}/plan.json','w'),indent=1)
    print(n,'end',round(end,2),'dur',dur,'frames',N,[(a,e,c) for a,e,c in C])
for n in (sys.argv[1:] or CFG): build(n, os.path.join(OUT, n))
