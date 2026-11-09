(()=>{'use strict';
let scene,renderer,camera,host,ready=false,role='B',avatarHead,avatarBubblePoint;
const mat=(c,r=.72,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function box(parent,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o}
function ball(parent,x,y,z,r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,20,16),m);o.position.set(x,y,z);parent.add(o);return o}
function makeAvatar(){
 const group=new THREE.Group();scene.add(group);group.position.set(0,0,-5.1);
 const body=mat('#6d5140'),skin=mat('#e5b995'),dark=mat('#2b211c'),white=mat('#fff7e9');
 // seated silhouette, intentionally simple and friendly
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.48,.55,.95,24),body);torso.position.set(0,1.05,0);group.add(torso);
 const head=ball(group,0,1.95,0,.48,skin);head.scale.set(1,.96,.82);
 // tiny dot eyes facing the player
 ball(group,-.16,2.02,.39,.045,dark);ball(group,.16,2.02,.39,.045,dark);
 const mouth=new THREE.Mesh(new THREE.TorusGeometry(.095,.018,8,24,Math.PI),dark);mouth.position.set(0,1.82,.405);mouth.rotation.z=Math.PI;group.add(mouth);
 const armL=box(group,-.48,1.02,.25,.18,.7,.2,skin);armL.rotation.z=-.45;
 const armR=box(group,.48,1.02,.25,.18,.7,.2,skin);armR.rotation.z=.45;
 const legL=box(group,-.25,.35,.45,.3,.18,.8,mat('#41352d'));const legR=box(group,.25,.35,.45,.3,.18,.8,mat('#41352d'));
 avatarHead=head;avatarBubblePoint=new THREE.Vector3(0,2.55,-5.1);
}
function buildRoom(){
 scene.background=new THREE.Color('#3a281d');scene.fog=new THREE.Fog('#3a281d',13,28);
 scene.add(new THREE.HemisphereLight('#f1d7b5','#2b1b13',1.7));
 const key=new THREE.PointLight('#ffbd7b',70,18);key.position.set(-1,5,-3);scene.add(key);
 const fill=new THREE.PointLight('#9ab7d0',15,13);fill.position.set(4,2,0);scene.add(fill);
 box(scene,0,-.18,-4,14,.35,18,mat('#4b382a'));box(scene,0,3.6,-12,14,7,.25,mat('#30221a'));box(scene,-7,3.6,-4,.25,7,16,mat('#39271d'));box(scene,7,3.6,-4,.25,7,16,mat('#39271d'));box(scene,0,7,-4,14,.2,16,mat('#30221a'));
 for(let i=0;i<5;i++){box(scene,-5+i*2.5,3.58,-11.82,1.9,.08,.06,mat('#8a6546'));box(scene,-5+i*2.5,2.8,-11.82,.06,1.5,.06,mat('#8a6546'))}
 // tabletop fills the lower half of the fixed first-person view
 box(scene,0,.88,-2.65,6.4,.22,3.2,mat('#754b2e'));box(scene,0,.35,-2.65,5.8,.85,2.8,mat('#4c3021'));
 const panel=box(scene,0,1.02,-3.65,3.7,.1,1.25,mat('#25292a',.5,.25));panel.rotation.x=-.08;
 // Three numbered physical signal lamps on the table
 const brass=mat('#bd9a68',.38,.5),dark=mat('#171a1b',.55,.3),glow=[mat('#e3a54e',.25,.15),mat('#e3a54e',.25,.15),mat('#e3a54e',.25,.15)];
 for(let i=0;i<3;i++){const x=-1.1+i*1.1;const base=new THREE.Mesh(new THREE.CylinderGeometry(.27,.3,.12,24),brass);base.position.set(x,1.12,-3.6);scene.add(base);const lamp=ball(scene,x,1.32,-3.6,.17,glow[i]);lamp.material.emissive=new THREE.Color('#9c5d20');lamp.material.emissiveIntensity=.6;const label=box(scene,x,1.14,-3.25,.34,.24,.04,dark);label.userData.number=i+1}
 // desk edge, small tools and bolts
 for(let i=0;i<6;i++){const bolt=ball(scene,-2.35+i*.9,1.02,-1.55,.055,brass);bolt.scale.set(1,.35,1)}
 makeAvatar();
}
function updateBubble(){const el=document.getElementById('partnerBubble');if(!el||!avatarBubblePoint||!camera||!renderer)return;const p=avatarBubblePoint.clone().project(camera);const rect=renderer.domElement.getBoundingClientRect();const x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;el.style.left=x+'px';el.style.top=y+'px';}
function init(r='B'){if(ready)return;role=r||'B';host=document.getElementById('threeStage');if(!host||!window.THREE)return;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(58,1,.08,80);camera.position.set(0,2.05,4.3);camera.lookAt(0,1.65,-4.7);renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);buildRoom();const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(host);resize();ready=true;animate()}
function animate(){requestAnimationFrame(animate);if(!ready)return;renderer.render(scene,camera);updateBubble()}
window.Handlink3D={init};
})();