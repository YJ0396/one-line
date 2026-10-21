'use strict';
/* 한 줄 / ONE LINE — v4
   흐름: 질문 → 나이·성별 → 지금 하는 것(복수) → 사회적 기준 vs 나의 위치 → 기준이 사라짐
         → 평균도 기준에서 벗어나 있음(기준↔실제 전환) → 나이를 움직여 보는 여덟 사람의 템포 → 모두에게 같은 번호표(No.01)
   입력값은 이 페이지 안에서만 쓰고 저장·전송하지 않는다. */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 데이터 ---------- */
const STATE={before:'입학 전',rest:'쉬어감',study:'공부',leave:'휴학',military:'군 복무',prep:'준비',work:'일',workstudy:'일하며 공부'};
const CHECK_LABEL={study:'공부',leave:'휴학',military:'군 복무',work:'일',prep:'준비',rest:'쉬는 중',other:'그 밖의 것'};
// 상태 → 사회적 시간표의 칸(1 재학 / 2 졸업·준비 / 3 취업, 0 = 칸 없음)
const STAGE_OF={study:[1],leave:[1],military:[1],prep:[2],work:[3],workstudy:[1,3],rest:[],before:[],other:[]};
const STAGE_NAME={1:'대학 재학',2:'졸업 · 취업 준비',3:'취업'};
const STOP_X={1:14,2:50,3:86}; // 레일 위 위치(%)
// 가상 인물 7명 — [시작, 끝(미포함), 상태, 설명]
const CASES=[
  {id:'A',title:'시간표대로 가다가, 다시 공부로.',copy:'A는 19살에 입학해 23살에 졸업하고 곧 첫 직장에 들어갔습니다. 몇 해 일한 뒤 더 깊이 공부하고 싶어져 대학원으로 돌아갔고, 지금은 연구직으로 일합니다.',
   segs:[[19,23,'study','대학 재학'],[23,24,'prep','졸업 · 취업 준비'],[24,27,'work','첫 직장'],[27,29,'study','퇴사 후 대학원'],[29,35,'work','연구직']]},
  {id:'B',title:'멈춘 시간이 아니라, 다른 과정.',copy:'B는 입학 1년 뒤 군 복무를 했고, 복학해 25살에 졸업했습니다. 1년 남짓 준비한 끝에 27살에 첫 직장을 얻었습니다.',
   segs:[[19,20,'study','대학 입학'],[20,22,'military','군 복무'],[22,25,'study','복학'],[25,27,'prep','졸업 · 취업 준비'],[27,35,'work','첫 직장']]},
  {id:'C',title:'순서가 뒤바뀐 경로.',copy:'C는 고등학교를 졸업하고 바로 일을 시작했습니다. 일하며 배우고 싶은 분야를 찾았고, 23살에 일과 공부를 함께 하는 대학 생활을 시작했습니다.',
   segs:[[19,23,'work','고교 졸업 후 취업'],[23,27,'workstudy','일하며 대학 입학'],[27,29,'work','졸업, 같은 일'],[29,35,'work','이직']]},
  {id:'D',title:'긴 준비도 하나의 구간.',copy:'D는 한 해 더 준비해 20살에 입학했습니다. 중간에 인턴과 어학연수로 휴학했고, 졸업 뒤 4년 가까이 시험을 준비해 29살에 합격했습니다.',
   segs:[[19,20,'prep','재수'],[20,22,'study','대학 입학'],[22,23,'leave','휴학 · 인턴, 어학'],[23,25,'study','복학'],[25,29,'prep','시험 준비'],[29,35,'work','합격 · 첫 출근']]},
  {id:'E',title:'되돌아가서, 다시 시작.',copy:'E는 2학년 때 전공이 맞지 않다는 걸 알고 다른 학교의 다른 전공으로 다시 입학했습니다. 26살에 졸업하고 곧바로 디자인 스튜디오에서 일을 시작했습니다.',
   segs:[[19,21,'study','대학 입학'],[21,26,'study','전공을 바꿔 재입학'],[26,35,'work','디자인 스튜디오']]},
  {id:'F',title:'오르내리는 경로.',copy:'F는 생계 때문에 3년 가까이 휴학하고 일했습니다. 복학해 26살에 졸업했고, 창업했다가 접은 뒤 30살에 다시 회사에 들어갔습니다.',
   segs:[[19,20,'study','대학 입학'],[20,23,'leave','휴학 · 생계를 위해 일'],[23,26,'study','복학'],[26,27,'prep','졸업 · 준비'],[27,30,'work','창업'],[30,35,'work','재취업']]},
  {id:'G',title:'쉼도 과정의 일부.',copy:'G는 대학 대신 일을 먼저 했습니다. 지쳐서 1년을 쉬었고, 직업훈련을 거쳐 새 일을 찾았습니다. 31살에 일하며 대학에 들어갔습니다.',
   segs:[[19,24,'work','고교 졸업 후 일'],[24,25,'rest','쉬어감'],[25,26,'study','직업훈련'],[26,31,'work','새 직장'],[31,35,'workstudy','일하며 대학 진학']]}
];
// 통념(인식) — 인크루트 '대졸 신입사원 적정 나이' 설문, 2025.9, 701명 (공식 통계 아님)
const NORM={m:{fit:30.4,last:32,fitT:'30.4',lastT:'32'},f:{fit:28.2,last:29.6,fitT:'28.2',lastT:'29.6'},n:{fit:28.2,last:29.6,fitT:'28.2~30.4',lastT:'29.6~32'}};
// 기준 vs 실제 평균 (공식 통계)
const CMP=[
  {k:'고교 졸업 후 바로 대학 진학',max:100,std:100,real:73.6,stdT:'100<small>%</small>',realT:'73.6<small>%</small>',diff:'−26.4%p',scale:['0%','100%'],
   d:'기준대로라면 모두 바로 진학합니다. 실제로는 넷 중 한 명이 다른 길로 시작합니다.',s:'교육부·한국교육개발원 「유·초·중등교육통계」 2024 · 당해 졸업자(재수생 미포함)'},
  {k:'휴학 없이 졸업',max:100,std:100,real:51.1,stdT:'100<small>%</small>',realT:'51.1<small>%</small>',diff:'−48.9%p',scale:['0%','100%'],
   d:'대졸자의 48.9%가 휴학을 경험했습니다(평균 1년 9.9개월). 휴학 없이 졸업하는 쪽이 겨우 절반입니다.',s:'국가데이터처 「2026년 5월 청년층 부가조사」 · 휴학 경험 48.9%를 뺀 값'},
  {k:'대학 졸업까지 걸리는 기간',max:60,std:48,real:53.7,stdT:'4<small>년</small>',realT:'4<small>년</small> 5.7<small>개월</small>',diff:'+5.7개월',scale:['0','5년'],
   d:'2~3년제를 포함한 평균인데도 4년을 넘깁니다. 2007년 집계 이후 가장 긴 기간입니다.',s:'국가데이터처 「2026년 5월 청년층 부가조사」 · 졸업 소요 기간(전문대 포함)'},
  {k:'졸업 후 첫 일자리까지',max:18,std:0,real:11.2,stdT:'졸업 <small>직후</small>',realT:'11.2<small>개월</small>',diff:'+11.2개월',scale:['0','18개월'],
   d:'학력별로도 다릅니다. 대졸 이상 8.5개월, 고졸 이하 1년 5.1개월.',s:'국가데이터처 「2026년 5월 청년층 부가조사」'}
];

/* ---------- 상태·계산 ---------- */
const S={age:24,gender:'n',checks:new Set()};
const N=()=>NORM[S.gender];
const pad2=n=>String(n).padStart(2,'0');
const checkText=()=>S.checks.size?[...S.checks].map(k=>CHECK_LABEL[k]).join(' + '):'고르지 않음';
function socialStage(a){return a<23?1:a<N().fit?2:3;}
const segAt=(c,a)=>c.segs.find(([x,y])=>a>=x&&a<y);
function caseStages(c,a){const s=segAt(c,a);return s?STAGE_OF[s[2]]:[];}
const caseMatch=(c,a)=>caseStages(c,a).includes(socialStage(a));
function myStages(){const set=new Set();S.checks.forEach(k=>(STAGE_OF[k]||[]).forEach(s=>set.add(s)));return[...set].sort();}
const myOff=()=>!S.checks.size||[...S.checks].some(k=>k==='rest'||k==='other');
function gap(){
  const st=myStages(),s=socialStage(S.age);
  if(!st.length)return{chip:'기준의 레일 <b>밖</b>에 서 있습니다',short:'레일 밖에'};
  const extra=myOff()&&S.checks.size?' · 레일 밖에도 한 발':'';
  if(st.includes(s)){const k=st.length-1;return k?{chip:`기준과 <b>같은 칸</b>, 그리고 <b>다른 칸 ${k}개</b>에 걸쳐 있습니다${extra}`,short:'같은 칸과 다른 칸에 걸쳐'}:{chip:`기준과 <b>같은 칸</b>에 서 있습니다${extra}`,short:'같은 칸에'};}
  const mx=Math.max(...st),mn=Math.min(...st);
  if(mx<s)return{chip:`기준보다 <b>${s-mx}칸 뒤</b>에 서 있습니다${extra}`,short:`${s-mx}칸 뒤에`};
  if(mn>s)return{chip:`기준보다 <b>${mn-s}칸 앞</b>에 서 있습니다${extra}`,short:`${mn-s}칸 앞에`};
  return{chip:`기준의 <b>앞과 뒤</b>에 동시에 서 있습니다${extra}`,short:'앞과 뒤에 걸쳐'};
}
function seeded(){const str=`${S.age}|${S.gender}|${[...S.checks].sort()}`;let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296;};}

/* ---------- 화면 전환 ---------- */
let current='intro';
function go(id){
  closeSheet(false);
  if(id==='line')buildPosition();
  if(id==='stats')buildStats();
  if(id==='paths')buildTempo(S.age);
  if(id==='end')buildEnd();
  $$('.screen').forEach(el=>el.classList.toggle('active',el.id===id));
  current=id;$('#progress').textContent=`${pad2($('#'+id).dataset.step)} / 07`;
  window.scrollTo(0,0);const h=$('#'+id+' h1, #'+id+' h2');h.setAttribute('tabindex','-1');h.focus({preventScroll:true});
}
function reset(){
  S.age=24;S.gender='n';S.checks.clear();syncAge();
  $$('.seg button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.gender==='n')));
  $$('.chips button').forEach(b=>b.setAttribute('aria-pressed','false'));$('#to-line').disabled=true;
  $('#ticket').classList.remove('flipped');$('#ticket').setAttribute('aria-pressed','false');go('intro');
}

/* ---------- 02·03 입력 ---------- */
function syncAge(){S.age=Math.min(34,Math.max(19,S.age));$('#age-out').textContent=S.age;$('#age').value=S.age;$$('.age-n').forEach(e=>e.textContent=S.age);}
$('#age').addEventListener('input',e=>{S.age=+e.target.value;syncAge();});
$('#age-minus').addEventListener('click',()=>{S.age--;syncAge();});
$('#age-plus').addEventListener('click',()=>{S.age++;syncAge();});
$$('.seg button').forEach(b=>b.addEventListener('click',()=>{S.gender=b.dataset.gender;$$('.seg button').forEach(x=>x.setAttribute('aria-checked',String(x===b)));}));
$$('.chips button').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.check,on=!S.checks.has(k);on?S.checks.add(k):S.checks.delete(k);b.setAttribute('aria-pressed',String(on));$('#to-line').disabled=!S.checks.size;}));
$('#to-line').addEventListener('click',()=>go('line'));
$('#skip-status').addEventListener('click',()=>{S.checks.clear();$$('.chips button').forEach(b=>b.setAttribute('aria-pressed','false'));go('line');});

/* ---------- 04 사회적 기준 vs 나 ---------- */
function buildPosition(){
  syncAge();
  const s=socialStage(S.age),n=N();
  $('#pos-title').innerHTML=`같은 <b class="age-n">${S.age}</b>세,<br><em>기준은 어디에 서라고 할까요.</em>`;
  const stops=[1,2,3].map(k=>`<i class="stop" style="left:${STOP_X[k]}%"></i>`).join('');
  $('#rail-std').innerHTML=stops+`<div class="pin std p${s}" style="left:${STOP_X[s]}%;animation-delay:.2s"><span>기준 · ${S.age}세</span><i></i></div>`;
  // 나의 핀: 칸별로 묶기
  const byStage={};S.checks.forEach(k=>(STAGE_OF[k]||[]).forEach(st=>(byStage[st]=byStage[st]||[]).push(CHECK_LABEL[k])));
  let me=stops+Object.entries(byStage).map(([st,labels],i)=>`<div class="pin me p${st}" style="left:${STOP_X[st]}%;animation-delay:${.7+i*.18}s"><span>${labels.join(' · ')}</span><i></i></div>`).join('');
  const offLabels=[...S.checks].filter(k=>k==='rest'||k==='other').map(k=>CHECK_LABEL[k]);
  if(!S.checks.size)offLabels.push('고르지 않음');
  if(offLabels.length)me+=`<div class="pin me off" style="animation-delay:.9s"><i></i><span>${offLabels.join(' · ')} · 레일 밖</span></div>`;
  $('#rail-me').innerHTML=me;
  $('#stops').innerHTML=[1,2,3].map(k=>`<span style="left:${STOP_X[k]}%">${STAGE_NAME[k]}<small>${k===1?'19~22세':k===2?`23~${n.fitT}세`:`${n.fitT}세~`}</small></span>`).join('');
  const g=gap();
  $('#verdict').innerHTML=`<div class="row"><span class="k">사회적 기준</span><span class="v">${S.age}세라면 ‘${STAGE_NAME[s]}’</span></div><div class="row me"><span class="k">지금의 나</span><span class="v">${checkText()}</span></div><span class="gap-chip">${g.chip}</span>`;
  $('#norm-tiles').innerHTML=`<div class="tile"><div class="k">대졸 신입 '적정 나이'${S.gender==='n'?' (여~남)':''}</div><div class="v">${n.fitT}<small>세</small></div><span class="t">인식 조사</span></div><div class="tile"><div class="k">대졸 신입 '마지노선'${S.gender==='n'?' (여~남)':''}</div><div class="v">${n.lastT}<small>세</small></div><span class="t">인식 조사</span></div>`;
  $('#norm-src').innerHTML=`입학 19세·졸업 23세는 흔한 기대를 나타낸 예시입니다. '적정 나이'·'마지노선'은 인크루트 설문(2025.9, 701명) 결과로, <b>공식 통계가 아닌 사람들의 인식</b>입니다. 이 화면의 '기준'은 이 통념으로 만든 것입니다.`;
  // 사라짐 연출 초기화
  $('#rail-card').classList.remove('dissolving');$$('#line .gone').forEach(e=>e.classList.remove('gone'));
  ['#verdict','#norm-tiles','#norm-src'].forEach(q=>{$(q).classList.add('fade-out-copy');$(q).classList.remove('dissolving-copy');});
  const b=$('#dissolve');b.disabled=false;b.classList.remove('done');b.innerHTML='누가 정한 기준일까? <span>↘</span>';
}
/* '누가 정한 기준일까?' — 주황 스캔선이 왼쪽에서 오른쪽으로 지나가며 기준을 지운다 */
$('#dissolve').addEventListener('click',()=>{
  const btn=$('#dissolve');if(btn.disabled)return;btn.disabled=true;
  if(reduceMotion()){go('stats');return;}
  const card=$('#rail-card'),W=card.offsetWidth,dur=1250,rnd=seeded();
  card.style.setProperty('--sweep-w',W+'px');
  card.scrollIntoView({block:'center',behavior:'smooth'});
  setTimeout(()=>{
    $('#pos-title').innerHTML=`아무도 정한 적<br><em>없는 줄.</em>`;
    ['#verdict','#norm-tiles','#norm-src'].forEach(q=>$(q).classList.add('dissolving-copy'));
    btn.classList.add('done');btn.innerHTML='기준을 지우는 중 <span>…</span>';
    card.classList.add('dissolving');
    const cb=card.getBoundingClientRect();
    $$('#rail-std .pin, #rail-std .stop, #stops span').forEach(el=>{
      const r=el.getBoundingClientRect(),t=(r.left+r.width/2-cb.left)/W;
      el.style.setProperty('--dx',((rnd()-.5)*30).toFixed(0)+'px');el.style.setProperty('--dy',(6+rnd()*16).toFixed(0)+'px');el.style.setProperty('--rot',((rnd()-.5)*14).toFixed(1)+'deg');
      setTimeout(()=>el.classList.add('gone'),Math.max(0,t*dur*.92-30));
    });
    setTimeout(()=>$('#line').classList.add('leaving'),dur+450);
    setTimeout(()=>{$('#line').classList.remove('leaving');go('stats');},dur+800);
  },420);
});

/* ---------- 05 기준 vs 실제 평균 ---------- */
let autoT=0,userTouched=false;
function setMode(real){
  $('#sw-std').setAttribute('aria-pressed',String(!real));$('#sw-real').setAttribute('aria-pressed',String(real));
  $('#cmp-list').classList.toggle('real',real);
  $$('.cmp').forEach((el,i)=>{const c=CMP[i];el.querySelector('.num').innerHTML=real?c.realT:c.stdT;el.querySelector('.fill').style.width=((real?c.real:c.std)/c.max*100)+'%';
    const n=el.querySelector('.num');n.classList.remove('flash');void n.offsetWidth;n.classList.add('flash');});
}
function buildStats(){
  userTouched=false;clearTimeout(autoT);
  $('#cmp-list').innerHTML=CMP.map((c,i)=>`<article class="cmp" style="--i:${i}"><div class="k"><span>기준 vs 실제</span><span class="tag">공식 통계</span></div><h3>${c.k}</h3><div class="val"><span class="num">${c.stdT}</span><span class="diff">기준과 ${c.diff}</span></div><div class="track"><span class="fill" style="width:${c.std/c.max*100}%"></span><span class="ghost" style="left:calc(${c.std/c.max*100}% - 1px)"></span></div><div class="scale"><span>${c.scale[0]}</span><span>${c.scale[1]}</span></div><p class="d">${c.d}</p><p class="s">${c.s}</p></article>`).join('');
  setMode(false);
  // 카드가 올라온 뒤 한 번 자동으로 '실제 평균'으로 바뀐다
  autoT=setTimeout(()=>{if(!userTouched&&current==='stats')setMode(true);},reduceMotion()?200:1600);
}
$('#sw-std').addEventListener('click',()=>{userTouched=true;setMode(false);});
$('#sw-real').addEventListener('click',()=>{userTouched=true;setMode(true);});

/* ---------- 06 나이를 움직여 보기 ---------- */
let scrubAge=24;
function buildTempo(a){
  scrubAge=a;$('#scrub').value=a;$('#scrub-out').textContent=a+'세';
  $('#tempo-title').innerHTML=`같은 <b>${a}</b>세,<br><em>지금 모두 다른 곳에.</em>`;
  const s=socialStage(a);
  $('#std-card').innerHTML=`<div><div class="k">사회적 기준이 말하는 ${a}세</div><div class="v">${STAGE_NAME[s]}</div></div><span class="badge">통념</span>`;
  const m=CASES.filter(c=>caseMatch(c,a)).length;
  $('#match-count').innerHTML=`${a}세에 기준과 같은 칸에 있는 사람 <b>${m}</b> / 7명`;
  const dots=fn=>Array.from({length:16},(_,i)=>{const y=19+i;return`<i class="${fn(y)?'on':''} ${y===a?'cur':''}"></i>`;}).join('');
  const meNow=a===S.age;
  const meMatch=meNow&&myStages().includes(s);
  const meCard=`<button class="pc me" data-id="나"><span class="who">나<em>${meNow?(S.checks.size?(meMatch?'기준과 같음':'다른 칸'):''):''}</em></span><span class="now">${meNow?checkText():'?'}</span><span class="det">${meNow?`지금, ${S.age}세`:'다른 나이의 당신은 당신만 알아요'}</span><span class="dots">${dots(y=>y===S.age&&myStages().includes(socialStage(y)))}</span></button>`;
  const html=CASES.map(c=>{const sg=segAt(c,a),ok=caseMatch(c,a);return`<button class="pc ${ok?'match':''}" data-id="${c.id}"><span class="who">${c.id}<em>${ok?'기준과 같음':'다른 칸'}</em></span><span class="now">${sg[3]}</span><span class="det">${STATE[sg[2]]} · ${sg[0]}세부터</span><span class="dots">${dots(y=>caseMatch(c,y))}</span></button>`;}).join('');
  const prev=$$('.pc .now').map(e=>e.textContent);
  $('#people').innerHTML=meCard+html;
  $$('.pc .now').forEach((e,i)=>{if(prev.length&&prev[i]!==e.textContent)e.classList.add('flash');});
}
$('#scrub').addEventListener('input',e=>buildTempo(+e.target.value));
$('#people').addEventListener('click',e=>{const c=e.target.closest('.pc');if(c)openSheet(c.dataset.id,c);});

/* 이야기 시트 */
let lastTrigger=null;
function openSheet(id,trigger){
  lastTrigger=trigger;
  if(id==='나'){
    $('#sheet-idx').textContent=`나 / ${S.age}세`;$('#sheet-title').textContent='당신의 과정은 이 화면에 그려지지 않습니다.';
    $('#sheet-copy').textContent=`지금 고른 것: ${checkText()}. 지나온 길과 앞으로의 방향, 그 속도는 당신만 알고 있어요.`;$('#sheet-tl').innerHTML='';
  }else{
    const c=CASES.find(c=>c.id===id),yrs=Array.from({length:16},(_,i)=>19+i).filter(y=>caseMatch(c,y)).length;
    $('#sheet-idx').textContent=`STORY ${c.id} / 가상 인물 · 19~34세 중 기준과 같은 칸 ${yrs}년`;
    $('#sheet-title').textContent=c.title;$('#sheet-copy').textContent=c.copy;
    $('#sheet-tl').innerHTML=c.segs.map(([a,b,st,t])=>`<li><span>${a}–${b===35?'':b-1}</span>${t}</li>`).join('');
  }
  $('#sheet').hidden=false;$('#scrim').hidden=false;$('#sheet').scrollTop=0;$('#sheet').focus({preventScroll:true});
}
function closeSheet(restore=true){if($('#sheet').hidden)return;$('#sheet').hidden=true;$('#scrim').hidden=true;if(restore&&lastTrigger&&document.contains(lastTrigger))lastTrigger.focus({preventScroll:true});}
$('#sheet-close').addEventListener('click',()=>closeSheet());$('#scrim').addEventListener('click',()=>closeSheet());
addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();});
(()=>{const sh=$('#sheet');let y0=null,dy=0;
  sh.addEventListener('touchstart',e=>{if(sh.scrollTop>0)return;y0=e.touches[0].clientY;dy=0;},{passive:true});
  sh.addEventListener('touchmove',e=>{if(y0===null)return;dy=Math.max(0,e.touches[0].clientY-y0);sh.style.transform=`translateY(${dy}px)`;},{passive:true});
  sh.addEventListener('touchend',()=>{if(y0===null)return;sh.style.transform='';if(dy>80)closeSheet();y0=null;});})();

/* ---------- 07 번호표 ---------- */
function buildEnd(){
  const g=gap(),m=CASES.filter(c=>caseMatch(c,S.age)).length;
  const always=CASES.filter(c=>Array.from({length:16},(_,i)=>19+i).every(y=>caseMatch(c,y))).length;
  $('#callback').innerHTML=`${S.age}세의 당신은 사회적 기준과 <b>${g.short}</b> 서 있었습니다.<br>같은 나이의 일곱 사람 중 기준과 같은 칸에 있던 사람은 ${m}명, 19~34세 내내 기준대로 간 사람은 ${always?always+'명뿐이었습니다':'<b>없었습니다</b>'}.`;
  // 책갈피 뒷면 '나의 지금' 칸에 입력값을 적는다 (칸 폭 38mm에 맞춰 글자 크기 조정)
  const t=$('#bm-now');t.textContent=S.checks.size?checkText():'';t.setAttribute('font-size','3.6');
  requestAnimationFrame(()=>{try{const w=t.getComputedTextLength();if(w>38)t.setAttribute('font-size',(3.6*38/w).toFixed(2));}catch(e){}});
}
$('#ticket').addEventListener('click',()=>{const on=$('#ticket').classList.toggle('flipped');$('#ticket').setAttribute('aria-pressed',String(on));});

/* 책갈피 이미지 — 화면의 책갈피(앞·뒤 SVG)를 그대로 그리고, '나의 지금'만 캔버스 글자로 얹는다 */
function svgImage(svg){
  return new Promise((res,rej)=>{const c=svg.cloneNode(true);c.setAttribute('xmlns','http://www.w3.org/2000/svg');c.setAttribute('width','500');c.setAttribute('height','1500');
    c.querySelectorAll('#bm-now').forEach(n=>n.remove());
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(c)],{type:'image/svg+xml'}));
    const im=new Image();im.onload=()=>{URL.revokeObjectURL(url);res(im);};im.onerror=rej;im.src=url;});
}
async function drawBookmark(){
  try{await document.fonts.load('700 40px Pretendard');}catch(e){}
  const W=1200,H=1760,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#161616';x.fillRect(0,0,W,H);
  const bw=480,bh=1440,top=260,lefts=[90,630],s=bw/50;
  const [fi,bi]=await Promise.all([svgImage($('.bm-front svg')),svgImage($('.bm-back svg'))]);
  [fi,bi].forEach((im,i)=>{const L=lefts[i];x.save();x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=40;x.shadowOffsetY=16;x.fillStyle='#000';x.fillRect(L,top,bw,bh);x.restore();
    x.drawImage(im,L,top,bw,bh);x.fillStyle='#161616';x.beginPath();x.arc(L+25*s,top+10*s,2.5*s,0,Math.PI*2);x.fill();});
  // 끈: 구멍에서 위로 올라가는 두 가닥
  lefts.forEach(L=>{const hx=L+25*s,hy=top+10*s;x.lineCap='round';x.lineWidth=9;
    [['#FF5A1F',[[hx-6,hy-80,hx-90,hy-140,hx-60,hy-200],[hx-30,hy-250,hx+50,hy-240,hx+40,hy-260]]],['#c9400f',[[hx+8,hy-80,hx+90,hy-150,hx+60,hy-205],[hx+30,hy-250,hx-50,hy-235,hx-40,hy-260]]]].forEach(([col,cs])=>{
      x.strokeStyle=col;x.beginPath();x.moveTo(hx,hy);cs.forEach(p=>x.bezierCurveTo(...p));x.stroke();});});
  if(S.checks.size){const t=checkText();let fs=3.6*s;x.font=`700 ${fs}px Pretendard, sans-serif`;const w=x.measureText(t).width;if(w>38*s){fs=fs*38*s/w;x.font=`700 ${fs}px Pretendard, sans-serif`;}
    x.fillStyle='#111111';x.fillText(t,lefts[1]+6*s,top+99*s);}
  return new Promise(r=>c.toBlob(r,'image/png'));
}
$('#save').addEventListener('click',async()=>{
  const btn=$('#save');btn.disabled=true;
  try{const blob=await drawBookmark(),name='한줄_책갈피_No01.png',file=new File([blob],name,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'한 줄 — 번호표 책갈피'});return;}catch(e){if(e.name==='AbortError')return;}}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  }finally{btn.disabled=false;}
});

/* ---------- 공통 ---------- */
$('#start').addEventListener('click',()=>go('profile'));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$$('.reset').forEach(b=>b.addEventListener('click',reset));
$('.brand').addEventListener('click',e=>{e.preventDefault();reset();});
$('#about-open').addEventListener('click',()=>$('#about').showModal());
$('#about-close').addEventListener('click',()=>$('#about').close());
$('#about').addEventListener('click',e=>{if(e.target===$('#about')){const r=$('#about').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#about').close();}});
syncAge();
