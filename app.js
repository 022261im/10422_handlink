(()=> {
const $=id=>document.getElementById(id), video=$('inputVideo'),canvas=$('outputCanvas'),ctx=canvas.getContext('2d');
let hands=null,camera=null,mode='communication',candidate='',stableFrames=0,candidateStart=0,lastTrigger=0,currentGesture='',recentClassifications=[],currentPhrase='',lastSpoken='',autoSpeak=true,selected=0,confirmed=false,logs=[],cameraBusy=false;
const gestures={
 point:{label:'검지 가리키기',icon:'☝️',phrase:'이것을 원해요'},
 open:{label:'손바닥 펴기',icon:'✋',phrase:'잠시만 기다려 주세요'},
 fist:{label:'주먹 쥐기',icon:'✊',phrase:'아니요 / 취소할게요'},
 peace:{label:'브이',icon:'✌️',phrase:'도와주세요'},
 thumb:{label:'엄지 올리기',icon:'👍',phrase:'네, 알겠습니다'},
 three:{label:'세 손가락',icon:'🤟',phrase:'다시 설명해 주세요'},
 pinch:{label:'엄지와 검지 모으기',icon:'👌',phrase:'괜찮아요'},
 four:{label:'네 손가락',icon:'🖖',phrase:'메뉴 4 선택'}
};
const kioskGesture={point:0,peace:1,three:2,four:3};
const menu=[...document.querySelectorAll('.food-item')];
function toast(s){const t=$('toast');t.textContent=s;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,2500)}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function angleAt(a,b,c){
 const ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y;
 const den=Math.hypot(ux,uy)*Math.hypot(vx,vy);
 if(!den)return 0;
 return Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/den)))*180/Math.PI;
}
function fingerExtended(p,mcp,pip,tip,palm){
 const straight=angleAt(p[mcp],p[pip],p[tip])>145;
 const reach=dist(p[0],p[tip])-dist(p[0],p[pip])>palm*.10;
 return straight&&reach;
}
function classify(p){
 const palm=Math.max(dist(p[5],p[17]),dist(p[0],p[9])*.55,.001);
 const index=fingerExtended(p,5,6,8,palm);
 const middle=fingerExtended(p,9,10,12,palm);
 const ring=fingerExtended(p,13,14,16,palm);
 const pink=fingerExtended(p,17,18,20,palm);
 const thumbIndex=dist(p[4],p[8])/palm;
 const thumbRaised=p[4].y<p[0].y-palm*.22 && p[4].y<p[3].y-palm*.08;
 const otherCurled=!index&&!middle&&!ring&&!pink;
 // "괜찮아요": thumb and index touch, with the other three fingers extended.
 if(thumbIndex<.30&&middle&&ring&&pink)return 'pinch';
 // "엄지 올리기": thumb is clearly above the wrist while the four fingers are curled.
 if(thumbRaised&&otherCurled&&dist(p[4],p[2])>palm*.45)return 'thumb';
 if(index&&middle&&ring&&!pink)return 'three';
 if(index&&middle&&!ring&&!pink)return 'peace';
 if(index&&!middle&&!ring&&!pink)return 'point';
 if(index&&middle&&ring&&pink)return 'open';
 if(!index&&!middle&&!ring&&!pink)return 'fist';
 return null;
}
function drawResults(res){
 if(!video.videoWidth)return;
 const w=video.videoWidth,h=video.videoHeight;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 ctx.clearRect(0,0,w,h);ctx.drawImage(res.image,0,0,w,h);
 const p=res.multiHandLandmarks?.[0];
 if(!p){candidate='';stableFrames=0;recentClassifications=[];currentGesture='';$('recognitionState').textContent='손을 찾고 있어요';$('recognitionHelp').textContent='손 전체를 카메라 안에 보여 주세요.';$('stateLed').classList.remove('active');$('cameraHint').textContent='SHOW YOUR HAND';$('confidenceBar').style.width='0%';$('confidenceText').textContent='—';return}
 const xs=p.map(a=>a.x*w),ys=p.map(a=>a.y*h),pad=Math.max(w*.035,16);
 const x0=Math.max(0,Math.min(...xs)-pad),y0=Math.max(0,Math.min(...ys)-pad),x1=Math.min(w,Math.max(...xs)+pad),y1=Math.min(h,Math.max(...ys)+pad);
 ctx.save();ctx.strokeStyle='#a7ed6b';ctx.lineWidth=Math.max(3,w/240);ctx.shadowColor='#a7ed6b';ctx.shadowBlur=12;ctx.strokeRect(x0,y0,x1-x0,y1-y0);ctx.shadowBlur=0;
 ctx.fillStyle='#a7ed6b';ctx.fillRect(x0,y0,Math.min(155,w-x0),Math.max(25,h/23));ctx.fillStyle='#101b17';ctx.font='bold '+Math.max(12,w/55)+'px sans-serif';ctx.fillText('HAND DETECTED',x0+8,y0+Math.max(17,h/34));
 const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
 ctx.strokeStyle='#b9ef95';ctx.lineWidth=Math.max(2,w/360);for(const [a,b] of links){ctx.beginPath();ctx.moveTo(p[a].x*w,p[a].y*h);ctx.lineTo(p[b].x*w,p[b].y*h);ctx.stroke()}
 for(const a of p){ctx.beginPath();ctx.arc(a.x*w,a.y*h,Math.max(2,w/190),0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#1c5a43';ctx.lineWidth=2;ctx.stroke()}
 ctx.restore();
 const rawGesture=classify(p);
 recentClassifications.push(rawGesture);if(recentClassifications.length>9)recentClassifications.shift();
 const votes={};for(const item of recentClassifications){if(item)votes[item]=(votes[item]||0)+1;}
 const best=Object.keys(votes).sort((a,b)=>votes[b]-votes[a])[0];
 const g=best&&votes[best]>=6?best:null;
 if(!g){candidate='';stableFrames=0;$('recognitionState').textContent='동작을 구분 중';$('recognitionHelp').textContent='손 모양을 조금 더 분명하게 유지해 주세요.';$('confidenceBar').style.width='25%';$('confidenceText').textContent='분석 중';return}
 if(g===candidate)stableFrames++;else{candidate=g;stableFrames=1;candidateStart=performance.now()}
 const ready=stableFrames>=8;
 $('recognitionState').textContent=ready?'동작 인식 완료':'동작 확인 중 · '+Math.min(stableFrames,8)+'/8';
 $('recognitionHelp').textContent=ready?'인식 결과를 확인하세요.':'같은 손 모양을 잠깐 유지해 주세요.';
 $('recognitionOutput').textContent=gestures[g].icon+' '+gestures[g].label;
 $('confidenceBar').style.width=(Math.min(stableFrames/8,1)*100)+'%';$('confidenceText').textContent=ready?'안정 인식':Math.round(stableFrames/8*100)+'%';
 $('stateLed').classList.toggle('active',ready);$('cameraHint').textContent=ready?'GESTURE RECOGNIZED':'TRACKING HAND';
 if(ready&&g!==currentGesture&&performance.now()-lastTrigger>600){currentGesture=g;lastTrigger=performance.now();const ms=Math.round(performance.now()-candidateStart);record(gestures[g].icon+' '+gestures[g].label,'안정 인식',ms);activate(g)}
}
function record(label,status='안정 인식',ms='—'){
 logs.unshift({time:new Date(),label,status,ms});logs=logs.slice(0,100);
 $('metricRecognized').textContent=logs.filter(a=>a.status==='안정 인식').length;
 const nums=logs.filter(a=>typeof a.ms==='number').map(a=>a.ms);
 $('metricLatency').textContent=nums.length?Math.round(nums.reduce((a,b)=>a+b,0)/nums.length):'—';
 $('metricLast').textContent=logs[0]?.status||'—';
 $('eventLog').innerHTML=logs.slice(0,20).map(a=>'<div class="log-row"><span class="log-time">'+a.time.toLocaleTimeString('ko-KR')+'</span><span class="log-label">'+escapeHtml(a.label)+'</span><span class="log-status">'+a.status+(typeof a.ms==='number'?' · '+a.ms+'ms':'')+'</span></div>').join('')||'<p class="empty-log">아직 기록이 없어요.</p>';
}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
function speakOnce(text){
 if(!autoSpeak||!text||text===lastSpoken)return;
 if(!('speechSynthesis'in window))return;
 lastSpoken=text;speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text);utterance.lang='ko-KR';utterance.rate=.92;speechSynthesis.speak(utterance);
}
function updatePhrase(g){
 const phrase=gestures[g].phrase;currentPhrase=phrase;
 $('messageOutput').textContent=phrase;
 document.querySelectorAll('.phrase-row').forEach(el=>el.classList.toggle('active',el.dataset.gesture===g));
 speakOnce(phrase);
}
function choose(i){
 selected=(i+menu.length)%menu.length;confirmed=false;
 menu.forEach((b,j)=>b.classList.toggle('selected',j===selected));
 const b=menu[selected];$('kioskSelected').textContent=b.querySelector('.food-emoji').textContent+'　'+b.dataset.item;
 $('kioskPrice').textContent=b.dataset.price==='0'?'안내':Number(b.dataset.price).toLocaleString('ko-KR')+'원';
 $('kioskStatus').textContent='선택 '+b.dataset.number+'번: '+b.dataset.item+'. 엄지 올리기로 확인하세요.';
}
function confirmKiosk(){
 const b=menu[selected];
 if(b.dataset.item==='도움 요청'){$('kioskStatus').textContent='도움 안내: 직원에게 도움이 필요하다고 말해 주세요. 실제 호출은 되지 않습니다.';record('도움 안내 표시','데모');return}
 confirmed=true;$('kioskStatus').textContent=b.dataset.item+' 선택을 확인했어요. 실제 주문은 진행되지 않습니다.';
 record('선택 확인: '+b.dataset.item,'확인 완료');toast('선택을 확인했어요. 데모 화면입니다.');
}
function cancelKiosk(){choose(0);$('kioskStatus').textContent='선택을 취소했어요. 1번 음료로 돌아왔어요.';record('키오스크 취소','취소 완료')}
function helpKiosk(){$('kioskStatus').textContent='도움 안내: 1~4번은 손가락 개수, 엄지는 확인, 주먹은 취소예요. 실제 호출은 되지 않습니다.';record('도움말 표시','데모');toast('손동작 안내를 표시했어요.')}
function activate(g){
 if(mode==='communication'){updatePhrase(g);return}
 if(mode==='kiosk'){
   if(Object.prototype.hasOwnProperty.call(kioskGesture,g)){choose(kioskGesture[g]);record('메뉴 '+(selected+1)+'번 선택','메뉴 선택');return}
   if(g==='thumb'){confirmKiosk();return}
   if(g==='fist'){cancelKiosk();return}
   if(g==='open'){helpKiosk();return}
   if(g==='pinch'){choose(selected===0?menu.length-1:selected-1);return}
   return;
 }
 if(mode==='research')toast('인식 기록에 추가했어요: '+gestures[g].label);
}
async function startCamera(){
 if(cameraBusy)return;cameraBusy=true;
 try{
  if(!window.Hands||!window.Camera)throw Error('손 인식 모듈을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.');
  if(!navigator.mediaDevices?.getUserMedia)throw Error('이 브라우저에서 카메라를 사용할 수 없어요. HTTPS 주소로 접속해 주세요.');
  hands=new Hands({locateFile:file=>'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/'+file});
  hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.68,minTrackingConfidence:.62});
  hands.onResults(drawResults);
  camera=new Camera(video,{onFrame:async()=>{if(hands)await hands.send({image:video})},width:640,height:480});
  await camera.start();
  $('cameraPlaceholder').classList.add('hidden');$('stopCamera').disabled=false;$('startCamera').disabled=true;
  $('modelTag').textContent='실시간 인식';$('topStatus').textContent='카메라 연결됨';$('statusDot').classList.add('live');
  $('recognitionState').textContent='손을 찾고 있어요';$('recognitionHelp').textContent='손 전체를 화면 안에 보여 주세요.';toast('카메라 연결 완료');
 }catch(e){if(hands){try{await hands.close()}catch{}hands=null}camera=null;toast(e.message||'카메라 권한을 확인해 주세요.');$('recognitionState').textContent='연결에 실패했어요';$('recognitionHelp').textContent='카메라 권한과 HTTPS 연결을 확인해 주세요.'}
 finally{cameraBusy=false}
}
async function stopCamera(){
 if(camera){camera.stop();camera=null}if(hands){try{await hands.close()}catch{}hands=null}
 $('cameraPlaceholder').classList.remove('hidden');$('stopCamera').disabled=true;$('startCamera').disabled=false;
 $('modelTag').textContent='대기 중';$('topStatus').textContent='카메라 연결 전';$('statusDot').classList.remove('live');
 $('recognitionState').textContent='대기 중';$('recognitionHelp').textContent='카메라를 시작하면 인식이 진행됩니다.';$('recognitionOutput').textContent='아직 인식된 동작이 없어요.';
 $('cameraHint').textContent='WAITING FOR CAMERA';$('stateLed').classList.remove('active');$('confidenceBar').style.width='0%';$('confidenceText').textContent='—';ctx.clearRect(0,0,canvas.width,canvas.height);
 candidate='';stableFrames=0;currentGesture='';
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
 mode=b.dataset.mode;document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===b));document.querySelectorAll('.mode-content').forEach(p=>p.classList.toggle('active',p.id===mode+'Panel'));
 if(mode==='kiosk')$('recognitionHelp').textContent='1~4개 손가락은 메뉴, 엄지는 확인, 주먹은 취소, 손바닥은 도움말입니다.';
 else if(mode==='communication')$('recognitionHelp').textContent='동작을 유지하면 문구가 표시됩니다.';
 else $('recognitionHelp').textContent='안정적으로 인식된 동작이 기록됩니다.';
}));
$('startCamera').addEventListener('click',startCamera);$('stopCamera').addEventListener('click',stopCamera);
$('speakOutput').addEventListener('click',()=>{if(currentPhrase){lastSpoken='';speakOnce(currentPhrase)}else toast('먼저 손동작을 인식해 주세요.')});
$('kioskConfirm').addEventListener('click',confirmKiosk);$('kioskCancel').addEventListener('click',cancelKiosk);$('kioskHelp').addEventListener('click',helpKiosk);
menu.forEach((b,i)=>b.addEventListener('click',()=>choose(i)));
$('autoSpeak').addEventListener('click',()=>{autoSpeak=!autoSpeak;$('autoSpeak').classList.toggle('on',autoSpeak);$('autoSpeak').setAttribute('aria-checked',String(autoSpeak));if(!autoSpeak&&'speechSynthesis'in window)speechSynthesis.cancel()});
$('exportLog').addEventListener('click',()=>{
 if(!logs.length){toast('내보낼 기록이 없어요.');return}
 const rows=[['time','event','status','stabilization_ms'],...logs.slice().reverse().map(a=>[a.time.toISOString(),a.label,a.status,a.ms])];
 const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='handlink-session-log.csv';a.click();URL.revokeObjectURL(url);
});
window.addEventListener('beforeunload',()=>{if(camera)camera.stop();if('speechSynthesis'in window)speechSynthesis.cancel()});
})();