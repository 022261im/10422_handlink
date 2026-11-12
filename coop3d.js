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
 // Sunglasses only; no hat, beanie, eyebrows, or costume.
 const glasses=new THREE.Group();glasses.position.set(0,1.43,.81);g.add(glasses);
 for(const side of [-1,1]){
  const x=side*.245;
  const rim=new THREE.Mesh(new THREE.BoxGeometry(.43,.27,.065),frame);
  rim.position.set(x,0,0);glasses.add(rim);
  const lens=new THREE.Mesh(new THREE.BoxGeometry(.375,.215,.035),lensMat);
  lens.position.set(x,0,.045);glasses.add(lens);
  const arm=box(glasses,side*.45,0,-.13,.17,.045,.055,frame);arm.rotation.y=side*.2;
 }
 box(glasses,0,0,.025,.13,.055,.07,frame);
 const glintMat=new THREE.MeshBasicMaterial({color:'#a9cbdc'});
 for(const side of [-1,1]){
  const glint=box(glasses,side*.245-.075,.065,.068,.035,.012,.008,glintMat);glint.rotation.z=-.3;
 }
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
function makeManual(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,1.205,-1.05);
 const page=mat('#f4e9d1',.95),edge=mat('#b99b6c'),blue=mat('#2456a7'),ink=mat('#1e3558');
 // open two-page instruction booklet resting flat on the desk
 box(g,0,0,0,3.9,.055,2.48,edge);
 box(g,-.96,.04,0,1.9,.025,2.38,page);box(g,.96,.04,0,1.9,.025,2.38,page);
 box(g,0,.06,0,.07,.025,2.38,blue);
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=760;const c=canvas.getContext('2d');
 c.fillStyle='#f4edda';c.fillRect(0,0,1200,760);c.strokeStyle='#2855a2';c.lineWidth=12;c.strokeRect(18,18,1164,724);c.beginPath();c.moveTo(600,24);c.lineTo(600,736);c.stroke();
 c.fillStyle='#244b91';c.font='bold 44px sans-serif';c.fillText('STAGE 02 · SAFETY PROTOCOL',65,90);
 c.fillStyle='#1e2e4a';c.font='bold 34px sans-serif';c.fillText('스위치 조작 순서',65,160);
 const lines=['1. 노란 표시등이 켜진 2번 레버 내리기','2. 3번 레버 올리기','3. 5번 레버 내리기','4. 1번 레버 올리기'];
 c.font='bold 27px sans-serif';lines.forEach((t,i)=>{c.fillStyle='#23334f';c.fillText(t,70,250+i*90)});
 c.fillStyle='#244b91';c.font='bold 34px sans-serif';c.fillText('레버 위치 안내',655,160);
 for(let i=0;i<6;i++){const x=690+i*78;c.fillStyle=i===1?'#efc340':'#d9d6cc';c.fillRect(x,225,56,105);c.strokeStyle='#263a5d';c.lineWidth=5;c.strokeRect(x,225,56,105);c.fillStyle='#1d2f4d';c.font='bold 30px sans-serif';c.fillText(String(i+1),x+19,285)}
 c.fillStyle='#31528a';c.font='24px sans-serif';c.fillText('노란 표시등이 켜진 번호를 먼저 확인하세요.',650,405);
 c.fillText('엄지 위 = 올리기   ·   엄지 아래 = 내리기',650,470);
 c.fillStyle='#6b665b';c.font='22px sans-serif';c.fillText('상대가 조작을 마칠 때마다 상태를 확인하세요.',65,660);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const picture=new THREE.Mesh(new THREE.PlaneGeometry(3.78,2.39),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));picture.position.set(0,.058,0);picture.rotation.x=-Math.PI/2;g.add(picture);
 manualGroup=g;
}
function makeSwitchPanel(){
 const g=new THREE.Group();scene.add(g);g.position.set(0,1.205,-2.55);
 const shell=mat('#303b43',.48,.22),edge=mat('#b77a38',.5,.25),black=mat('#20262a',.34,.15),red=mat('#e65c45'),yellow=mat('#f2c443'),green=mat('#35b77c'),blue=mat('#398ac4');
 box(g,0,0,0,4.5,.16,2.15,shell);box(g,0,.09,.91,4.48,.08,.18,edge);
 const colors=[red,blue,yellow,green,red,blue];
 switchMeshes=[];
 for(let i=0;i<6;i++){
  const x=-1.78+i*.712,z=-.12;
  // Individual metal toggle base and lever, with the number engraved on a front-facing plate
  box(g,x,.13,z,.55,.12,.62,edge);
  box(g,x,.205,z+.34,.43,.035,.25,mat('#e9dfc8'));
  flatText(g,String(i+1),x,.228,z+.34,.36,.18,{bg:'#e9dfc8',fg:'#28221a',size:115});
  const pivot=new THREE.Group();pivot.position.set(x,.25,z);g.add(pivot);
  const stem=box(pivot,0,.27,0,.12,.53,.13,black);stem.rotation.z=-.18;
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.145,20,16),colors[i]);cap.position.set(0,.3,0);stem.add(cap);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(.62,.72,.62),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.set(0,.3,0);pivot.add(hit);hit.userData.switchNumber=i+1;
  switchMeshes.push({pivot,stem,hit,state:true});
  if(i===1){const lamp=ball(g,x,.31,z-.39,.105,yellow);lamp.material.emissive=new THREE.Color('#ffc52e');lamp.material.emissiveIntensity=2.4;g.add(lamp)}
 }
 // Decorative colored cables make the control device read as a real machine
 for(let i=0;i<4;i++){const cable=new THREE.Mesh(new THREE.TorusGeometry(.22,.045,8,28,Math.PI),[red,blue,yellow,green][i]);cable.rotation.x=Math.PI/2;cable.position.set(-1.5+i*.55,.2,-.86);g.add(cable)}
 switchPanelGroup=g;
}
function makeDoll(){
 const skin=mat('#e8bd91'),red=mat('#e95b4a'),blue=mat('#398dc2'),yellow=mat('#efc34b');
 dollMeshes.hat=new THREE.Mesh(new THREE.ConeGeometry(.33,.32,5),red);dollMeshes.hat.position.set(0,2.1,-3.5);scene.add(dollMeshes.hat);
 dollMeshes.shirt=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.68,12),blue);dollMeshes.shirt.position.set(0,1.52,-3.5);scene.add(dollMeshes.shirt);
 dollMeshes.head=ball(scene,0,1.98,-3.5,.25,skin);scene.add(dollMeshes.head);dollMeshes.shoes=box(scene,0,1.1,-3.5,.65,.18,.34,yellow);
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
function setDollPart(part,color){const o=dollMeshes[part];if(!o)return;o.material=mat(['#e95b4a','#398dc2','#efc34b'][color]||'#999',.7)}
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
window.Handlink3D={init,setStage,setRole,setSwitch,setDollPart,showPartnerBubble};
})();