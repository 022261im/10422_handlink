(()=>{'use strict';
let scene,renderer,camera,host,ready=false,avatarBubblePoint,bubbleActive=false;
let switchMeshes=[],switchLabels=[],dollMeshes={},protocolObjects=[],manualGroup=null,switchPanelGroup=null,currentRole='B',currentStage=1,pitch=-1.12,yaw=0;
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const mat=(c,r=.7,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function box(parent,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o}
function ball(parent,x,y,z,r,m){return new THREE.Mesh(new THREE.SphereGeometry(r,24,18),m).translateX(x).translateY(y).translateZ(z)}
function flatText(parent,text,x,y,z,w,h,options={}){
 const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
 g.fillStyle=options.bg||'#f5e9cf';g.fillRect(0,0,c.width,c.height);
 if(options.border){g.strokeStyle=options.border;g.lineWidth=12;g.strokeRect(6,6,500,244)}
 g.fillStyle=options.fg||'#34271d';g.textAlign='center';g.textBaseline='middle';
 g.font='900 '+(options.size||100)+'px "Noto Sans KR",sans-serif';g.fillText(String(text),256,128,480);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
 o.position.set(x,y,z);o.rotation.x=-Math.PI/2;parent.add(o);return o;
}
function makePotato(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,0,-6.35);
 const potatoMat=new THREE.MeshStandardMaterial({color:'#c99b61',roughness:1});
 const lensMat=new THREE.MeshPhysicalMaterial({color:'#080d12',roughness:.2,metalness:.08,clearcoat:1,clearcoatRoughness:.12});
 const frame=mat('#17191b',.28,.08),mouthMat=mat('#38251d');
 // A squat, rounded potato body matching the supplied soft 3D mascot reference.
 const geo=new THREE.SphereGeometry(1,64,48),pos=geo.attributes.position;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  const lump=1+.035*Math.sin(x*5+z*3)*Math.cos(y*5-z*2)+.018*Math.sin(z*10+y*4);
  pos.setXYZ(i,x*lump,y*lump,z*lump);
 }
 geo.computeVertexNormals();
 const body=new THREE.Mesh(geo,potatoMat);body.position.set(0,1.22,0);body.scale.set(1.02,.86,.88);g.add(body);
 // Four short, rounded nubs instead of long arms or legs.
 for(let i=0;i<4;i++){
  const side=i<2?-1:1,front=i%2===0?1:-1;
  const limb=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.17,6,14),potatoMat);
  limb.position.set(side*.59,.55,front*.34);
  limb.rotation.z=side*.62;limb.rotation.x=front*.32;
  limb.scale.set(1,.9,1);g.add(limb);
 }
 // Soft dark beanie pulled low, ending just above the sunglasses.
 const beanieMat=mat('#333a3a',.92),beanieRim=mat('#252b2c',.88);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(1,48,32,0,Math.PI*2,0,Math.PI/2),beanieMat);
 cap.position.set(0,1.62,0);cap.scale.set(1.01,.78,.9);g.add(cap);
 const cuff=new THREE.Mesh(new THREE.TorusGeometry(.88,.085,12,64),beanieRim);
 cuff.position.set(0,1.63,0);cuff.scale.set(1.12,1,.99);g.add(cuff);
 // Long, rounded rectangular sunglasses with a thick sculpted frame.
 const glasses=new THREE.Group();glasses.position.set(0,1.43,.81);g.add(glasses);
 function roundedLens(parent,x){
  const shape=new THREE.Shape(),w=.30,h=.145,r=.105;
  shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);
  shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);
  shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
  const rimGeo=new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.018});
  const rim=new THREE.Mesh(rimGeo,frame);rim.position.set(x,0,0);parent.add(rim);
  const lensShape=new THREE.Shape(),lw=.27,lh=.115,lr=.085;
  lensShape.moveTo(-lw+lr,-lh);lensShape.lineTo(lw-lr,-lh);lensShape.quadraticCurveTo(lw,-lh,lw,-lh+lr);
  lensShape.lineTo(lw,lh-lr);lensShape.quadraticCurveTo(lw,lh,lw-lr,lh);lensShape.lineTo(-lw+lr,lh);
  lensShape.quadraticCurveTo(-lw,lh,-lw,lh-lr);lensShape.lineTo(-lw,-lh+lr);lensShape.quadraticCurveTo(-lw,-lh,-lw+lr,-lh);
  const lens=new THREE.Mesh(new THREE.ShapeGeometry(lensShape),lensMat);lens.position.set(x,0,.102);parent.add(lens);
  const glint=box(parent,x-.11,.055,.108,.045,.012,.006,new THREE.MeshBasicMaterial({color:'#a9cbdc'}));glint.rotation.z=-.25;
 }
 roundedLens(glasses,-.32);roundedLens(glasses,.32);
 box(glasses,0,0,.075,.12,.055,.09,frame);
 box(glasses,-.69,0,-.11,.19,.045,.055,frame);
 box(glasses,.69,0,-.11,.19,.045,.055,frame);
 const smile=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,8,28,Math.PI),mouthMat);
 smile.position.set(0,1.02,.875);smile.rotation.z=Math.PI;g.add(smile);
 avatarBubblePoint=new THREE.Vector3(0,2.25,-6.35);
}
function makeRoom(){
 scene.background=new THREE.Color('#087f9e');scene.fog=new THREE.Fog('#087f9e',18,36);
 scene.add(new THREE.HemisphereLight('#fff1d7','#3b2630',2.15));
 const key=new THREE.DirectionalLight('#fff2d7',2.7);key.position.set(-4,8,5);scene.add(key);
 const fill=new THREE.PointLight('#ffb33e',65,18);fill.position.set(1,4,-3);scene.add(fill);
 const wall=mat('#087b9d'),side=mat('#075a7b'),floor=mat('#efa32f'),wood=mat('#a95b2b'),dark=mat('#292b32');
 box(scene,0,-.18,-4,16,.35,20,floor);box(scene,0,3.5,-12,16,7,.25,wall);box(scene,-8,3.5,-4,.25,7,16,side);box(scene,8,3.5,-4,.25,7,16,side);
 box(scene,0,.98,-2.45,7.4,.28,5.3,wood);box(scene,0,.43,-2.45,6.9,.82,4.9,mat('#774025'));
 box(scene,0,1.14,-2.45,7.15,.08,5.05,mat('#d28a45'));
 // Colorful workshop dressing behind the seated partner
 box(scene,-3.8,4.5,-11.82,2.1,.2,.08,mat('#ed553e'));box(scene,3.5,4.8,-11.82,2.4,.18,.08,mat('#f5c64d'));
 box(scene,-5.5,3.2,-11.78,1.1,1.6,.12,mat('#f5b33c'));box(scene,5.3,3.1,-11.78,1.3,1.5,.12,mat('#19a58e'));
 makePotato();
}
let manualCanvas=null,manualTexture=null;
function drawManual(plan){
 if(!manualCanvas)return;
 const c=manualCanvas.getContext('2d');c.clearRect(0,0,1200,760);
 c.fillStyle='#f4edda';c.fillRect(0,0,1200,760);c.strokeStyle='#2855a2';c.lineWidth=12;c.strokeRect(18,18,1164,724);c.beginPath();c.moveTo(600,24);c.lineTo(600,736);c.stroke();
 c.fillStyle='#244b91';c.font='bold 44px sans-serif';c.fillText('STAGE 02 · SAFETY PROTOCOL',65,90);
 c.fillStyle='#1e2e4a';c.font='bold 34px sans-serif';c.fillText('스위치 조작 순서',65,160);
 const lines=(plan||[]).map((x,i)=>(i+1)+'. '+(x.label||x.n+'번 레버')+' '+(x.state?'올리기':'내리기'));
 c.font='bold 27px sans-serif';lines.forEach((t,i)=>{c.fillStyle='#23334f';c.fillText(t,70,250+i*90)});
 c.fillStyle='#244b91';c.font='bold 34px sans-serif';c.fillText('레버 위치 안내',655,160);
 for(let i=0;i<5;i++){const x=720+i*86;c.fillStyle=plan?.[0]?.n===i+1?'#efc340':'#d9d6cc';c.fillRect(x,225,58,105);c.strokeStyle='#263a5d';c.lineWidth=5;c.strokeRect(x,225,58,105);c.fillStyle='#1d2f4d';c.font='bold 30px sans-serif';c.fillText(String(i+1),x+20,285)}
 c.fillStyle='#31528a';c.font='24px sans-serif';c.fillText('앞에서 세는 번호와 뒤에서 세는 위치 표현을 구분해 조작하세요.',650,405);
 c.fillText('엄지 위 = 올리기   ·   엄지 아래 = 내리기',650,470);
 c.fillStyle='#6b665b';c.font='22px sans-serif';c.fillText('상대가 조작을 마칠 때마다 상태를 확인하세요.',65,660);
 if(manualTexture)manualTexture.needsUpdate=true;
}
function setFusePlan(plan){drawManual(plan)}
function makeManual(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,1.205,-1.05);
 const page=mat('#f4e9d1',.95),edge=mat('#b99b6c'),blue=mat('#2456a7');
 box(g,0,0,0,3.9,.055,2.48,edge);
 box(g,-.96,.04,0,1.9,.025,2.38,page);box(g,.96,.04,0,1.9,.025,2.38,page);
 box(g,0,.06,0,.07,.025,2.38,blue);
 manualCanvas=document.createElement('canvas');manualCanvas.width=1200;manualCanvas.height=760;
 manualTexture=new THREE.CanvasTexture(manualCanvas);manualTexture.colorSpace=THREE.SRGBColorSpace;
 const picture=new THREE.Mesh(new THREE.PlaneGeometry(3.78,2.39),new THREE.MeshBasicMaterial({map:manualTexture,side:THREE.DoubleSide}));
 picture.position.set(0,.058,0);picture.rotation.x=-Math.PI/2;g.add(picture);
 manualGroup=g;drawManual([]);
}
function makeSwitchPanel(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,1.205,-2.55);
 const shell=mat('#303b43',.48,.22),edge=mat('#b77a38',.5,.25),black=mat('#20262a',.34,.15);
 box(g,0,0,0,4.5,.16,2.15,shell);box(g,0,.09,.91,4.48,.08,.18,edge);
 const colors=[mat('#e65c45'),mat('#398ac4'),mat('#e8b844'),mat('#35a879'),mat('#8a6bb8')];
 switchMeshes=[];
 for(let i=0;i<5;i++){
  const x=-1.55+i*.775,z=-.12;
  box(g,x,.13,z,.58,.12,.62,edge);
  box(g,x,.205,z+.34,.43,.035,.25,mat('#e9dfc8'));
  flatText(g,String(i+1),x,.228,z+.34,.36,.18,{bg:'#e9dfc8',fg:'#28221a',size:115});
  const pivot=new THREE.Group();pivot.position.set(x,.25,z);g.add(pivot);
  const stem=box(pivot,0,.27,0,.12,.53,.13,black);stem.rotation.z=-.18;
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.145,20,16),colors[i]);cap.position.set(0,.3,0);stem.add(cap);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.66,.75,.66),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.set(0,.3,0);pivot.add(hit);hit.userData.switchNumber=i+1;
  switchMeshes.push({pivot,stem,hit,state:true});
 }
 switchPanelGroup=g;
}
function makeDoll(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,1.235,-3.55);dollMeshes.root=g;
 const plush=mat('#c98b55',.95),dark=mat('#30251f'),cream=mat('#fff1df'),shirt=mat('#398dc2'),pants=mat('#7ca99a');
 // A simple bear-shaped dress-up doll lying flat on its back on the desk.
 const torso=new THREE.Mesh(new THREE.SphereGeometry(1,40,28),plush);torso.scale.set(.48,.105,.62);torso.position.set(0,.075,.12);g.add(torso);dollMeshes.body=torso;
 const head=new THREE.Mesh(new THREE.SphereGeometry(1,36,28),plush);head.scale.set(.39,.14,.38);head.position.set(0,.09,-.58);g.add(head);dollMeshes.face=head;
 for(const side of [-1,1]){
  const ear=new THREE.Mesh(new THREE.SphereGeometry(.145,24,18),plush);ear.scale.set(1,.65,1);ear.position.set(side*.29,.09,-.84);g.add(ear);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,16,12),dark);eye.position.set(side*.14,.218,-.62);g.add(eye);
  const arm=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),plush);arm.scale.set(.28,.075,.13);arm.position.set(side*.63,.07,.02);arm.rotation.y=side*.18;g.add(arm);
  const leg=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),plush);leg.scale.set(.14,.075,.27);leg.position.set(side*.22,.065,.72);g.add(leg);
 }
 const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.14,24,16),cream);muzzle.scale.set(1,.42,.78);muzzle.position.set(0,.205,-.43);g.add(muzzle);
 const nose=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),dark);nose.position.set(0,.265,-.49);g.add(nose);
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.055,.012,8,20,Math.PI),dark);mouth.position.set(0,.245,-.34);mouth.rotation.x=Math.PI/2;g.add(mouth);
 // Shirt / dress panel, collar and trousers are separate recolorable pieces.
 const outfit=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),shirt);outfit.scale.set(.405,.035,.48);outfit.position.set(0,.165,.18);g.add(outfit);
 const collar=new THREE.Mesh(new THREE.TorusGeometry(.13,.025,8,24),cream);collar.position.set(0,.205,-.23);collar.rotation.x=Math.PI/2;g.add(collar);
 const pantsGroup=new THREE.Group();g.add(pantsGroup);
 for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),pants);leg.scale.set(.14,.035,.22);leg.position.set(side*.2,.145,.57);pantsGroup.add(leg)}
 dollMeshes.shoes=[];
 for(const side of [-1,1]){const shoe=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),mat('#7b4d9b'));shoe.scale.set(.16,.045,.13);shoe.position.set(side*.2,.15,.78);g.add(shoe);dollMeshes.shoes.push(shoe)}
 // Hat and bow remain optional, visibly separate color regions.
 const hat=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),mat('#e8bd42'));hat.scale.set(.34,.075,.22);hat.position.set(0,.19,-.77);g.add(hat);dollMeshes.headwear=hat;
 const bowGroup=new THREE.Group();bowGroup.position.set(0,.205,-.25);g.add(bowGroup);
 const bowMat=mat('#e34d63');
 for(const side of [-1,1]){const loop=new THREE.Mesh(new THREE.SphereGeometry(1,18,14),bowMat);loop.scale.set(.12,.035,.09);loop.position.x=side*.105;bowGroup.add(loop)}
 const knot=new THREE.Mesh(new THREE.SphereGeometry(.055,16,12),cream);knot.position.y=.012;bowGroup.add(knot);dollMeshes.accessory=bowGroup;
 dollMeshes.outfit=[outfit];
}
function setRole(r){currentRole=r||'B';setStage(currentStage)}
function setStage(n){
 currentStage=n;if(!ready)return;
 protocolObjects.forEach(o=>o.visible=false);
 if(manualGroup)manualGroup.visible=n===2&&currentRole==='A';
 if(switchPanelGroup)switchPanelGroup.visible=n===2&&currentRole==='B';
 switchMeshes.forEach(o=>{o.pivot.visible=n===2&&currentRole==='B';o.hit.visible=n===2&&currentRole==='B'});
 switchLabels.forEach(o=>o.visible=n===2&&currentRole==='B');
 Object.values(dollMeshes).forEach(o=>o.visible=n===3);
}
function setSwitch(n,state){const o=switchMeshes[n-1];if(!o)return;o.state=!!state;o.stem.rotation.z=state?-.18:.62;o.pivot.userData.state=!!state}
function setDollPart(part,color){
 const palette=['#e95b4a','#398dc2','#efc34b'];const c=palette[color]||'#999';const material=mat(c,.72);
 const target=dollMeshes[part];if(!target)return;
 const meshes=Array.isArray(target)?target:(target.isGroup?target.children: [target]);
 meshes.forEach(mesh=>{if(mesh.material&&mesh.material.color)mesh.material=material;else if(mesh.isGroup)mesh.children.forEach(child=>{if(child.material&&child.material.color)child.material=material})});
}
function updateBubble(){
 const el=document.getElementById('partnerBubble');if(!el||!avatarBubblePoint||!camera||!renderer)return;
 const p=avatarBubblePoint.clone().project(camera),rect=renderer.domElement.getBoundingClientRect();
 const visible=bubbleActive&&p.z<1&&p.z>-1&&p.y>-.95&&p.y<.95&&p.x>-.95&&p.x<.95;
 el.hidden=!visible;
 if(visible){el.style.left=((p.x*.5+.5)*rect.width)+'px';el.style.top=((-p.y*.5+.5)*rect.height)+'px'}
}
function showPartnerBubble(active){bubbleActive=!!active}
function onPointerMove(e){
 if(!ready)return;
 yaw=Math.max(-.32,Math.min(.32,yaw-e.movementX*.0025));pitch=Math.max(-1.42,Math.min(.35,pitch-e.movementY*.003));camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
}
function onClick(e){
 if(currentStage!==2||currentRole!=='B'||!ready)return;
 const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
 raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(switchMeshes.map(o=>o.hit),false);if(!hits.length)return;
 const n=hits[0].object.userData.switchNumber,obj=switchMeshes[n-1];setSwitch(n,!obj.state);if(window.handlinkSwitchAction)window.handlinkSwitchAction(n);
}
function init(){
 if(ready)return;host=document.getElementById('threeStage');if(!host||!window.THREE)return;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(66,1,.08,80);camera.position.set(0,4.35,-.65);camera.rotation.order='YXZ';camera.rotation.x=pitch;
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;host.appendChild(renderer.domElement);
 renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());renderer.domElement.addEventListener('pointermove',onPointerMove);renderer.domElement.addEventListener('click',onClick);
 makeRoom();makeManual();makeSwitchPanel();makeDoll();
 const panel=scene.children.find(o=>o.type==='Group'&&o.position.x===0&&o.position.z===-2.55&&o.children.length>10);if(panel)panel.name='fuseDeskPanel';
 // Hide puzzle objects until a stage and role are selected
 protocolObjects.forEach(o=>o.visible=false);if(manualGroup)manualGroup.visible=false;if(switchPanelGroup)switchPanelGroup.visible=false;
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
 new ResizeObserver(resize).observe(host);resize();ready=true;setStage(1);animate();
}
function animate(){requestAnimationFrame(animate);if(ready){renderer.render(scene,camera);updateBubble()}}
window.Handlink3D={init,setStage,setRole,setSwitch,setDollPart,setFusePlan,showPartnerBubble};
})();