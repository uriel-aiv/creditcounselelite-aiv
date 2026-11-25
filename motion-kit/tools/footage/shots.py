import os
import subprocess, json, re, sys, os
from PIL import Image, ImageDraw
SRC=os.environ.get('FT_SRC', os.path.expanduser('~/UU/creditcounsel/footage-tests'))
out={}
for f in sorted(os.listdir(SRC)):
    n=f[:-4]; p=f'{SRC}/{f}'
    dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True).stdout)
    r=subprocess.run(['ffmpeg','-i',p,'-vf','scale=320:-1,scdet=threshold=12','-an','-f','null','-'],capture_output=True,text=True).stderr
    cuts=[float(x) for x in re.findall(r'lavfi.scd.time: ([\d.]+)',r)]
    b=[0.0]+cuts+[dur]; shots=[(round(b[i],2),round(b[i+1],2)) for i in range(len(b)-1) if b[i+1]-b[i]>0.15]
    out[n]=shots
    ths=[]
    for i,(a,e) in enumerate(shots):
        t=(a+e)/2; tmp=f'/tmp/_s.jpg'
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',p,'-frames:v','1','-vf','scale=-1:200',tmp])
        im=Image.open(tmp).convert('RGB'); d=ImageDraw.Draw(im); d.rectangle((0,0,150,22),fill='black'); d.text((4,4),f'{i}: {a:.1f}-{e:.1f}',fill='yellow'); ths.append(im)
    W=sum(i.width for i in ths[:8]); rows=(len(ths)+7)//8
    S=Image.new('RGB',(max(1,W),200*rows))
    x=y=0
    for k,im in enumerate(ths):
        if k and k%8==0: x=0; y+=200
        S.paste(im,(x,y)); x+=im.width
    S.save(f'shots_{n}.png')
    print(n, len(shots), shots)
json.dump(out,open('shots.json','w'))
