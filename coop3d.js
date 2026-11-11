(()=>{'use strict';
let scene,renderer,camera,host,ready=false,avatarBubblePoint;
let switchMeshes=[],switchLabels=[],dollMeshes={},protocolObjects=[],currentRole='B',currentStage=1,pitch=-.48,yaw=0;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const mat=(c,r=.7,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function box(parent,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o}
function ball(parent,x,y,z,r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,24,18),m);o.position.set(x,y,z);return o}
function label(text,x,y,z,w,h,bg='#f8e9c9',fg='#392719',size=120,rotation=-Math.PI/2){
 const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,512,256);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font='bold '+size+'px sans-serif';g.fillText(String(text),256,128,470);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));o.position.set(x,y,z);o.rotation.x=rotation;return o;
}
function makeMascot(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,0,-6.4);
 const skin=mat('#f5c783'),shirt=mat('#e85c43'),dark=mat('#29221d');
 const head=ball(g,0,2.05,0,.53,skin);head.scale.set(1,.95,.72);
 ball(g,-.17,2.13,.39,.055,dark);ball(g,.17,2.13,.39,.055,dark);
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.095,.025,8,24,Math.PI),dark);mouth.position.set(0,1.94,.43);mouth.rotation.z=Math.PI;g.add(mouth);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.72,5,12),shirt);body.position.set(0,1.05,0);g.add(body);
 const arm1=box(g,-.5,1.15,.2,.18,.65,.2,skin);arm1.rotation.z=-.5;
 const arm2=box(g,.5,1.15,.2,.18,.65,.2,skin);arm2.rotation.z=.5;
 avatarBubblePoint=new THREE.Vector3(0,2.75,-6.4);
}
function makeRoom(){
 scene.background=new THREE.Color('#087f9e');scene.fog=new THREE.Fog('#087f9e',16,34);
 scene.add(new THREE.HemisphereLight('#fff0d2','#3d2630',2));
 const key=new THREE.DirectionalLight('#fff2d7',2.5);key.position.set(-4,8,5);scene.add(key);
 const fill=new THREE.PointLight('#ffb33e',65,18);fill.position.set(1,4,-3);scene.add(fill);
 const wall=mat('#087b9d'),side=mat('#075a7b'),floor=mat('#efa32f'),wood=mat('#a95b2b'),dark=mat('#292b32');
 box(scene,0,-.18,-4,16,.35,20,floor);box(scene,0,3.5,-12,16,7,.25,wall);box(scene,-8,3.5,-4,.25,7,16,side);box(scene,8,3.5,-4,.25,7,16,side);
 box(scene,0,.98,-2.45,7.4,.28,5.3,wood);box(scene,0,.43,-2.45,6.9,.82,4.9,mat('#774025'));
 box(scene,0,1.14,-2.45,7.15,.08,5.05,mat('#d28a45'));
 // colorful room dressing and seated partner, visible when the player raises their gaze
 box(scene,-3.8,4.5,-11.82,2.1,.2,.08,mat('#ed553e'));box(scene,3.5,4.8,-11.82,2.4,.18,.08,mat('#f5c64d'));
 makeMascot();
}
function makeSwitchPanel(){
 switchMeshes=[];switchLabels=[];
 const base=mat('#35434d',.42,.25),brass=mat('#d99a43',.38,.35),black=mat('#20272d',.32,.15),red=mat('#ed634d');
 // flat work surface with six individual physical toggle levers
 box(scene,0,1.22,-2.45,4.85,.12,1.72,base);
 for(let i=0;i<6;i++){
  const x=-1.95+i*.78,z=-2.22;
  box(scene,x,1.31,z,.58,.08,.66,brass);
  const pivot=new THREE.Group();pivot.position.set(x,1.36,z);scene.add(pivot);
  const stem=box(pivot,0,.28,0,.13,.56,.14,black);stem.rotation.z=-.12;
  ball(pivot,0,.57,0,.16,i===1?mat('#ffcf4e',.22):red);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.62,.78,.62),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(0,.3,0);pivot.add(hit);hit.userData.switchNumber=i+1;
  switchMeshes.push({pivot,stem,hit,state:true});
  const num=label(i+1,x,1.285,z+.43,.28,.22,'#f9e7c7','#382719',125);scene.add(num);switchLabels.push(num);
  if(i===1){const lamp=ball(scene,x,1.39,z-.34,.105,mat('#ffdf55',.2));lamp.material.emissive=new THREE.Color('#ffb51c');lamp.material.emissiveIntensity=2.2;}
 }
}
function makeProtocolBoard(){
 // A single paper instruction sheet lying flat on the desk; no floating popup or duplicated control labels.
 const paper=box(scene,-1.65,1.205,-2.45,2.25,.035,2.25,mat('#f5e7c8'));
 const title=label('SAFETY PROTOCOL',-1.65,1.228,-1.58,1.8,.22,'#f5e7c8','#593a22',43);
 const rows=['1  ·  노란 표시등 레버 내리기','2  ·  3번 레버 올리기','3  ·  5번 레버 내리기','4  ·  1번 레버 올리기'];
 const group=new THREE.Group();scene.add(group);group.position.set(-1.65,1.232,-2.15);
 rows.forEach((txt,i)=>{const o=label(txt,0,0,-i*.35,1.98,.25,'#fff1d5','#49301e',31,0);o.rotation.x=0;group.add(o)});
 protocolObjects.push(paper,title,group);
}
function makeDoll(){
 const skin=mat('#e8bd91'),red=mat('#e95b4a'),blue=mat('#398dc2'),yellow=mat('#efc34b');
 dollMeshes.hat=new THREE.Mesh(new THREE.ConeGeometry(.33,.32,5),red);dollMeshes.hat.position.set(0,2.1,-3.5);scene.add(dollMeshes.hat);
 dollMeshes.shirt=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.68,12),blue);dollMeshes.shirt.position.set(0,1.52,-3.5);scene.add(dollMeshes.shirt);
 dollMeshes.head=ball(scene,0,1.98,-3.5,.25,skin);dollMeshes.shoes=box(scene,0,1.1,-3.5,.65,.18,.34,yellow);
}
function makeHands(){
 const skin=mat('#efbd8d'),sleeve=mat('#e85b43');
 for(const side of [-1,1]){
  const hand=new THREE.Group();hand.position.set(side*.92,.55,.25);hand.rotation.x=-.42;hand.rotation.z=side*.12;scene.add(hand);
  box(hand,0,0,0,.48,.16,.48,skin);
  for(let f=0;f<4;f++)box(hand,-.18+f*.12,.01,-.27,.085,.12,.35,skin);
  const thumb=box(hand,side*.27,0,-.04,.12,.13,.25,skin);thumb.rotation.z=side*.45;
  box(hand,0,-.01,.34,.52,.18,.22,sleeve);
 }
}
function setRole(r){currentRole=r||'B';setStage(currentStage)}
function setStage(n){
 currentStage=n;if(!ready)return;
 protocolObjects.forEach(o=>o.visible=n===2&&currentRole==='A');
 switchMeshes.forEach(o=>{o.pivot.visible=n===2&&currentRole==='B';o.hit.visible=n===2&&currentRole==='B'});
 switchLabels.forEach(o=>o.visible=n===2&&currentRole==='B');
 Object.values(dollMeshes).forEach(o=>o.visible=n===3);
}
function setSwitch(n,state){const o=switchMeshes[n-1];if(!o)return;o.state=!!state;o.stem.rotation.z=state?-.12:.58;o.pivot.userData.state=!!state}
function setDollPart(part,color){const o=dollMeshes[part];if(!o)return;o.material=mat(['#e95b4a','#398dc2','#efc34b'][color]||'#999',.7)}
function updateBubble(){
 const el=document.getElementById('partnerBubble');if(!el||!avatarBubblePoint||!camera||!renderer)return;
 const p=avatarBubblePoint.clone().project(camera),rect=renderer.domElement.getBoundingClientRect();
 const visible=p.z<1&&p.z>-1&&p.y>-.95&&p.y<.95;el.hidden=!visible;
 if(visible){el.style.left=((p.x*.5+.5)*rect.width)+'px';el.style.top=((-p.y*.5+.5)*rect.height)+'px'}
}
function onPointerMove(e){
 if(!ready)return;
 if(e.buttons===2){yaw=Math.max(-.32,Math.min(.32,yaw-e.movementX*.0025));pitch=Math.max(-.82,Math.min(.18,pitch-e.movementY*.003));camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}
}
function onClick(e){
 if(currentStage!==2||currentRole!=='B'||!ready)return;
 const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
 raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(switchMeshes.map(o=>o.hit),false);if(!hits.length)return;
 const n=hits[0].object.userData.switchNumber,obj=switchMeshes[n-1];setSwitch(n,!obj.state);if(window.handlinkSwitchAction)window.handlinkSwitchAction(n);
}
function init(){
 if(ready)return;host=document.getElementById('threeStage');if(!host||!window.THREE)return;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(66,1,.08,80);camera.position.set(0,1.68,4.35);camera.rotation.order='YXZ';camera.rotation.x=pitch;
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;host.appendChild(renderer.domElement);
 renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());renderer.domElement.addEventListener('pointermove',onPointerMove);renderer.domElement.addEventListener('click',onClick);
 makeRoom();makeSwitchPanel();makeProtocolBoard();makeDoll();makeHands();
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
 new ResizeObserver(resize).observe(host);resize();ready=true;setStage(1);animate();
}
function animate(){requestAnimationFrame(animate);if(ready){renderer.render(scene,camera);updateBubble()}}
window.Handlink3D={init,setStage,setRole,setSwitch,setDollPart};
})();