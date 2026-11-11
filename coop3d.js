(()=>{'use strict';
let scene,renderer,camera,host,ready=false,avatarBubblePoint,switchMeshes=[],switchLabels=[],dollMeshes={},yaw=0,pitch=-.035;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const mat=(c,r=.72,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function box(parent,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o}
function ball(parent,x,y,z,r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,20,16),m);o.position.set(x,y,z);parent.add(o);return o}
function labelSprite(text,x,y,z){const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#17120e';ctx.fillRect(8,8,112,112);ctx.strokeStyle='#d9ad68';ctx.lineWidth=7;ctx.strokeRect(8,8,112,112);ctx.fillStyle='#ffe0a2';ctx.font='bold 76px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,64,66);const tex=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));s.position.set(x,y,z);s.scale.set(.28,.28,.04);scene.add(s);return s}
function makeAvatar(){const g=new THREE.Group();scene.add(g);g.position.set(0,0,-5.1);const skin=mat('#e5b995'),body=mat('#6d5140'),dark=mat('#2b211c');const torso=new THREE.Mesh(new THREE.CylinderGeometry(.48,.55,.95,24),body);torso.position.set(0,1.05,0);g.add(torso);const head=ball(g,0,1.95,0,.48,skin);head.scale.set(1,.96,.82);ball(g,-.16,2.02,.39,.045,dark);ball(g,.16,2.02,.39,.045,dark);const mouth=new THREE.Mesh(new THREE.TorusGeometry(.095,.018,8,24,Math.PI),dark);mouth.position.set(0,1.82,.405);mouth.rotation.z=Math.PI;g.add(mouth);const a=box(g,-.48,1.02,.25,.18,.7,.2,skin);a.rotation.z=-.45;const b=box(g,.48,1.02,.25,.18,.7,.2,skin);b.rotation.z=.45;box(g,-.25,.35,.45,.3,.18,.8,mat('#41352d'));box(g,.25,.35,.45,.3,.18,.8,mat('#41352d'));avatarBubblePoint=new THREE.Vector3(0,2.55,-5.1)}
function makeSwitchPanel(){
 switchMeshes=[];switchLabels=[];
 const brass=mat('#bd9a68',.38,.5),dark=mat('#242424',.5,.2),panel=mat('#282522',.48,.35);
 box(scene,0,1.35,-3.72,4.8,.95,.22,panel);
 for(let i=0;i<6;i++){
  const x=-1.95+i*.78;
  box(scene,x,1.12,-3.56,.5,.16,.38,brass);
  const pivot=new THREE.Group();pivot.position.set(x,1.22,-3.55);scene.add(pivot);
  const stem=box(pivot,0,.32,0,.105,.62,.12,dark);stem.rotation.x=-.38;
  ball(pivot,0,.64,0,.13,mat('#d9b16c',.4,.25));
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.48,.9,.45),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(0,.34,0);pivot.add(hit);hit.userData.switchNumber=i+1;
  switchMeshes.push({pivot,stem,hit,state:true});
  switchLabels.push(labelSprite(String(i+1),x,1.88,-3.48));
  if(i===1){const lampMat=new THREE.MeshStandardMaterial({color:'#f2c44e',emissive:'#b87912',emissiveIntensity:1.8,roughness:.25});ball(scene,x,1.72,-3.42,.105,lampMat)}
 }
}
function makeDoll(){const skin=mat('#d7b18a'),red=mat('#d84b3f'),blue=mat('#397fc5'),yellow=mat('#e8bd42');dollMeshes.hat=new THREE.Mesh(new THREE.ConeGeometry(.33,.32,4),red);dollMeshes.hat.position.set(0,2.05,-3.65);scene.add(dollMeshes.hat);dollMeshes.shirt=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.68,12),blue);dollMeshes.shirt.position.set(0,1.48,-3.65);scene.add(dollMeshes.shirt);dollMeshes.head=ball(scene,0,1.95,-3.65,.25,skin);dollMeshes.shoes=box(scene,0,1.05,-3.65,.65,.18,.34,yellow)}
function buildRoom(){scene.background=new THREE.Color('#3a281d');scene.fog=new THREE.Fog('#3a281d',13,28);scene.add(new THREE.HemisphereLight('#f1d7b5','#2b1b13',1.7));const key=new THREE.PointLight('#ffbd7b',70,18);key.position.set(-1,5,-3);scene.add(key);const fill=new THREE.PointLight('#9ab7d0',15,13);fill.position.set(4,2,0);scene.add(fill);box(scene,0,-.18,-4,14,.35,18,mat('#4b382a'));box(scene,0,3.6,-12,14,7,.25,mat('#30221a'));box(scene,-7,3.6,-4,.25,7,16,mat('#39271d'));box(scene,7,3.6,-4,.25,7,16,mat('#39271d'));box(scene,0,7,-4,14,.2,16,mat('#30221a'));box(scene,0,.88,-2.65,6.4,.22,3.2,mat('#754b2e'));box(scene,0,.35,-2.65,5.8,.85,2.8,mat('#4c3021'));box(scene,0,1.02,-3.65,5.15,.1,1.25,mat('#25292a',.5,.25));makeSwitchPanel();makeDoll();makeAvatar()}
let currentRole='B',currentStage=1;
function setRole(r){currentRole=r||'B';setStage(currentStage)}
function setStage(n){currentStage=n;if(!ready)return;const fuse=n===2,doll=n===3;switchMeshes.forEach(o=>{o.pivot.visible=fuse&&currentRole==='B';o.hit.visible=fuse&&currentRole==='B'});switchLabels.forEach(o=>o.visible=fuse&&currentRole==='B');Object.values(dollMeshes).forEach(o=>o.visible=doll)}
function setSwitch(n,state){const o=switchMeshes[n-1];if(!o)return;o.state=!!state;o.stem.rotation.x=state?-.38:.58;o.pivot.userData.state=!!state}
function setDollPart(part,color){const o=dollMeshes[part];if(!o)return;o.material=mat(['#d84b3f','#397fc5','#e8bd42'][color]||'#999999',.7)}
function updateBubble(){const el=document.getElementById('partnerBubble');if(!el||!avatarBubblePoint||!camera||!renderer)return;const p=avatarBubblePoint.clone().project(camera),rect=renderer.domElement.getBoundingClientRect();el.style.left=((p.x*.5+.5)*rect.width)+'px';el.style.top=((-p.y*.5+.5)*rect.height)+'px'}
function onPointerMove(e){if(e.buttons===2){yaw-=e.movementX*.0035;pitch=Math.max(-.38,Math.min(.32,pitch-e.movementY*.0028));camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}}
function onClick(e){if(currentStage!==2||currentRole!=='B'||!ready)return;const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(switchMeshes.map(o=>o.hit),false);if(!hits.length)return;const n=hits[0].object.userData.switchNumber;const obj=switchMeshes[n-1];setSwitch(n,!obj.state);if(window.handlinkSwitchAction)window.handlinkSwitchAction(n)}
function init(){if(ready)return;host=document.getElementById('threeStage');if(!host||!window.THREE)return;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(58,1,.08,80);camera.position.set(0,2.05,4.3);camera.lookAt(0,1.65,-4.7);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());renderer.domElement.addEventListener('pointermove',onPointerMove);renderer.domElement.addEventListener('click',onClick);buildRoom();const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(host);resize();ready=true;setStage(1);animate()}
function animate(){requestAnimationFrame(animate);if(ready){renderer.render(scene,camera);updateBubble()}}
window.Handlink3D={init,setStage,setRole,setSwitch,setDollPart};
})();