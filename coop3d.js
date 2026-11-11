(()=>{'use strict';
let scene,renderer,camera,host,ready=false,avatarBubblePoint;
let switchMeshes=[],switchLabels=[],dollMeshes={},currentRole='B',currentStage=1,yaw=0,pitch=-.12;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const mat=(c,r=.7,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function box(parent,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o}
function ball(parent,x,y,z,r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,18),m);o.position.set(x,y,z);parent.add(o);return o}
function textPlane(text,x,y,z,w,h,bg='#f8e9c9',fg='#392719',size=34){
 const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');
 g.fillStyle=bg;g.fillRect(0,0,512,512);g.strokeStyle='#9b7046';g.lineWidth=12;g.strokeRect(8,8,496,496);
 g.fillStyle=fg;g.textAlign='center';g.font='bold '+size+'px sans-serif';
 const lines=String(text).split('\n');const lineH=size*1.55;let yy=256-(lines.length-1)*lineH/2;
 lines.forEach(line=>{g.fillText(line,256,yy,460);yy+=lineH});
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
 mesh.position.set(x,y,z);return mesh;
}
function makeMascot(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,0,-4.9);
 const skin=mat('#f5c783'),shirt=mat('#e85c43'),dark=mat('#29221d');
 const head=ball(g,0,2.05,0,.53,skin);head.scale.set(1,.95,.72);
 ball(g,-.17,2.13,.39,.055,dark);ball(g,.17,2.13,.39,.055,dark);
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.095,.025,8,24,Math.PI),dark);mouth.position.set(0,1.94,.43);mouth.rotation.z=Math.PI;g.add(mouth);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.72,5,12),shirt);body.position.set(0,1.05,0);g.add(body);
 const arm1=box(g,-.5,1.15,.2,.18,.65,.2,skin);arm1.rotation.z=-.5;
 const arm2=box(g,.5,1.15,.2,.18,.65,.2,skin);arm2.rotation.z=.5;
 avatarBubblePoint=new THREE.Vector3(0,2.72,-4.9);
}
function makeRoom(){
 scene.background=new THREE.Color('#1686a2');scene.fog=new THREE.Fog('#1686a2',15,32);
 scene.add(new THREE.HemisphereLight('#fff0d2','#3d2630',2.05));
 const key=new THREE.DirectionalLight('#fff2d7',2.6);key.position.set(-4,8,5);scene.add(key);
 const fill=new THREE.PointLight('#ffb33e',85,18);fill.position.set(1,4,-3);scene.add(fill);
 const wall=mat('#087b9d'),wall2=mat('#075a7b'),floor=mat('#f0a52e'),trim=mat('#ed553e'),wood=mat('#a95b2b'),dark=mat('#292b32'),cream=mat('#ffe2a8');
 box(scene,0,-.18,-4,16,.35,20,floor);box(scene,0,3.5,-12,16,7,.25,wall);box(scene,-8,3.5,-4,.25,7,16,wall2);box(scene,8,3.5,-4,.25,7,16,wall2);box(scene,0,7,-4,16,.2,16,wall);
 // bold colorful wall details
 box(scene,-3.9,4.9,-11.82,2.1,.22,.08,trim);box(scene,3.5,5.1,-11.82,2.4,.18,.08,mat('#f5c64d'));
 for(let i=0;i<5;i++){const orb=ball(scene,-5.8+i*.55,3.9,-11.65,.13,mat(['#f4cb54','#f16a4b','#4cc6a7'][i%3]));}
 // chunky workbench, viewed from player's seated position
 box(scene,0,.96,-2.35,7.1,.28,4.0,wood);box(scene,0,.43,-2.35,6.55,.82,3.55,mat('#774025'));
 box(scene,0,1.13,-3.45,6.4,.12,1.55,dark);
 // foreground padded edge
 box(scene,0,1.23,-2.55,5.9,.12,.18,mat('#f4c15b'));
 makeMascot();
}
function makeSwitchPanel(){
 switchMeshes=[];switchLabels=[];
 const panel=mat('#303d49',.42,.28),brass=mat('#d99a43',.38,.45),black=mat('#1d252b',.35,.2),red=mat('#ef5b45');
 box(scene,0,1.43,-3.55,4.9,.82,.26,panel);
 box(scene,0,1.87,-3.39,4.85,.09,.12,brass);
 for(let i=0;i<6;i++){
  const x=-1.95+i*.78;
  box(scene,x,1.05,-3.3,.55,.18,.55,brass);
  const pivot=new THREE.Group();pivot.position.set(x,1.17,-3.26);scene.add(pivot);
  const stem=box(pivot,0,.32,0,.13,.64,.15,black);stem.rotation.x=-.38;
  ball(pivot,0,.66,0,.17,i===1?mat('#ffcf4e',.25,.05):red);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.58,1.0,.58),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(0,.35,0);pivot.add(hit);hit.userData.switchNumber=i+1;
  switchMeshes.push({pivot,stem,hit,state:true});
  const label=textPlane(String(i+1),x,2.04,-3.29,.36,.36,'#fff0d0','#33251b',125);scene.add(label);switchLabels.push(label);
  if(i===1){const lamp=ball(scene,x,1.72,-3.12,.09,mat('#ffdc4f',.2));lamp.material.emissive=new THREE.Color('#ffb51c');lamp.material.emissiveIntensity=2.4;}
 }
}
function makeProtocolBoard(){
 const board=box(scene,-2.15,1.8,-3.15,1.5,1.55,.12,mat('#f2d9a8'));board.rotation.y=.12;
 const paper=textPlane('SAFETY\nPROTOCOL\n\n2 ↓  ·  3 ↑\n5 ↓  ·  1 ↑',-2.15,1.82,-3.07,1.28,1.35,'#fff0cf','#49301e',38);paper.rotation.y=.12;scene.add(paper);
}
function makeDoll(){const skin=mat('#e8bd91'),red=mat('#e95b4a'),blue=mat('#398dc2'),yellow=mat('#efc34b');dollMeshes.hat=new THREE.Mesh(new THREE.ConeGeometry(.33,.32,5),red);dollMeshes.hat.position.set(0,2.1,-3.5);scene.add(dollMeshes.hat);dollMeshes.shirt=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.68,12),blue);dollMeshes.shirt.position.set(0,1.52,-3.5);scene.add(dollMeshes.shirt);dollMeshes.head=ball(scene,0,1.98,-3.5,.25,skin);dollMeshes.shoes=box(scene,0,1.1,-3.5,.65,.18,.34,yellow)}
function makeHands(){
 const skin=mat('#efbd8d'),sleeve=mat('#e85b43');
 for(const side of [-1,1]){
  const hand=new THREE.Group();hand.position.set(side*.92,.56,-.15);hand.rotation.x=-.42;hand.rotation.z=side*.12;scene.add(hand);
  const palm=box(hand,0,0,0,.48,.16,.48,skin);
  for(let f=0;f<4;f++){const finger=box(hand,-.18+f*.12,.01,-.27,.085,.12,.35,skin);finger.rotation.x=-.08}
  const thumb=box(hand,side*.27,0,-.04,.12,.13,.25,skin);thumb.rotation.z=side*.45;
  const cuff=box(hand,0,-.01,.34,.52,.18,.22,sleeve);
 }
}
function setRole(r){currentRole=r||'B';setStage(currentStage)}
function setStage(n){
 currentStage=n;if(!ready)return;
 switchMeshes.forEach(o=>{o.pivot.visible=n===2&&currentRole==='B';o.hit.visible=n===2&&currentRole==='B'});
 switchLabels.forEach(o=>o.visible=n===2&&currentRole==='B');
 Object.values(dollMeshes).forEach(o=>o.visible=n===3);
}
function setSwitch(n,state){const o=switchMeshes[n-1];if(!o)return;o.state=!!state;o.stem.rotation.x=state?-.38:.58;o.pivot.userData.state=!!state}
function setDollPart(part,color){const o=dollMeshes[part];if(!o)return;o.material=mat(['#e95b4a','#398dc2','#efc34b'][color]||'#999',.7)}
function updateBubble(){const el=document.getElementById('partnerBubble');if(!el||!avatarBubblePoint||!camera||!renderer)return;const p=avatarBubblePoint.clone().project(camera),rect=renderer.domElement.getBoundingClientRect();el.style.left=((p.x*.5+.5)*rect.width)+'px';el.style.top=((-p.y*.5+.5)*rect.height)+'px'}
function onPointerMove(e){if(e.buttons===2){yaw-=e.movementX*.0035;pitch=Math.max(-.48,Math.min(.32,pitch-e.movementY*.0028));camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}}
function onClick(e){if(currentStage!==2||currentRole!=='B'||!ready)return;const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(switchMeshes.map(o=>o.hit),false);if(!hits.length)return;const n=hits[0].object.userData.switchNumber;const obj=switchMeshes[n-1];setSwitch(n,!obj.state);if(window.handlinkSwitchAction)window.handlinkSwitchAction(n)}
function init(){
 if(ready)return;host=document.getElementById('threeStage');if(!host||!window.THREE)return;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(62,1,.08,80);camera.position.set(0,1.78,4.25);camera.lookAt(0,1.75,-3.65);
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;host.appendChild(renderer.domElement);
 renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());renderer.domElement.addEventListener('pointermove',onPointerMove);renderer.domElement.addEventListener('click',onClick);
 makeRoom();makeSwitchPanel();makeProtocolBoard();makeDoll();makeHands();
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
 new ResizeObserver(resize).observe(host);resize();ready=true;setStage(1);animate();
}
function animate(){requestAnimationFrame(animate);if(ready){renderer.render(scene,camera);updateBubble()}}
window.Handlink3D={init,setStage,setRole,setSwitch,setDollPart};
})();