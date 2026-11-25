# Photo Collage 2.5D layer prep (style 20).
#   Scene with a person:  python3 make_layers.py <scene.png> <plate.png> <out-dir> <name>
#   Prop on plain white:  python3 make_layers.py <prop.png> - <out-dir> <name> --prop
# scene.png = the full Nano Banana 2.1 image; plate.png = the same image edited by Nano Banana 2.1 with the subject erased.
# Writes <name>_plate.jpg (1080 wide) and <name>_subj.png (the person, registered to the plate, transparent elsewhere),
# or <name>.png for a prop (cropped to the object, max 900 px).
# Needs: pip install "rembg[cpu]" scipy pillow  (segmentation models download from GitHub on first use).
import sys
from PIL import Image
import numpy as np
from scipy import ndimage as nd
from rembg import remove, new_session

scene, plate, out, name = sys.argv[1:5]
a = Image.open(scene).convert('RGB')
if '--prop' in sys.argv:
    o = remove(a, session=new_session('isnet-general-use'), post_process_mask=True)
    o = o.crop(o.getbbox()); o.thumbnail((900, 900), Image.LANCZOS); o.save(f'{out}/{name}.png')
    sys.exit()

p = Image.open(plate).convert('RGB').resize(a.size, Image.LANCZOS)
# 1) where the plate differs from the scene = where the subject was. This bounds the person and keeps out
#    objects a general model would also grab (the jet behind the traveller, the lounger under the man).
d = np.abs(np.asarray(a, float) - np.asarray(p, float)).sum(2) > 40
d = nd.binary_fill_holes(nd.binary_closing(d, iterations=6))
ys, xs = np.where(d); pad = 60
box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(a.width, xs.max() + pad), min(a.height, ys.max() + pad))
# 2) a people-only model on that crop gives the clean edge (hair, hands, glasses). If the person holds something
#    (cards, a suitcase) that this model drops, use the isnet-general-use cut-out for that part instead.
o = remove(a.crop(box), session=new_session('u2net_human_seg'), post_process_mask=True)
al = np.zeros((a.height, a.width)); al[box[1]:box[3], box[0]:box[2]] = np.asarray(o.split()[3]) / 255
hard = al > 0.5; lab, k = nd.label(hard)
keep = lab == (np.argmax(nd.sum(hard, lab, range(1, k + 1))) + 1)
al = al * nd.binary_dilation(keep, iterations=3)
W, H = 1080, round(1080 * a.height / a.width)
p.resize((W, H), Image.LANCZOS).save(f'{out}/{name}_plate.jpg', quality=92)
s = a.copy(); s.putalpha(Image.fromarray((al * 255).astype(np.uint8)))
s.resize((W, H), Image.LANCZOS).save(f'{out}/{name}_subj.png')
print(name, 'subject box', box)
