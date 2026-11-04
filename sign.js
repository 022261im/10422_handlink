(()=> {
const $=id=>document.getElementById(id),video=$('video'),canvas=$('view'),ctx=canvas.getContext('2d');
let holistic=null,camera=null,running=false,recording=false,recordStart=0,frames=[],templates=[],latest=[],lastAuto=0;
const FACE=[1,33,263,61,291,199],POSE=[0,11,12,13,14,15,16,23,24];
const duration=2400,frameLimit=24;
function pointSet(list,ids){const out=[];for(const id of ids){const p=list?.[id];out.push(p?.x??0,p?.y??0,p?.z??0)}return out}
function featureVector(r){
 const f=pointSet(r.faceLandmarks,FACE),p=pointSet(r.poseLandmarks,POSE);
 const left=pointSet(r.leftHandLandmarks,Array.from({length:21},(_,i)=>i));
 const right=pointSet(r.rightHandLandmarks,Array.from({length:21},(_,i)=>i));
 return [...f,...p,...left,...right];
}
function draw(r){
 if(!video.videoWidth)return;const w=video.videoWidth,h=video.videoHeight;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 ctx.clearRect(0,0,w,h);ctx.drawImage(r.image,0,0,w,h);
 const drawPts=(pts,color)=>{if(!pts)return;ctx.fillStyle=color;for(const p of pts){ctx.beginPath();ctx.arc(p.x*w,p.y*h,Math.max(2,w/240),0,Math.PI*2);ctx.fill()}};
 drawPts(r.poseLandmarks,'#a7ed6b');drawPts(r.faceLandmarks,'#f3d18a');drawPts(r.leftHandLandmarks,'#fff');drawPts(r.rightHandLandmarks,'#7ed9c1');
 const hands=(r.leftHandLandmarks?1:0)+(r.rightHandLandmarks?1:0);
 $('handsCount').textContent=hands+' / 2';$('faceState').textContent=r.faceLandmarks?'추적 중':'미검출';$('poseState').textContent=r.poseLandmarks?'추적 중':'미검출';
 const hasBody=!!r.poseLandmarks,hasHand=hands>0;
 $('scanLabel').textContent=hasHand&&hasBody?'BODY + HANDS TRACKING':'SHOW HANDS AND UPPER BODY';
 const vec=featureVector(r);
 if(recording&&hasBody&&hasHand){frames.push({t:performance.now()-recordStart,v:vec});const pct=Math.min(100,(performance.now()-recordStart)/duration*100);$('progress').style.width=pct+'%';}
 latest.push({t:performance.now(),v:vec});if(latest.length>frameLimit)latest.shift();
 if(recording&&performance.now()-recordStart>=duration)finishRecording();
 if($('auto').checked&&templates.length&&latest.length>=frameLimit&&performance.now()-lastAuto>1300){lastAuto=performance.now();recognize(latest.slice(-frameLimit),false)}
}
function normalize(seq){
 if(seq.length<5)return [];
 const n=frameLimit,out=[];
 for(let i=0;i<n;i++){const idx=Math.round(i*(seq.length-1)/(n-1));out.push(seq[idx].v)}
 return out;
}
function distance(a,b){
 const d=(x,y)=>{let sum=0,count=0;for(let i=0;i<x.length;i+=3){const dx=x[i]-y[i],dy=x[i+1]-y[i+1],dz=x[i+2]-y[i+2];sum+=dx*dx+dy*dy+dz*dz;count++}return Math.sqrt(sum/Math.max(1,count))};
 const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>Array(m+1).fill(Infinity));dp[0][0]=0;
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)dp[i][j]=d(a[i-1],b[j-1])+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
 return dp[n][m]/(n+m);
}
function recognize(seq,announce=true){
 if(!templates.length){$('result').textContent='먼저 표현 샘플을 등록해 주세요.';return}
 const input=normalize(seq);if(!input.length)return;
 const ranked=templates.map(t=>({phrase:t.phrase,score:distance(input,t.seq)})).sort((a,b)=>a.score-b.score);
 const best=ranked[0],second=ranked[1];const gap=second?second.score-best.score:0;
 const accepted=best.score<.22&&( !second||gap>.012 );
 if(accepted){$('result').textContent=best.phrase;$('confidence').textContent='샘플 유사도 기반 추정 · '+best.score.toFixed(3);$('speak').disabled=false;if(announce)speak(best.phrase)}
 else{$('result').textContent='등록된 표현과 일치하는 동작을 찾지 못했어요.';$('confidence').textContent='판단 보류 · 거리 '+best.score.toFixed(3);$('speak').disabled=true}
}
function speak(text){if(!('speechSynthesis'in window)){alert('이 브라우저는 음성 출력을 지원하지 않습니다.');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.92;speechSynthesis.speak(u)}
function renderSamples(){
 $('sampleCount').textContent=templates.length+'개 샘플';
 $('samples').innerHTML=templates.length?templates.map((t,i)=>'<div class="sample"><span>'+escapeHtml(t.phrase)+'</span><b>시퀀스 '+(i+1)+'</b></div>').join(''):'<p class="empty">아직 등록된 샘플이 없습니다.</p>';
 $('recognize').disabled=!templates.length;
}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function finishRecording(){
 recording=false;$('record').disabled=false;$('record').textContent='● 동작 샘플 녹화';$('progress').style.width='0%';
 const phrase=$('phrase').value.trim(),seq=normalize(frames);
 if(!phrase||seq.length<5){$('recordState').textContent='유효한 동작 데이터가 충분하지 않아요. 손과 상체가 보이도록 다시 촬영해 주세요.';return}
 templates.push({phrase,seq});renderSamples();$('recordState').textContent='“'+phrase+'” 시퀀스를 등록했어요. 같은 표현을 다른 조건에서도 추가 촬영해 보세요.';$('modelState').textContent='샘플 '+templates.length+'개 등록';
}
async function start(){
 if(running)return;
 try{
 if(!window.Holistic||!window.Camera)throw Error('MediaPipe Holistic 모듈을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
 holistic=new Holistic({locateFile:file=>'https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/'+file});
 holistic.setOptions({modelComplexity:1,smoothLandmarks:true,enableSegmentation:false,refineFaceLandmarks:true,minDetectionConfidence:.55,minTrackingConfidence:.55});
 holistic.onResults(draw);
 camera=new Camera(video,{onFrame:async()=>{if(holistic)await holistic.send({image:video})},width:640,height:480});
 await camera.start();running=true;$('placeholder').classList.add('hidden');$('start').disabled=true;$('stop').disabled=false;$('record').disabled=false;$('cameraState').textContent='카메라 연결됨';$('cameraState').classList.add('green');$('modelState').textContent='랜드마크 추출 중';
 }catch(e){alert(e.message||'카메라를 시작하지 못했습니다. HTTPS와 카메라 권한을 확인해 주세요.');await stop()}
}
async function stop(){
 recording=false;if(camera){camera.stop();camera=null}if(holistic){try{await holistic.close()}catch{}holistic=null}
 running=false;$('placeholder').classList.remove('hidden');$('start').disabled=false;$('stop').disabled=true;$('record').disabled=true;$('cameraState').textContent='카메라 대기';$('cameraState').classList.remove('green');$('scanLabel').textContent='WAITING FOR CAMERA';
}
$('start').addEventListener('click',start);$('stop').addEventListener('click',stop);
$('record').addEventListener('click',()=>{
 if(recording){finishRecording();return}
 const phrase=$('phrase').value.trim();if(!phrase){$('phrase').focus();$('recordState').textContent='먼저 표현의 한국어 의미를 입력해 주세요.';return}
 frames=[];recording=true;recordStart=performance.now();$('record').disabled=true;$('record').textContent='녹화 중…';$('recordState').textContent='약 2.4초 동안 동작을 자연스럽게 표현해 주세요.';$('progress').style.width='0%';
});
$('clear').addEventListener('click',()=>{templates=[];renderSamples();$('modelState').textContent='샘플 대기';$('result').textContent='수어 동작을 입력하면 결과가 여기에 표시됩니다.';$('confidence').textContent='아직 분석 전';$('speak').disabled=true});
$('recognize').addEventListener('click',()=>recognize(latest.slice(-frameLimit),true));
$('speak').addEventListener('click',()=>speak($('result').textContent));
$('phrase').addEventListener('input',()=>{$('record').disabled=!running||!$('phrase').value.trim()});
$('auto').addEventListener('change',()=>{if(!$('auto').checked)$('confidence').textContent='자동 분석 꺼짐'});
window.addEventListener('beforeunload',()=>{if(camera)camera.stop();if('speechSynthesis'in window)speechSynthesis.cancel()});
})();