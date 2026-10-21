'use strict';
/* 한 줄 v5 — 인터랙션 시안 레이어
   app.js(v4)의 흐름·데이터는 그대로 두고, 화면마다 손으로 만지는 재미를 얹는다.
   01 끌어서 흔드는 한 줄(줄 물리) → 세 갈래로 갈라짐
   02 눈금자를 밀어 나이 맞추기
   03 고른 상태가 '나' 토큰에 하나씩 붙음
   04 기준이 사라질 때 입자로 부서짐
   05 숫자가 기준값에서 실제값으로 굴러감
   06 19→34세 자동 재생 + 사람마다 다른 박자로 뛰는 맥박(템포)
   07 끈에 매달린 책갈피 — 끌면 흔들리고, 누르면 뒤집힘 */
(()=>{
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch(e){}};
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* ---------- 01 흔들리는 한 줄 ---------- */
const rope=(()=>{
  const wrap=$('#rope-wrap'),cv=$('#rope'),ctx=cv.getContext('2d'),hint=$('#rope-hint');
  let W=0,H=0,dpr=1,P=[],N=48,y0=62,grab=-1,split=0,splitOn=false,t=0,touched=false,autoT=0,raf=0;
  const MS=[[.07,'입학'],[.32,'졸업'],[.86,'취업']];
  const STR=[{off:-40,dash:[7,5],sp:1.1,label:'복학'},{off:4,dash:[],sp:1.7,label:'전공 변경'},{off:46,dash:[1,6],sp:.8,label:'일하며 공부'}];
  function size(){const r=wrap.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    P=Array.from({length:N},(_,i)=>{const x=i/(N-1)*W;return{x,y:y0,py:y0};});}
  function step(){
    for(let i=1;i<N-1;i++){const p=P[i];if(i===grab)continue;const v=(p.y-p.py)*.982;p.py=p.y;p.y+=v+(y0-p.y)*.012;}
    for(let k=0;k<6;k++)for(let i=1;i<N-1;i++){if(i===grab)continue;const p=P[i];p.y+=((P[i-1].y+P[i+1].y)/2-p.y)*.5;}
  }
  function yAt(fx){const f=fx*(N-1),i=Math.min(N-2,Math.floor(f)),r=f-i;return P[i].y*(1-r)+P[i+1].y*r;}
  function draw(){
    ctx.clearRect(0,0,W,H);const O=css('--orange'),T=css('--text'),M=css('--muted');
    const xs=MS[1][0]*W,ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
    // 가이드
    ctx.setLineDash([3,5]);ctx.strokeStyle='rgba(244,241,234,.16)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y0);ctx.lineTo(W,y0);ctx.stroke();ctx.setLineDash([]);
    // 본선(갈라지기 전 구간은 항상, 갈라진 뒤에는 졸업 지점까지 진하게)
    ctx.strokeStyle=O;ctx.lineWidth=2.2;ctx.lineCap='round';
    ctx.beginPath();P.forEach((p,i)=>{if(split>.02&&p.x>xs+1)return;i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();
    if(split<=.02){ctx.beginPath();P.forEach((p,i)=>{if(p.x<xs)return;ctx.lineTo(p.x,p.y);});ctx.stroke();}
    // 세 갈래
    if(split>.02){STR.forEach((s,k)=>{ctx.setLineDash(s.dash);ctx.lineWidth=2;ctx.beginPath();let lx=0,ly=0;
      for(let i=0;i<=80;i++){const fx=MS[1][0]+(1-MS[1][0])*i/80,x=fx*W,pr=ease((x-xs)/(W-xs)*1.25);
        const y=yAt(fx)+s.off*pr*split+Math.sin(t*.045*s.sp+fx*11+k*2)*7*pr*split;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);lx=x;ly=y;}
      ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=Math.min(1,split*1.4);ctx.fillStyle=O;ctx.beginPath();ctx.arc(lx-4,ly,3.5,0,7);ctx.fill();
      ctx.fillStyle=T;ctx.font='600 12px Pretendard, sans-serif';ctx.textAlign='right';ctx.fillText(s.label,W-14,ly+(s.off<0?-9:16));ctx.globalAlpha=1;});}
    // 시간표 점과 라벨
    MS.forEach(([fx,l],k)=>{const x=fx*W,y=yAt(fx);ctx.fillStyle=k===1&&split>.02?T:O;ctx.beginPath();ctx.arc(x,y,k===1?5:3.6,0,7);ctx.fill();
      ctx.fillStyle=M;ctx.font='500 13px Pretendard, sans-serif';ctx.textAlign='center';ctx.fillText(l,x,Math.min(y,y0)-16);});
  }
  function loop(){raf=requestAnimationFrame(loop);if(!$('#intro').classList.contains('active'))return;t++;step();
    if(splitOn&&split<1)split=Math.min(1,split+.02);draw();}
  function idx(cx){return Math.max(1,Math.min(N-2,Math.round(cx/W*(N-1))));}
  function local(e){const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function pluck(at,amt){const i=idx(at*W);for(let j=-6;j<=6;j++){const q=P[i+j];if(q&&i+j>0&&i+j<N-1)q.py=q.y+amt*Math.cos(j/6*Math.PI/2);}}
  wrap.addEventListener('pointerdown',e=>{wrap.setPointerCapture(e.pointerId);touched=true;clearTimeout(autoT);const l=local(e);grab=idx(l.x);hint.classList.add('off');buzz(6);});
  wrap.addEventListener('pointermove',e=>{if(grab<0)return;const l=local(e),g=Math.max(1,Math.min(N-2,idx(l.x)));grab=g;const y=Math.max(12,Math.min(H-24,l.y));
    for(let j=-4;j<=4;j++){const q=P[g+j];if(q&&g+j>0&&g+j<N-1){const w=1-Math.abs(j)/5;q.y=q.y*(1-w)+y*w;q.py=q.y;}}});
  const release=()=>{if(grab<0)return;const amp=Math.abs(P[grab].y-y0);grab=-1;if(amp>18&&!splitOn){setTimeout(()=>{splitOn=true;hint.textContent='한 줄이, 여러 갈래로.';hint.classList.remove('off');buzz([8,40,8]);},350);}};
  wrap.addEventListener('pointerup',release);wrap.addEventListener('pointercancel',release);
  function start(){size();split=0;splitOn=false;touched=false;hint.textContent='선을 끌어 흔들어 보세요';hint.classList.remove('off');
    if(RM()){split=1;splitOn=true;draw();return;}
    clearTimeout(autoT);autoT=setTimeout(()=>{if(!touched){pluck(.55,-46);setTimeout(()=>{if(!touched)pluck(.2,30);},500);}},1400);
    if(!raf)loop();}
  addEventListener('resize',()=>{if($('#intro').classList.contains('active'))size();});
  return{start};
})();

/* ---------- 02 눈금자 ---------- */
const ruler=(()=>{
  const sc=$('#ruler'),tr=$('#ruler-track'),STEP=56;let fromRuler=false,rt=0,last=S.age;
  tr.innerHTML='<span class="pad"></span>'+Array.from({length:16},(_,i)=>`<span class="yr" data-a="${19+i}">${[1,2,3,4].map(k=>`<i style="left:${k*11.2}px"></i>`).join('')}<span>${19+i}</span></span>`).join('')+'<span class="pad"></span>';
  const mark=()=>tr.querySelectorAll('.yr').forEach(el=>el.classList.toggle('on',+el.dataset.a===S.age));
  sc.addEventListener('scroll',()=>{cancelAnimationFrame(rt);rt=requestAnimationFrame(()=>{const a=19+Math.round(sc.scrollLeft/STEP);
    if(a!==S.age&&a>=19&&a<=34){fromRuler=true;S.age=a;syncAge();fromRuler=false;buzz(4);const o=$('#age-out');o.classList.remove('bump');void o.offsetWidth;o.classList.add('bump');}mark();});},{passive:true});
  const _sync=syncAge;
  window.syncAge=syncAge=function(){_sync();mark();if(!fromRuler&&sc.offsetParent){const target=(S.age-19)*STEP;if(Math.abs(sc.scrollLeft-target)>2)sc.scrollTo({left:target,behavior:RM()?'auto':'smooth'});}};
  return{show(){requestAnimationFrame(()=>{sc.scrollLeft=(S.age-19)*STEP;mark();});}};
})();

/* ---------- 03 '나' 토큰 ---------- */
let shown=new Set();
function token(){
  const box=$('#me-token'),ks=[...S.checks];
  if(!ks.length){box.innerHTML='<b>나</b><span class="mt-empty">= ?</span>';shown=new Set();return;}
  box.innerHTML='<b>나 =</b>'+ks.map((k,i)=>`${i?'<span class="plus">+</span>':''}<span class="mt" style="${shown.has(k)?'animation:none':''}">${CHECK_LABEL[k]}</span>`).join('');
  shown=new Set(ks);
}
$$('.chips button').forEach(b=>b.addEventListener('click',()=>{token();buzz(5);}));
$('#skip-status').addEventListener('click',token);

/* ---------- 04 기준이 입자로 부서짐 ---------- */
$('#dissolve').addEventListener('click',()=>{
  if(RM())return;
  const card=$('#rail-card');
  setTimeout(()=>{
    const cv=document.createElement('canvas');cv.className='fx-canvas';card.appendChild(cv);
    const r=cv.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);
    const cb=card.getBoundingClientRect(),ox=cb.left-r.left,parts=[],dur=1150;
    const add=(px,py,n,col)=>{for(let i=0;i<n;i++)parts.push({x:px,y:py,vx:(Math.random()*2.6-.8),vy:-(Math.random()*2.8+.4),g:.09+Math.random()*.06,life:70+Math.random()*50,a:1,s:1+Math.random()*2.4,col});};
    const sources=[];
    $$('#rail-std .pin, #rail-std .stop, #stops span').forEach(el=>{const b=el.getBoundingClientRect();sources.push({x:b.left+b.width/2-r.left,y:b.top+b.height/2-r.top,n:el.matches('.pin')?26:12,col:el.matches('.pin')?'#111111':'#5f5b53'});});
    const rail=$('#rail-std').getBoundingClientRect();for(let px=rail.left;px<rail.right;px+=7)sources.push({x:px-r.left,y:rail.top-r.top+1,n:2,col:'#111111'});
    sources.forEach(s=>{const tt=Math.max(0,(s.x-ox)/cb.width)*dur*.92;setTimeout(()=>{add(s.x,s.y,s.n,s.col);add(s.x,s.y,Math.ceil(s.n/3),'#FF5A1F');},tt);});
    buzz([10,30,10,30,14]);
    let f=0;(function tick(){f++;x.clearRect(0,0,r.width,r.height);
      parts.forEach(p=>{if(p.life<=0)return;p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.life--;p.a=Math.max(0,p.life/90);x.globalAlpha=p.a;x.fillStyle=p.col;x.fillRect(p.x,p.y,p.s,p.s);});
      x.globalAlpha=1;if(f<170)requestAnimationFrame(tick);else cv.remove();})();
  },420);
});

/* ---------- 05 숫자 굴러가기 ---------- */
const numsOf=el=>{const out=[];const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const m=n.textContent.match(/\d+(\.\d+)?/);if(m)out.push(parseFloat(m[0]));}return out;};
const _setMode=setMode;
window.setMode=setMode=function(real){
  const before=$$('.cmp .num').map(numsOf);
  _setMode(real);
  if(RM())return;
  $$('.cmp .num').forEach((el,ci)=>{const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n,k=0;const nodes=[];while((n=w.nextNode())){const m=n.textContent.match(/\d+(\.\d+)?/);if(m)nodes.push([n,m[0],k++]);}
    nodes.forEach(([node,txt,k])=>{const to=parseFloat(txt),from=(before[ci]&&before[ci][k]!==undefined)?before[ci][k]:0,dec=(txt.split('.')[1]||'').length;if(from===to)return;
      const t0=performance.now(),D=900;(function f(now){const p=Math.min(1,(now-t0)/D),e=1-Math.pow(1-p,3),v=from+(to-from)*e;node.textContent=node.textContent.replace(/\d+(\.\d+)?/,v.toFixed(dec));if(p<1)requestAnimationFrame(f);})(t0);});});
  if(real)buzz(8);
};

/* ---------- 06 템포: 맥박 + 자동 재생 ---------- */
const BPM={'나':1.0,A:.9,B:1.6,C:1.15,D:2.1,E:1.3,F:.8,G:1.9};
let lastCount=null;
const _buildTempo=buildTempo;
window.buildTempo=buildTempo=function(a){
  _buildTempo(a);
  $$('.pc').forEach(c=>{const s=document.createElement('span');s.className='pulse';s.style.setProperty('--bpm',(BPM[c.dataset.id]||1.2)+'s');c.appendChild(s);});
  const b=$('#match-count b');if(b){if(lastCount!==null&&lastCount!==b.textContent){b.classList.add('tick');buzz(4);}lastCount=b.textContent;}
};
let playT=0;
function stopPlay(){clearInterval(playT);playT=0;$('#play').setAttribute('aria-pressed','false');$('#play').textContent='▶ 재생';}
$('#play').addEventListener('click',()=>{
  if(playT){stopPlay();return;}
  let a=+$('#scrub').value;if(a>=34)a=19;buildTempo(a);
  $('#play').setAttribute('aria-pressed','true');$('#play').textContent='❚❚ 정지';
  playT=setInterval(()=>{a++;if(a>34){stopPlay();return;}buildTempo(a);},RM()?400:720);
});
['pointerdown','keydown'].forEach(ev=>$('#scrub').addEventListener(ev,()=>{if(playT)stopPlay();}));

/* ---------- 07 끈에 매달린 책갈피 ---------- */
const swing=(()=>{
  const el=$('#ticket');let ang=0,vel=0,drag=false,sx=0,moved=false,raf=0;
  const hint=$('.bm-hint');if(hint)hint.textContent='끌어서 흔들고, 눌러서 뒤집어보세요 ↻';
  function origin(){const cord=el.querySelector('.bm-cord'),b=el.getBoundingClientRect(),c=cord.getBoundingClientRect();el.style.transformOrigin=`50% ${c.top-b.top}px`;}
  function loop(){raf=requestAnimationFrame(loop);if(!drag){vel+=-.011*ang;vel*=.986;ang+=vel;}el.style.transform=`rotate(${ang.toFixed(2)}deg)`;
    if(!drag&&Math.abs(ang)<.02&&Math.abs(vel)<.02){cancelAnimationFrame(raf);raf=0;}}
  const run=()=>{if(!raf)loop();};
  el.addEventListener('pointerdown',e=>{drag=true;moved=false;sx=e.clientX;el.setPointerCapture(e.pointerId);origin();run();});
  el.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-sx;if(Math.abs(dx)>6)moved=true;if(moved){ang=Math.max(-32,Math.min(32,dx*.22));vel=0;}});
  const up=()=>{if(!drag)return;drag=false;if(moved)buzz(6);run();};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
  el.addEventListener('click',e=>{if(moved){e.stopImmediatePropagation();e.preventDefault();moved=false;}else buzz(10);},true);
  return{kick(){if(RM())return;requestAnimationFrame(()=>{origin();ang=0;vel=1.9;run();});}};
})();

/* ---------- 화면 전환에 연결 ---------- */
const _go=go;
window.go=go=function(id){
  if(playT)stopPlay();
  _go(id);
  if(id==='intro')rope.start();
  if(id==='profile')ruler.show();
  if(id==='status')token();
  if(id==='end')swing.kick();
};
rope.start();
})();
