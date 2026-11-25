import os
import cv2, json, numpy as np, subprocess
SRC=os.environ.get('FT_SRC', os.path.join(os.environ.get('CCE_ROOT', os.path.expanduser('~/CCE')), 'footage-tests'))
cas=cv2.CascadeClassifier(os.environ.get('HAAR', cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'))
shots=json.load(open('shots.json')); res={}
for n in ['04_video04','05b_video24','06_video29','11_video03','12_video08']:
    cap=cv2.VideoCapture(f'{SRC}/{n}.mp4'); fps=cap.get(5); res[n]=[]
    for (a,e) in shots[n]:
        boxes=[]
        for t in np.linspace(a+0.1,e-0.1,6):
            cap.set(cv2.CAP_PROP_POS_MSEC,t*1000); ok,fr=cap.read()
            if not ok: continue
            g=cv2.cvtColor(fr,cv2.COLOR_BGR2GRAY)
            fs=cas.detectMultiScale(g,1.1,6,minSize=(50,50))
            boxes.append([list(map(int,b)) for b in fs])
        res[n].append({'shot':[a,e],'faces':boxes})
        print(n,(a,e),[sorted(b) for b in boxes[:3]])
json.dump(res,open('faces.json','w'))
