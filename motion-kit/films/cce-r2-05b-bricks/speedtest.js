import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const cv=document.createElement('canvas');cv.width=720;cv.height=660;
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});
R.setSize(720,660,false);R.outputColorSpace=THREE.SRGBColorSpace;
const env=new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(),0.04).texture;
const sc=new THREE.Scene();sc.environment=env;sc.add(new THREE.HemisphereLight(0xffffff,0x998877,1.5));const dl=new THREE.DirectionalLight(0xffffff,2);dl.position.set(-5,10,6);sc.add(dl);
function brickGeo(w,d,h){const g=[new THREE.BoxGeometry(w-0.03,h,d-0.03).translate(0,h/2,0)];for(let i=0;i<w;i++)for(let j=0;j<d;j++)g.push(new THREE.CylinderGeometry(0.3,0.3,0.2,14).translate(i+0.5-w/2,h+0.1,j+0.5-d/2));return mergeGeometries(g);}
const geo=brickGeo(2,4,1.2);const mats=[0xC91A09,0x0055BF,0xF2CD37,0xF4F4F4].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:0.3}));
for(let i=0;i<200;i++){const m=new THREE.Mesh(geo,mats[i%4]);m.position.set((i%20)-10,Math.floor(i/20)*1.2,0);sc.add(m);}
const cam=new THREE.OrthographicCamera(-15,15,14,-14,0.1,200);cam.position.set(20,16,20);cam.lookAt(0,4,0);
const t0=performance.now();for(let k=0;k<10;k++){sc.rotation.y=k*0.1;R.render(sc,cam);}
document.title='ms '+((performance.now()-t0)/10).toFixed(1)+' '+R.getContext().getParameter(R.getContext().VERSION);
