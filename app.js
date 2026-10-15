'use strict';
/* Hojas Studio 2 — واجهة الاستوديو */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const F=$('#frame'), AU=$('#au'), FPS=30;
let LANG='ar'; try{ LANG=localStorage.getItem('hsLang')||'ar'; }catch(e){}
const t=(k,...a)=>{ const v=I18N[k]; let s=v?v[LANG==='ar'?0:1]:k; a.forEach((x,i)=>{ s=s.split('{'+i+'}').join(x); }); return s; };
let ST=null, INFO=null, NOTES=[], REV={approved:null,comments:[]}, PEAKS=null, CHECK=null;
let T=0, PX=80, playing=false, lastFrame=-1, LTAB='text', RTAB='cap', Q='', SEL=null, TOOL='select', MAG=true, SKIM=false, MARKS=[];
let ACT=[], lastAct=0, SIG=null, adoptSig=false, READY=false, PULSE={}, dragging=false, frameReady=false, auKey='';
const AR_FONTS=['Cairo','Tajawal','IBM Plex Sans Arabic','Alexandria','El Messiri','Noto Sans Arabic','Noto Kufi Arabic','Readex Pro','Almarai','Changa','Rubik','Aref Ruqaa','Lalezar','Reem Kufi','Amiri','Marhey','Baloo Bhaijaan 2','Lemonada'];
const EN_FONTS=['Inter','Poppins','Montserrat','Bebas Neue','Oswald','Space Grotesk'];
const SWATCH=['#FFFFFF','#F2B33D','#FFE14D','#111111','#FF5A4E','#43D17A','#4C8DFF','#F472B6','#8F73F5'];
const DEFCAP={on:false,font:'Cairo',weight:800,size:64,color:'#FFFFFF',active:'#F2B33D',bg:'none',stroke:0,strokeColor:'#000000',shadow:true,y:76,width:760,lines:2,gap:16,mode:'line',enter:'rise',bgColor:'#000000',bgOpacity:0.62,hl:'color',chunk:0,actScale:1,fill:'solid',shadowColor:'#000000'};
const DEFEN={on:false,font:'Inter',weight:700,size:40,color:'#FFFFFF',pos:'below',gap:18,map:{}};
const FXS=['confetti','zoom','punch','shake','flash','bw','blur','vignette','letterbox','tint','glitch','grain','facezoom','spotlight','pulse','tilt','rgb','vhs','pixel','duotone','sepia','invert','mirror','leak','strobe','speed'];
const BGM=['blur','bw','dim','color','grad','studio','image'];
const CARDS=['list','steps','flow','versus','stat','check','timeline','funnel','quote'];
const ANIMS=['pop','rise','drop','slide','slideL','zoom','fade','type','none'];
/* 4.0: الدمج */
const TRS=['curve','push','pull','rack','whip','spin','iris'], MKK=['circle','underline','arrow','box','highlight','check','cross'], LTS=['bar','card','tag','line'], PIPS=['tr','tl','br','bl'];
const GRADES=['none','natural','skin','studio','warm','cool','night','muted','pop','teal','bw','film'];
const GRADEF={none:'none',natural:'contrast(1.05) saturate(1.06)',skin:'contrast(.97) saturate(.94) brightness(1.04) sepia(.08)',studio:'contrast(1.09) saturate(1.03) brightness(1.03)',warm:'saturate(1.08) sepia(.2) brightness(1.02)',cool:'contrast(1.06) saturate(.95) hue-rotate(-12deg)',night:'brightness(1.13) contrast(.95) saturate(.9)',muted:'saturate(.7) contrast(1.05)',pop:'saturate(1.32) contrast(1.08)',teal:'contrast(1.1) saturate(1.1) hue-rotate(-18deg)',bw:'grayscale(1) contrast(1.18)',film:'contrast(1.04) saturate(.85) sepia(.25)'};
const MKPV={circle:'<svg viewBox="0 0 60 40"><ellipse cx="30" cy="20" rx="24" ry="13" fill="none" stroke="#FFD21F" stroke-width="3.5" stroke-linecap="round"/></svg>',underline:'<svg viewBox="0 0 60 40"><path d="M8 28 Q30 33 52 27" fill="none" stroke="#FFD21F" stroke-width="4" stroke-linecap="round"/><rect x="12" y="12" width="36" height="7" rx="3" fill="#ffffff55"/></svg>',arrow:'<svg viewBox="0 0 60 40"><path d="M50 32 Q34 8 12 10 M12 10 l8 -5 M12 10 l6 7" fill="none" stroke="#FF4D6D" stroke-width="3.5" stroke-linecap="round"/></svg>',box:'<svg viewBox="0 0 60 40"><path d="M10 9 L50 8 L51 31 L9 32 Z" fill="none" stroke="#FFD21F" stroke-width="3.5" stroke-linejoin="round"/></svg>',highlight:'<svg viewBox="0 0 60 40"><rect x="8" y="14" width="44" height="12" fill="#FFD21F99"/><rect x="12" y="17" width="36" height="6" rx="2" fill="#ffffffaa"/></svg>',check:'<svg viewBox="0 0 60 40"><path d="M18 21 L27 30 L44 10" fill="none" stroke="#2FBF9B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',cross:'<svg viewBox="0 0 60 40"><path d="M20 10 L40 30 M40 10 L20 30" fill="none" stroke="#FF4D6D" stroke-width="5" stroke-linecap="round"/></svg>'};
const LTPV={bar:'<span style="all:unset;display:block;border-right:4px solid var(--cap);background:#000a;color:#fff;font-size:11px;padding:3px 7px">الاسم</span>',card:'<span style="all:unset;display:block;background:#fff;color:#15151C;border-radius:6px;font-size:11px;padding:3px 8px">الاسم</span>',tag:'<span style="all:unset;display:block;background:var(--cap);color:#fff;border-radius:20px;font-size:11px;padding:3px 9px">الاسم</span>',line:'<span style="all:unset;display:block;border-bottom:3px solid var(--cap);color:#fff;font-size:11px;padding:2px 6px">الاسم</span>'};
function lookApply(name){ snap(); const h=hs();
  if(!name){ delete h.look; delete h.grade; } else { const L=(INFO.looks||{})[name]; if(!L) return; h.look={name,overlay:L.overlay||'none',amount:L.amount==null?0.5:L.amount}; if(L.grade) h.grade={preset:L.grade,amount:0.85}; Object.assign(h.cap,L.cap||{}); h.cardDefault={...(L.card||{})};
    h.layers.forEach(Ly=>{ if(Ly.type==='split'||Ly.type==='viz'||Ly.type==='pip'){ for(const k in L.card||{}){ if(!(k==='deco'&&Ly.type==='viz')) Ly[k]=L.card[k]; } } if(Ly.type==='fx'&&(Ly.auto==='transitions'||Ly.auto==='trans')&&L.tr) Ly.fx=L.tr; }); }
  renderAll(); live(); toast(name?t('lookDone',(LANG==='ar'?(INFO.looks[name].ar):INFO.looks[name].en)):t('lookOff')); }
function trAdd(f,at){ const h=hs(); return {type:'fx',fx:f,seam:r3(at),dir:h.trDir||'right',amount:0.6,auto:'trans',track:2}; }
const ENTERS=['rise','pop','slide','drop','zoom','fade','words','none'];
const CHARS=['robo','sprout','star','cube'];
const RTABS=['sel','cap','tr','audio','check','notes','claude','proj'];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=x=>{ const m=Math.floor(x/60), s=(x%60).toFixed(2).padStart(5,'0'); return String(m).padStart(2,'0')+':'+s; };
const key=c=>c.w.map(w=>w.t).join(' ');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const r3=x=>Math.round(x*1000)/1000;
const total=()=>ST.caps.total, dur=()=>ST.caps.total+(ST.outro||0);
function toast(m){ const x=$('#toast'); x.textContent=m; x.style.opacity=1; clearTimeout(x._t); x._t=setTimeout(()=>x.style.opacity=0,2400); }
async function api(url,body,headers){ const r=await fetch(url,body===undefined?{}:{method:'POST',headers:headers||{'Content-Type':'application/json'},body:headers?body:JSON.stringify(body)}); try{ return await r.json(); }catch(e){ return {ok:false,msg:'HTTP '+r.status}; } }
function hs(){ ST.studio.hs=ST.studio.hs||{}; const h=ST.studio.hs; h.cap={...DEFCAP,...(h.cap||{})}; h.en={...DEFEN,...(h.en||{})}; h.en.map=h.en.map||{};
  h.fonts=h.fonts||[]; h.layers=h.layers||[]; h.hooks={on:false,active:0,dur:2.6,style:'box',items:[],...(h.hooks||{})}; h.mix={voice:1,clean:false,bg:0.28,...(h.mix||{})}; h.mix.sfx=h.mix.sfx||{}; h.check={gap:2.5,...(h.check||{})}; h.frame={ar:'9:16',cy:0.47,...(h.frame||{})}; h.platforms=h.platforms||[]; return h; }
const cardAt=x=>ST.caps.cards.findIndex(c=>x>=c.s&&x<c.e);
const selLayer=()=>SEL&&SEL.kind==='layer'?hs().layers.find(l=>l.id===SEL.id):null;
const allFonts=()=>[...hs().fonts.map(f=>f.name),...AR_FONTS,...EN_FONTS];

/* ───── اللغة ───── */
function applyLang(){ document.documentElement.lang=LANG; document.documentElement.dir=LANG==='ar'?'rtl':'ltr'; $$('.side,#top,#stageBtns,#live').forEach(e=>e.dir=LANG==='ar'?'rtl':'ltr');
  $$('[data-t]').forEach(e=>e.textContent=t(e.dataset.t)); $('#bLang').textContent=LANG==='ar'?'EN':'ع'; $('#pp').textContent=t(playing?'pause':'play');
  $('#tabs').innerHTML=RTABS.map(k=>'<button data-tab="'+k+'">'+t('tab_'+k)+'</button>').join(''); markTabs(); if(typeof mTabs==='function') mTabs(); }
function markTabs(){ $$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===RTAB)); { const cur=document.body.dataset.mv==='bin'?LTAB:RTAB; $$('#mtabs button').forEach(b=>b.classList.toggle('on',b.dataset.mv===cur)); } $$('#binTabs button').forEach(b=>b.classList.toggle('on',b.dataset.ltab===LTAB));
  $$('[data-tool]').forEach(b=>b.classList.toggle('on',b.dataset.tool===TOOL)); $('#bMag').classList.toggle('on',MAG); $('#bSkim').classList.toggle('on',SKIM); $('#lane').classList.toggle('blade',TOOL==='blade'); }
$('#bLang').onclick=()=>{ LANG=LANG==='ar'?'en':'ar'; try{ localStorage.setItem('hsLang',LANG); }catch(e){} applyLang(); if(ST){ buildTL(); renderAll(); } renderLive(); if($('#brief').classList.contains('on')) renderBrief(); };

/* ───── تحميل وحفظ ───── */
async function load(keep){
  ST=await api('/api/state'); INFO=await api('/hs/info'); if(!SFXLIB.length) await sfxLibLoad(); NOTES=await api('/hs/notes'); REV=await api('/hs/review_state'); hs(); drawSafe();
  $('#proj').textContent=INFO.title||INFO.name; hubBack(); pillSync(); lastFrame=-1; VK=(INFO.vsig||'0')+'-'+ST.nvf; const k=ST.nvf+':'+ST.caps.total+':'+(INFO.vsig||''); if(k!==auKey){ auKey=k; AU._fb=0; AU.onerror=()=>{ if(!AU._fb){ AU._fb=1; AU.src='/cutz.mp4?v='+encodeURIComponent(k); } }; AU.preload='auto'; AU.src='/hs/au.m4a?v='+encodeURIComponent(k); PEAKS=null; }
  MARKS=MARKS.filter(m=>m<total()); if(SEL&&SEL.kind!=='layer') SEL=null;
  await initFrame(true); buildTL(); renderAll(); seek(keep?Math.min(T,dur()):0); if(!keep) posRestore(); if(!PEAKS) api('/hs/peaks').then(p=>{ PEAKS=p; drawWave(); }); refreshCheck(); }
function frameLoad(){ return new Promise(res=>{ F.onload=()=>res(); F.src='/compose.html?v='+Date.now(); }); }
async function initFrame(reload){ if(reload||!frameReady){ frameReady=false; await frameLoad(); }
  return new Promise(res=>{ let n=0; const go=()=>{ const w=F.contentWindow; if(!w||!w.init||!w.__hsExt){ if(++n>80){ res(); return; } setTimeout(go,120); return; }
    if(!w.document.getElementById('mfit')){ const st=w.document.createElement('style'); st.id='mfit'; st.textContent='html,body{margin:0;overflow:hidden;background:#000}#cv{width:100vw!important;height:100vh!important;display:block}'; w.document.head.appendChild(st); }
    frameReady=true; if(MOBILE&&w.hsLowRes){ try{ w.hsLowRes(0.5); }catch(e){} } Promise.resolve(w.init({cards:ST.caps.cards,total:ST.caps.total,outro:ST.outro,theme:ST.theme,behind:ST.behind,studio:ST.studio})).then(res,res); }; go(); }); }
let _frP=null, VK='0'; const frU=i=>'/hs/pv/'+String(Math.min(ST.nvf,Math.max(1,i))).padStart(5,'0')+'.jpg?v='+VK;
async function drawNow(x){ const w=F.contentWindow; if(!w||!w.draw||!ST||!ST.nvf) return; let i=Math.min(ST.nvf,Math.max(1,Math.round(x*FPS)+1)); if(MOBILE&&playing) i-=((i-1)%2); const id=String(i).padStart(5,'0');
  if(i!==lastFrame){ lastFrame=i; try{ await w.setFrame(frU(i)); }catch(e){} if(playing&&w.hsPrefetch) w.hsPrefetch((MOBILE?[2,4,6]:[1,2,3,4,5,6]).map(d=>frU(i+d))); if(ST.behind&&ST.hasPerson&&w.setPerson){ const inR=(ST.behind.ranges||[]).some(r=>i>=r[0]&&i<=r[1]); try{ await w.setPerson(inR?('/bt/person/'+id+'.png'):null,(ST.behind.faces&&ST.behind.faces[i])||null); }catch(e){} } }
  try{ w.draw(x); }catch(e){} }
/* 3.8: رسمة وحدة بكل مرة. لو الطلبات أسرع من الرسم (جوال أو جهاز مشغول) ينرسم آخر طلب فقط بدل ما تتراكم وتعلّق */
let _pump=false, _want=null;
function drawT(x){ _want=x; if(_pump) return _frP; _pump=true; _frP=(async()=>{ try{ while(_want!==null){ const v=_want; _want=null; await drawNow(v); } } finally { _pump=false; } })(); return _frP; }
const HIST=[]; let _saveT=null, _chkT=null;
function snap(){ HIST.push(JSON.stringify({caps:ST.caps,theme:ST.theme,studio:ST.studio})); if(HIST.length>40) HIST.shift(); FUT.length=0; }
const FUT=[];
function dirty(){ $('#saved').textContent=t('saving'); clearTimeout(_saveT); _saveT=setTimeout(save,450); }
async function save(){ clearTimeout(_saveT); adoptSig=true; LASTSAVE=Date.now(); await api('/api/save',{caps:ST.caps,theme:ST.theme,studio:ST.studio,outro:ST.outro||0}); $('#saved').textContent=t('saved'); clearTimeout(_chkT); _chkT=setTimeout(refreshCheck,700); }
async function live(){ const w=F.contentWindow; if(w&&w.hsSet){ await w.hsSet(ST.studio.hs); } drawT(T); placeGiz(); dirty(); }
async function hard(){ await initFrame(false); lastFrame=-1; drawT(T); dirty(); }
async function redo(){ if(!FUT.length){ toast(t('nothingRedo')); return; } HIST.push(JSON.stringify({caps:ST.caps,theme:ST.theme,studio:ST.studio})); const o=JSON.parse(FUT.pop()); ST.caps=o.caps; ST.theme=o.theme; ST.studio=o.studio; hs(); await initFrame(false); buildTL(); renderAll(); drawT(T); dirty(); }
async function undo(){ if(!HIST.length){ toast(t('nothingUndo')); return; } FUT.push(JSON.stringify({caps:ST.caps,theme:ST.theme,studio:ST.studio})); const o=JSON.parse(HIST.pop()); ST.caps=o.caps; ST.theme=o.theme; ST.studio=o.studio; hs(); await initFrame(false); buildTL(); renderAll(); drawT(T); dirty(); }
async function refreshCheck(){ if(!READY) return; CHECK=await api('/hs/check'); drawCheck(); if(RTAB==='check') renderRight(); const b=$('#tabs [data-tab="check"]'); if(b) b.innerHTML=t('tab_check')+((CHECK.issues||(CHECK.reqs||[]).some(r=>!r.ok))?'<i class="dot"></i>':''); }

/* ───── التشغيل ───── */
function seek(x,quiet){ T=clamp(x,0,dur()); if(MOBILE) mSync(); else { $('#tm').textContent=fmt(T)+' / '+fmt(dur()); mSync(); } $('#ph').style.left=(T*PX)+'px';
  { const sc=$('#scroller'), px=T*PX; if(!quiet&&(px<sc.scrollLeft+10||px>sc.scrollLeft+sc.clientWidth-30)) sc.scrollLeft=Math.max(0,px-sc.clientWidth*(MOBILE?0.5:0.3)); }
  drawT(T); placeGiz(); if(!playing){ try{ AU.currentTime=Math.min(T,AU.duration||T); }catch(e){} } if(typeof posSave==='function') posSave(); }
let _loop=0; const SFXA={};
function stop(){ playing=false; _loop++; AU.pause(); $('#pp').textContent=t('play'); mSync(); }
function sfxPreview(a,b){ const sf=ST.studio.sfx||{}, mix=hs().mix; for(const k in sf){ if(!Array.isArray(sf[k])||k==='soft') continue; for(const v of sf[k]){ const x=Array.isArray(v)?v[0]:v; if(x>a&&x<=b){ try{ const au=SFXA[k]||(SFXA[k]=new Audio('/sfx_prev/'+k+'.wav')); au.currentTime=0; au.volume=clamp(0.55*(mix.sfx[k]==null?1:mix.sfx[k]),0,1); au.play().catch(()=>{}); }catch(e){} } } } }
async function play(){ if(playing){ stop(); return; } if(T>=dur()-0.05) T=0; playing=true; $('#pp').textContent=t('pause'); const my=++_loop;
  let clock=false; AU.volume=clamp(hs().mix.voice,0,1); try{ AU.currentTime=T; await AU.play(); }catch(e){ clock=true; } if(AU.paused||AU.error) clock=true;
  let t0=T, n0=performance.now(); let prev=T; if(T>=total()-0.03){ clock=true; AU.pause(); }
  let tk=0; const tick=()=>{ if(!playing||my!==_loop) return; if(MOBILE&&(++tk%2)){ requestAnimationFrame(tick); return; } if(!clock&&(AU.ended||AU.currentTime>=total()-0.03)&&dur()>total()+0.05){ clock=true; t0=Math.max(total(),AU.currentTime); n0=performance.now(); AU.pause(); }
    const x=clock?t0+(performance.now()-n0)/1000:AU.currentTime; if(x>=dur()-0.03||(!clock&&AU.ended)){ stop(); seek(dur()); return; } sfxPreview(prev,x); prev=x; seek(x); requestAnimationFrame(tick); };
  requestAnimationFrame(tick); }

/* ───── التايم لاين ───── */
const lname=L=>L.type==='draw'?t('type_draw'):L.type==='mark'?t('mk_'+(L.kind||'circle')):L.type==='cursor'?t('type_cursor'):L.type==='lt'?(L.text||t('type_lt')):L.type==='pip'?t('type_pip'):L.type==='collage'?t('type_collage'):L.type==='text'?(L.text||'').split('\n')[0]:L.type==='char'?t('char_'+(L.char||'custom')):L.type==='fx'?t('fx_'+L.fx):L.type==='split'?(L.title||t('type_split')):L.type==='viz'?(L.title||t('vk_'+L.kind)):L.type==='kinetic'?(String(L.text||'').replace(/^[*>+]\s*/gm,'').split('\n').join(' ').slice(0,40)||t('type_kinetic')):L.type==='desk'?((L.text||'')+' '+t('dk_'+(L.kind||'note'))).trim():L.type==='cover'?(L.text||t('type_cover')):L.type==='bg'?t('bg_'+(L.mode||'blur')):L.type==='behind'?(L.text||t('type_behind')):t('image');
function buildTL(){ if(!ST) return; const D=dur(), Wd=Math.max(D*PX+80,$('#scroller').clientWidth); $('#lane').style.width=Wd+'px'; const h=hs();
  const step=PX>=120?1:PX>=50?2:PX>=28?5:10; let o='';
  for(let s=0;s<=D;s+=step) o+='<span style="left:'+(s*PX)+'px">'+(s<60?s+'s':Math.floor(s/60)+':'+String(s%60).padStart(2,'0'))+'</span>';
  $('#ruler').innerHTML=o;
  const on=(k,id)=>SEL&&SEL.kind===k&&String(SEL.id)===String(id)?' on':'';
  const box=(s,e)=>'left:'+(s*PX)+'px;width:'+Math.max(7,(e-s)*PX-1)+'px';
  for(const tr of [0,1,2]) $('#tL'+tr).innerHTML=(tr===2?'<span class="lbl">'+t('trkLayers')+'</span>':'')+h.layers.filter(L=>(L.track||0)===tr).map(L=>'<div class="clip '+L.type+on('layer',L.id)+'" data-kind="layer" data-id="'+L.id+'" style="'+box(L.s,L.e)+(L.off?';opacity:.4':'')+'"><i class="hl"></i>'+esc(lname(L))+'<i class="hr"></i></div>').join('');
  $('#tCap').innerHTML='<span class="lbl">'+t('trkCaps')+'</span>'+ST.caps.cards.map((c,i)=>'<div class="clip cap'+on('cap',i)+'" data-kind="cap" data-id="'+i+'" style="'+box(c.s,c.e)+'"><i class="hl"></i>'+esc(key(c))+'<i class="hr"></i></div>').join('');
  let fx='<span class="lbl">'+t('trkFx')+'</span>';
  (ST.studio.scenes||[]).filter(s=>s.m&&s.m!=='R_FULL').forEach(s=>{ fx+='<div class="clip sc" style="'+box(s.s,Math.min(s.e,D))+'">'+esc(t('scene'))+'</div>'; });
  (ST.studio.brollClips||[]).forEach((b,i)=>{ fx+='<div class="clip broll'+on('broll',i)+'" data-kind="broll" data-id="'+i+'" style="'+box(b.s,b.e)+'"><i class="hl"></i>'+esc(t('broll'))+'<i class="hr"></i></div>'; });
  const sf=ST.studio.sfx||{}; for(const k in sf){ if(!Array.isArray(sf[k])) continue; sf[k].forEach((v,j)=>{ const x=Array.isArray(v)?v[0]:v; fx+='<div class="clip sfx'+on('sfx',k+':'+j)+'" data-kind="sfx" data-id="'+k+':'+j+'" title="'+esc(t('sfx_'+k))+'" style="left:'+(x*PX)+'px;width:'+Math.max(14,0.3*PX)+'px">'+esc(t('sfx_'+k).slice(0,PX>100?8:2))+'</div>'; }); }
  $('#tFx').innerHTML=fx;
  const every=Math.max(1,Math.ceil(26/PX)); let fm='';
  for(let s=0;s<total();s+=every) fm+='<div class="film" style="left:'+(s*PX)+'px;width:'+(every*PX)+'px;background-image:url(/hs/th/'+(s+1)+'.jpg?v='+VK+')"></div>';
  (INFO.seams||[]).forEach(s=>{ const tr=seamFx(s); fm+='<div class="seam" style="left:'+(s*PX)+'px"></div><div class="cutbtn'+(tr?' on':'')+'" data-seam="'+s+'" title="'+esc(tr?t('fx_'+tr.fx):t('cutAdd'))+'" style="left:'+(s*PX)+'px"></div>'; }); MARKS.forEach(m=>{ fm+='<div class="mark" style="left:'+(m*PX)+'px"></div>'; });
  const rg=SEL&&SEL.kind==='video'?SEL:null; if(ST.outro>0) fm+='<div class="clip outro'+on('outro',0)+'" data-kind="outro" data-id="0" title="'+esc(t('endCardTip'))+'" style="'+box(total(),dur())+'">'+esc(t('endCard'))+'<i class="hr"></i></div>';
  fm+='<div class="region'+(rg?' on':'')+'" style="'+(rg?'left:'+(rg.s*PX)+'px;width:'+((rg.e-rg.s)*PX)+'px':'')+'"><i class="rl"></i><i class="rr"></i></div><div class="trim"></div><span class="lbl">'+t('trkVideo')+'</span>';
  $('#tFilm').innerHTML=fm;
  $('#tMk').innerHTML=NOTES.map(n=>'<div class="mk'+(n.status==='done'?' done':'')+(n.by==='claude'?' ai':'')+'" data-n="'+n.id+'" title="'+esc(n.text)+'" style="left:'+(n.t*PX)+'px"></div>').join('')+(REV.comments||[]).filter(c=>c.status==='open').map(c=>'<div class="mk cl" data-c="'+c.id+'" title="'+esc(c.who+': '+c.text)+'" style="left:'+(c.t*PX)+'px"></div>').join('');
  drawWave(); drawCheck(); $('#ph').style.left=(T*PX)+'px'; placeGiz(); }
function drawWave(){ const cv=$('#wave'); if(!ST) return; const Wd=Math.min(16000,Math.max(1,Math.round(total()*PX))), H=34; cv.width=Wd; cv.height=H; cv.style.width=Wd+'px';
  const x=cv.getContext('2d'); x.fillStyle='#1b2a22'; x.fillRect(0,0,Wd,H); if(!PEAKS||!PEAKS.p.length) return; x.fillStyle='#43b072';
  for(let px=0;px<Wd;px++){ const a=Math.floor(px/PX*PEAKS.rate), b=Math.max(a+1,Math.floor((px+1)/PX*PEAKS.rate)); let m=0; for(let i=a;i<b&&i<PEAKS.p.length;i++) if(PEAKS.p[i]>m) m=PEAKS.p[i]; const hh=Math.max(1,m*(H-4)); x.fillRect(px,(H-hh)/2,1,hh); } }
function drawCheck(){ const el=$('#tChk'); if(!el) return; el.innerHTML=(CHECK&&CHECK.gaps||[]).map(g=>'<div class="gap" data-gap="'+g.s+'" title="'+esc(t('gapTitle',g.d))+'" style="left:'+(g.s*PX)+'px;width:'+((g.e-g.s)*PX)+'px"></div>').join(''); }
function shotBounds(){ return [...new Set([0,...(INFO.seams||[]),...MARKS,total()].map(v=>r3(v)))].filter(v=>v>=0&&v<=total()).sort((a,b)=>a-b); }
function tlTime(e,far){ const r=$('#lane').getBoundingClientRect(); return clamp((e.clientX-r.left)/PX,0,far?dur()+12:dur()); }
function snapPts(skip){ const p=[0,total(),T,...(INFO.seams||[]),...MARKS]; ST.caps.cards.forEach((c,i)=>{ if(!(skip&&skip.kind==='cap'&&skip.id===i)) p.push(c.s,c.e); });
  hs().layers.forEach(L=>{ if(!(skip&&skip.kind==='layer'&&skip.id===L.id)) p.push(L.s,L.e); }); return p; }
let ALT=false; function snapTo(x,pts){ if(!MAG||ALT) return x; let best=x, d=6/PX; for(const p of pts){ const dd=Math.abs(p-x); if(dd<d){ d=dd; best=p; } } return best; }
/* 3.9: الكابشن يتحرك داخل السكتة اللي حوله، والجيران يتقلصون لحد كلماتهم بدل ما يقفلونه */
function capNb(i){ const cs=ST.caps.cards, p=cs[i-1], n=cs[i+1]; return {p:p?{s:p.s,e:p.e}:null,n:n?{s:n.s,e:n.e}:null,lim:[p?p.w[p.w.length-1].e+0.02:0,n?n.w[0].s-0.02:total()]}; }
function capPush(D,o){ const i=+D.id, cs=ST.caps.cards, p=cs[i-1], n=cs[i+1];
  if(p&&D.nb.p){ p.e=r3(Math.max(p.w[p.w.length-1].e,Math.min(D.nb.p.e,o.s-0.02))); } if(n&&D.nb.n){ n.s=r3(Math.min(n.w[0].s,Math.max(D.nb.n.s,o.e+0.02))); }
  for(const [c,j] of [[p,i-1],[n,i+1]]){ if(!c) continue; const de=document.querySelector('#lane .clip[data-kind="cap"][data-id="'+j+'"]'); if(de){ de.style.left=(c.s*PX)+'px'; de.style.width=Math.max(7,(c.e-c.s)*PX-1)+'px'; } } }
function objOf(kind,id){ if(kind==='layer') return hs().layers.find(l=>l.id===id); if(kind==='cap') return ST.caps.cards[+id]; if(kind==='broll') return ST.studio.brollClips[+id]; return null; }
function select(s){ SEL=s; if(MOBILE&&s&&s.kind!=='cap') document.body.dataset.mv='panel'; if(s&&RTAB!=='sel'&&s.kind!=='cap'){ RTAB='sel'; markTabs(); } buildTL(); renderRight(); if(s&&s.kind==='cap'&&LTAB==='text'){ const el=$('#lbody .card[data-card="'+s.id+'"]'); $$('#lbody .card').forEach(c=>c.classList.toggle('on',c===el)); if(el) el.scrollIntoView({block:'nearest'}); } }
function blade(el,x){ const pts=snapPts(null); x=snapTo(x,pts);
  if(!el){ return; }
  const kind=el.dataset.kind, id=el.dataset.id;
  if(kind==='layer'){ const L=objOf('layer',id); if(x<L.s+0.1||x>L.e-0.1) return; snap(); const h=hs(), n={...L,id:'L'+(Math.max(0,...h.layers.map(l=>parseInt(String(l.id).replace(/\D/g,''))||0))+1),s:r3(x)}; L.e=r3(x); h.layers.push(n); buildTL(); live(); toast(t('splitDone')); }
  else if(kind==='broll'){ const b=objOf('broll',id); if(x<b.s+0.1||x>b.e-0.1) return; snap(); ST.studio.brollClips.push({...b,s:r3(x)}); b.e=r3(x); buildTL(); dirty(); toast(t('splitDone')); }
  else if(kind==='cap'){ const i=+id, c=ST.caps.cards[i]; if(c.w.length<2) return; let j=1, bd=1e9; for(let k=1;k<c.w.length;k++){ const m=(c.w[k-1].e+c.w[k].s)/2, d=Math.abs(m-x); if(d<bd){ bd=d; j=k; } }
    snap(); const old=key(c), a=c.w.slice(0,j), b=c.w.slice(j), mid=r3((a[a.length-1].e+b[0].s)/2), c2={s:r3(Math.max(mid,b[0].s-0.08)),e:c.e,w:b}; c.w=a; c.e=r3(Math.min(mid,c2.s-0.02)); if(c.e<a[a.length-1].e) c.e=a[a.length-1].e;
    ST.caps.cards.splice(i+1,0,c2); const mp=hs().en.map; if(mp[old]){ mp[key(c)]=mp[old]; delete mp[old]; } buildTL(); renderLeft(); hard(); toast(t('splitDone')); } }
(function(){ const sc=$('#scroller'); let D=null;
  sc.addEventListener('pointerdown',e=>{ if(!ST||e.button>0) return; const x=tlTime(e), el=e.target.closest('.clip[data-kind]'), mk=e.target.closest('.mk'), gp=e.target.closest('.gap'), cb=e.target.closest('.cutbtn');
    if(cb){ e.preventDefault(); seamPick(+cb.dataset.seam); return; }
    const rh=e.target.closest('.rl,.rr'); if(rh&&SEL&&SEL.kind==='video'){ e.preventDefault(); if(playing) stop(); D={kind:'trim',side:rh.classList.contains('rr')?'r':'l',s:SEL.s,e:SEL.e,x:rh.classList.contains('rr')?SEL.e:SEL.s}; dragging=true; sc.setPointerCapture(e.pointerId); return; }
    if(mk){ if(mk.dataset.n){ seek(NOTES.find(n=>String(n.id)===mk.dataset.n).t); } else { seek(REV.comments.find(c=>String(c.id)===mk.dataset.c).t); } RTAB='notes'; markTabs(); renderRight(); return; }
    if(gp){ seek(+gp.dataset.gap+0.05); RTAB='check'; markTabs(); renderRight(); return; }
    const inFilm=!!e.target.closest('#tFilm,#tAu');
    if(TOOL==='blade'){ if(el) blade(el,x); else if(inFilm){ const m=r3(snapTo(x,[T,...(INFO.seams||[]),...ST.caps.cards.flatMap(c=>[c.s,c.e])])); if(m>0.1&&m<total()-0.1&&!MARKS.some(q=>Math.abs(q-m)<0.05)){ MARKS.push(m); MARKS.sort((a,b)=>a-b); buildTL(); toast(t('markAdded')); } } return; }
    if(playing) stop();
    if(el){ e.preventDefault(); ALT=e.altKey; const kind=el.dataset.kind, id=kind==='layer'?el.dataset.id:(kind==='sfx'?el.dataset.id:+el.dataset.id); select({kind,id});
      if(kind==='outro'){ D={kind,x0:x,o:ST.outro,edge:e.target.classList.contains('hr'),moved:false}; if(!D.edge) seek(Math.min(dur()-0.05,total()+1.6)); dragging=true; sc.setPointerCapture(e.pointerId); return; }
      const mode=e.target.classList.contains('hl')?'l':e.target.classList.contains('hr')?'r':'move';
      if(kind==='sfx'){ const [k,j]=String(id).split(':'); D={kind,k,j:+j,x0:x,orig:ST.studio.sfx[k][+j],moved:false}; }
      else { const o=objOf(kind,id); D={kind,id,mode,x0:x,s:o.s,e:o.e,track:o.track||0,moved:false,pts:snapPts({kind,id}),words:kind==='cap'?o.w.map(w=>[w.s,w.e]):null,nb:kind==='cap'?capNb(+id):null}; }
      dragging=true; sc.setPointerCapture(e.pointerId); return; }
    if(inFilm){ const b=shotBounds(); for(let i=0;i<b.length-1;i++){ if(x>=b[i]&&x<b[i+1]){ select({kind:'video',s:b[i],e:b[i+1],id:i}); break; } } }
    else if(SEL){ SEL=null; buildTL(); renderRight(); }
    D={kind:'scrub'}; dragging=true; sc.setPointerCapture(e.pointerId); seek(x); });
  sc.addEventListener('pointermove',e=>{ if(D&&D.kind!=='scrub'){ const r=sc.getBoundingClientRect(); if(e.clientX>r.right-36) sc.scrollLeft+=14; else if(e.clientX<r.left+36) sc.scrollLeft-=14; }
    const x=tlTime(e,D&&D.kind==='outro');
    if(!D){ if(SKIM&&!playing&&ST){ $('#sk').style.display='block'; $('#sk').style.left=(x*PX)+'px'; drawT(x); } return; }
    if(D.kind==='scrub'){ seek(x); return; }
    if(D.kind==='trim'){ D.x=D.side==='r'?clamp(snapTo(x,[T,...ST.caps.cards.flatMap(c=>[c.s,c.e])]),D.s+0.15,D.e):clamp(snapTo(x,[T,...ST.caps.cards.flatMap(c=>[c.s,c.e])]),D.s,D.e-0.15);
      const tm=$('#tFilm .trim'), a=D.side==='r'?[D.x,D.e]:[D.s,D.x]; if(tm){ tm.style.display='block'; tm.style.left=(a[0]*PX)+'px'; tm.style.width=((a[1]-a[0])*PX)+'px'; } drawT(D.x); return; }
    const dt=x-D.x0; if(!D.moved&&Math.abs(dt)*PX<3) return; if(!D.moved){ D.moved=true; snap(); }
    if(D.kind==='outro'){ if(!D.edge) return; ST.outro=r3(clamp(D.o+dt,0.8,12)); const oe=document.querySelector('#tFilm .clip.outro'); if(oe) oe.style.width=Math.max(7,ST.outro*PX-1)+'px'; $('#lane').style.width=Math.max(dur()*PX+80,sc.clientWidth)+'px'; $('#tm').textContent=fmt(T)+' / '+fmt(dur()); return; }
    if(D.kind==='sfx'){ const v=r3(clamp(snapTo((Array.isArray(D.orig)?D.orig[0]:D.orig)+dt,[T,...ST.caps.cards.flatMap(c=>c.w.map(w=>w.s))]),0,total())); const arr=ST.studio.sfx[D.k]; arr[D.j]=Array.isArray(D.orig)?[v,...D.orig.slice(1)]:v; const de=document.querySelector('#lane .clip.sfx[data-id="'+D.k+':'+D.j+'"]'); if(de) de.style.left=(v*PX)+'px'; else buildTL(); return; }
    const o=objOf(D.kind,D.id), len=D.e-D.s, lim=D.kind==='cap'?D.nb.lim:[0,total()];
    if(D.mode==='move'){ let s=D.s+dt; const s1=snapTo(s,D.pts), e1=snapTo(s+len,D.pts); if(s1!==s) s=s1; else if(e1!==s+len) s=e1-len; s=clamp(s,lim[0],Math.max(lim[0],lim[1]-len)); const d=s-D.s; o.s=r3(s); o.e=r3(s+len);
      if(D.kind==='cap'){ o.w.forEach((w,i)=>{ w.s=r3(D.words[i][0]+d); w.e=r3(D.words[i][1]+d); }); capPush(D,o); if(Math.abs(D.s+dt-s)*PX>24&&!D.told){ D.told=1; toast(t('capLimit')); } }
      if(D.kind==='layer'){ const r=$('#lane').getBoundingClientRect(), y=e.clientY-r.top; const rows=[[2,24],[1,47],[0,70]]; for(const [k,tp] of rows) if(y>=tp+3&&y<=tp+18) o.track=k; } }
    else if(D.mode==='l'){ let s=clamp(snapTo(D.s+dt,D.pts),lim[0],D.e-0.15); if(D.kind==='cap') s=Math.min(s,o.w[0].s); o.s=r3(s); if(D.kind==='cap') capPush(D,o); }
    else { let en=clamp(snapTo(D.e+dt,D.pts),D.s+0.15,lim[1]); if(D.kind==='cap') en=Math.max(en,o.w[o.w.length-1].e); o.e=r3(en); if(D.kind==='cap') capPush(D,o); }
    const dl=document.querySelector('#lane .clip[data-kind="'+D.kind+'"][data-id="'+D.id+'"]');
    if(!dl||(D.kind==='layer'&&(o.track||0)!==D.track)){ D.track=o.track||0; buildTL(); } else { dl.style.left=(o.s*PX)+'px'; dl.style.width=Math.max(7,(o.e-o.s)*PX-1)+'px'; }
    if(!D.raf) D.raf=requestAnimationFrame(()=>{ if(D) D.raf=0; drawT(T); placeGiz(); }); });
  const end=()=>{ if(D&&D.kind==='trim'){ const a=D.side==='r'?[D.x,D.e]:[D.s,D.x]; const tm=$('#tFilm .trim'); if(tm) tm.style.display='none'; D=null; dragging=false; if(a[1]-a[0]>=0.08) askRemove({ranges:[[r3(a[0]),r3(a[1])]]},fmt(a[0])+' ← '+fmt(a[1])); return; }
    if(D&&D.kind==='outro'){ const mv=D.moved; D=null; dragging=false; ALT=false; if(mv){ buildTL(); renderRight(); hard(); } return; }
    if(D&&D.moved){ buildTL(); if(D.kind==='layer') live(); else dirty(); if(D.kind!=='sfx') renderRight(); } D=null; dragging=false; ALT=false; };
  sc.addEventListener('pointerup',end); sc.addEventListener('pointercancel',end);
  sc.addEventListener('pointerleave',()=>{ if(SKIM&&!D){ $('#sk').style.display='none'; drawT(T); } });
  sc.addEventListener('scroll',()=>{ $('#gut').scrollTop=sc.scrollTop; });
  sc.addEventListener('wheel',e=>{ if(e.ctrlKey||e.metaKey){ e.preventDefault(); setZoom(PX*(e.deltaY<0?1.15:0.87)); } },{passive:false});
})();
function setZoom(v){ PX=clamp(v,16,260); $('#zoom').value=PX; buildTL(); const sc=$('#scroller'); sc.scrollLeft=Math.max(0,T*PX-sc.clientWidth/2); }
$('#zoom').oninput=e=>setZoom(+e.target.value);
$$('[data-tool]').forEach(b=>b.onclick=()=>{ TOOL=b.dataset.tool; markTabs(); });
$('#bMag').onclick=()=>{ MAG=!MAG; markTabs(); }; $('#bSkim').onclick=()=>{ SKIM=!SKIM; markTabs(); if(!SKIM){ $('#sk').style.display='none'; drawT(T); } };
const OUTRO_DEF={l1:'شكراً على المشاهدة',l2:'',cta:'تابعني',word:'للمزيد',sub:'',chips:[]};
function outroT(){ return {...OUTRO_DEF,...(ST.studio.outro||{})}; }
function outroSet(sec){ snap(); ST.outro=sec; if(sec>0&&!ST.studio.outro) ST.studio.outro={...OUTRO_DEF}; if(sec>0) SEL={kind:'outro',id:0}; else if(SEL&&SEL.kind==='outro') SEL=null; buildTL(); renderRight(); hard().then(()=>seek(sec>0?Math.min(dur()-0.05,total()+1.6):Math.min(T,dur()))); }
function delSel(){ if(!SEL) return; const h=hs();
  if(SEL.kind==='outro'){ outroSet(0); return; }
  if(SEL.kind==='layer'){ snap(); h.layers=h.layers.filter(l=>l.id!==SEL.id); ST.studio.hs.layers=h.layers; SEL=null; buildTL(); renderRight(); live(); }
  else if(SEL.kind==='sfx'){ snap(); const [k,j]=String(SEL.id).split(':'); ST.studio.sfx[k].splice(+j,1); SEL=null; buildTL(); renderRight(); dirty(); }
  else if(SEL.kind==='broll'){ snap(); ST.studio.brollClips.splice(+SEL.id,1); SEL=null; buildTL(); renderRight(); dirty(); drawT(T); }
  else if(SEL.kind==='cap'){ askRemove({cards:[+SEL.id]},'«'+key(ST.caps.cards[+SEL.id])+'»'); }
  else if(SEL.kind==='video'){ askRemove({ranges:[[SEL.s,SEL.e]]},fmt(SEL.s)+' ← '+fmt(SEL.e)); } }
function dupSel(){ const L=selLayer(); if(!L) return; snap(); const h=hs(), n={...L,id:'L'+(Math.max(0,...h.layers.map(l=>parseInt(String(l.id).replace(/\D/g,''))||0))+1)}; const d=L.e-L.s; n.s=r3(Math.min(L.e,total()-0.3)); n.e=r3(Math.min(total(),n.s+d)); h.layers.push(n); select({kind:'layer',id:n.id}); live(); }

/* ───── عناصر الواجهة العامة ───── */
const vid=k=>'v-'+k.replace(/\./g,'-');
function slider(lbl,k,min,max,val,step){ return '<div class="row"><label>'+lbl+'</label><input type="range" data-k="'+k+'" min="'+min+'" max="'+max+'" step="'+(step||1)+'" value="'+val+'"><span class="val" id="'+vid(k)+'">'+val+'</span></div>'; }
function swatches(lbl,k,val){ val=val||'#FFFFFF'; return '<div class="row"><label>'+lbl+'</label><div class="sw">'+SWATCH.map(c=>'<i data-k="'+k+'" data-c="'+c+'" class="'+(c.toLowerCase()===String(val).toLowerCase()?'on':'')+'" style="background:'+c+'"></i>').join('')+'<input type="color" data-k="'+k+'" value="'+esc(val)+'"></div></div>'; }
function seg(lbl,k,opts,val){ return '<div class="row"><label>'+lbl+'</label><div class="seg">'+opts.map(o=>'<button data-k="'+k+'" data-v="'+o[0]+'" class="'+(String(o[0])===String(val)?'on':'')+'">'+o[1]+'</button>').join('')+'</div></div>'; }
function pick(lbl,k,opts,val){ return '<div class="row"><label>'+lbl+'</label><select data-k="'+k+'">'+opts.map(o=>{ const [v,l]=Array.isArray(o)?o:[o,o]; return '<option value="'+esc(v)+'"'+(String(v)===String(val)?' selected':'')+'>'+esc(l)+'</option>'; }).join('')+'</select></div>'; }
function tog(k,title,sub,val){ return '<div class="tog"><div>'+title+(sub?'<small>'+sub+'</small>':'')+'</div><div class="sw-t'+(val?' on':'')+'" data-tog="'+k+'"></div></div>'; }
function ref(k){ const p=k.split('.'); let o; if(p[0]==='L') o=selLayer(); else if(p[0]==='th') o=ST.theme; else if(p[0]==='B') o=ST.studio.brollClips[+SEL.id]; else if(p[0]==='C'){ hs().cap.on=true; o=SCOPE==='all'?hs().cap:capOvOf(+SEL.id,true); } else { const h=hs(); o=h[p[0]]; } for(let i=1;i<p.length-1;i++){ o[p[i]]=o[p[i]]||{}; o=o[p[i]]; } return [o,p[p.length-1]]; }
const getK=k=>{ const [o,f]=ref(k); return o?o[f]:undefined; }, setK=(k,v)=>{ const [o,f]=ref(k); if(o) o[f]=v; };
function weightsOf(f){ const w=F.contentWindow, G=(w&&w.__hsFonts)||{}; return G[f]||[400,500,600,700,800,900]; }
function fontLink(){ if($('#fprev')) return; const l=document.createElement('link'); l.id='fprev'; l.rel='stylesheet'; l.href='https://fonts.googleapis.com/css2?'+AR_FONTS.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')+':wght@700').join('&')+'&text='+encodeURIComponent('متابعة')+'&display=swap'; document.head.appendChild(l); }
function localFace(f){ const id='lf-'+f.file; if(document.getElementById(id)) return; const st=document.createElement('style'); st.id=id; st.textContent='@font-face{font-family:"'+f.name+'";src:url("/fonts/'+encodeURIComponent(f.file)+'")}'; document.head.appendChild(st); }
function renderAll(){ markTabs(); renderLeft(); renderRight(); }

/* ───── اليسار: النص + الملفات ───── */
function renderLeft(){ const B=$('#lbody'), h=hs(); let o='';
  if(LTAB==='text'){ o+='<div class="sec"><input type="search" id="q" placeholder="'+t('searchText')+'" value="'+esc(Q)+'"></div><p class="hint" style="margin-top:-8px">'+t('textHint')+'</p>';
    ST.caps.cards.forEach((c,i)=>{ const k=key(c); if(Q&&!k.includes(Q)) return;
      o+='<div class="card'+(SEL&&SEL.kind==='cap'&&+SEL.id===i?' on':'')+'" data-card="'+i+'"><span class="t" data-seek="'+c.s+'">'+fmt(c.s)+'</span><div class="ar" dir="rtl">'+c.w.map((w,j)=>'<span class="w'+(w.hot?' hot':'')+'" data-w="'+i+':'+j+'">'+(Q&&w.t.includes(Q)?'<mark>'+esc(w.t)+'</mark>':esc(w.t))+'</span>').join(' ')+'</div><div class="acts"><button class="sm" data-edit="'+i+'">'+t('edit')+'</button><button class="sm ghost" data-drop="'+i+'">'+t('dropSentence')+'</button></div></div>'; }); }
  else { fontLink(); h.fonts.forEach(localFace);
    o+='<div class="sec"><h4>'+t('binClips')+'<button class="sm" data-up="broll">'+t('upload')+'</button></h4><div class="grid3">'+Object.keys(ST.studio.brNeed||{}).map(k=>'<div class="tile" data-add="broll:'+esc(k)+'"><div class="pv" style="background-image:url(/broll/'+esc(k)+'_0001.jpg)"></div><span>'+esc(k)+'</span></div>').join('')+'</div>'+(Object.keys(ST.studio.brNeed||{}).length?'':'<p class="hint">'+t('binClipsEmpty')+'</p>')+'</div>';
    o+=mediaHtml();
    o+='<div class="sec"><h4>'+t('binIntros')+'</h4><div class="grid3">'+['introGlass','introBox','introPill','introType','introTwo','introLower','plainText'].map(k=>'<div class="tile" data-add="text:'+k+'"><div class="pv" dir="rtl"><span style="all:unset;'+({introGlass:'background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45);padding:2px 8px;border-radius:8px',introBox:'background:#8F73F5;padding:2px 7px;border-radius:6px',introPill:'background:#D2558F;padding:2px 9px;border-radius:12px',introType:'-webkit-text-stroke:.6px #000',introTwo:'line-height:1.2',introLower:'background:rgba(0,0,0,.7);padding:1px 6px;border-radius:5px;font-size:12px',plainText:''}[k])+'">'+t('pv_'+k)+'</span></div><span>'+t(k)+'</span></div>').join('')+'</div></div>';
    o+='<div class="sec"><h4>'+t('binViz')+'</h4><div class="grid3">'+VIZK.map(k=>'<div class="tile" data-add="viz:'+k+'"><div class="pv vz vz-'+k+'">'+VIZPV[k]+'</div><span>'+t('vk_'+k)+'</span></div>').join('')+'<div class="tile" data-add="outro:1"><div class="pv" style="background:#1d1d24;color:#fff;font-weight:700;font-size:15px">'+t('endCardPv')+'</div><span>'+t('endCard')+'</span></div><div class="tile" data-add="cover:1"><div class="pv" style="background:#F3F2EE;color:#15151C;font-family:\'Noto Naskh Arabic\';font-weight:700;font-size:22px">'+t('coverDef')+'</div><span>'+t('type_cover')+'</span></div></div><p class="hint">'+t('binVizHint')+'</p><h4 style="margin-top:12px">'+t('shotTitle')+'</h4><div class="row"><input type="text" id="shotUrl" dir="ltr" placeholder="example.com"><button class="sm" id="shotGo">'+t('add')+'</button></div><p class="hint">'+t('shotHint')+'</p></div>';
    o+='<div class="sec"><h4>'+t('binSplit')+'</h4><div class="grid3">'+CARDS.map(k=>'<div class="tile" data-add="split:'+k+'"><div class="pv cdp">'+CARDPV[k]+'</div><span>'+t('cs2_'+k)+'</span></div>').join('')+'</div><p class="hint">'+t('binSplitHint')+'</p></div>';
    o+='<div class="sec"><h4>'+t('binDraw')+'</h4><button class="sm" data-drawbin="1" style="width:100%;height:40px;display:flex;align-items:center;justify-content:center;gap:8px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 4-2 5-4s2-3 4-3 3 2 5 2 4-2 4-2"/><path d="M14 4l6 6-8 8-6-6z"/></svg>'+t('drawStartBtn')+'</button><p class="hint">'+t('binDrawHint')+'</p></div>';
    o+='<div class="sec"><h4>'+t('binPerson')+'</h4><div class="grid3">'+BGM.map(m=>'<div class="tile" data-add="bg:'+m+'"><div class="pv bgm bgm-'+m+'"><i></i></div><span>'+t('bg_'+m)+'</span></div>').join('')+'<div class="tile" data-add="behind:1"><div class="pv bgm bhd"><b>'+t('behindDef')+'</b><i></i></div><span>'+t('type_behind')+'</span></div></div><p class="hint">'+t('binPersonHint')+'</p></div>';
    o+='<div class="sec"><h4>'+t('binHooks')+'</h4>'+tog('hooks.on',t('hookLab'),t('hookLabSub'),h.hooks.on);
    if(h.hooks.on){ const it=h.hooks.items; o+=[0,1,2].map(i=>'<div class="row"><input type="radio" name="hk" data-hkact="'+i+'"'+((h.hooks.active||0)===i?' checked':'')+' style="flex:none"><input type="text" dir="auto" data-hk="'+i+'" placeholder="'+t('hookN',i+1)+'" value="'+esc((it[i]||{}).text||'')+'"></div>').join('')
        +seg(t('style'),'hooks.style',[['box',t('bgBox')],['pill',t('bgPill')],['glass',t('fr_glass')],['plain',t('bgNone')]],h.hooks.style)+slider(t('duration'),'hooks.dur',1,5,h.hooks.dur,0.1)+'<p class="hint">'+t('hookHint')+'</p>'; }
    o+='</div>';
    o+='<div class="sec"><h4>'+t('binChars')+'<button class="sm" data-up="char">'+t('upload')+'</button></h4><div class="grid3">'+CHARS.map(c=>'<div class="tile" data-add="char:'+c+'"><div class="pv"><canvas data-spr="'+c+'" width="56" height="56"></canvas></div><span>'+t('char_'+c)+'</span></div>').join('')+'</div><p class="hint">'+t('charHint')+'</p></div>';
    const hasAuto=k=>h.layers.some(l=>l.auto===k);
    o+='<div class="sec"><h4>'+t('binFx')+'</h4><div class="grid3">'+FXS.map(f=>fxTile(f,'data-add="fx:'+f+'"')).join('')+'</div><div class="chips" style="margin-top:9px"><button data-auto="zooms" class="'+(hasAuto('zooms')?'on':'')+'">'+t('autoZooms')+'</button><button data-auto="transitions" class="'+(hasAuto('transitions')?'on':'')+'">'+t('autoTrans')+'</button></div></div>';
    o+='<div class="sec"><h4>'+t('binTrans')+'</h4><div class="grid3">'+TRS.map(f=>fxTile(f,'data-add="tr:'+f+'"')).join('')+'</div><div class="row" style="margin-top:9px"><label>'+t('trDir')+'</label><div class="seg">'+['right','left','up','down'].map(d=>'<button data-k="trDir" data-v="'+d+'" class="'+((hs().trDir||'right')===d?'on':'')+'">'+t('dir_'+d)+'</button>').join('')+'</div></div><p class="hint">'+t('binTransHint')+'</p></div>';
    o+='<div class="sec"><h4>'+t('binMarks')+'</h4><div class="grid3">'+MKK.map(k=>'<div class="tile" data-add="mark:'+k+'"><div class="pv mkp">'+MKPV[k]+'</div><span>'+t('mk_'+k)+'</span></div>').join('')+'<div class="tile" data-add="cursor:1"><div class="pv mkp"><svg viewBox="0 0 60 40"><path d="M24 6 L24 32 L31 26 L36 37 L41 35 L36 24 L45 24 Z" fill="#fff" stroke="#15151C" stroke-width="2" stroke-linejoin="round"/></svg></div><span>'+t('type_cursor')+'</span></div></div><p class="hint">'+t('binMarksHint')+'</p>'
      +'<h4 style="margin-top:12px">'+t('binLt')+'</h4><div class="grid3">'+LTS.map(k=>'<div class="tile" data-add="lt:'+k+'"><div class="pv" style="background:#2a2a33">'+LTPV[k]+'</div><span>'+t('lt_'+k)+'</span></div>').join('')+'</div>'
      +'<h4 style="margin-top:12px">'+t('binPip')+'</h4><div class="grid3">'+PIPS.map(k=>'<div class="tile" data-add="pip:'+k+'"><div class="pv pipv pip-'+k+'"><i></i></div><span>'+t('pip_'+k)+'</span></div>').join('')+'<div class="tile" data-add="collage:1"><div class="pv" style="background:#E07A3F"><span style="all:unset;width:44%;height:52%;background:#F4EBD8;transform:rotate(-6deg);box-shadow:0 2px 4px #0005"></span></div><span>'+t('type_collage')+'</span></div></div><p class="hint">'+t('binPipHint')+'</p></div>';
    { const lk=INFO.looks||{}, cur=(hs().look||{}).name||'', g=(hs().grade||{}).preset||'none';
      o+='<div class="sec"><h4>'+t('binLooks')+'</h4><div class="grid3"><div class="tile'+(!cur?' sel':'')+'" data-add="look:"><div class="pv" style="background:#1d1d24;color:#fff;font-size:13px">'+t('bgNone')+'</div><span>'+t('lookNone')+'</span></div>'+Object.keys(lk).map(k=>{ const L=lk[k], c=L.card||{}; return '<div class="tile'+(cur===k?' sel':'')+'" data-add="look:'+k+'"><div class="pv" style="background:'+esc(c.bgColor||'#222')+';color:'+esc(c.accent||'#fff')+';font-weight:800;font-size:15px"><span style="all:unset;border-bottom:3px solid '+esc(c.accent||'#fff')+'">Aa</span></div><span>'+esc(LANG==='ar'?L.ar:L.en)+'</span></div>'; }).join('')+'</div>'
        +(cur?slider(t('lookAmt'),'look.amount',0,1,hs().look.amount==null?0.5:hs().look.amount,0.05):'')+'<p class="hint">'+t('binLooksHint')+'</p>'
        +'<h4 style="margin-top:12px">'+t('binGrade')+'</h4><div class="grid3">'+GRADES.map(k=>'<div class="tile fxt'+(g===k?' sel':'')+'" data-add="grade:'+k+'"><div class="pv"><i class="fxp" style="background-image:url('+thumbAt(T)+');filter:'+GRADEF[k]+'"></i></div><span>'+t('gr_'+k)+'</span></div>').join('')+'</div>'
        +(g!=='none'?slider(t('gradeAmt'),'grade.amount',0.2,1,hs().grade.amount==null?1:hs().grade.amount,0.05):'')+'<p class="hint">'+t('binGradeHint')+'</p></div>'; }
    o+='<div class="sec"><h4>'+t('binSfx')+'</h4><div class="chips">'+['whoosh_up','whoosh_down','thud','tap'].map(k=>'<button data-sfxadd="'+k+'">'+t('sfx_'+k)+'</button>').join('')+'</div><p class="hint">'+t('binSfxHint')+'</p>'+sfxLibHtml()+'</div>';
    o+='<div class="sec"><h4>'+t('binImages')+'<button class="sm" data-up="image">'+t('upload')+'</button></h4><div class="grid3">'+(INFO.assets||[]).map(a=>'<div class="tile" data-add="image:'+esc(a)+'"><div class="pv" style="background-image:url(/assets/'+encodeURIComponent(a)+');background-size:contain;background-repeat:no-repeat"></div><span>'+esc(a)+'</span></div>').join('')+'</div></div>';
    o+='<div class="sec"><h4>'+t('binFonts')+'<button class="sm" data-up="font">'+t('upload')+'</button></h4>'+(h.fonts.length?h.fonts.map(f=>'<div class="item" style="cursor:default"><span style="font-family:\''+esc(f.name)+'\';font-size:16px">'+esc(f.name)+'</span></div>').join(''):'<p class="hint">'+t('binFontsEmpty')+'</p>')+'</div>';
    if((h.ideas||[]).length) o+='<div class="sec"><h4>'+t('binIdeas')+'</h4>'+h.ideas.map(x=>'<div class="item" data-seek="'+(x.t||0)+'"><span>'+esc(x.text)+'</span></div>').join('')+'</div>'; }
  B.innerHTML=o; drawSprites(); }
function drawSprites(){ const w=F.contentWindow, S=w&&w.__hsSpr; if(!S) return; $$('canvas[data-spr]').forEach(cv=>{ const g=S[cv.dataset.spr]; if(!g) return; const x=cv.getContext('2d'), n=g[0].length, p=cv.width/n; x.clearRect(0,0,cv.width,cv.height);
  const body={robo:'#8F73F5',sprout:'#43B072',star:'#F2B33D',cube:'#4C8DFF'}[cv.dataset.spr]; for(let r=0;r<g.length;r++) for(let c=0;c<n;c++){ const ch=g[r][c]; if(ch==='.') continue; x.fillStyle=ch==='W'?'#fff':ch==='E'||ch==='M'?'#15151A':ch==='D'?'rgba(0,0,0,.35)':ch==='A'?'#F2B33D':body; if(ch==='D'){ x.fillStyle=body; x.fillRect(c*p,r*p,p+.5,p+.5); x.fillStyle='rgba(0,0,0,.3)'; } x.fillRect(c*p,r*p,p+.5,p+.5); } }); }
const _sv=b=>'<svg viewBox="0 0 64 40" width="64" height="40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'+b+'</svg>';
const CARDPV={ list:_sv('<circle cx="54" cy="9" r="2.5" fill="currentColor"/><path d="M14 9h32"/><circle cx="54" cy="20" r="2.5" fill="currentColor"/><path d="M22 20h24"/><circle cx="54" cy="31" r="2.5" fill="currentColor"/><path d="M10 31h36"/>'),
  steps:_sv('<path d="M52 9v22" opacity=".5"/><circle cx="52" cy="8" r="5"/><circle cx="52" cy="20" r="5"/><circle cx="52" cy="32" r="5" fill="currentColor"/><path d="M18 8h24M24 20h18M14 32h28"/>'),
  flow:_sv('<rect x="16" y="2" width="32" height="9" rx="3"/><path d="M32 12v5M29 15l3 3 3-3"/><rect x="16" y="19" width="32" height="9" rx="3"/><path d="M32 29v4"/><rect x="16" y="33" width="32" height="6" rx="3" fill="currentColor"/>'),
  versus:_sv('<rect x="4" y="5" width="24" height="30" rx="4"/><rect x="36" y="5" width="24" height="30" rx="4"/><circle cx="32" cy="12" r="5" fill="currentColor"/>'),
  stat:_sv('<circle cx="32" cy="18" r="14" opacity=".4"/><path d="M32 4a14 14 0 0 1 12 21"/><path d="M22 37h20"/>'),
  check:_sv('<path d="M50 8l3 3 6-6M14 9h28"/><path d="M51 17l6 6M57 17l-6 6M20 20h22" opacity=".7"/><path d="M50 32l3 3 6-6M12 33h30"/>'),
  timeline:_sv('<path d="M46 3v34" opacity=".5"/><circle cx="46" cy="8" r="3" fill="currentColor"/><circle cx="46" cy="20" r="3" fill="currentColor"/><circle cx="46" cy="32" r="3" fill="currentColor"/><path d="M14 8h24M20 20h18M12 32h26"/><path d="M52 8h8M52 20h8M52 32h8" opacity=".6"/>'),
  funnel:_sv('<path d="M6 5h52l-6 9H12zM15 17h34l-6 9H21zM24 29h16l-4 8h-8z" fill="currentColor" fill-opacity=".35"/>'),
  quote:_sv('<path d="M46 6c-4 2-6 5-6 9h6zM57 6c-4 2-6 5-6 9h6z" fill="currentColor"/><path d="M12 24h40M18 32h28"/>'),
  draw:_sv('<circle cx="52" cy="14" r="7"/><rect x="24" y="8" width="16" height="12" rx="3" fill="currentColor"/><circle cx="12" cy="14" r="7"/><path d="M44 14h-3M23 14h-3M20 32h24"/>') };
const CARDDEF={ list:{title:'وش تستفيد',text:'[bolt] أسرع\n[money] أرخص\n[shield] أضمن'}, steps:{title:'ثلاث خطوات',text:'الخطوة الأولى\nالخطوة الثانية\nالخطوة الثالثة'}, flow:{title:'كيف يشتغل',text:'[camera] تصوّر\n[wand] يتمنتج\n[rocket] تنشر'},
  versus:{title:'الفرق',a:'قبل',b:'بعد',text:'ساعات | دقايق\nتعب | راحة'}, stat:{title:'الرقم',value:87,unit:'%',label:'وش يعني هذا الرقم'}, check:{title:'الصح والغلط',text:'+ سوّ كذا\n- لا تسوي كذا\n+ وهذا تمام'},
  timeline:{title:'القصة',text:'2021 | البداية\n2023 | أول نجاح\n2026 | اليوم'}, funnel:{title:'من يكمل؟',text:'يشوفون | 1000\nيكملون | 400\nيشترون | 60'}, quote:{text:'اكتب الجملة القوية هنا',by:''} };
const CITIES={'جدة':[21.49,39.19],'الرياض':[24.71,46.68],'مكة':[21.39,39.86],'المدينة':[24.47,39.61],'الدمام':[26.43,50.1],'أبها':[18.22,42.5],'تبوك':[28.38,36.57],'الطائف':[21.27,40.42],'نيوم':[28.0,35.2],'العلا':[26.62,37.92],'دبي':[25.2,55.27],'أبوظبي':[24.45,54.38],'الدوحة':[25.29,51.53],'الكويت':[29.38,47.99],'المنامة':[26.23,50.59],'مسقط':[23.59,58.41],'القاهرة':[30.04,31.24],'الإسكندرية':[31.2,29.92],'عمّان':[31.95,35.93],'بيروت':[33.89,35.5],'دمشق':[33.51,36.29],'بغداد':[33.31,44.37],'القدس':[31.77,35.23],'صنعاء':[15.37,44.19],'الخرطوم':[15.5,32.56],'طرابلس':[32.89,13.19],'تونس':[36.81,10.18],'الجزائر':[36.75,3.06],'الرباط':[34.02,-6.84],'الدار البيضاء':[33.57,-7.59],'مراكش':[31.63,-7.99],'إسطنبول':[41.01,28.98],'أنقرة':[39.93,32.86],'طهران':[35.69,51.39],'كراتشي':[24.86,67.01],'دلهي':[28.61,77.21],'مومباي':[19.08,72.88],'جاكرتا':[-6.21,106.85],'كوالالمبور':[3.14,101.69],'سنغافورة':[1.35,103.82],'بانكوك':[13.76,100.5],'بكين':[39.9,116.4],'شنغهاي':[31.23,121.47],'هونغ كونغ':[22.32,114.17],'طوكيو':[35.68,139.69],'سيول':[37.57,126.98],'سيدني':[-33.87,151.21],'موسكو':[55.76,37.62],'لندن':[51.51,-0.13],'باريس':[48.86,2.35],'برلين':[52.52,13.4],'مدريد':[40.42,-3.7],'برشلونة':[41.39,2.17],'روما':[41.9,12.5],'أمستردام':[52.37,4.9],'جنيف':[46.2,6.14],'فيينا':[48.21,16.37],'أثينا':[37.98,23.73],'نيروبي':[-1.29,36.82],'لاغوس':[6.52,3.38],'كيب تاون':[-33.92,18.42],'أديس أبابا':[9.03,38.74],'نيويورك':[40.71,-74.01],'واشنطن':[38.91,-77.04],'لوس أنجلوس':[34.05,-118.24],'سان فرانسيسكو':[37.77,-122.42],'شيكاغو':[41.88,-87.63],'ميامي':[25.76,-80.19],'تورنتو':[43.65,-79.38],'مكسيكو':[19.43,-99.13],'ساو باولو':[-23.55,-46.63],'بوينس آيرس':[-34.6,-58.38]};
const cityFind=n=>{ n=String(n||'').trim(); if(CITIES[n]) return n; const k=Object.keys(CITIES).find(c=>c.replace(/[ًَُِّْ]/g,'')===n.replace(/[ًَُِّْ]/g,'')||c.startsWith(n)&&n.length>=3); return k||null; };
const VIZPV={ line:'<svg viewBox="0 0 60 40" style="width:70%"><path d="M54 32 L40 26 L28 28 L16 14 L6 6" fill="none" stroke="#2FBF9B" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="6" r="3.5" fill="#2FBF9B"/></svg>', slot:'<b style="font-family:monospace">2,480</b>', news:'<span style="all:unset;display:block;background:#fff;color:#15151C;font-size:10px;line-height:1.5;padding:4px;border-radius:4px;text-align:right">خبر <mark style="background:#FFD21F">مهم</mark> اليوم</span>', pctdots:'<b>60%</b>', people:'<i></i><i></i><i></i><i></i><i class="o"></i><i class="o"></i>', fill:'<u></u>', bars:'<s style="height:90%"></s><s style="height:60%"></s><s style="height:38%"></s>', route:'<em></em>', cta:'<b>حركة</b>' };
function addLayer(o){ snap(); const h=hs(); const id='L'+(Math.max(0,...h.layers.map(l=>parseInt(String(l.id).replace(/\D/g,''))||0))+1); const d=o.type==='fx'?1.4:o.type==='char'?total():o.type==='split'||o.type==='viz'?5:o.type==='cover'?0.9:3;
  const s=o.type==='char'?0:r3(Math.min(T,Math.max(0,total()-0.5))); const L={id,s,e:r3(Math.min(total(),s+d)),track:o.type==='fx'?2:o.type==='text'||o.type==='behind'?1:0,...o}; h.layers.push(L); select({kind:'layer',id}); live(); if(o.type==='bg'||o.type==='behind') toast(t('visMask')); }
const VIZDEF={ line:{layout:'stage',values:[5,9,7,14,22,31],labels:[],unit:'',title:''}, slot:{layout:'stage',value:2480,unit:'',label:''}, news:{layout:'full',source:'عاجل',text:'اكتب عنوان الخبر هنا',mark:'الخبر'}, pctdots:{layout:'stage',values:[60,86,31],title:''}, people:{layout:'stage',value:70}, fill:{layout:'stage',value:75,color2:'#D9643A',accent:'#1E4FA3'}, bars:{layout:'stage',unit:'م',items:[{label:'الأول',value:828},{label:'الثاني',value:601},{label:'الثالث',value:413}]},
  route:{layout:'stage',from:{name:'الدوحة',lat:25.29,lon:51.53},to:{name:'نيروبي',lat:-1.29,lon:36.82},time:'5 ساعات',mode:'plane'}, cta:{pre:'اكتب كلمة',word:'حركة',post:'يوصلك بالخاص',accent:'#E32BD0'} };
const VIZK=['pctdots','people','fill','bars','route','cta','line','slot','news'];
const PRE={ introGlass:{text:'عنوان المقطع',size:92,bg:'glass',anim:'rise',x:.5,y:.72,weight:800,font:'Noto Naskh Arabic'}, introBox:{text:'عنوان المقطع',size:104,bg:'box',bgColor:'#8F73F5',anim:'pop',x:.5,y:.2,weight:900}, introPill:{text:'عنوان المقطع',size:92,bg:'pill',bgColor:'#D2558F',anim:'rise',x:.5,y:.2,weight:900},
  introType:{text:'عنوان المقطع',size:110,bg:'none',stroke:7,anim:'type',x:.5,y:.2,weight:900}, introTwo:{text:'السطر الأول\nالسطر الثاني',size:96,bg:'none',stroke:6,anim:'drop',x:.5,y:.22,weight:900},
  introLower:{text:'الاسم · الوصف',size:54,bg:'box',bgColor:'#000000',bgOpacity:.7,anim:'slide',x:.5,y:.7,weight:700}, plainText:{text:'نص',size:80,bg:'none',anim:'fade',x:.5,y:.4,weight:800} };
$('#lbody').addEventListener('input',e=>{ const el=e.target; if(el.id==='mq'||el.id==='gTx') return; if(el.id==='q'){ Q=el.value.trim(); const pos=el.selectionStart; renderLeft(); const n=$('#q'); n.focus(); n.setSelectionRange(pos,pos); return; }
  if(el.dataset.hk!==undefined){ const h=hs().hooks, i=+el.dataset.hk; while(h.items.length<=i) h.items.push({text:''}); h.items[i].text=el.value; live(); return; }
  panelInput(e); });
$('#lbody').addEventListener('keydown',e=>{ if(e.target.id==='mq'&&e.key==='Enter'){ e.preventDefault(); mediaSearch(); } });
$('#lbody').addEventListener('change',e=>{ if(e.target.dataset.hkact!==undefined){ snap(); hs().hooks.active=+e.target.dataset.hkact; live(); if(T>hs().hooks.dur) seek(0.6); } });
$('#lbody').addEventListener('click',async e=>{ const el=e.target, d=el.dataset, tile=el.closest('[data-add]');
  if(d.seek!==undefined){ if(playing) stop(); seek(+d.seek+0.02); const c=el.closest('.card'); if(c) select({kind:'cap',id:+c.dataset.card}); return; }
  if(d.w){ snap(); const [i,j]=d.w.split(':').map(Number), w=ST.caps.cards[i].w[j]; w.hot=!w.hot; el.classList.toggle('hot',w.hot); drawT(T); dirty(); return; }
  if(d.edit!==undefined){ editCard(+d.edit); return; }
  if(d.drop!==undefined){ askRemove({cards:[+d.drop]},'«'+key(ST.caps.cards[+d.drop])+'»'); return; }
  if(d.up){ pickFile(d.up); return; }
  if(el.id==='mGo'){ mediaSearch(); return; }
  if(d.mfit){ MEDIA.fit=d.mfit; renderLeft(); return; }
  if(d.gen){ genAsk(d.gen); return; }
  if(d.gopen){ genOpen(d.gopen); return; } if(d.gup){ genUpload(d.gup); return; } if(d.gcl){ genClaude(d.gcl); return; } if(d.grm){ genRm(d.grm); return; }
  if(d.mkind){ MEDIA.kind=d.mkind; MEDIA.items=[]; MEDIA.msg=''; renderLeft(); return; }
  if(el.id==='shotGo'){ const u=$('#shotUrl').value.trim(); if(!u) return; el.disabled=true; toast(t('shotBusy')); await save(); const r=await api('/hs/shot',{url:u,at:T,dur:4}); if(!r.ok){ el.disabled=false; toast(r.msg||t('failed')); return; } await load(true); select({kind:'layer',id:r.id}); toast(t('imageAdded')); return; }
  if(d.sfxplay){ sfxPlay(d.sfxplay); return; }
  if(d.myedit){ myEdit(d.myedit); return; }
  if(el.id==='myOpen'){ const r=await api('/hs/open_sounds',{}); toast(r.ok?t('myOpened'):(r.dir||t('failed'))); return; }
  if(d.sfxlib){ const it=SFXLIB.find(x=>x.id===d.sfxlib); if(it&&!it.have){ toast(t('sfxGetting')); const r=await api('/hs/sfx_fetch',{ids:[it.id]}); if(!r.ok){ toast(r.msg||t('failed')); return; } it.have=true; renderLeft(); } sfxAdd(d.sfxlib); return; }
  if(el.id==='sfxAll'){ el.disabled=true; toast(t('sfxGetting')); const r=await api('/hs/sfx_fetch',{}); await sfxLibLoad(); renderLeft(); toast(r.ok?t('sfxGotAll'):(r.msg||t('failed'))); return; }
  if(d.sfxadd){ sfxAdd(d.sfxadd); return; }
  if(d.auto){ autoFx(d.auto,!el.classList.contains('on')); return; }
  const mt=el.closest('[data-madd]'); if(mt){ const it=MEDIA.items[+mt.dataset.madd]; toast(t('downloading')); await save(); const r=await api('/hs/media_add',{item:it,at:T,dur:it.kind==='video'?4:3,fit:MEDIA.fit}); if(!r.ok){ toast(r.msg||t('failed')); return; } await load(true); if(r.id) select({kind:'layer',id:r.id}); toast(t(it.kind==='video'?'clipAdded':'imageAdded')); return; }
  if(tile){ const [kind,arg]=tile.dataset.add.split(/:(.*)/);
    if(kind==='text') addLayer({type:'text',font:hs().cap.font,color:'#FFFFFF',...PRE[arg]});
    else if(kind==='char') addLayer({type:'char',char:arg,x:.2,y:.62,size:.26,color:{robo:'#8F73F5',sprout:'#43B072',star:'#F2B33D',cube:'#4C8DFF'}[arg],anim:'pop',react:true});
    else if(kind==='fx') addLayer({type:'fx',fx:arg,amount:.6});
    else if(kind==='viz') addLayer({type:'viz',kind:arg,track:2,...VIZDEF[arg],...(hs().cardDefault?{accent:hs().cardDefault.accent}:{})});
    else if(kind==='tr') addLayer({...trAdd(arg,T),s:r3(Math.max(0,T-0.3)),e:r3(Math.min(total(),T+0.35))});
    else if(kind==='mark') addLayer({type:'mark',kind:arg,x:.5,y:arg==='underline'?.62:.4,w:arg==='check'||arg==='cross'?.22:.46,h:arg==='underline'?.03:arg==='highlight'?.05:.1,color:arg==='cross'||arg==='arrow'?'#FF4D6D':arg==='check'?'#2FBF9B':'#FFD21F',lw:10,track:1});
    else if(kind==='cursor') addLayer({type:'cursor',x:.5,y:.45,at:1.0,style:'light',track:1});
    else if(kind==='lt') addLayer({type:'lt',style:arg,text:(ST.theme&&ST.theme.handle&&ST.theme.handle!=='@handle'?ST.theme.handle.replace(/^@/,''):t('ltName')),sub:t('ltSub'),side:'right',y:.7,size:64,track:1});
    else if(kind==='pip') addLayer({type:'pip',pos:arg,size:.36,deco:'grid',track:2,...(hs().cardDefault?{bgColor:hs().cardDefault.bgColor,accent:hs().cardDefault.accent,deco:hs().cardDefault.deco||'grid'}:{})});
    else if(kind==='collage'){ const im=(INFO.assets||[]).filter(a=>/\.png$/i.test(a)).concat((INFO.assets||[]).filter(a=>!/\.png$/i.test(a))).slice(0,3); if(!im.length){ toast(t('collageNeed')); return; } addLayer({type:'collage',items:im.map(a=>({src:'assets/'+a})),bgColor:'#E07A3F',track:2}); }
    else if(kind==='look') lookApply(arg);
    else if(kind==='grade'){ snap(); const h=hs(); if(arg==='none') delete h.grade; else h.grade={preset:arg,amount:(h.grade&&h.grade.amount)||1}; renderLeft(); live(); }
    else if(kind==='outro'){ if(ST.outro>0){ select({kind:'outro',id:0}); seek(Math.min(dur()-0.05,total()+1.6)); } else outroSet(3.5); }
    else if(kind==='cover') addLayer({type:'cover',text:t('coverDef'),bgColor:'#F3F2EE',font:'Noto Naskh Arabic',size:230,track:2});
    else if(kind==='split') addLayer({type:'split',style:arg,size:84,track:2,...(CARDDEF[arg]||CARDDEF.list),...(hs().cardDefault||{})});
    else if(kind==='bg') addLayer({type:'bg',mode:arg,amount:.6,...(arg==='color'||arg==='grad'||arg==='studio'?{color:(ST.theme&&ST.theme.bg)||'#101014'}:{}),...(arg==='image'&&(INFO.assets||[])[0]?{src:'assets/'+INFO.assets[0]}:{})});
    else if(kind==='behind') addLayer({type:'behind',text:t('behindDef'),size:270,color:'#FFFFFF',font:hs().cap.font,anim:'rise'});
    else if(kind==='image') addLayer({type:'image',src:'assets/'+arg,x:.5,y:.35,w:.5,anim:'pop'});
    else if(kind==='broll'){ snap(); const n=(ST.studio.brNeed[arg]||[1,90])[1]; ST.studio.brollClips=ST.studio.brollClips||[]; ST.studio.brollClips.push({k:arg,s:r3(T),e:r3(Math.min(total(),T+Math.min(4,n/30))),mode:'full'}); select({kind:'broll',id:ST.studio.brollClips.length-1}); hard(); }
    return; }
  panelClick(e); });
function pickFile(kind){ const inp=$('#fileIn'); inp.value=''; inp.accept={font:'.ttf,.otf,.woff,.woff2',broll:'video/*',image:'image/*',char:'image/*',bgimg:'image/*',sound:'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac'}[kind]; inp.multiple=kind==='sound'; inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return;
    if(kind==='sound'){ toast(t('uploading')); let n=0; for(const g of [...inp.files]){ const r=await api('/hs/mysfx',g,{'X-Name':encodeURIComponent(g.name)}); if(r.ok){ n++; sfxSet(r.items); } else toast(r.msg||t('failed')); } renderLeft(); if(n) toast(t('myAdded',n)); return; }
    if(kind==='font'){ const r=await api('/hs/font',f,{'X-Name':encodeURIComponent(f.name)}); if(!r.ok){ toast(r.msg||t('failed')); return; } snap(); const h=hs(); if(!h.fonts.some(x=>x.file===r.file)) h.fonts.push({name:r.name,file:r.file}); const L=selLayer(); if(L&&L.type==='text') L.font=r.name; else h.cap.font=r.name; renderAll(); await live(); toast(t('fontAdded',r.name)); }
    else if(kind==='broll'){ await save(); const r=await api('/api/broll',f,{'X-Name':encodeURIComponent(f.name)}); if(!r.ok){ toast(t('busyJob')); return; } toast(t('uploading')); pollJob(()=>load(true)); }
    else { const r=await api('/hs/asset',f,{'X-Name':encodeURIComponent(f.name)}); if(!r.ok){ toast(r.msg||t('failed')); return; } INFO.assets=[...new Set([...(INFO.assets||[]),r.file])];
      if(kind==='bgimg'){ const L=selLayer(); if(L){ snap(); L.src=r.src; L.mode='image'; renderRight(); live(); } } else if(kind==='char') addLayer({type:'char',src:r.src,x:.2,y:.62,size:.3,anim:'pop',react:true}); else addLayer({type:'image',src:r.src,x:.5,y:.35,w:.5,anim:'pop'}); renderLeft(); } }; inp.click(); }

/* ───── اليمين ───── */
function aiNote(n){ const w=n.status==='ask';
  return '<div class="note ai'+(w?' wait':'')+'"><div style="flex:1;min-width:0"><span class="t" style="direction:ltr;color:var(--mut);font-size:11px;cursor:pointer" data-seek="'+n.t+'">'+fmt(n.t)+'</span> <span class="st ai">Claude</span> <span class="st">'+t('aik_'+(n.kind||'suggest'))+'</span>'+(w?'':' <span class="st '+n.status+'">'+t('ns_'+n.status)+'</span>')+'<p dir="auto">'+esc(n.text)+'</p>'+(n.answer?'<p class="rep" dir="auto" style="color:var(--note)">'+t('aiYou')+esc(n.answer)+'</p>':'')+(n.reply?'<p class="rep" dir="auto">'+esc(n.reply)+'</p>':'')+(w?'<div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap">'+(n.kind==='question'?'':'<button class="sm pri" data-aians="'+n.id+'" data-v="yes">'+t('aiYes')+'</button><button class="sm" data-aians="'+n.id+'" data-v="no">'+t('aiNo')+'</button>')+'<input data-aitx="'+n.id+'" dir="auto" placeholder="'+esc(t('aiReplyPh'))+'" style="flex:1;min-width:120px"><button class="sm" data-aians="'+n.id+'" data-v="text">'+t('aiSend')+'</button></div>':'<button class="sm ghost" data-delnote="'+n.id+'">'+t('delete')+'</button>')+'</div></div>'; }
function renderRight(){ const B=$('#body'), h=hs(); let o='';
  if(RTAB==='sel') o=inspector();
  else if(RTAB==='cap'){ fontLink(); h.fonts.forEach(localFace); const c=h.cap;
    o+=tog('cap.on',t('capFull'),t('capFullSub'),c.on);
    if(!c.on){ o+='<div class="sec"><h4>'+t('engineStyle')+'</h4><select id="capStyle">'+['card','shadow','big','underline','bar','type'].map(k=>'<option value="'+k+'"'+((ST.theme.capStyle||'card')===k?' selected':'')+'>'+t('cs_'+k)+'</option>').join('')+'</select><p class="hint">'+t('capOffHint')+'</p></div>'; }
    else { const sz=INFO.safe; if(sz&&(c.y>sz.capMax+0.01||c.y<sz.capMin-12)) o+='<div class="warnbox">'+t('capSafeWarn',sz.capMin,sz.capMax)+'</div>';
      o+='<div class="sec"><h4>'+t('capPresets')+'</h4><div class="grid3">'+Object.keys(CAPPRE).map(preTile).join('')+'</div></div>';
      o+='<div class="sec"><h4>'+t('font')+'<button class="sm" data-up="font">'+t('addFont')+'</button></h4><div class="fonts">'+[...h.fonts.map(f=>f.name),...AR_FONTS].map(f=>'<div class="fcard'+(c.font===f?' on':'')+'" data-font="'+esc(f)+'"><b style="font-family:\''+f+'\'">متابعة</b><span>'+esc(f)+'</span></div>').join('')+'</div></div>';
      o+='<div class="sec"><h4>'+t('look')+'</h4>'+pick(t('weight'),'cap.weight',weightsOf(c.font).map(w=>[w,t('w_'+w)]),c.weight)+slider(t('size'),'cap.size',34,150,c.size)+swatches(t('textColor'),'cap.color',c.color)+swatches(t('activeColor'),'cap.active',c.active)
        +seg(t('background'),'cap.bg',[['none',t('bgNone')],['box',t('bgBox')],['lines',t('bgLines')],['bar',t('bgBar')],['glass',t('fr_glass')],['pill',t('bgWord')]],c.bg)+(c.bg==='box'||c.bg==='bar'||c.bg==='lines'?swatches(t('cardColor'),'cap.bgColor',c.bgColor)+slider(t('cardOpacity'),'cap.bgOpacity',0.1,1,c.bgOpacity,0.05):'')
        +slider(t('stroke'),'cap.stroke',0,12,c.stroke)+(c.stroke>0?swatches(t('strokeColor'),'cap.strokeColor',c.strokeColor):'')+seg(t('shadow'),'cap.shadow',[[true,t('yes')],[false,t('no')],['hard',t('shadowHard')]],c.shadow)+(c.shadow==='hard'?swatches(t('shadowColor'),'cap.shadowColor',c.shadowColor):'')
        +seg(t('hlMode'),'cap.hl',[['color',t('hlColor')],['under',t('hlUnder')],['dim',t('hlDim')],['glow',t('hlGlow')],['marker',t('hlMarker')]],c.hl)+seg(t('fillMode'),'cap.fill',[['solid',t('fillSolid')],['outline',t('fillOutline')]],c.fill)+slider(t('actScale'),'cap.actScale',1,1.5,c.actScale,0.02)+'</div>';
      o+='<div class="sec"><h4>'+t('entrance')+'</h4><div class="seg">'+ENTERS.map(k=>'<button data-k="cap.enter" data-v="'+k+'" class="'+(c.enter===k?'on':'')+'" style="flex:1 1 22%">'+t('en_'+k)+'</button>').join('')+'</div>'+seg(t('display'),'cap.chunk',[[0,t('modeLine')],[1,t('chunk1')],[2,t('chunk2')],[3,t('chunk3')],[4,t('chunk4')]],c.mode==='word'?1:c.chunk).replace('class="row"','class="row" style="margin-top:9px"')+'</div>';
      o+='<div class="sec"><h4>'+t('position')+'</h4>'+slider(t('position'),'cap.y',15,92,c.y,0.5)+slider(t('lineWidth'),'cap.width',380,980,c.width,10)+seg(t('lines'),'cap.lines',[[1,'1'],[2,'2'],[3,'3']],c.lines)+'<p class="hint">'+t('capFaceHint')+'</p></div>'; } }
  else if(RTAB==='tr'){ const e=h.en, cards=ST.caps.cards, miss=cards.filter(c=>!e.map[key(c)]).length;
    o+=tog('en.on',t('trTitle'),t('trSub'),e.on);
    if(miss) o+='<div class="warnbox">'+t('trMissing',miss)+'<div style="margin-top:7px"><button class="sm" id="askTr">'+t('trAsk')+'</button></div></div>';
    o+='<div class="sec"><h4>'+t('trLook')+'</h4>'+pick(t('font'),'en.font',[...EN_FONTS,...AR_FONTS.slice(0,3)],e.font)+slider(t('size'),'en.size',22,110,e.size)+swatches(t('color'),'en.color',e.color)+seg(t('position'),'en.pos',[['below',t('below')],['above',t('above')]],e.pos)+'<div class="row"><label></label><button class="sm" id="matchSize">'+t('matchSize')+'</button></div></div>';
    o+='<div class="sec"><h4>'+t('sentences')+'</h4>'+cards.map((c,i)=>'<div class="card" data-card="'+i+'"><span class="t" data-seek="'+c.s+'">'+fmt(c.s)+'</span><div class="ar" dir="rtl">'+esc(key(c))+'</div><textarea dir="ltr" data-en="'+i+'" rows="1" placeholder="English">'+esc(e.map[key(c)]||'')+'</textarea></div>').join('')+'</div>'; }
  else if(RTAB==='audio'){ const m=h.mix, sf=ST.studio.sfx||{}, types=Object.keys(sf).filter(k=>Array.isArray(sf[k])&&sf[k].length);
    o+='<div class="sec"><h4>'+t('voice')+'</h4>'+slider(t('level'),'mix.voice',0,2,m.voice,0.05)+tog('mix.clean',t('cleanVoice'),t('cleanVoiceSub'),m.clean)+'<div class="row"><label>'+t('voiceFx')+'</label><select data-k="mix.voiceFx">'+['','clarity','deboom','demud','soft','radio','phone'].map(k=>'<option value="'+k+'"'+((m.voiceFx||'')===k?' selected':'')+'>'+t('vfx_'+(k||'none'))+'</option>').join('')+'</select></div><p class="hint" style="margin-top:-2px">'+t('voiceFxHint')+'</p>'+slider(t('duck'),'mix.duck',0.15,1,m.duck==null?0.45:m.duck,0.05)+'<p class="hint" style="margin-top:-2px">'+t('duckHint')+'</p></div>';
    o+='<div class="sec"><h4>'+t('sfxLevels')+'</h4>'+(types.length?types.map(k=>slider(t('sfx_'+k),'mix.sfx.'+k,0,2,m.sfx[k]==null?1:m.sfx[k],0.05)).join(''):'<p class="hint">'+t('noSfx')+'</p>')+'</div>';
    o+='<div class="sec"><h4>'+t('bgAudio')+'</h4>'+slider(t('level'),'mix.bg',0,1,m.bg,0.02)+slider(t('bgFadeIn'),'mix.bgIn',0,6,m.bgIn==null?1:m.bgIn,0.1)+slider(t('bgFadeOut'),'mix.bgOut',0,6,m.bgOut==null?1.4:m.bgOut,0.1)+'<p class="hint">'+t('bgAudioHint')+' '+t('bgFadeHint')+'</p></div><p class="hint">'+t('audioHint')+'</p>'; }
  else if(RTAB==='check'){ const c=CHECK; if(!c){ o='<p class="hint">…</p>'; } else {
      const rq=c.reqs||[]; if(rq.length){ const nd=rq.filter(r=>r.ok).length;
        o+='<div class="sec"><h4>'+t('reqTitle')+' <span class="st '+(nd===rq.length?'ok':'bad')+'" style="direction:ltr;display:inline-block">'+nd+' / '+rq.length+'</span></h4><p class="hint">'+t('reqHint')+'</p>'+rq.map(r=>'<div class="item req'+(r.ok?' ok':'')+'"><span class="st '+(r.ok?'ok':'bad')+'" style="flex:none">'+(r.ok?'✓':'□')+'</span><span style="flex:1;min-width:0"><b dir="auto">'+esc(r.label)+'</b>'+(r.why&&(!r.ok||r.man)?'<br><small dir="auto" style="color:var(--mut)">'+(r.man&&r.ok?t('reqBy'):'')+esc(r.why)+'</small>':'')+'</span></div>').join('')+'</div>'; }
      o+='<div class="sec" style="display:flex;align-items:flex-end;gap:12px"><div class="score" style="color:'+(c.score>=80?'var(--au)':c.score>=55?'var(--warn)':'var(--bad)')+'">'+c.score+'</div><div class="hint" style="margin:0">'+t('checkScore')+'</div></div>';
      o+='<div class="sec"><h4>'+t('chkRetention')+'</h4>'+slider(t('chkGap'),'check.gap',1.5,5,h.check.gap,0.1);
      if(c.firstCap!=null&&c.firstCap>1) o+='<div class="item" data-seek="0"><span class="st bad">'+t('chkFirst',c.firstCap.toFixed(1))+'</span></div>';
      o+=c.gaps.map(g=>'<div class="item" data-seek="'+g.s+'"><span>'+t('chkGapItem',g.d.toFixed(1))+'</span><span class="st" style="flex:none;direction:ltr">'+fmt(g.s)+'</span></div>').join('')+c.longCaps.map(l=>'<div class="item" data-seek="'+ST.caps.cards[l.card].s+'"><span>'+t('chkLong',l.card+1,l.n)+'</span></div>').join('');
      if(!c.gaps.length&&!c.longCaps.length&&!(c.firstCap>1)) o+='<p class="hint">'+t('chkClean')+'</p>'; else o+='<p class="hint">'+t('chkGapHint')+'</p>';
      o+='</div>'; { const om=(c.open&&c.open.miss)||[], ln=c.len||[];
        o+='<div class="sec"><h4>'+t('chkOpen')+'</h4>'+(om.length?om.map(k=>'<div class="item" data-seek="0"><span>'+t('chkOpen_'+k)+'</span></div>').join('')+'<p class="hint">'+t('chkOpenHint')+'</p>':'<p class="hint">'+t('chkOpenOk')+'</p>')+'</div>';
        if(ln.length) o+='<div class="sec"><h4>'+t('chkLen')+'</h4>'+ln.map(l=>'<div class="item"><span'+(l.k==='over'?' class="st bad"':'')+'>'+(l.k==='over'?t('chkLen_over',t('b_'+l.p),l.max,Math.round(c.total)):t('chkLen_'+l.k,t('b_'+l.p),l.lo,l.hi,Math.round(c.total)))+'</span></div>').join('')+'</div>'; }
      o+='<div class="sec"><h4>'+t('chkFillers')+'</h4>'+(c.fillers.length?c.fillers.map((f,i)=>'<label class="item"><input type="checkbox" data-fil="'+f.card+':'+f.idx+'" checked><span dir="rtl">«'+esc(f.t)+'» · '+esc(key(ST.caps.cards[f.card]).slice(0,34))+'</span><span class="st" style="flex:none;direction:ltr" data-seek="'+f.s+'">'+fmt(f.s)+'</span></label>').join(''):'<p class="hint">'+t('chkNoFillers')+'</p>')+'</div>';
      o+='<div class="sec"><h4>'+t('chkDupes')+'</h4>'+(c.dupes.length?c.dupes.map(d=>'<label class="item" style="align-items:flex-start"><input type="checkbox" data-dup="'+d.a+'" checked style="margin-top:4px"><span dir="rtl"><span class="st bad">'+t('chkDrop')+'</span> '+esc(key(ST.caps.cards[d.a]))+'<br><span class="st ok">'+t('chkKeep')+'</span> '+esc(key(ST.caps.cards[d.b]))+'</span></label>').join(''):'<p class="hint">'+t('chkNoDupes')+'</p>')+'</div>';
      if(c.fillers.length||c.dupes.length) o+='<button class="pri" id="doClean" style="width:100%">'+t('chkRemove')+'</button><p class="hint">'+t('chkRemoveHint')+'</p>'; } }
  else if(RTAB==='notes'){ const open=NOTES.filter(n=>n.status!=='done'&&n.status!=='ask').length, cm=(REV.comments||[]);
    o+='<div class="sec"><button class="pri" id="newNote" style="width:100%">'+t('newNoteAt',fmt(T))+'</button></div>';
    if(INFO&&INFO.claude) o+=quickHtml();
    if(!NOTES.length) o+='<p class="hint">'+t('notesEmpty')+'</p>';
    const ask=NOTES.filter(n=>n.status==='ask');
    if(ask.length) o+='<div class="sec"><h4>'+t('aiAskTitle',ask.length)+'</h4>'+ask.sort((a,b)=>a.t-b.t).map(aiNote).join('')+'</div>';
    o+=NOTES.filter(n=>n.status!=='ask').sort((a,b)=>a.t-b.t).map(n=>n.by==='claude'?aiNote(n):'<div class="note">'+(n.img?'<img src="/'+n.img+'?v='+n.id+'">':'')+'<div style="flex:1;min-width:0"><span class="t" style="direction:ltr;color:var(--mut);font-size:11px;cursor:pointer" data-seek="'+n.t+'">'+fmt(n.t)+'</span> <span class="st '+n.status+'">'+t('ns_'+n.status)+'</span>'+(n.who&&n.who!=='أنا'?' <span class="st">'+esc(n.who)+'</span>':'')+'<p dir="auto">'+esc(n.text)+'</p>'+(n.audio?'<audio controls preload="none" src="/'+n.audio+'"></audio>':'')+(n.reply?'<p class="rep" dir="auto">'+esc(n.reply)+'</p>':'')+'<button class="sm ghost" data-delnote="'+n.id+'">'+t('delete')+'</button></div></div>').join('');
    if(NOTES.length) o+='<div class="sec" style="margin-top:12px"><button class="pri" id="sendNotes" style="width:100%"'+(open?'':' disabled')+'>'+t(INFO.claude?'sendRun':'sendCopy',open)+'</button><div id="sendOut"></div></div>';
    o+='<div class="sec"><h4>'+t('clientReview')+(REV.approved?'<span class="st ok">'+t('approvedBy',esc(REV.approved.by))+'</span>':'')+'</h4>'+(cm.length?cm.map(c=>'<div class="note"><div style="flex:1;min-width:0"><span class="t" style="direction:ltr;color:var(--mut);font-size:11px;cursor:pointer" data-seek="'+c.t+'">'+fmt(c.t)+'</span> <span class="st">'+esc(c.who)+'</span>'+(c.status==='promoted'?' <span class="st sent">'+t('promoted')+'</span>':'')+'<p dir="auto">'+esc(c.text)+'</p>'+(c.status==='open'?'<button class="sm" data-promote="'+c.id+'">'+t('promote')+'</button>':'')+'</div></div>').join(''):'<p class="hint">'+t('reviewEmpty')+'</p>')+'<div class="copy"><span style="direction:ltr;text-align:left">'+esc(INFO.review)+'</span><button class="sm" data-copy="'+esc(INFO.review)+'">'+t('copy')+'</button></div><p class="hint">'+t('reviewHint')+'</p></div>'; }
  else if(RTAB==='claude'){ o+='<div class="sec"><h4>'+t('askClaude')+(PULSE.agent&&PULSE.agent.running?'<button class="sm" id="agStop">'+t('stop')+'</button>':'')+'</h4><textarea id="agTx" rows="3" dir="auto" placeholder="'+t('askPh')+'"></textarea><div class="row" style="margin-top:8px"><button class="pri" id="agGo"'+(PULSE.agent&&PULSE.agent.running?' disabled':'')+'>'+t(INFO.claude?'run':'copyReq')+'</button><span class="hint" style="margin:0">'+t(INFO.claude?'askHint':'askNoCli')+'</span></div><div id="agOut"></div></div>';
    o+='<div class="sec"><h4>'+t('stagesTitle')+'</h4><div class="stages" id="pStages"></div></div><div class="sec"><h4>'+t('feedTitle')+'</h4><div class="feed" id="pFeed"></div></div>'; }
  else if(RTAB==='proj'){
    o+=styleSec(h);
    o+='<div class="sec"><h4>'+t('exportTitle')+'</h4><label class="item"><input type="checkbox" id="exHooks"'+(h.hooks.on&&h.hooks.items.filter(x=>x&&x.text).length>1?'':' disabled')+'><span>'+t('exHooks')+'</span></label><div class="row"><button class="pri" id="doRender" style="flex:1">'+t('exportFinal')+'</button><button id="doClean2">'+t('exportClean')+'</button></div><div id="dl">'+(INFO.finals||[]).map(f=>'<div class="item" style="cursor:default"><span><a href="/'+f+'?v='+Date.now()+'" download>'+t('download')+' '+f+'</a></span><button class="sm" data-phone="'+f+'">'+t('toPhone')+'</button></div>').join('')+'</div><div id="log" style="margin-top:8px;display:none"></div></div>';
    o+='<div class="sec"><h4>'+t('packTitle')+'</h4><textarea id="postTx" rows="4" dir="auto" placeholder="'+t('postPh')+'">'+esc(INFO.post||'')+'</textarea><div class="row" style="margin-top:8px"><button id="doPack">'+t('packBuild')+'</button><button class="sm ghost" id="askPost">'+t('askPost')+'</button></div><div id="packOut"></div></div>';
    { const fr=h.frame||{ar:'9:16'}, pl=h.platforms||[], sz=INFO.safe||{};
      o+='<div class="sec"><h4>'+t('frameTitle')+'</h4><div class="seg" style="margin-bottom:8px">'+FRAMES.map(f=>'<button data-frame="'+f+'" class="'+((fr.ar||'9:16')===f?'on':'')+'">'+f+'</button>').join('')+'</div><div class="chips" style="margin-bottom:8px">'+PLATS.map(k=>'<button data-plat="'+k+'" class="'+(pl.includes(k)?'on':'')+'">'+t('b_'+k)+'</button>').join('')+'</div>'
        +(fr.ar==='4:5'||fr.ar==='1:1'?slider(t('frameCy'),'frame.cy',0.3,0.7,fr.cy==null?0.47:fr.cy,0.01):'')+'<p class="hint">'+t('fh_'+(fr.ar||'9:16').replace(':','x'))+' '+(sz.capMax?t('frameSafe',sz.capMin,sz.capMax):'')+'</p>'
        +pl.map(k=>'<p class="hint" style="margin-top:4px"><b>'+t('b_'+k)+'</b>: '+t('pf_'+k)+'</p>').join('')+'</div>'; }
    o+='<div class="sec"><h4>'+t('compareTitle')+'</h4>'+((INFO.exports||[]).length>1?'<div class="row"><select id="cmpA">'+INFO.exports.map((x,i)=>'<option'+(i===1?' selected':'')+'>'+x+'</option>').join('')+'</select><select id="cmpB">'+INFO.exports.map(x=>'<option>'+x+'</option>').join('')+'</select><button class="sm" id="doCmp">'+t('compare')+'</button></div>':'<p class="hint">'+t('compareEmpty')+'</p>')+'</div>';
    o+='<div class="sec"><h4>'+t('brand')+'</h4><div class="row"><select id="brandSel"><option value="">'+t('brandPick')+'</option>'+INFO.brands.map(b=>'<option>'+esc(b)+'</option>').join('')+'</select><button class="sm" id="brandApply">'+t('apply')+'</button></div><div class="row"><input type="text" id="brandName" placeholder="'+t('brandPh')+'"><button class="sm" id="brandSave">'+t('saveCurrent')+'</button></div></div>';
    o+='<div class="sec"><h4>'+t('privTitle')+'</h4><p class="hint" style="margin-top:0">'+t('privHint')+'</p><button class="sm" id="privShow">'+t('privShow')+'</button></div>';
    o+='<div class="sec"><h4>'+t('versions')+'</h4><div class="row"><input type="text" id="verName" placeholder="'+t('verPh')+'"><button class="sm" id="verSave">'+t('saveVersion')+'</button></div>'+(INFO.versions.length?INFO.versions.slice(0,8).map(v=>'<div class="item" style="cursor:default"><span>'+esc(v.name)+' <small style="color:var(--mut)">'+esc(v.at)+'</small></span><button class="sm ghost" data-ver="'+v.id+'">'+t('restore')+'</button></div>').join(''):'<p class="hint">'+t('verHint')+'</p>')+'</div>'; }
  B.innerHTML=o; if(RTAB==='claude') renderFeed(); }
/* 4.2: لوحة الأسلوب: كل شي بالدحيح والورق المتحرك يتعدّل من هنا */
const DCAP={on:true,font:'Cairo',weight:800,size:34,color:'#FFFFFF',active:'#FFFFFF',bg:'box',bgColor:'#E8541E',bgOpacity:1,y:63.2,x:71,width:440,lines:1,chunk:4,shadow:false,stroke:0,enter:'pop'};
const DKBG=['paper','navy','original','orange','green','dark'];
const dkStageK=()=>{ const D=hs().dahih||{}; return D.on&&D.layout!=='full'?{y0:660/1920,h:608/1920}:{y0:0,h:1}; };
function styleSec(h){ if(!h.kin) h.kin={}; if(!h.dahih) h.dahih={}; const D=h.dahih||{}, K=h.kin||{}, ON=!!D.on, A=[['',t('bgNone')],...(INFO.assets||[]).map(a=>['assets/'+a,a])], FF=[...h.fonts.map(f=>f.name),...AR_FONTS];
  const ti=(k,v,ph)=>'<div class="row"><label>'+ph+'</label><input type="text" data-k="'+k+'" dir="auto" value="'+esc(v||'')+'"></div>';
  let o='<div class="sec"><h4>'+t('stTitle')+'</h4><p class="hint" style="margin-top:0">'+t('stHint')+'</p><div class="row" style="flex-wrap:wrap;gap:6px"><button class="'+(ON?'':'pri')+'" id="dkToggle">'+t(ON?'stDahihOff':'stDahihOn')+'</button><button id="addKin">'+t('stAddKin')+'</button><button id="addDesk">'+t('stAddDesk')+'</button></div>';
  if(ON){ o+='<h4>'+t('b_dahih')+'</h4>'+ti('dahih.title',D.title,t('stTitleTx'))+ti('dahih.tag',D.tag,t('stTag'))
      +pick(t('stAvatar'),'dahih.avatar',A,D.avatar||'')+pick(t('stLogo'),'dahih.logo',[['',t('bgNone')],['claude','Claude'],...(INFO.assets||[]).map(a=>['assets/'+a,a])],D.logo||'')
      +seg(t('stLayout'),'dahih.layout',[['window',t('stWindow')],['full',t('stFull')]],D.layout||'window')+seg(t('stSide'),'dahih.side',[['right',t('dir_right')],['left',t('dir_left')]],D.side||'right')
      +slider(t('stZoom'),'dahih.zoom',0.4,1,D.zoom||0.74,0.02)+pick(t('font'),'dahih.font',FF,D.font||'Cairo')+pick(t('stNumFont'),'dahih.numFont',[['',t('stSame')],...FF.map(f=>[f,f]),['Playfair Display','Playfair Display']],D.numFont||'')
      +seg(t('stTc'),'dahih.tc',[[true,t('yes')],[false,t('no')]],D.tc!==false)
      +pick(t('stBg0'),'dahih.bg',DKBG.map(m=>[m,t('dkbg_'+m)]),D.bg||'paper')
      +'<h4>'+t('stBgs')+'</h4>'+(D.bgs||[]).map((b,i)=>'<div class="row"><input type="number" step="0.1" data-dkbs="'+i+'" value="'+b.s+'" style="max-width:90px"><select data-dkbm="'+i+'">'+DKBG.map(m=>'<option value="'+m+'"'+(b.mode===m?' selected':'')+'>'+esc(t('dkbg_'+m))+'</option>').join('')+'</select><button class="sm" data-dkbd="'+i+'">'+t('delete')+'</button></div>').join('')
      +'<div class="row"><button class="sm" id="dkBgAdd">'+t('stBgAdd')+'</button></div>'
      +'<h4>'+t('cap')+'</h4><div class="row"><button class="sm" id="dkCap">'+t('stCapReset')+'</button></div>'; }
  if(h.pod&&h.pod.on){ const P=h.pod; o+='<h4>'+t('b_podcast')+'</h4>'+ti('pod.title',P.title,t('stTitleTx'))+ti('pod.credit',P.credit,t('podCredit'))
      +slider(t('podTSize'),'pod.tsize',32,80,P.tsize||52,1)+slider(t('podTY'),'pod.ty',4,30,P.ty||12,0.5)
      +seg(t('podLang'),'pod.lang',[['en','English ← عربي'],['ar','عربي']],P.lang||'en')+seg(t('podOrig'),'pod.orig',[[true,t('yes')],[false,t('no')]],P.orig!==false)
      +slider(t('podSub'),'pod.subScale',0.4,0.9,P.subScale||0.62,0.02)+seg(t('podBar'),'pod.bar',[[true,t('yes')],[false,t('no')]],!!P.bar)
      +'<p class="hint">'+t('podHint')+'</p>'; }
  o+='<h4>'+t('b_paper')+'</h4>'+ti('kin.mark',K.mark,t('stMark'))+pick(t('stAvatar'),'kin.avatar',A,K.avatar||'')+pick(t('font'),'kin.font',FF,K.font||'Cairo')+'</div>';
  return o; }
function styleClick(el){ const h=hs(), d=el.dataset;
  if(el.id==='dkToggle'){ snap(); const D=h.dahih=h.dahih||{}; if(D.on){ D.on=false; } else { Object.assign(D,{on:true,layout:D.layout||'window',bg:D.bg||'paper',bgs:D.bgs||[]}); h.cap={...h.cap,...DCAP}; toast(t('visMask')); } live(); renderRight(); return true; }
  if(el.id==='addKin'){ addLayer({type:'kinetic',text:t('stKinSample'),deco:'none',track:2}); return true; }
  if(el.id==='addDesk'){ addLayer({type:'desk',kind:'note',text:t('stDeskSample'),x:0.3,y:0.42,track:1}); return true; }
  if(el.id==='dkBgAdd'){ snap(); const D=h.dahih; D.bgs=(D.bgs||[]).concat([{s:r3(T),mode:'navy'}]).sort((a,b)=>a.s-b.s); live(); renderRight(); return true; }
  if(d.dkbd!==undefined){ snap(); h.dahih.bgs.splice(+d.dkbd,1); live(); renderRight(); return true; }
  if(el.id==='dkCap'){ snap(); h.cap={...h.cap,...DCAP,...(h.dahih&&h.dahih.layout==='full'?{y:70,x:50,size:52,width:760}:h.dahih&&h.dahih.side==='left'?{x:29}:{})}; live(); toast(t('saved')); return true; }
  return false; }
function inspector(){ const h=hs(); if(!SEL) return '<p class="hint">'+t('selNone')+'</p>';
  if(SEL.kind==='layer'){ const L=selLayer(); if(!L) return ''; let o='<div class="sec"><h4>'+t('type_'+L.type)+'<span><button class="sm" id="lDup">'+t('duplicate')+'</button> <button class="sm" id="lDel">'+t('delete')+'</button></span></h4>';
    o+='<div class="row"><label>'+t('timing')+'</label><input type="number" step="0.05" data-k="L.s" value="'+L.s+'" title="'+esc(t('tStart'))+'"><input type="number" step="0.05" data-k="L.e" value="'+L.e+'" title="'+esc(t('tEnd'))+'"></div><div class="row"><label></label><button class="sm ghost" data-tset="s">'+t('tFromHere')+'</button><button class="sm ghost" data-tset="e">'+t('tToHere')+'</button></div>';
    if(h.layers.filter(x=>x.type===L.type).length>1) o+=scopeRow();
    if(L.type==='text'){ o+='<textarea data-k="L.text" rows="2" dir="auto" style="margin-bottom:9px">'+esc(L.text)+'</textarea>'+pick(t('font'),'L.font',allFonts(),L.font||h.cap.font)+slider(t('size'),'L.size',30,220,L.size||96)+swatches(t('textColor'),'L.color',L.color)
        +seg(t('background'),'L.bg',[['none',t('bgNone')],['box',t('bgBox')],['pill',t('bgPill')],['glass',t('fr_glass')]],L.bg||'none')+(L.bg&&L.bg!=='none'?swatches(t('cardColor'),'L.bgColor',L.bgColor||'#000000')+slider(t('cardOpacity'),'L.bgOpacity',0.1,1,L.bgOpacity==null?1:L.bgOpacity,0.05):'')+slider(t('stroke'),'L.stroke',0,14,L.stroke||0)+slider(t('lineWidth'),'L.width',300,1040,L.width||900,10); }
    if(L.type==='char'){ if(!L.src) o+=pick(t('character'),'L.char',CHARS.map(c=>[c,t('char_'+c)]),L.char)+swatches(t('color'),'L.color',L.color)+swatches(t('accent'),'L.accent',L.accent||'#F2B33D');
      o+=slider(t('size'),'L.size',0.08,0.8,L.size||0.26,0.01)+seg(t('react'),'L.react',[[true,t('yes')],[false,t('no')]],L.react!==false)+seg(t('flip'),'L.flip',[[false,t('no')],[true,t('yes')]],!!L.flip); }
    if(L.type==='image'&&(!L.fit||L.fit==='free')) o+=seg(t('frame'),'L.frame',[['',t('bgNone')],['glass',t('fr_glass')],['ring',t('fr_ring')],['browser',t('fr_browser')],['post',t('fr_post')]],L.frame||'')+(L.frame==='browser'?'<input type="text" data-k="L.url" dir="ltr" value="'+esc(L.url||'')+'" placeholder="example.com" style="margin-bottom:9px">':'')+(L.frame==='post'?'<input type="text" data-k="L.handle" dir="ltr" value="'+esc(L.handle||'')+'" placeholder="@handle" style="margin-bottom:6px"><input type="text" data-k="L.caption" dir="auto" value="'+esc(L.caption||'')+'" placeholder="'+esc(t('postCapPh'))+'" style="margin-bottom:9px">':'')+(L.frame==='ring'?swatches(t('color'),'L.ringColor',L.ringColor||'#FFFFFF')+seg(t('ringFull'),'L.ringFull',[[false,t('ringSpin')],[true,t('ringDone')]],!!L.ringFull):'');
    if(L.type==='image') o+=seg(t('display'),'L.fit',[['free',t('fitFree')],['card',t('fitCard')],['cover',t('fitCover')]],L.fit||'free')+(L.fit==='cover'?'':slider(t('size'),'L.w',0.08,1.2,L.w||(L.fit==='card'?0.76:0.5),0.01)+slider(t('round'),'L.round',0,200,L.round==null?(L.fit==='card'?36:0):L.round,2))+(L.fit==='cover'||L.fit==='card'?seg(t('kenburns'),'L.kb',[[true,t('yes')],[false,t('no')]],L.kb!==false):'');
    if(L.type==='viz'){ const kx=(lbl,key,val,ph)=>'<div class="row"><label>'+lbl+'</label><input type="text" data-kx="'+key+'" dir="auto" value="'+esc(val)+'" placeholder="'+esc(ph||'')+'"></div>', pt=p=>p?[p.name||'',p.lat,p.lon].join(', '):'';
      if(VIZK.includes(L.kind)) o+='<p class="hint">'+t('vh_'+L.kind)+'</p>';
      if(L.kind!=='cta') o+=seg(t('vLayout'),'L.layout',[['stage',t('vl_stage')],['split',t('vl_split')],['over',t('vl_over')],['full',t('vl_full')]],L.layout||'stage')+'<input type="text" data-k="L.title" dir="auto" value="'+esc(L.title||'')+'" placeholder="'+esc(t('vTitlePh'))+'" style="margin-bottom:9px">';
      if(L.kind==='pctdots') o+=kx(t('vValues'),'values',(L.values||[L.value||60]).join(', '),'60, 86, 31')+kx(t('vUnit'),'unit',L.unit==null?'%':L.unit,'%');
      if(L.kind==='people'||L.kind==='fill') o+=slider(t('vValue'),'L.value',0,100,L.value==null?70:L.value);
      if(L.kind==='bars') o+=(L.items||[]).map((b,i)=>'<div class="row"><input type="text" dir="auto" data-bar="'+i+':label" value="'+esc(b.label)+'" placeholder="'+esc(t('vName'))+'"><input type="number" data-bar="'+i+':value" value="'+esc(b.value)+'" style="max-width:104px;flex:none"><button class="sm ghost" data-brm="'+i+'" style="flex:none">×</button></div>').join('')+((L.items||[]).length<6?'<div class="row"><label></label><button class="sm" id="barAdd">'+t('vAddRow')+'</button></div>':'')+kx(t('vUnit'),'unit',L.unit||'','م');
      if(L.kind==='route') o+=['from','to'].map(k=>'<div class="row"><label>'+t(k==='from'?'vFrom':'vTo')+'</label><input type="text" dir="auto" list="hsCities" data-city="'+k+'" value="'+esc((L[k]||{}).name||'')+'" placeholder="'+esc(t('vCityPh'))+'"></div>').join('')+'<p class="hint" style="margin-top:-4px">'+t('vCityHint')+'</p>'+kx(t('vTime'),'time',L.time||'','5 ساعات')+kx(t('vKm'),'km',L.km||'',t('vKmPh'))+seg(t('vMode'),'L.mode',[['plane',t('vPlane')],['car',t('vCar')]],L.mode||'plane');
      if(L.kind==='cta') o+=kx(t('vPre'),'pre',L.pre||'')+kx(t('vWord'),'word',L.word||'')+kx(t('vPost'),'post',L.post||'');
      if(L.kind==='line') o+=kx(t('vValues'),'values',(L.values||[]).join(', '),'5, 9, 14, 22')+kx(t('vLabels'),'labels',(L.labels||[]).join('، '),'يناير، فبراير')+kx(t('vUnit'),'unit',L.unit||'','k');
      if(L.kind==='slot') o+='<div class="row"><label>'+t('vValue')+'</label><input type="number" data-k="L.value" value="'+esc(L.value==null?2480:L.value)+'"></div>'+kx(t('vUnit'),'unit',L.unit||'','ر.س');
      if(L.kind==='news') o+=kx(t('vSource'),'source',L.source||'','عاجل')+'<textarea data-k="L.text" rows="3" dir="auto" style="margin-bottom:8px">'+esc(L.text||'')+'</textarea>'+kx(t('vMark'),'mark',L.mark||'',t('vMarkPh'))+pick(t('image'),'L.src',[['',t('bgNone')],...(INFO.assets||[]).map(a=>['assets/'+a,a])],L.src||'');
      if(L.kind==='card'||L.kind==='draw') o+='<div class="warnbox">'+t('byClaude')+'</div>';
      if(L.kind!=='cta'&&L.kind!=='bars'&&L.kind!=='route'&&L.kind!=='card'&&L.kind!=='draw'&&L.kind!=='news') o+=kx(t('vLabel'),'label',L.label||'',t('vLabelPh'));
      o+=swatches(t('accent'),'L.accent',L.accent||(ST.theme&&ST.theme.acc)||'#F2B33D')+(L.kind==='fill'?swatches(t('vColor2'),'L.color2',L.color2||'#C9CDD8'):'')+(L.kind!=='cta'&&(L.layout||'stage')!=='over'?swatches(t('cardColor'),'L.bgColor',L.bgColor||'#F5F6FA'):''); }
    if(L.type==='kinetic'){ const ti=(k,v,ph)=>'<input type="text" data-k="'+k+'" dir="auto" value="'+esc(v||'')+'" placeholder="'+esc(ph||'')+'" style="margin-bottom:8px">', c=L.card||'none';
      o+='<p class="hint">'+t('kinHint')+'</p><textarea data-k="L.text" rows="4" dir="auto" style="margin-bottom:9px">'+esc(L.text||'')+'</textarea>'
        +slider(t('posY'),'L.y',0.1,0.8,L.y==null?(c!=='none'?0.25:0.43):L.y,0.005)+pick(t('font'),'L.font',[['',t('stSame')],...[...hs().fonts.map(f=>f.name),...AR_FONTS].map(f=>[f,f])],L.font||'')
        +pick(t('kinCard'),'L.card',[['none',t('bgNone')],['terminal',t('kc_terminal')],['phone',t('kc_phone')],['pill',t('kc_pill')],['comment',t('kc_comment')],['profile',t('kc_profile')],['image',t('image')]],c);
      if(c!=='none'){ o+=ti('L.cardText',L.cardText,t('kinCardText'));
        if(c==='terminal'||c==='phone') o+=ti('L.cardTitle',L.cardTitle,t('kinCardTitle'));
        if(c==='terminal') o+='<textarea data-k="L.cardOut" rows="3" dir="auto" style="margin-bottom:8px" placeholder="'+esc(t('kinCardOut'))+'">'+esc(Array.isArray(L.cardOut)?L.cardOut.join('\n'):(L.cardOut||''))+'</textarea>';
        if(c==='comment'||c==='profile') o+=ti('L.cardSub',L.cardSub,t('kinCardSub'));
        if(c==='image'||c==='phone'||c==='comment'||c==='profile') o+=pick(t('image'),'L.src',[['',t('bgNone')],...(INFO.assets||[]).map(a=>['assets/'+a,a])],L.src||'');
        o+=slider(t('kinCardAt'),'L.cardAt',0,Math.max(0.2,+(L.e-L.s).toFixed(2)),L.cardAt==null?0.18:L.cardAt,0.05); }
      o+=pick(t('deco'),'L.deco',[['none',t('bgNone')],['flowers',t('kd_flowers')],['badges',t('kd_badges')],['both',t('kd_both')]],L.deco||'none')
        +seg(t('kinReveal'),'L.reveal',[['spoken',t('kr_spoken')],['even',t('kr_even')],['all',t('kr_all')]],L.reveal||'spoken'); }
    if(L.type==='desk'){ const DK=['note','polaroid','number','strike','invoice','file','clock','chart','swatches','sticker','label','cta'], ti=(k,v,ph)=>'<input type="text" data-k="'+k+'" dir="auto" value="'+esc(v==null?'':v)+'" placeholder="'+esc(ph||'')+'" style="margin-bottom:8px">', yn=(lbl,k,v)=>seg(lbl,k,[[true,t('yes')],[false,t('no')]],v);
      o+='<p class="hint">'+t('deskHint')+'</p>'+pick(t('deskKind'),'L.kind',DK.map(k=>[k,t('dk_'+k)]),L.kind||'note');
      const k=L.kind||'note', ta=(key,val,rows,ph,dir)=>'<textarea data-k="'+key+'" rows="'+(rows||2)+'" dir="'+(dir||'auto')+'" style="margin-bottom:8px" placeholder="'+esc(ph||'')+'">'+esc(val||'')+'</textarea>';
      if(k==='number') o+='<div class="row"><label>'+t('vValue')+'</label><input type="number" data-k="L.n" value="'+esc(L.n==null?24:L.n)+'"></div>'+ti('L.unit',L.unit,t('vUnit'))+ti('L.sub',L.sub,t('deskSub'))+yn(t('deskCircle'),'L.circle',L.circle!==false)+yn(t('deskStrike'),'L.strike',!!L.strike);
      else if(k==='strike') o+=ti('L.text',L.text,t('deskFrom'))+ti('L.to',L.to,t('deskTo'))+ti('L.sub',L.sub,t('deskSub'))+ti('L.head',L.head,'WE VALUE SKILLS:');
      else if(k==='invoice') o+=ta('L.items',Array.isArray(L.items)?L.items.join('\n'):String(L.items||'').split('|').join('\n'),4,'EXTRA EDITS=$0','ltr')+ti('L.head',L.head,'INVOICE');
      else if(k==='chart') o+=ti('L.values',Array.isArray(L.values)?L.values.join(', '):(L.values||'100, 70, 45'),t('vValues'))+ti('L.text',L.text,t('deskUnder'))+ti('L.mark',L.mark,t('vMark'));
      else if(k==='swatches') o+=ti('L.colors',Array.isArray(L.colors)?L.colors.join(' '):(L.colors||'#FFFFFF #B3261E #3F7D4E #1A1917'),t('deskColors'))+ti('L.text',L.text,t('deskUnder'));
      else if(k!=='sticker'&&k!=='clock') o+=ta('L.text',L.text,2);
      if(k==='note'||k==='polaroid') o+=ti('L.label',L.label,'EDIT REQUEST #1')+ti('L.head',L.head,'RAW FOOTAGE');
      if(k==='note') o+=ti('L.sub',L.sub,t('deskSub'))+yn(t('deskSticker'),'L.sticker',!!L.sticker);
      if(k==='polaroid') o+=pick(t('image'),'L.src',[['video',t('dk_video')],['clock',t('dk_clock')],...(INFO.assets||[]).map(a=>['assets/'+a,a])],L.src||'video');
      if(k==='file') o+=ti('L.sub',L.sub,t('deskSub'))+ti('L.head',L.head,'FILE:')+yn(t('deskCross'),'L.cross',!!L.cross);
      if(k==='clock') o+=yn(t('deskSticker'),'L.sticker',L.sticker!==false);
      if(k==='label'||k==='cta') o+=swatches(t('color'),'L.color',L.color||'#E8541E');
      if(k==='note'||k==='polaroid'||k==='clock'||k==='chart') o+=yn(t('deskClip'),'L.clip',L.clip!==false);
      if(k==='number') o+=slider(t('size'),'L.size',80,260,L.size||170,2);
      else if(k!=='label'&&k!=='cta'&&k!=='sticker') o+=slider(t('deskW'),'L.w',0.1,0.7,L.w||({note:0.4,polaroid:0.4,strike:0.48,invoice:0.44,file:0.19,clock:0.28,chart:0.31,swatches:0.36}[k]||0.4),0.01);
      else if(k==='sticker') o+=slider(t('size'),'L.w',0.05,0.25,L.w||0.1,0.005);
      o+=seg(t('deskFrom2'),'L.from',[['drop',t('df_drop')],['left',t('dir_left')],['right',t('dir_right')],['up',t('df_up')],['pop',t('df_pop')]],L.from||'drop'); }
    if(L.type==='cover') o+='<textarea data-k="L.text" rows="2" dir="auto" style="margin-bottom:9px">'+esc(L.text||'')+'</textarea>'+pick(t('font'),'L.font',allFonts(),L.font||h.cap.font)+slider(t('size'),'L.size',90,360,L.size||230,2)+swatches(t('background'),'L.bgColor',L.bgColor||'#F3F2EE')+swatches(t('textColor'),'L.color',L.color||'#15151C');
    if(L.type==='split'){ const st=L.style||(Array.isArray(L.draw)&&L.draw.length?'draw':'list'), th=ST.theme||{};
      o+='<div class="grid3" style="margin-bottom:9px">'+CARDS.map(k=>'<div class="tile'+(st===k?' sel':'')+'" data-cstyle="'+k+'"><div class="pv cdp">'+CARDPV[k]+'</div><span>'+t('cs2_'+k)+'</span></div>').join('')+'</div>';
      if(st==='draw') o+='<div class="warnbox">'+t('byClaude')+'</div>';
      o+='<input type="text" data-k="L.title" dir="auto" value="'+esc(L.title||'')+'" placeholder="'+esc(t('splitTitlePh'))+'" style="margin-bottom:8px">';
      if(st==='versus') o+='<div class="row"><input type="text" data-k="L.a" dir="auto" value="'+esc(L.a||'')+'" placeholder="'+esc(t('vsA'))+'"><input type="text" data-k="L.b" dir="auto" value="'+esc(L.b||'')+'" placeholder="'+esc(t('vsB'))+'"></div>';
      if(st==='stat') o+='<div class="row"><label>'+t('vValue')+'</label><input type="number" data-k="L.value" value="'+esc(L.value==null?87:L.value)+'"><input type="text" data-k="L.unit" dir="auto" value="'+esc(L.unit||'')+'" placeholder="%" style="max-width:90px;flex:none"></div><input type="text" data-k="L.label" dir="auto" value="'+esc(L.label||'')+'" placeholder="'+esc(t('vLabelPh'))+'" style="margin-bottom:9px">';
      else if(st!=='draw') o+='<textarea data-k="L.text" rows="'+(st==='quote'?3:5)+'" dir="auto" placeholder="'+esc(t('splitTextPh'))+'" style="margin-bottom:6px">'+esc(L.text||'')+'</textarea><p class="hint" style="margin-top:0">'+t('ch_'+st)+'</p>';
      if(st==='quote') o+='<input type="text" data-k="L.by" dir="auto" value="'+esc(L.by||'')+'" placeholder="'+esc(t('quoteBy'))+'" style="margin-bottom:9px">';
      if(st==='list') o+=seg(t('listMark'),'L.num',[[false,t('markDot')],[true,t('markNum')]],!!L.num);
      o+=pick(t('image'),'L.src',[['',t('bgNone')],...(INFO.assets||[]).map(a=>['assets/'+a,a])],L.src||'')+pick(t('deco'),'L.deco',[['glow',t('deco_glow')],['dots',t('deco_dots')],['grid',t('deco_grid')],['waves',t('deco_waves')],['none',t('bgNone')]],L.deco||'glow')
        +'<div class="row"><label>'+t('splitRatio')+'</label><div class="seg"><button data-ratio="auto" class="'+(L.ratio?'':'on')+'">'+t('auto')+'</button><button data-ratio="man" class="'+(L.ratio?'on':'')+'">'+t('manual')+'</button></div></div>'+(L.ratio?slider(t('splitRatio'),'L.ratio',0.38,0.62,L.ratio,0.01):'<p class="hint" style="margin-top:-4px">'+t('ratioAutoHint')+'</p>')
        +slider(t('size'),'L.size',56,120,L.size||84)+swatches(t('cardColor'),'L.bgColor',L.bgColor||th.bg||'#101014')+swatches(t('textColor'),'L.color',L.color||th.ink||'#FFFFFF')+swatches(t('accent'),'L.accent',L.accent||th.acc||'#F2B33D'); }
    if(L.type==='bg'){ const m=L.mode||'blur'; o+='<p class="hint">'+t('bgHint')+'</p><div class="grid3" style="margin-bottom:9px">'+BGM.map(k=>'<div class="tile'+(m===k?' sel':'')+'" data-bgm="'+k+'"><div class="pv bgm bgm-'+k+'"><i></i></div><span>'+t('bg_'+k)+'</span></div>').join('')+'</div>';
      if(m==='blur'||m==='bw'||m==='dim') o+=slider(t('amount'),'L.amount',0.1,1,L.amount==null?0.6:L.amount,0.05);
      if(m==='color'||m==='grad'||m==='studio') o+=swatches(t('color'),'L.color',L.color||(ST.theme&&ST.theme.bg)||'#101014');
      if(m==='grad') o+=swatches(t('color2'),'L.color2',L.color2||(ST.theme&&ST.theme.acc)||'#F2B33D');
      if(m==='studio') o+=swatches(t('accent'),'L.accent',L.accent||(ST.theme&&ST.theme.acc)||'#F2B33D');
      if(m==='image') o+=pick(t('image'),'L.src',[['',t('bgNone')],...(INFO.assets||[]).map(a=>['assets/'+a,a])],L.src||'')+'<div class="row"><label></label><button class="sm" data-up="bgimg">'+t('upload')+'</button></div>'; }
    if(L.type==='behind') o+='<p class="hint">'+t('behindHint')+'</p><textarea data-k="L.text" rows="2" dir="auto" style="margin-bottom:9px">'+esc(L.text||'')+'</textarea>'+pick(t('font'),'L.font',allFonts(),L.font||h.cap.font)+slider(t('size'),'L.size',120,460,L.size||270,2)+swatches(t('textColor'),'L.color',L.color||'#FFFFFF')+seg(t('fillMode'),'L.fill',[['solid',t('fillSolid')],['outline',t('fillOutline')]],L.fill||'solid')
      +'<div class="row"><label>'+t('posY')+'</label><div class="seg"><button data-byauto="1" class="'+(L.y==null?'on':'')+'">'+t('behindAuto')+'</button><button data-byauto="0" class="'+(L.y==null?'':'on')+'">'+t('manual')+'</button></div></div>'+(L.y==null?'':slider(t('posY'),'L.y',0.05,0.9,L.y,0.005)+slider(t('posX'),'L.x',0,1,L.x==null?0.5:L.x,0.005))+pick(t('entrance'),'L.anim',ANIMS.map(a=>[a,t('an_'+a)]),L.anim||'rise');
    if(L.type==='pip') o+='<p class="hint">'+t('pipHint')+'</p>'+seg(t('pipPos'),'L.pos',PIPS.map(k=>[k,t('pip_'+k)]),L.pos||'tr')+slider(t('size'),'L.size',0.24,0.5,L.size||0.36,0.01)+seg(t('pipShape'),'L.circle',[[false,t('pipRect')],[true,t('pipCircle')]],!!L.circle)
      +pick(t('deco'),'L.deco',[['grid',t('deco_grid')],['dots',t('deco_dots')],['glow',t('deco_glow')],['lattice',t('deco_lattice')],['halftone',t('deco_halftone')],['blueprint',t('deco_blueprint')],['none',t('bgNone')]],L.deco||'grid')+swatches(t('background'),'L.bgColor',L.bgColor||(ST.theme&&ST.theme.bg)||'#101014')+swatches(t('accent'),'L.accent',L.accent||(ST.theme&&ST.theme.acc)||'#F2B33D');
    if(L.type==='mark') o+='<div class="grid3" style="margin-bottom:9px">'+MKK.map(k=>'<div class="tile'+((L.kind||'circle')===k?' sel':'')+'" data-k="L.kind" data-v="'+k+'"><div class="pv mkp" style="pointer-events:none">'+MKPV[k]+'</div><span style="pointer-events:none">'+t('mk_'+k)+'</span></div>').join('')+'</div>'
      +slider(t('posX'),'L.x',0,1,L.x==null?0.5:L.x,0.005)+slider(t('posY'),'L.y',0,1,L.y==null?0.4:L.y,0.005)+slider(t('mkW'),'L.w',0.05,1,L.w||0.42,0.01)+slider(t('mkH'),'L.h',0.01,0.4,L.h||0.07,0.005)+slider(t('lineWidth'),'L.lw',3,30,L.lw||10)+swatches(t('color'),'L.color',L.color||'#FFD21F')+'<p class="hint">'+t('mkHint')+'</p>';
    if(L.type==='draw') o+='<div class="row"><label></label><button class="sm" id="drawAgain">'+t('drawAgain')+'</button></div>'+swatches(t('color'),'L.color',L.color||'#FFD21F')+slider(t('lineWidth'),'L.lw',3,40,L.lw||12)+slider(t('drawSpeed'),'L.reveal',0,3,L.reveal==null?0.9:L.reveal,0.1)+slider(t('size'),'L.sc',0.3,2,L.sc||1,0.05)+slider(t('posX'),'L.x',0,1,L.x==null?0.5:L.x,0.005)+slider(t('posY'),'L.y',0,1,L.y==null?0.5:L.y,0.005)+seg(t('drawGlow'),'L.glow',[['shadow',t('drawShadow')],['neon',t('drawNeon')],['none',t('no')]],L.glow||'shadow')+'<p class="hint">'+t('drawHint')+'</p>';
    if(L.type==='cursor') o+=slider(t('posX'),'L.x',0,1,L.x==null?0.5:L.x,0.005)+slider(t('posY'),'L.y',0,1,L.y==null?0.45:L.y,0.005)+slider(t('curAt'),'L.at',0.3,Math.max(0.4,+(L.e-L.s).toFixed(2)),L.at==null?1:L.at,0.05)+seg(t('curFrom'),'L.from',[['bottom',t('dir_down')],['left',t('dir_left')],['right',t('dir_right')]],L.from||'bottom')+seg(t('curStyle'),'L.style',[['light',t('curLight')],['dark',t('curDark')]],L.style||'light')+slider(t('size'),'L.size',0.06,0.2,L.size||0.1,0.005)+'<p class="hint">'+t('curHint')+'</p>';
    if(L.type==='lt') o+='<input type="text" data-k="L.text" dir="auto" value="'+esc(L.text||'')+'" placeholder="'+esc(t('ltName'))+'" style="margin-bottom:8px"><input type="text" data-k="L.sub" dir="auto" value="'+esc(L.sub||'')+'" placeholder="'+esc(t('ltSub'))+'" style="margin-bottom:9px">'
      +seg(t('style'),'L.style',LTS.map(k=>[k,t('lt_'+k)]),L.style||'bar')+seg(t('ltSide'),'L.side',[['right',t('dir_right')],['left',t('dir_left')]],L.side||'right')+slider(t('posY'),'L.y',0.1,0.9,L.y==null?0.7:L.y,0.005)+slider(t('size'),'L.size',36,110,L.size||64)+pick(t('font'),'L.font',allFonts(),L.font||h.cap.font)+swatches(t('accent'),'L.accent',L.accent||(ST.theme&&ST.theme.acc)||'#F2B33D');
    if(L.type==='collage'){ const its=(L.items||[]).map(x=>x.src); o+='<p class="hint">'+t('collageHint')+'</p><div class="chips" style="margin-bottom:9px">'+(INFO.assets||[]).map(a=>'<button data-colimg="assets/'+esc(a)+'" class="'+(its.includes('assets/'+a)?'on':'')+'">'+esc(a)+'</button>').join('')+'</div><div class="row"><label></label><button class="sm" data-up="image">'+t('upload')+'</button></div>'
      +'<div class="row"><label>'+t('collageMood')+'</label><div class="sw">'+[['#E07A3F','t_time'],['#E3B23C','t_tool'],['#2E6B5A','t_mind'],['#4B2E6B','t_memory'],['#1F7A80','t_team']].map(m=>'<i data-k="L.bgColor" data-c="'+m[0]+'" title="'+esc(t('cm_'+m[1]))+'" class="'+((L.bgColor||'#E07A3F')===m[0]?'on':'')+'" style="background:'+m[0]+'"></i>').join('')+'<input type="color" data-k="L.bgColor" value="'+esc(L.bgColor||'#E07A3F')+'"></div></div>'
      +seg(t('collageDots'),'L.halftone',[[true,t('yes')],[false,t('no')]],L.halftone!==false); }
    if(L.type==='fx'&&!TRS.includes(L.fx)) o+='<div class="grid3" style="margin-bottom:9px">'+FXS.map(f=>fxTile(f,'data-fxset="'+f+'"',L.fx===f,L.s)).join('')+'</div>'+slider(t('amount'),'L.amount',0.05,1,L.amount==null?0.5:L.amount,0.05)+(L.fx==='tint'||L.fx==='duotone'||L.fx==='strobe'?swatches(t('color'),'L.color',L.color||(L.fx==='duotone'?'#FF5A8A':L.fx==='strobe'?'#FFFFFF':'#F2B33D')):'')+(L.fx==='duotone'?swatches(t('color2'),'L.color2',L.color2||'#1B1F6B'):'');
    if(L.type==='fx'&&TRS.includes(L.fx)) o+='<div class="grid3" style="margin-bottom:9px">'+TRS.map(f=>fxTile(f,'data-fxset="'+f+'"',L.fx===f,L.s)).join('')+'</div>'+(['curve','whip','spin'].includes(L.fx)?seg(t('trDir'),'L.dir',[['right',t('dir_right')],['left',t('dir_left')],['up',t('dir_up')],['down',t('dir_down')]],L.dir||hs().trDir||'right'):'')+'<p class="hint">'+t('trHint')+'</p>';
    if(L.type==='fx'||L.type==='pip'||L.type==='mark'||L.type==='draw'||L.type==='cursor'||L.type==='lt'||L.type==='collage'||L.type==='kinetic') o+='';
    else if(L.type==='desk') o+=slider(t('posX'),'L.x',0,1,L.x==null?0.3:L.x,0.005)+slider(t('posY'),'L.y',0,1,L.y==null?0.42:L.y,0.005)+slider(t('rotate'),'L.rot',-20,20,L.rot||0,1);
    else if(L.type==='split'||L.type==='bg'||L.type==='behind'||L.type==='cover'||(L.type==='viz'&&(L.layout||'stage')!=='over')) o+='';
    else if(L.type==='image'&&L.fit==='cover') o+=slider(t('opacity'),'L.opacity',0.1,1,L.opacity==null?1:L.opacity,0.05)+pick(t('entrance'),'L.anim',ANIMS.map(a=>[a,t('an_'+a)]),L.anim||'fade');
    else o+=slider(t('posX'),'L.x',0,1,L.x==null?0.5:L.x,0.005)+slider(t('posY'),'L.y',0,1,L.y==null?0.3:L.y,0.005)+slider(t('rotate'),'L.rot',-45,45,L.rot||0,1)+slider(t('opacity'),'L.opacity',0.1,1,L.opacity==null?1:L.opacity,0.05)+pick(t('entrance'),'L.anim',ANIMS.map(a=>[a,t('an_'+a)]),L.anim||'pop')+'<p class="hint">'+t('gizHint')+'</p>';
    return o+'</div>'; }
  if(SEL.kind==='cap'){ const i=+SEL.id, c=ST.caps.cards[i]; if(!c) return ''; const ov=capOvOf(i,false), V=f=>(SCOPE==='one'&&ov&&ov[f]!==undefined)?ov[f]:h.cap[f];
    return '<div class="sec"><h4>'+t('sentence')+' '+(i+1)+'<span class="st" style="direction:ltr">'+fmt(c.s)+' – '+fmt(c.e)+'</span></h4><p dir="rtl" style="line-height:1.9">'+esc(key(c))+'</p><div class="row"><button data-edit="'+i+'">'+t('edit')+'</button><button class="ghost" data-drop="'+i+'">'+t('dropSentence')+'</button></div></div>'
      +'<div class="sec"><h4>'+t('capLook')+(ov?'<button class="sm" id="ovReset">'+t('ovReset')+'</button>':'')+'</h4>'+scopeRow()+slider(t('position'),'C.y',15,92,V('y'),0.5)+slider(t('size'),'C.size',34,150,V('size'))+swatches(t('textColor'),'C.color',V('color'))+swatches(t('activeColor'),'C.active',V('active'))+'<p class="hint">'+t(SCOPE==='one'?'scopeOneHint':'scopeAllHint')+'</p></div>'; }
  if(SEL.kind==='sfx'){ const [k]=String(SEL.id).split(':'); return '<div class="sec"><h4>'+t('sfx_'+k)+'</h4><div class="row"><button id="lDel">'+t('delete')+'</button></div><p class="hint">'+t('sfxSelHint')+'</p></div>'; }
  if(SEL.kind==='broll'){ const b=ST.studio.brollClips[+SEL.id]; if(!b) return ''; return '<div class="sec"><h4>'+t('broll')+' · '+esc(b.k)+'<button class="sm" id="lDel">'+t('delete')+'</button></h4>'+seg(t('display'),'B.mode',[['full',t('brFull')],['card',t('brCard')]],b.mode||'full')+'</div>'; }
  if(SEL.kind==='outro'){ const O=outroT(); return '<div class="sec"><h4>'+t('endCard')+'<span><button class="sm" id="oDel">'+t('delete')+'</button></span></h4><p class="hint">'+t('endCardHint')+'</p>'+slider(t('endDur'),'O.dur',0.8,12,ST.outro,0.1)
    +[['l1','endL1'],['l2','endL2'],['cta','endCta'],['word','endWord'],['sub','endSub']].map(([f,k])=>'<div class="row"><label>'+t(k)+'</label><input type="text" dir="auto" data-ko="'+f+'" value="'+esc(O[f]||'')+'"></div>').join('')
    +'<div class="row"><label>'+t('endFont')+'</label><select data-ko="font"><option value="">'+t('endFontDef')+'</option>'+[...hs().fonts.map(f=>f.name),...AR_FONTS,...EN_FONTS].map(f=>'<option'+(O.font===f?' selected':'')+' style="font-family:\''+esc(f)+'\'">'+esc(f)+'</option>').join('')+'</select></div>'+'<div class="row"><label>'+t('endChips')+'</label><textarea data-ko="chips" rows="3" dir="auto">'+esc((O.chips||[]).join('\n'))+'</textarea></div><button class="ghost" id="oSee">'+t('endSee')+'</button></div>'; }
  if(SEL.kind==='video'){ return '<div class="sec"><h4>'+t('videoRegion')+'<span class="st" style="direction:ltr">'+fmt(SEL.s)+' – '+fmt(SEL.e)+'</span></h4><p class="hint">'+t('shotHint',(SEL.e-SEL.s).toFixed(2))+'</p><div class="row"><button class="pri" id="lDel">'+t('removeRegion')+'</button><button class="ghost" id="clrMarks">'+t('clearMarks')+'</button></div></div>'; }
  return ''; }
function renderFeed(){ const st=$('#pStages'), fd=$('#pFeed'); const sh=stagesHtml(), fh=feedHtml(60); if(st) st.innerHTML=sh; if(fd) fd.innerHTML=fh||'<p class="hint">'+t('feedEmpty')+'</p>'; }
function stagesHtml(){ const ss=PULSE.stages||[]; const now=ss.findIndex(s=>!s.done); return ss.map((s,i)=>'<div class="'+(s.done?'done':i===now?'now':'')+'"><i></i>'+esc(LANG==='ar'?s.ar:s.en)+(s.pct?' · '+s.pct+'%':'')+'</div>').join(''); }
function feedHtml(n){ return ACT.slice(-n).reverse().map(e=>'<div class="k-'+e.kind+'"><time>'+new Date(e.t*1000).toTimeString().slice(0,5)+'</time><span dir="auto">'+esc(e.text)+'</span></div>').join(''); }
function renderLive(){ if(READY) return; $('#liveStages').innerHTML=stagesHtml(); $('#liveFeed').innerHTML=feedHtml(40)||'<p class="hint">'+t('liveWaiting')+'</p>'; const p=PULSE.preview, im=$('#livePrev'); if(p){ const u='/'+p.path+'?v='+p.mt; if(im.dataset.u!==u){ im.dataset.u=u; im.src=u; } im.style.display='block'; } else im.style.display='none'; }

function vizParse(key,raw){ raw=String(raw); if(key==='labels'){ const a=raw.split(/[,،]/).map(x=>x.trim()).filter(Boolean); return a; } if(key==='values'){ const a=raw.split(/[,،\s]+/).map(Number).filter(x=>isFinite(x)&&String(x)!=='NaN'&&raw.trim()!==''); return a.length?a:null; }
  if(key==='items'){ const a=raw.split('\n').map(l=>{ const m=l.match(/^(.*?)[=:،,]\s*(-?[\d.]+)\s*$/); return m?{label:m[1].trim(),value:+m[2]}:null; }).filter(Boolean); return a.length?a:null; }
  if(key==='from'||key==='to'){ const m=raw.split(/[,،]/).map(x=>x.trim()); if(m.length<3||!isFinite(+m[m.length-2])||!isFinite(+m[m.length-1])) return null; return {name:m.slice(0,m.length-2).join(' '),lat:+m[m.length-2],lon:+m[m.length-1]}; }
  if(key==='km'){ return raw.trim()===''?undefined:(isFinite(+raw)?+raw:null); } return raw; }
let _oT=0; function panelInput(e){ const el=e.target, k=el.dataset.k;
  if(el.dataset.dkbs!==undefined||el.dataset.dkbm!==undefined){ const D=hs().dahih, i=+(el.dataset.dkbs||el.dataset.dkbm); if(!D||!D.bgs[i]) return; if(!el._sn){ snap(); el._sn=1; setTimeout(()=>el._sn=0,1200); } if(el.dataset.dkbs!==undefined){ const v=+el.value; if(!isFinite(v)) return; D.bgs[i].s=r3(Math.max(0,v)); } else D.bgs[i].mode=el.value; live(); return; }
  if(el.dataset.ko||k==='O.dur'){ if(!el._sn){ snap(); el._sn=1; setTimeout(()=>el._sn=0,1200); } if(k==='O.dur'){ const v=+el.value; if(!isFinite(v)) return; ST.outro=r3(clamp(v,0.8,12)); const s=document.getElementById(vid(k)); if(s) s.textContent=ST.outro; buildTL(); }
    else { const O=ST.studio.outro={...outroT()}, f=el.dataset.ko; if(f==='chips') O.chips=el.value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,6); else if(f==='font'&&!el.value) delete O.font; else O[f]=el.value; if(f==='font'&&el.value) fontLink(); }
    clearTimeout(_oT); _oT=setTimeout(()=>{ hard(); if(T<total()) seek(Math.min(dur()-0.05,total()+1.6)); },350); return; }
  if(el.dataset.bar){ const L=selLayer(); if(!L||!L.items) return; const [i,f]=el.dataset.bar.split(':'); if(!L.items[+i]) return; if(!el._sn){ snap(); el._sn=1; setTimeout(()=>el._sn=0,1200); } if(f==='value'){ const v=+el.value; if(!isFinite(v)||el.value==='') return; L.items[+i].value=v; } else L.items[+i].label=el.value; live(); return; }
  if(el.dataset.city){ const L=selLayer(); if(!L) return; const n=cityFind(el.value); el.style.borderColor=n||!el.value.trim()?'':'var(--bad)'; if(!n) return; if(!el._sn){ snap(); el._sn=1; setTimeout(()=>el._sn=0,1200); } L[el.dataset.city]={name:n,lat:CITIES[n][0],lon:CITIES[n][1]}; delete L.km; live(); return; }
  if(el.dataset.kx){ const L=selLayer(); if(!L) return; const v=vizParse(el.dataset.kx,el.value); if(v===null) return; if(!el._sn){ snap(); el._sn=1; setTimeout(()=>el._sn=0,1200); } if(v===undefined) delete L[el.dataset.kx]; else L[el.dataset.kx]=v; if(el.dataset.kx==='values') delete L.value; live(); return; }
  if(el.dataset.en!==undefined){ const c=ST.caps.cards[+el.dataset.en], v=el.value.trim(); if(v) hs().en.map[key(c)]=v; else delete hs().en.map[key(c)]; live(); return; }
  if(!k||el.type==='radio') return; if(!el._sn){ snap(); el._sn=1; setTimeout(()=>el._sn=0,1200); }
  let v=el.value; if(el.type==='range'||el.type==='number'){ v=+v; if(isNaN(v)) return; const s=document.getElementById(vid(k)); if(s) s.textContent=v; } else if(el.tagName==='SELECT'&&/weight$/.test(k)) v=+v;
  if(k==='L.s') v=clamp(v,0,(selLayer().e||total())-0.1); if(k==='L.e') v=clamp(v,selLayer().s+0.1,total());
  setK(k,v); propagate(k,v); if(k==='mix.voice') AU.volume=clamp(v,0,1);
  if(k.startsWith('check.')){ dirty(); return; } if(k.startsWith('mix.')){ dirty(); return; }
  live(); if(k==='L.s'||k==='L.e'||k==='L.text'||k==='L.fx'||k==='L.char') buildTL(); if(el.tagName==='SELECT'||el.type==='color') renderRight(); }
$('#body').addEventListener('input',panelInput);
$('#body').addEventListener('change',e=>{ const el=e.target; if(el.id==='capStyle'){ snap(); ST.theme.capStyle=el.value; hard(); } if(el.dataset.k==='cap.y'||el.dataset.k==='cap.stroke') renderRight(); if(el.dataset.k==='frame.cy') frameSync(); if(el.id==='postTx'){ INFO.post=el.value; api('/hs/post',{text:el.value}); } });
async function panelClick(e){ const el=e.target, d=el.dataset;
  if(d.k==='trDir'&&d.v){ snap(); const h=hs(); h.trDir=d.v; h.layers.forEach(L=>{ if(L.type==='fx'&&(L.auto==='trans'||L.auto==='transitions')&&['curve','whip','spin'].includes(L.fx)) L.dir=d.v; }); renderLeft(); live(); return true; }
  if(d.colimg){ const L=selLayer(); if(!L) return true; snap(); const a=(L.items||[]).map(x=>x.src), i=a.indexOf(d.colimg); if(i>=0) a.splice(i,1); else if(a.length<6) a.push(d.colimg); L.items=a.map(src=>({src})); renderRight(); live(); return true; }
  { const L=selLayer(), tl=el.closest('[data-cstyle],[data-bgm],[data-fxset]');
    if(L&&tl){ snap(); if(tl.dataset.cstyle){ const k=tl.dataset.cstyle, df=CARDDEF[k]||{}; L.style=k; ['text','a','b','value','unit','label'].forEach(f=>{ if((L[f]==null||L[f]==='')&&df[f]!=null) L[f]=df[f]; }); if(k==='versus'&&!/\|/.test(L.text||'')) L.text=df.text; if(k==='check'&&!/^[+\-]/m.test(L.text||'')) L.text=df.text; if((k==='timeline'||k==='funnel')&&!/\|/.test(L.text||'')) L.text=df.text; }
      else if(tl.dataset.bgm){ L.mode=tl.dataset.bgm; if((L.mode==='color'||L.mode==='grad'||L.mode==='studio')&&!L.color) L.color=(ST.theme&&ST.theme.bg)||'#101014'; if(L.mode==='image'&&!L.src&&(INFO.assets||[])[0]) L.src='assets/'+INFO.assets[0]; }
      else L.fx=tl.dataset.fxset; buildTL(); renderRight(); await live(); return true; }
    if(L&&d.tset){ snap(); if(d.tset==='s') L.s=r3(clamp(T,0,L.e-0.1)); else L.e=r3(clamp(T,L.s+0.1,total())); buildTL(); renderRight(); await live(); return true; }
    if(L&&d.ratio){ snap(); if(d.ratio==='auto') delete L.ratio; else L.ratio=0.5; renderRight(); await live(); return true; }
    if(L&&d.byauto!==undefined){ snap(); if(d.byauto==='1'){ delete L.y; delete L.x; } else { L.y=0.3; L.x=0.5; } renderRight(); await live(); return true; }
    if(L&&d.brm!==undefined&&L.items){ snap(); L.items.splice(+d.brm,1); renderRight(); await live(); return true; }
    if(L&&el.id==='barAdd'){ snap(); L.items=L.items||[]; L.items.push({label:t('vName'),value:100}); renderRight(); await live(); return true; } }
  if(d.tog){ snap(); setK(d.tog,!getK(d.tog)); if(d.tog==='en.on'&&getK('en.on')) hs().cap.on=true; renderAll(); if(d.tog.startsWith('mix.')) dirty(); else await live(); if(d.tog==='hooks.on'&&getK('hooks.on')) seek(0.6); return true; }
  if(el.closest('.fcard')){ snap(); const f=el.closest('.fcard').dataset.font, c=hs().cap; c.font=f; const ws=weightsOf(f); c.weight=ws.reduce((b,x)=>Math.abs(x-c.weight)<Math.abs(b-c.weight)?x:b,ws[0]); renderRight(); await live(); return true; }
  if(d.scope){ SCOPE=d.scope; renderRight(); return true; }
  if(d.cappre!==undefined||el.closest('[data-cappre]')){ snap(); const k=(el.closest('[data-cappre]')||el).dataset.cappre, c=hs().cap; Object.assign(c,capStyle(k),{on:true}); renderRight(); await live(); return true; }
  if(d.c&&d.k){ snap(); setK(d.k,d.c); propagate(d.k,d.c); renderRight(); live(); return true; }
  if(d.v!==undefined&&d.k){ snap(); let v=d.v; if(v==='true') v=true; else if(v==='false') v=false; else if(/^\d+$/.test(v)) v=+v; if(d.k==='cap.chunk') hs().cap.mode='line'; setK(d.k,v); propagate(d.k,v); renderRight(); if(d.k==='B.mode'){ drawT(T); dirty(); } else if(d.k.startsWith('hooks.')){ renderLeft(); live(); } else live(); return true; }
  return false; }
$('#tabs').addEventListener('click',e=>{ const b=e.target.closest('[data-tab]'); if(b){ RTAB=b.dataset.tab; markTabs(); renderRight(); } });
$('#binTabs').addEventListener('click',e=>{ const b=e.target.closest('[data-ltab]'); if(b){ LTAB=b.dataset.ltab; markTabs(); renderLeft(); } });
$('#body').addEventListener('click',async e=>{ const el=e.target, d=el.dataset; if(styleClick(el)) return; if(el.id==='oDel'){ outroSet(0); return; } if(el.id==='oSee'){ seek(total()+0.05); play(); return; } if(await panelClick(e)) return;
  if(d.up){ pickFile(d.up); return; }
  if(d.copy){ navigator.clipboard&&navigator.clipboard.writeText(d.copy); toast(t('copied')); return; }
  if(d.seek!==undefined){ if(playing) stop(); seek(+d.seek+0.02); return; }
  if(d.edit!==undefined){ editCard(+d.edit); return; }
  if(d.drop!==undefined){ askRemove({cards:[+d.drop]},'«'+key(ST.caps.cards[+d.drop])+'»'); return; }
  if(el.id==='lDel'){ delSel(); return; } if(el.id==='lDup'){ dupSel(); return; }
  if(el.id==='ovReset'){ snap(); const h=hs(); delete h.capOv[key(ST.caps.cards[+SEL.id])]; renderRight(); live(); return; }
  if(d.frame){ snap(); const h=hs(); h.frame={...(h.frame||{}),ar:d.frame}; await frameSync(); return; }
  if(d.plat){ snap(); const h=hs(), a=h.platforms||[]; h.platforms=a.includes(d.plat)?a.filter(x=>x!==d.plat):[...a,d.plat]; await frameSync(); return; }
  if(d.phone){ phoneFile(d.phone); return; }
  if(el.id==='clrMarks'){ MARKS=[]; SEL=null; buildTL(); renderRight(); return; }
  if(el.id==='matchSize'){ snap(); const h=hs(), m=Math.round((h.cap.size+h.en.size)/2); h.cap.size=m; h.en.size=m; renderRight(); live(); return; }
  if(el.id==='askTr'){ runAgent(t('reqTranslate')); return; }
  if(el.id==='doClean'){ const words=$$('[data-fil]:checked').map(x=>x.dataset.fil.split(':').map(Number)), cards=$$('[data-dup]:checked').map(x=>+x.dataset.dup); if(!words.length&&!cards.length) return; askRemove({words,cards},t('chkRemoveWhat',words.length,cards.length)); return; }
  if(el.id==='newNote'){ openNote(); return; }
  if(d.aians){ let v=d.v; if(v==='text'){ const x=document.querySelector('[data-aitx="'+d.aians+'"]'); v=(x&&x.value||'').trim(); if(!v){ toast(t('noteEmpty')); return; } } const r=await api('/hs/note_edit',{id:d.aians,answer:v}); NOTES=r.notes; buildTL(); renderRight(); toast(t('aiSent')); return; }
  if(d.delnote){ const r=await api('/hs/note_edit',{id:d.delnote,delete:true}); NOTES=r.notes; buildTL(); renderRight(); return; }
  if(d.promote){ const r=await api('/hs/review_promote',{id:+d.promote}); if(r.ok){ NOTES=r.notes; REV={approved:r.approved,comments:r.comments}; buildTL(); renderRight(); } return; }
  if(el.id==='sendNotes'){ await save(); const r=await api('/hs/notes_send',{run:!!INFO.claude}); NOTES=r.notes; buildTL(); renderRight(); const out=$('#sendOut');
    if(r.started){ toast(t('claudeStarted')); RTAB='claude'; markTabs(); renderRight(); } else if(out){ out.innerHTML='<p class="hint" style="margin-top:9px">'+(r.msg?esc(r.msg)+' ':'')+t('pasteHint',r.count)+'</p><div class="copy"><span dir="auto">'+esc(r.prompt)+'</span><button class="sm" data-copy="'+esc(r.prompt)+'">'+t('copy')+'</button></div>'; } return; }
  if(el.id==='agGo'){ const v=$('#agTx').value.trim(); if(v) runAgent(v); return; }
  if(el.id==='agStop'){ await api('/hs/agent_stop',{}); return; }
  if(el.id==='doRender'){ doExport('final',$('#exHooks')&&$('#exHooks').checked); return; } if(el.id==='doClean2'){ doExport('clean',false); return; }
  if(el.id==='doPack'){ await api('/hs/post',{text:$('#postTx').value}); const r=await api('/hs/pack',{}); $('#packOut').innerHTML=r.ok?'<p class="hint">'+r.files.map(esc).join(' · ')+'</p><a href="/hs/pack.zip" download>'+t('packDownload')+'</a>':'<p class="hint">'+esc(r.msg||t('failed'))+'</p>'; return; }
  if(el.id==='askPost'){ runAgent(t('reqPost')); return; }
  if(el.id==='doCmp'){ compare($('#cmpA').value,$('#cmpB').value); return; }
  if(el.id==='privShow'){ const r=await api('/hs/tools'); modal('<h3>'+t('privTitle')+'</h3>'+(r.tools||[]).map(x=>'<div class="note"><div style="flex:1"><b>'+esc(x.name)+'</b> <span class="st '+(x.ok?'ok':'')+'">'+t(x.ok?'privHave':'privMiss')+'</span><p dir="auto">'+esc(x.why)+'</p><p class="hint" dir="auto" style="margin:2px 0 0">'+esc(x.src)+'</p></div></div>').join('')+'<h4 style="margin:14px 0 6px">'+t('privNet')+'</h4>'+(r.net||[]).map(x=>'<p class="hint" dir="auto" style="margin:4px 0">'+esc(x)+'</p>').join('')+'<div class="row" style="margin:14px 0 0"><button id="qNo">'+t('close')+'</button></div>',true); $('#qNo').onclick=closeModal; return; }
  if(el.id==='brandSave'){ await save(); const r=await api('/hs/brand_save',{name:$('#brandName').value}); if(!r.ok){ toast(r.msg); return; } INFO.brands=r.brands; renderRight(); toast(t('brandSaved')); return; }
  if(el.id==='brandApply'){ const n=$('#brandSel').value; if(!n) return; snap(); const b=await api('/hs/brand/'+encodeURIComponent(n)), h=hs(); h.cap={...h.cap,...(b.cap||{})}; h.en={...h.en,...(b.en||{}),map:h.en.map}; (b.fonts||[]).forEach(f=>{ if(!h.fonts.some(x=>x.file===f.file)) h.fonts.push(f); }); ST.theme={...ST.theme,...(b.theme||{})}; await hard(); renderAll(); toast(t('brandApplied')); return; }
  if(el.id==='verSave'){ await save(); const r=await api('/hs/ver_save',{name:$('#verName').value||t('version')}); INFO.versions=r.versions; renderRight(); toast(t('verSaved')); return; }
  if(d.ver){ await save(); const r=await api('/hs/ver_restore',{id:d.ver}); if(r.rebuild){ toast(t('rebuilding')); pollJob(()=>load(true)); } else { await load(true); toast(t('verRestored')); } return; } });
async function runAgent(task,gen){ await save(); const sel=SEL?(SEL.kind==='layer'?'طبقة '+SEL.id:SEL.kind==='cap'?'الجملة '+(+SEL.id+1):SEL.kind):null; const r=await api('/hs/agent',{task,t:T,sel,gen:!!gen});
  if(r.ok){ toast(t('claudeStarted')); RTAB='claude'; markTabs(); renderRight(); } else { RTAB='claude'; markTabs(); renderRight(); const out=$('#agOut'); if(out) out.innerHTML='<p class="hint">'+esc(r.msg||'')+' '+t('pasteHint2')+'</p><div class="copy"><span dir="auto">'+esc(r.prompt||task)+'</span><button class="sm" data-copy="'+esc(r.prompt||task)+'">'+t('copy')+'</button></div>'; } }

/* ───── النوافذ ───── */
function modal(html,wide){ $('#mbox').className=wide?'wide':''; $('#mbox').dir=LANG==='ar'?'rtl':'ltr'; $('#mbox').innerHTML=html; $('#modal').classList.add('on'); }
function closeModal(){ $('#modal').classList.remove('on'); $('#mbox').innerHTML=''; }
$('#modal').addEventListener('pointerdown',e=>{ if(e.target.id==='modal') closeModal(); });
function editCard(i){ const c=ST.caps.cards[i]; modal('<h3>'+t('editTitle')+'</h3><textarea id="edTx" rows="3" dir="rtl">'+esc(key(c))+'</textarea><p class="hint">'+t('editHint')+'</p><div class="row" style="margin:12px 0 0"><button class="pri" id="edOk">'+t('save')+'</button><button class="ghost" id="edNo">'+t('cancel')+'</button></div>');
  const x=$('#edTx'); x.focus(); $('#edNo').onclick=closeModal;
  $('#edOk').onclick=async()=>{ await save(); snap(); const r=await api('/hs/text',{card:i,text:x.value}); if(!r.ok){ toast(r.msg||t('failed')); return; } ST.caps=r.caps; ST.studio.hs=r.hs; hs(); closeModal(); await initFrame(false); buildTL(); renderAll(); drawT(T); adoptSig=true; $('#saved').textContent=t('saved'); refreshCheck(); }; }
function askRemove(body,what){ modal('<h3>'+t('removeTitle')+'</h3><p dir="auto" style="line-height:1.9">'+esc(what)+'</p><p class="hint">'+t('removeHint')+'</p><div class="row" style="margin:12px 0 0"><button class="pri" id="dOk">'+t('removeGo')+'</button><button class="ghost" id="dNo">'+t('cancel')+'</button></div>');
  $('#dNo').onclick=closeModal; $('#dOk').onclick=async()=>{ closeModal(); await save(); const r=await api('/hs/remove',body); if(!r.ok){ toast(r.msg||t('busyJob')); return; } MARKS=[]; SEL=null; toast(t('rebuilding')); pollJob(()=>load(true)); }; }
function pollJob(done){ const tk=async()=>{ const p=await api('/api/progress'); const L=$('#log'); if(L){ L.style.display='block'; L.dir='rtl'; L.textContent=(p.log||'').split('\n').filter(Boolean).slice(-9).join('\n'); L.scrollTop=1e6; }
  $('#saved').textContent=p.running?t('working',p.elapsed):t('saved'); if(p.running){ setTimeout(tk,1200); return; } if(p.err) toast(t('failedWhy',p.err.slice(0,90))); done&&done(p); }; setTimeout(tk,600); }
async function doExport(kind,hooks){ await save(); RTAB='proj'; markTabs(); renderRight(); const r=await api('/hs/export',{kind,hooks:!!hooks}); if(!r.ok){ toast(r.msg||t('busyJob')); return; } toast(t('exportStarted'));
  pollJob(async p=>{ INFO=await api('/hs/info'); if(RTAB==='proj') renderRight(); if(!p.err) toast(t('exportDone')); }); }
$('#bExport').onclick=()=>{ RTAB='proj'; markTabs(); renderRight(); };
let PIN=null;
function grab(){ try{ const w=F.contentWindow, src=w.document.getElementById('cv'), c=document.createElement('canvas'); c.width=432; c.height=768; c.getContext('2d').drawImage(src,0,0,432,768); return c.toDataURL('image/jpeg',0.72); }catch(e){ return ''; } }
function openNote(){ if(!ST) return; if(playing) stop(); PIN=null; const img=grab(), x0=T;
  modal('<h3>'+t('noteAt',fmt(x0))+'</h3><div class="ngrid"><div><div id="pinbox">'+(img?'<img src="'+img+'">':'')+'<div id="pin"></div></div><p class="hint" style="text-align:center">'+t('pinHint')+'</p></div><div><textarea id="nTx" rows="7" dir="auto" placeholder="'+t('notePh')+'"></textarea><div class="row" style="margin:12px 0 0"><button class="pri" id="nOk">'+t('noteSave')+'</button><button class="ghost" id="nNo">'+t('cancel')+'</button></div><p class="hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd></p></div></div>');
  const tx=$('#nTx'); tx.focus();
  $('#pinbox').onclick=e=>{ const r=$('#pinbox').getBoundingClientRect(); PIN={x:+((e.clientX-r.left)/r.width).toFixed(3),y:+((e.clientY-r.top)/r.height).toFixed(3)}; const p=$('#pin'); p.style.display='block'; p.style.left=(PIN.x*100)+'%'; p.style.top=(PIN.y*100)+'%'; };
  const ok=async()=>{ if(!tx.value.trim()){ toast(t('noteEmpty')); return; } const ci=cardAt(x0); const r=await api('/hs/note',{t:x0,text:tx.value.trim(),pin:PIN,img,card:ci>=0?ci:null}); NOTES=r.notes; buildTL(); if(RTAB==='notes') renderRight(); closeModal(); toast(t('noteSaved')); };
  $('#nOk').onclick=ok; $('#nNo').onclick=closeModal; tx.onkeydown=e=>{ if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){ e.preventDefault(); ok(); } e.stopPropagation(); }; }
$('#bNote').onclick=openNote;
$('#bQR').onclick=()=>{ if(!INFO) return; let svg=''; try{ const q=qrcode(0,'M'); q.addData(INFO.lanM||INFO.lan); q.make(); svg=q.createSvgTag({cellSize:6,margin:3,scalable:true}); }catch(e){}
  modal('<h3>'+t('qrTitle')+'</h3><div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center"><div style="width:230px;background:#fff;border-radius:10px;padding:6px;line-height:0">'+svg+'</div><div style="flex:1;min-width:220px"><p style="line-height:1.9;margin-top:0">'+t('qrHint')+'</p><div class="copy"><span style="direction:ltr;text-align:left">'+esc(INFO.lanM||INFO.lan)+'</span></div><p class="hint">'+t('qrCode')+' <b style="color:var(--tx);font-size:16px;letter-spacing:2px">'+INFO.token+'</b></p></div></div><div id="ntfBox" class="sec" style="margin-top:14px"></div><div class="row" style="margin:14px 0 0"><button id="qNo">'+t('close')+'</button></div>'); $('#qNo').onclick=closeModal; ntfRender(); };
/* 4.1: إشعارات للجوال (ntfy): Claude يكلّمك ويرسل لك المقطع أول ما يخلص */
async function ntfRender(st){ const box=$('#ntfBox'); if(!box) return; if(!st){ try{ st=await (await fetch('/hs/notify')).json(); }catch(e){ st={on:false}; } }
  let h='<h4>'+t('ntfTitle')+'</h4><p class="hint" style="line-height:1.8">'+t('ntfHint')+'</p>';
  if(st.on&&st.sub){ let svg=''; try{ const q=qrcode(0,'M'); q.addData(st.sub); q.make(); svg=q.createSvgTag({cellSize:4,margin:2,scalable:true}); }catch(e){}
    h+='<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center"><div style="width:150px;background:#fff;border-radius:8px;padding:4px;line-height:0">'+svg+'</div><div style="flex:1;min-width:200px"><p style="margin:0 0 6px">'+t('ntfSteps')+'</p><div class="copy"><span style="direction:ltr;text-align:left">'+esc(st.topic)+'</span></div><p class="hint">'+t('ntfPrivacy')+'</p></div></div><div class="row"><button class="pri" id="ntfTest">'+t('ntfTest')+'</button><button class="ghost" id="ntfOff">'+t('ntfOff')+'</button></div>'; }
  else h+='<div class="row"><button class="pri" id="ntfOn">'+t('ntfOn')+'</button></div>';
  box.innerHTML=h;
  const call=async a=>{ const r=await api('/hs/notify',{action:a}); return r; };
  if($('#ntfOn')) $('#ntfOn').onclick=async()=>{ const r=await call('setup'); ntfRender(r); };
  if($('#ntfOff')) $('#ntfOff').onclick=async()=>{ await call('off'); ntfRender({on:false}); };
  if($('#ntfTest')) $('#ntfTest').onclick=async()=>{ const r=await call('test'); toast(r&&r.ok?t('ntfSent'):t('ntfFail')+(r&&r.msg?': '+r.msg:'')); }; }
function compare(a,b){ modal('<h3>'+t('compareTitle')+'</h3><div class="cmp"><div><video id="cvA" src="/hs/export/'+a+'" playsinline muted></video><p class="hint" style="direction:ltr">'+a+'</p></div><div><video id="cvB" src="/hs/export/'+b+'" playsinline></video><p class="hint" style="direction:ltr">'+b+'</p></div></div><div class="row" style="margin-top:10px"><button class="pri" id="cPlay">'+t('play')+'</button><input type="range" id="cSeek" min="0" max="1000" value="0"><button id="cNo">'+t('close')+'</button></div>',true);
  const A=$('#cvA'), B=$('#cvB'); $('#cNo').onclick=()=>{ A.pause(); B.pause(); closeModal(); };
  $('#cPlay').onclick=()=>{ if(A.paused){ B.currentTime=A.currentTime; A.play(); B.play(); $('#cPlay').textContent=t('pause'); } else { A.pause(); B.pause(); $('#cPlay').textContent=t('play'); } };
  $('#cSeek').oninput=e=>{ const d=Math.max(A.duration||0,B.duration||0), x=d*e.target.value/1000; A.currentTime=Math.min(x,A.duration||x); B.currentTime=Math.min(x,B.duration||x); };
  A.ontimeupdate=()=>{ const d=Math.max(A.duration||0,B.duration||0); if(d) $('#cSeek').value=1000*A.currentTime/d; }; }
$('#bSafe').onclick=()=>$('#safe').classList.toggle('on'); $('#bCover').onclick=coverShot; $('#bUndo').onclick=undo; $('#pp').onclick=play;

/* ───── تحريك الطبقة على الشاشة ───── */
function placeGiz(){ const g=$('#giz'), L=selLayer(); if(!ST){ g.style.display='none'; return; }
  if(SEL&&SEL.kind==='cap'&&hs().cap.on){ const i=+SEL.id, c=ST.caps.cards[i]; if(c&&T>=c.s&&T<c.e){ const ov=capOvOf(i,false), y=(SCOPE==='one'&&ov&&ov.y!==undefined)?ov.y:hs().cap.y; g.style.display='block'; g.style.left='50%'; g.style.top=y+'%'; return; } }
  if(!L||L.type==='fx'||L.type==='split'||L.type==='cover'||L.type==='bg'||(L.type==='behind'&&L.y==null)||(L.type==='viz'&&L.layout!=='over')||(L.type==='image'&&L.fit==='cover')||L.type==='kinetic'||T<L.s||T>=L.e){ g.style.display='none'; return; } g.style.display='block'; g.style.left=((L.x==null?(L.type==='desk'?0.3:0.5):L.x)*100)+'%'; if(L.type==='desk'){ const S=dkStageK(); g.style.top=((S.y0+(L.y==null?0.42:L.y)*S.h)*100)+'%'; } else g.style.top=((L.y==null?0.3:L.y)*100)+'%'; }
(function(){ const g=$('#giz'); let on=false; g.addEventListener('pointerdown',e=>{ on=true; snap(); g.setPointerCapture(e.pointerId); e.preventDefault(); });
  g.addEventListener('pointermove',e=>{ if(!on) return; const r=$('#wrap').getBoundingClientRect(); let x=clamp((e.clientX-r.left)/r.width,0,1), y=clamp((e.clientY-r.top)/r.height,0,1); const w=F.contentWindow;
    if(SEL&&SEL.kind==='cap'){ const v=Math.round(clamp(y*100,15,92)*2)/2; setK('C.y',v); if(w&&w.hsSet) w.hsSet(ST.studio.hs); placeGiz(); if(w&&w.draw) w.draw(T); return; }
    const L=selLayer(); if(!L) return; if(MAG&&Math.abs(x-0.5)<0.02) x=0.5; if(L.type==='desk'){ const S=dkStageK(); y=clamp((y-S.y0)/S.h,0,1); } L.x=r3(x); L.y=r3(y); propagate('L.x',L.x); propagate('L.y',L.y); placeGiz(); if(w&&w.draw) w.draw(T); });
  const end=()=>{ if(on){ on=false; live(); renderRight(); } }; g.addEventListener('pointerup',end); g.addEventListener('pointercancel',end); })();

/* ───── الاختصارات ───── */
document.addEventListener('keydown',e=>{ const tg=e.target.tagName, typing=(tg==='INPUT'&&!['range','checkbox','radio'].includes(e.target.type))||tg==='TEXTAREA'||tg==='SELECT';
  if(e.key==='Escape'){ closeModal(); return; }
  const mod=e.ctrlKey||e.metaKey;
  if($('#modal').classList.contains('on')||typing||!ST){ if(mod&&e.code==='KeyF'&&ST&&!$('#modal').classList.contains('on')){ e.preventDefault(); LTAB='text'; markTabs(); renderLeft(); $('#q').focus(); } return; }
  if(e.code==='Space'){ e.preventDefault(); play(); }
  else if(mod&&e.code==='KeyZ'){ e.preventDefault(); undo(); }
  else if(mod&&e.code==='KeyF'){ e.preventDefault(); LTAB='text'; markTabs(); renderLeft(); $('#q').focus(); }
  else if(mod&&e.code==='KeyD'){ e.preventDefault(); dupSel(); }
  else if(mod) return;
  else if(e.code==='KeyM'){ e.preventDefault(); openNote(); }
  else if(e.code==='KeyA'||e.code==='KeyV'){ TOOL='select'; markTabs(); }
  else if(e.code==='KeyB'){ TOOL='blade'; markTabs(); }
  else if(e.code==='KeyN'){ MAG=!MAG; markTabs(); }
  else if(e.code==='KeyS'){ $('#bSkim').click(); }
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.preventDefault(); if(playing) stop(); seek(T+(e.shiftKey?1:1/FPS)*(e.key==='ArrowRight'?1:-1)); placeGiz(); }
  else if(e.key==='Delete'||e.key==='Backspace'){ if(SEL){ e.preventDefault(); delSel(); } } });
window.addEventListener('resize',()=>{ if(ST) buildTL(); });


/* ═══════════ v3: ستايلات جاهزة للكابشن ═══════════ */
const CAPRESET={bg:'none',bgColor:'#000000',bgOpacity:0.62,stroke:0,strokeColor:'#000000',shadow:true,shadowColor:'#000000',hl:'color',chunk:0,actScale:1,fill:'solid',mode:'line',enter:'rise',lines:2};
const CAPPRE={ clean:{font:'Tajawal',weight:800,size:66,color:'#FFFFFF',active:'#F2B33D',bg:'none',stroke:0,shadow:true,enter:'rise'},
  box:{font:'Cairo',weight:800,size:60,color:'#FFFFFF',active:'#FFE14D',bg:'box',bgColor:'#000000',bgOpacity:0.7,stroke:0,enter:'pop'},
  pill:{font:'Tajawal',weight:900,size:68,color:'#FFFFFF',active:'#8F73F5',bg:'pill',stroke:0,shadow:true,enter:'rise'},
  bold:{font:'Cairo',weight:900,size:80,color:'#FFE14D',active:'#FFFFFF',bg:'none',stroke:7,strokeColor:'#000000',shadow:false,enter:'pop'},
  karaoke:{font:'Alexandria',weight:800,size:64,color:'#FFFFFF',active:'#43D17A',bg:'none',stroke:4,strokeColor:'#000000',shadow:true,enter:'words'},
  oneword:{font:'Cairo',weight:900,size:120,color:'#FFFFFF',active:'#F2B33D',bg:'none',stroke:8,strokeColor:'#000000',shadow:false,enter:'pop',chunk:1,lines:1},
  band:{font:'IBM Plex Sans Arabic',weight:700,size:56,color:'#FFFFFF',active:'#FFE14D',bg:'bar',bgColor:'#000000',bgOpacity:0.78,shadow:false,enter:'fade'},
  lines:{font:'Almarai',weight:800,size:58,color:'#111111',active:'#D2558F',bg:'lines',bgColor:'#FFFFFF',bgOpacity:1,shadow:false,enter:'rise'},
  under:{font:'Readex Pro',weight:700,size:64,color:'#FFFFFF',active:'#43D17A',hl:'under',shadow:true,enter:'fade'},
  fill:{font:'Tajawal',weight:900,size:70,color:'#FFFFFF',active:'#FFFFFF',hl:'dim',stroke:5,strokeColor:'#000000',shadow:false,enter:'none'},
  punch:{font:'Cairo',weight:900,size:78,color:'#FFFFFF',active:'#FFE14D',actScale:1.22,stroke:8,strokeColor:'#000000',shadow:false,enter:'pop',chunk:3,lines:1},
  duo:{font:'Lalezar',weight:400,size:108,color:'#FFFFFF',active:'#F2B33D',stroke:8,strokeColor:'#000000',shadow:false,enter:'pop',chunk:2,lines:1},
  hollow:{font:'Changa',weight:800,size:84,color:'#FFFFFF',active:'#FFE14D',fill:'outline',shadow:false,enter:'words'},
  retro:{font:'Baloo Bhaijaan 2',weight:800,size:76,color:'#FFE14D',active:'#FFFFFF',stroke:6,strokeColor:'#1B1B22',shadow:'hard',shadowColor:'#D2558F',enter:'drop'},
  calm:{font:'IBM Plex Sans Arabic',weight:500,size:50,color:'#FFFFFF',active:'#FFFFFF',shadow:true,enter:'fade'},
  kufi:{font:'Reem Kufi',weight:700,size:70,color:'#FFFFFF',active:'#4C8DFF',shadow:true,enter:'slide'},
  naskh:{font:'Amiri',weight:700,size:72,color:'#FFFFFF',active:'#F2B33D',bg:'bar',bgColor:'#101014',bgOpacity:0.55,shadow:false,enter:'fade'},
  naskhword:{font:'Noto Naskh Arabic',weight:700,size:104,color:'#FFFFFF',active:'#FFD21F',shadow:true,enter:'pop',chunk:1,lines:1},
  glass:{font:'Noto Naskh Arabic',weight:700,size:70,color:'#FFFFFF',active:'#FFD21F',bg:'glass',shadow:false,enter:'rise',chunk:3,lines:2},
  fun:{font:'Marhey',weight:700,size:70,color:'#FFFFFF',active:'#FF7A59',bg:'pill',shadow:true,enter:'pop'} };
function preTile(k){ const p={...CAPRESET,...CAPPRE[k]}, dark=p.bg==='lines';
  let base='font-family:\''+p.font+'\';font-weight:'+p.weight+';color:'+p.color+';';
  if(p.stroke) base+='text-shadow:0 0 2px '+p.strokeColor+',0 0 2px '+p.strokeColor+',0 1px 2px '+p.strokeColor+(p.shadow==='hard'?',3px 3px 0 '+p.shadowColor:'')+';';
  if(p.fill==='outline') base+='-webkit-text-stroke:1px '+p.color+';color:transparent;';
  let wrap='all:unset;'; if(p.bg==='box') wrap+='background:rgba(0,0,0,.75);padding:2px 8px;border-radius:6px;'; if(p.bg==='glass') wrap+='background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.45);padding:2px 9px;border-radius:9px;'; if(p.bg==='lines') wrap+='background:'+p.bgColor+';padding:1px 7px;border-radius:4px;';
  if(p.bg==='bar') wrap+='display:block;width:100%;background:rgba(0,0,0,.78);padding:3px 0;text-align:center;';
  let act='all:unset;'; if(p.bg==='pill') act+='background:'+p.active+';color:#fff;padding:0 5px;border-radius:5px;'; else if(p.hl==='under') act+='border-bottom:3px solid '+p.active+';'; else if(p.hl==='dim') act+='opacity:.36;'; else act+='color:'+p.active+';'+(p.fill==='outline'?'-webkit-text-stroke:0;':'');
  if(p.actScale>1) act+='font-size:1.25em;';
  const words=p.chunk===1?['','مميّز']:p.chunk===2?['كلام','مميّز']:['كلام','مميّز'];
  return '<div class="tile" data-cappre="'+k+'" style="aspect-ratio:16/10"><div class="pv" dir="rtl" style="'+base+(dark?'':'')+(p.bg==='bar'?'padding:4px 0;':'')+'"><span style="'+wrap+'">'+(words[0]?words[0]+' ':'')+'<span style="'+act+'">'+words[1]+'</span></span></div><span>'+t('cp_'+k)+'</span></div>'; }
function capStyle(k){ return {...CAPRESET,...CAPPRE[k]}; }

/* ═══════════ v3: نطاق التعديل (هذا فقط / الكل) ═══════════ */
let SCOPE='one';
const NOPROP=new Set(['style','draw','a','b','by','mode','num','kind','values','value','items','from','to','km','time','label','pre','word','post','url','frame','caption','handle','title','ratio','text','s','e','src','char','id','track','type','auto','fx']);
function scopeRow(){ return '<div class="row"><label>'+t('scope')+'</label><div class="seg"><button data-scope="one" class="'+(SCOPE==='one'?'on':'')+'">'+t('scopeOne')+'</button><button data-scope="all" class="'+(SCOPE==='all'?'on':'')+'">'+t('scopeAll')+'</button></div></div>'; }
function capOvOf(i,create){ const h=hs(); h.capOv=h.capOv||{}; const k=key(ST.caps.cards[i]); if(!h.capOv[k]&&create) h.capOv[k]={}; return h.capOv[k]; }
function capVal(i,f){ const o=capOvOf(i,false); return (SCOPE==='one'&&o&&o[f]!==undefined)?o[f]:(o&&o[f]!==undefined&&SCOPE==='one'?o[f]:hs().cap[f]); }
function propagate(k,v){ if(SCOPE!=='all'||!k.startsWith('L.')) return; const f=k.slice(2), L=selLayer(); if(!L||NOPROP.has(f)) return; hs().layers.forEach(x=>{ if(x!==L&&x.type===L.type&&(L.type!=='image'||x.fit===L.fit)) x[f]=v; }); }

/* ═══════════ v3: صفحة الأسئلة قبل المونتاج ═══════════ */
let BR=null, BRD=null;
const PLATS=['tiktok','instagram','x','linkedin'], FRAMES=['9:16','4:5','1:1','16:9'];
const B_OPTS={ goal:['ad','explain','story','news','vlog','tutorial','review','podcast','other'], platform:PLATS, frame:FRAMES, length:['keep','tight','max30','max60'], pace:['calm','normal','fast'],
  pos:['top','mid','bottom'], media:['none','search','ai','mix','mine'], amount:['few','some','many'], sfx:['none','light','rich'] };
const POSY={top:30,mid:56,bottom:76};
function chips(id,opts,val,multi){ return '<div class="chips">'+opts.map(o=>{ const on=multi?(val||[]).includes(o):val===o; return '<button data-b="'+id+'" data-v="'+o+'"'+(multi?' data-m="1"':'')+' class="'+(on?'on':'')+'">'+t('b_'+o)+'</button>'; }).join('')+'</div>'; }
function btog(id,title,sub,val){ return '<div class="tog"><div>'+title+(sub?'<small>'+sub+'</small>':'')+'</div><div class="sw-t'+(val?' on':'')+'" data-bt="'+id+'"></div></div>'; }
function frameRec(){ const P=(BRD&&BRD.platforms)||{}; const sets=(BR.platform||[]).map(k=>(P[k]||{}).frames||[]); if(!sets.length) return ['9:16']; const common=FRAMES.filter(f=>sets.every(s=>s.includes(f))); return common.length?common:[sets[0][0]]; }
function bget(p){ return p.split('.').reduce((o,k)=>o==null?undefined:o[k],BR); }
function bset(p,v){ const ks=p.split('.'); let o=BR; for(let i=0;i<ks.length-1;i++){ o[ks[i]]=o[ks[i]]||{}; o=o[ks[i]]; } o[ks[ks.length-1]]=v; }
async function openBrief(){ BRD=await api('/hs/brief'); const L=BRD.last||{}, A=BRD.ask||{};
  BR={ goal:L.goal||'explain', goalText:L.goalText||'', theme:{mode:'auto',bg:'#101014',acc:'#F2B33D',ink:'#FFFFFF',handle:'',...(L.theme||{})}, platform:(L.platform||['tiktok','instagram']).filter(x=>PLATS.includes(x)), frame:FRAMES.includes(L.frame)?L.frame:'9:16', length:L.length||'keep', pace:L.pace||'normal', look:L.look||'clean', pos:L.pos||'bottom', en:!!L.en,
    hook:{use:true,text:(A.hooks||[])[0]||'',variants:A.hooks||[]}, char:{use:'none',side:'left',...(L.char||{}),color:undefined}, media:{mode:'search',amount:'some',video:false,...(L.media||{}),topics:A.topics||[]},
    cards:['none','few','some','many'].includes(L.cards)?L.cards:'some', fx:{zoom:true,transitions:false,sfx:'light',bg:false,...(L.fx||{})}, cut:{fillers:BRD.fillers>0,dupes:(BRD.dupes||[]).length>0,drop:(BRD.dupes||[]).map(d=>d[0])}, brand:L.brand||'', outro:{use:false,text:'',handle:'',...(L.outro||{})}, extra:{}, notes:'', ref:'', style:['normal','paper','dahih'].includes(L.style)?L.style:'normal' };
  renderBrief(); $('#brief').classList.add('on'); }
function renderBrief(){ const A=BRD.ask||{}; let o='<div class="bin"><h2>'+t('bTitle')+'</h2><p class="hint" style="font-size:13px">'+t('bSub')+'</p>'+(A.note?'<div class="warnbox" dir="auto">'+esc(A.note)+'</div>':'')+(BRD.last?'<p class="hint">'+t('bLast')+'</p>':'');
  let _n=0; const sec=(n,title,body)=>'<div class="bsec"><h3><i>'+(++_n)+'</i>'+title+'</h3>'+body+'</div>';
  o+=sec(1,t('bqGoal'),chips('goal',B_OPTS.goal,BR.goal)+(BR.goal==='other'?'<input type="text" dir="auto" data-bi="goalText" placeholder="'+t('bqGoalOther')+'" value="'+esc(BR.goalText||'')+'" style="margin-top:10px">':'')
    +'<h4>'+t('bqPlatform')+'</h4>'+chips('platform',B_OPTS.platform,BR.platform,true)+BR.platform.map(k=>'<p class="hint" style="margin:8px 0 0"><b>'+t('b_'+k)+'</b>: '+t('pf_'+k)+'</p>').join('')
    +'<h4>'+t('bqFrame')+'</h4><div class="frames">'+FRAMES.map(f=>{ const [a,b]=f.split(':').map(Number), rec=frameRec().includes(f); return '<button data-b="frame" data-v="'+f+'" class="'+(BR.frame===f?'on':'')+'"><i style="aspect-ratio:'+a+'/'+b+';'+(a>b?'width:44px':'height:44px')+'"></i><b>'+t('bf_'+f.replace(':','x'))+'</b><small>'+f+(rec?' · '+t('bfRec'):'')+'</small></button>'; }).join('')+'</div><p class="hint" style="margin-top:8px">'+t('fh_'+BR.frame.replace(':','x'))+'</p>');
  o+=sec('★',t('bqTheme'),'<div class="frames">'+['auto','mono','custom'].map(m=>{ const c=m==='mono'?['#0E0E10','#FFE14D','#FFFFFF']:m==='custom'?[BR.theme.bg,BR.theme.acc,BR.theme.ink]:['#1B2A4A','#F2B33D','#FFFFFF']; return '<button data-b="theme.mode" data-v="'+m+'" class="'+(BR.theme.mode===m?'on':'')+'"><span class="sw3"><u style="background:'+c[0]+'"></u><u style="background:'+c[1]+'"></u><u style="background:'+c[2]+'"></u></span><b>'+t('bt_'+m)+'</b><small>'+t('bts_'+m)+'</small></button>'; }).join('')+'</div>'+(BR.theme.mode==='custom'?'<div class="row3"><label>'+t('btBg')+'<input type="color" data-bi="theme.bg" value="'+esc(BR.theme.bg)+'"></label><label>'+t('btAcc')+'<input type="color" data-bi="theme.acc" value="'+esc(BR.theme.acc)+'"></label><label>'+t('btInk')+'<input type="color" data-bi="theme.ink" value="'+esc(BR.theme.ink)+'"></label></div>':'')+'<h4>'+t('btHandle')+'</h4><input type="text" dir="ltr" data-bi="theme.handle" placeholder="@handle" value="'+esc(BR.theme.handle||'')+'">');
  o+=sec('S',t('bqStyle'),chips('style',['normal','podcast','paper','dahih'],BR.style||'normal')+'<p class="hint">'+t('bqStyleH_'+(BR.style||'normal'))+'</p>');
  o+=sec(2,t('bqLength'),chips('length',B_OPTS.length,BR.length)+'<h4>'+t('bqPace')+'</h4>'+chips('pace',B_OPTS.pace,BR.pace));
  o+=sec(3,t('bqCap'),'<div class="grid3 g6">'+Object.keys(CAPPRE).map(k=>preTile(k).replace('class="tile"','class="tile'+(BR.look===k?' sel':'')+'"')).join('')+'</div><h4>'+t('bqPos')+'</h4>'+chips('pos',B_OPTS.pos,BR.pos)+btog('en',t('bqEn'),t('bqEnSub'),BR.en));
  o+=sec(4,t('bqHook'),btog('hook.use',t('bqHookUse'),t('bqHookSub'),BR.hook.use)+(BR.hook.use?(BR.hook.variants||[]).map((h,i)=>'<label class="item"><input type="radio" name="bhk" data-bhk="'+i+'"'+(BR.hook.text===h?' checked':'')+'><span dir="auto">'+esc(h)+'</span></label>').join('')+'<input type="text" dir="auto" data-bi="hook.text" placeholder="'+t('bqHookOwn')+'" value="'+esc(BR.hook.text||'')+'">':''));
  o+=sec(5,t('bqChar'),'<div class="grid3 g6"><div class="tile'+(BR.char.use==='none'?' sel':'')+'" data-bchar="none"><div class="pv">'+t('b_nochar')+'</div><span>'+t('b_none')+'</span></div>'+CHARS.map(c=>'<div class="tile'+(BR.char.use===c?' sel':'')+'" data-bchar="'+c+'"><div class="pv"><canvas data-spr="'+c+'" width="56" height="56"></canvas></div><span>'+t('char_'+c)+'</span></div>').join('')+'</div>'+(BR.char.use!=='none'?'<h4>'+t('bqCharSide')+'</h4><div class="chips"><button data-b="char.side" data-v="left" class="'+(BR.char.side==='left'?'on':'')+'">'+t('b_left')+'</button><button data-b="char.side" data-v="right" class="'+(BR.char.side==='right'?'on':'')+'">'+t('b_right')+'</button></div>':'')+'<p class="hint">'+t('bqCharHint')+'</p>');
  o+=sec(6,t('bqMedia'),chips('media.mode',B_OPTS.media,BR.media.mode)+(BR.media.mode!=='none'&&BR.media.mode!=='mine'?'<h4>'+t('bqTopics')+'</h4><input type="text" dir="auto" data-bi="media.topicsText" placeholder="'+t('bqTopicsPh')+'" value="'+esc((BR.media.topics||[]).join('، '))+'"><h4>'+t('bqAmount')+'</h4>'+chips('media.amount',B_OPTS.amount,BR.media.amount)+(BR.media.mode==='ai'||BR.media.mode==='mix'?btog('media.video',t('bqVideo'),t('bqVideoSub'),BR.media.video):''):'')+'<p class="hint">'+t('bqMediaHint')+'</p>');
  o+=sec('c',t('bqCards'),'<div class="chips">'+['none','few','some','many'].map(v=>'<button data-b="cards" data-v="'+v+'" class="'+(BR.cards===v?'on':'')+'">'+t('cd_'+v)+'</button>').join('')+'</div><div class="grid3 g6" style="margin-top:12px;pointer-events:none;opacity:.85">'+CARDS.slice(0,6).map(k=>'<div class="tile"><div class="pv cdp">'+CARDPV[k]+'</div><span>'+t('cs2_'+k)+'</span></div>').join('')+'</div><p class="hint">'+t('bqCardsHint')+'</p>');
  o+=sec(7,t('bqFx'),btog('fx.zoom',t('bqZoom'),'',BR.fx.zoom)+btog('fx.transitions',t('bqTrans'),'',BR.fx.transitions)+'<h4>'+t('bqSfx')+'</h4>'+chips('fx.sfx',B_OPTS.sfx,BR.fx.sfx)+btog('fx.bg',t('bqBg'),t('bqBgSub'),BR.fx.bg));
  const cards=BRD.cards||[]; o+=sec(8,t('bqCut'),(BRD.fillers?btog('cut.fillers',t('bqFillers',BRD.fillers),'',BR.cut.fillers):'')+((BRD.dupes||[]).length?btog('cut.dupes',t('bqDupes',BRD.dupes.length),'',BR.cut.dupes):'')+(cards.length?'<h4>'+t('bqDrop')+'</h4><div class="bcards">'+cards.map((c,i)=>'<label class="item"><input type="checkbox" data-bdrop="'+i+'"'+(BR.cut.drop.includes(i)?' checked':'')+'><span dir="rtl">'+esc(c)+'</span></label>').join('')+'</div>':'<p class="hint">'+t('bqNoText')+'</p>'));
  o+=sec(9,t('bqEnd'),btog('outro.use',t('bqOutro'),'',BR.outro.use)+(BR.outro.use?'<input type="text" dir="auto" data-bi="outro.text" placeholder="'+t('bqOutroPh')+'" value="'+esc(BR.outro.text)+'" style="margin-bottom:8px"><input type="text" dir="ltr" data-bi="outro.handle" placeholder="@handle" value="'+esc(BR.outro.handle)+'">':'')+((BRD.brands||[]).length?'<h4>'+t('brand')+'</h4><div class="chips"><button data-b="brand" data-v="" class="'+(!BR.brand?'on':'')+'">'+t('b_none')+'</button>'+BRD.brands.map(b=>'<button data-b="brand" data-v="'+esc(b)+'" data-raw="1" class="'+(BR.brand===b?'on':'')+'">'+esc(b)+'</button>').join('')+'</div>':''));
  if((A.extra||[]).length) o+=sec(10,t('bqExtra'),A.extra.map(q=>'<h4 dir="auto">'+esc(q.q)+'</h4>'+((q.options||[]).length?'<div class="chips">'+q.options.map(x=>'<button data-b="extra.'+esc(q.id)+'" data-v="'+esc(x)+'" data-raw="1" class="'+(BR.extra[q.id]===x?'on':'')+'">'+esc(x)+'</button>').join('')+'</div>':'<input type="text" dir="auto" data-bi="extra.'+esc(q.id)+'" value="'+esc(BR.extra[q.id]||'')+'">')).join(''));
  o+=sec((A.extra||[]).length?11:10,t('bqNotes'),'<textarea rows="3" dir="auto" data-bi="notes" placeholder="'+t('bqNotesPh')+'">'+esc(BR.notes)+'</textarea><input type="text" dir="ltr" data-bi="ref" placeholder="'+t('bqRefPh')+'" value="'+esc(BR.ref)+'" style="margin-top:8px">');
  o+='<div class="bsave"><button class="pri" id="bSave">'+t('bSave')+'</button><span class="hint">'+t('bSaveHint')+'</span></div></div>';
  const el=$('#brief'), y=el.scrollTop; el.dir=LANG==='ar'?'rtl':'ltr'; el.innerHTML=o; el.scrollTop=y; drawSprites(); }
$('#brief').addEventListener('click',async e=>{ const el=e.target.closest('[data-b],[data-bt],[data-cappre],[data-bchar],#bSave'); if(!el) return; const d=el.dataset;
  if(d.b){ const raw=d.raw; if(d.m){ const a=bget(d.b)||[]; bset(d.b,a.includes(d.v)?a.filter(x=>x!==d.v):[...a,d.v]); } else bset(d.b,d.v); renderBrief(); return; }
  if(d.bt){ bset(d.bt,!bget(d.bt)); renderBrief(); return; }
  if(d.cappre){ BR.look=d.cappre; renderBrief(); return; }
  if(d.bchar){ BR.char.use=d.bchar; renderBrief(); return; }
  if(el.id==='bSave'){ if(BR.goal==='other'&&!(BR.goalText||'').trim()){ toast(t('bqGoalNeed')); return; } if(!BR.platform.length){ toast(t('bqPlatNeed')); return; } const a=JSON.parse(JSON.stringify(BR)); a.cap={...capStyle(a.look),y:POSY[a.pos]||76,on:true}; if(a.media.topicsText!==undefined){ a.media.topics=a.media.topicsText.split(/[،,]/).map(x=>x.trim()).filter(Boolean); delete a.media.topicsText; }
    if(a.char.use!=='none'&&!a.char.color) a.char.color={robo:'#8F73F5',sprout:'#43B072',star:'#F2B33D',cube:'#4C8DFF'}[a.char.use];
    el.disabled=true; const r=await api('/hs/brief_save',{answers:a}); if(r.ok){ $('#brief').classList.remove('on'); toast(t('bSaved')); PULSE.brief='saved'; } else { el.disabled=false; toast(r.msg||t('failed')); } } });
$('#brief').addEventListener('input',e=>{ const d=e.target.dataset; if(d.bi) bset(d.bi,e.target.value); });
$('#brief').addEventListener('change',e=>{ if(e.target.type==='color') renderBrief(); });
$('#brief').addEventListener('change',e=>{ const d=e.target.dataset; if(d.bhk!==undefined){ BR.hook.text=BR.hook.variants[+d.bhk]; renderBrief(); } if(d.bdrop!==undefined){ const i=+d.bdrop; BR.cut.drop=e.target.checked?[...new Set([...BR.cut.drop,i])]:BR.cut.drop.filter(x=>x!==i); } });

/* ═══════════ v3: بحث الصور + التوليد ═══════════ */
let MEDIA={q:'',items:[],busy:false,fit:'card',msg:''};
function mediaHtml(){ let o='<div class="sec"><h4>'+t('binSearch')+'</h4><div class="row"><input type="search" id="mq" dir="auto" placeholder="'+t('searchPh')+'" value="'+esc(MEDIA.q)+'"><button class="sm" id="mGo">'+t('search')+'</button></div><div class="seg" style="margin-bottom:8px"><button data-mkind="image" class="'+(MEDIA.kind!=='video'?'on':'')+'">'+t('mkImage')+'</button><button data-mkind="video" class="'+(MEDIA.kind==='video'?'on':'')+'">'+t('mkVideo')+'</button></div><div class="seg" style="margin-bottom:8px;'+(MEDIA.kind==='video'?'display:none':'')+'"><button data-mfit="card" class="'+(MEDIA.fit==='card'?'on':'')+'">'+t('fitCard')+'</button><button data-mfit="cover" class="'+(MEDIA.fit==='cover'?'on':'')+'">'+t('fitCover')+'</button></div>';
  if(MEDIA.busy) o+='<p class="hint">'+t('searching')+'</p>'; else if(MEDIA.msg) o+='<p class="hint">'+esc(MEDIA.msg)+'</p>';
  o+='<div class="grid3">'+MEDIA.items.map((m,i)=>'<div class="tile" data-madd="'+i+'" title="'+esc(m.title+' · '+m.lic+' · '+m.author)+'"><div class="pv" style="background-image:url('+esc(m.thumb)+')"></div><span>'+(m.kind==='video'?esc(m.dur+'s · '):'')+esc(m.lic)+'</span></div>').join('')+'</div><p class="hint">'+t(MEDIA.kind==='video'?'searchHintV':'searchHint')+'</p></div>';
  o+='<div class="sec"><h4>'+t('binGen')+'</h4><textarea id="gTx" rows="2" dir="auto" placeholder="'+t('genPh')+'"></textarea><div class="row" style="margin-top:8px"><button class="sm" data-gen="image">'+t('genImage')+'</button><button class="sm" data-gen="video">'+t('genVideo')+'</button></div>'
    +(INFO.gen||[]).slice().reverse().map(r=>'<div class="greq'+(r.status==='done'?' done':'')+'"><div class="gp" dir="auto"><b>'+t(r.kind==='image'?'genKImg':'genKVid')+'</b> '+esc(r.prompt)+'</div>'+(r.status==='done'?'<small>'+t('genDone')+' · '+esc(r.file||'')+'</small>':'<div class="row" style="margin:6px 0 0;flex-wrap:wrap"><button class="sm" data-gopen="'+r.id+'">'+t(r.kind==='image'?'genOpenImg':'genOpenVid')+'</button><button class="sm" data-gup="'+r.id+'">'+t('genUpload')+'</button><button class="sm ghost" data-gcl="'+r.id+'">'+t('genViaClaude')+'</button><button class="sm ghost" data-grm="'+r.id+'">'+t('delete')+'</button></div>')+'</div>').join('')
    +'<p class="hint">'+t('genHint')+'</p></div>';
  return o; }
async function mediaSearch(){ const q=$('#mq').value.trim(); if(!q) return; MEDIA.q=q; MEDIA.busy=true; MEDIA.msg=''; renderLeft(); const r=await api('/hs/media_search?q='+encodeURIComponent(q)+(MEDIA.kind==='video'?'&kind=video':'')); MEDIA.busy=false; MEDIA.items=r.items||[]; MEDIA.msg=r.ok?(MEDIA.items.length?'':t('searchNone')):(r.msg||t('failed')); renderLeft(); }
async function genAsk(kind){ const p=$('#gTx').value.trim(); if(!p){ toast(t('genEmpty')); return; } const r=await api('/hs/gen',{kind,prompt:p,at:T,fit:MEDIA.fit});
  if(!r.ok){ toast(r.msg||t('failed')); return; } INFO.gen=r.gen; renderLeft(); toast(t('genSaved')); }
function genReq(id){ return (INFO.gen||[]).find(r=>String(r.id)===String(id)); }
async function genOpen(id){ const r=genReq(id); if(!r) return; try{ await navigator.clipboard.writeText(r.text); toast(t('genCopied')); }catch(e){ modal('<h3>'+t('genCopyTitle')+'</h3><div class="copy"><span dir="ltr" style="text-align:left;user-select:all">'+esc(r.text)+'</span></div><div class="row" style="margin:14px 0 0"><button id="qNo">'+t('close')+'</button></div>'); $('#qNo').onclick=closeModal; }
  window.open(r.kind==='image'?r.site+'?q='+encodeURIComponent(r.text):r.site,'_blank','noopener'); }
function genUpload(id){ const i=document.createElement('input'); i.type='file'; i.accept='image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm'; i.onchange=async()=>{ const f=i.files[0]; if(!f) return; toast(t('uploading')); await save();
    const res=await fetch('/hs/gen_import',{method:'POST',headers:{'X-Name':encodeURIComponent(f.name),'X-Id':String(id)},body:f}); const r=await res.json().catch(()=>({ok:false})); if(!r.ok){ toast(r.msg||t('failed')); return; } await load(true); toast(t('genAdded')); }; i.click(); }
async function genRm(id){ const r=await api('/hs/gen_rm',{id}); if(r.ok){ INFO.gen=r.gen; renderLeft(); } }
function genClaude(id){ const r=genReq(id); if(r) runAgent(t('reqGen',r.id,r.kind==='image'?'ChatGPT (chatgpt.com)':'Gemini (gemini.google.com)'),true); }
/* ═══════════ 3.4: واجهة الجوال (/m) ═══════════ */
const MOBILE=document.body.classList.contains('m');
const MVIEWS=[['notes','panel','notes'],['sel','panel','sel'],['text','bin','text'],['cap','panel','cap'],['tr','panel','tr'],['audio','panel','audio'],['files','bin','files'],['proj','panel','proj'],['check','panel','check'],['claude','panel','claude']];
function mSync(){ const sc=$('#mScrub'); if(!sc||!ST) return; $('#mNow').textContent=fmt(T).replace(/\.\d+$/,''); $('#mDur').textContent=fmt(dur()).replace(/\.\d+$/,''); $('#mPlay2').innerHTML=playing?'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>':'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>'; if(document.activeElement!==sc){ sc.max=dur()||1; sc.value=T; } $('#mTime').textContent=fmt(T)+' / '+fmt(dur()); $('#mPlay').textContent=t(playing?'pause':'play'); }
function mView(k){ const v=MVIEWS.find(x=>x[0]===k)||MVIEWS[0]; document.body.dataset.mv=v[1]; if(v[1]==='bin') LTAB=v[2]; else RTAB=v[2]; $$('#mnav button,#mtabs button').forEach(b=>b.classList.toggle('on',b.dataset.mv===k)); if(ST){ markTabs(); renderLeft(); renderRight(); } mSync(); const sc=$('#mid'); if(sc) sc.scrollTop=0; }
if(MOBILE){ $('#mnav').innerHTML=MVIEWS.map(v=>'<button data-mv="'+v[0]+'" data-t="mv_'+v[0]+'"></button>').join('');
  $('#mtabs').innerHTML=MVIEWS.map(v=>'<button data-mv="'+v[0]+'"></button>').join('');
  $('#mshBody').appendChild($('#bin')); $('#mshBody').appendChild($('#panel'));
  $('#mtabs').addEventListener('click',e=>{ const b=e.target.closest('[data-mv]'); if(b) mView(b.dataset.mv); });
  $('#mnav').addEventListener('click',e=>{ const b=e.target.closest('[data-mv]'); if(b) mView(b.dataset.mv); });
  $('#mPlay').onclick=()=>play(); $('#mScrub').addEventListener('input',e=>{ if(playing) stop(); seek(+e.target.value); });
  $('#mBack').onclick=()=>seek(Math.max(0,T-2)); $('#mFwd').onclick=()=>seek(Math.min(dur(),T+2));
  const close=()=>{ document.body.dataset.mv=''; };
  $('#mshClose').onclick=close; $('#msh').addEventListener('click',e=>{ if(e.target.id==='msh') close(); });
  $('#mList').onclick=()=>mView('notes'); $('#mKb').onclick=()=>openNote(); $('#mExport').onclick=()=>{ close(); $('#bExport').click(); };
  document.body.dataset.mv=''; setTimeout(()=>{ applyLang(); mTabs(); },0); }
function mTabs(){ if(!MOBILE) return; $$('#mtabs button').forEach(b=>{ const k=b.dataset.mv; b.textContent=k==='notes'?t('mv_notes'):k==='text'?t('tabText'):k==='files'?t('tabFiles'):t('tab_'+k); }); }
/* 4.3: أدوات الشريط (للجوال والكمبيوتر) */
if(!MOBILE){ const st=$('#stage'), mt=$('#mtools'); if(st&&mt) st.insertBefore(mt,$('#stageBtns')); }
$('#mPlay2').onclick=()=>play(); $('#mUndo').onclick=undo; $('#mRedo').onclick=redo;
$('#mMark').onclick=async()=>{ if(!ST) return; await save(); const r=await api('/hs/ver_save',{name:t('markName',fmt(T))}); if(r.ok){ INFO.versions=r.versions; toast(t('markSaved')); } };
$('#mCut').onclick=()=>{ buzz(10); splitAt(T); };
function splitAt(x){ if(!ST) return; let k=SEL;
  if(!k||!['layer','cap','broll'].includes(k.kind)){ const ci=cardAt(x); if(ci<0){ toast(t('cutNothing')); return; } k={kind:'cap',id:ci}; }
  const was=TOOL; blade({dataset:{kind:k.kind,id:String(k.id)}},x); TOOL=was; }
$('#bFull').onclick=()=>{ const w=$('#wrap'); try{ if(document.fullscreenElement) document.exitFullscreen(); else (w.requestFullscreen||w.webkitRequestFullscreen).call(w); }catch(e){} };
$('#bPen').onclick=()=>openNote();
function hubBack(){ const ck=document.cookie.includes('hs_hub=1'); const local=['127.0.0.1','localhost'].includes(location.hostname); const u=ck?'/library':(INFO&&INFO.hub&&local?INFO.hub:null); const b=$('#bBack'); b.hidden=!u; b.title=t('backLib'); b.dataset.l=t('back_lib'); if(u) b.onclick=async()=>{ b.disabled=true; await saveNow(); location.href=u; }; }
function pillSync(){ const el=$('#pill'); if(!el||!INFO) return; const p=PULSE||{}; let k='', s='';
  if(p.agent&&p.agent.running){ k='work'; s=t('pillClaude'); } else if(p.job&&p.job.running){ k='work'; s=t('pillExport'); }
  else if(!(INFO.exports||[]).length){ k='dirty'; s=t('pillNoExport'); } else if((LASTSAVE||0)/1000>(INFO.exportMt||0)+2||(INFO.studioMt||0)>(INFO.exportMt||0)+2){ k='dirty'; s=t('pillDirty'); } else { k='ready'; s=t('pillReady'); }
  el.className='pill '+k; el.querySelector('span').textContent=s; }
let LASTSAVE=0;
/* 4.3: ملاحظة بالصوت: اضغط مطوّل وتكلّم */
const REC={mr:null,chunks:[],t0:0,at:0,short:false,tm:null};
async function recStart(btn){ if(!ST||REC.mr&&REC.mr.state==='recording') return; if(!(window.isSecureContext&&navigator.mediaDevices&&window.MediaRecorder)){ toast(t('micNeedHttps')); openNote(); return; }
  let st; try{ st=await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e){ toast(t('micDenied')); return; }
  if(playing) stop(); REC.at=T; REC.chunks=[]; REC.short=false; const mr=new MediaRecorder(st); REC.mr=mr; REC.btn=btn;
  mr.ondataavailable=e=>{ if(e.data&&e.data.size) REC.chunks.push(e.data); }; mr.onstop=()=>{ st.getTracks().forEach(x=>x.stop()); recSend(); };
  mr.start(); buzz(20); REC.t0=Date.now(); btn.classList.add('rec'); $('#rec').classList.add('on'); const up=()=>{ $('#recTx').textContent=t('micRec',Math.round((Date.now()-REC.t0)/1000)); }; up(); REC.tm=setInterval(up,500);
  if(REC.pending){ REC.pending=false; recStop(); } }
function recStop(){ if(!REC.mr||REC.mr.state!=='recording'){ REC.pending=true; setTimeout(()=>REC.pending=false,1500); return; } REC.short=Date.now()-REC.t0<700; REC.mr.stop(); clearInterval(REC.tm); $('#rec').classList.remove('on'); if(REC.btn) REC.btn.classList.remove('rec'); }
async function recSend(){ if(REC.short||!REC.chunks.length){ toast(t('micHold')); return; } const b=new Blob(REC.chunks,{type:(REC.mr&&REC.mr.mimeType)||'audio/webm'}); const ci=cardAt(REC.at);
  let r; try{ r=await fetch('/hs/voice_note?t='+REC.at+'&card='+(ci>=0?ci:''),{method:'POST',headers:{'Content-Type':b.type},body:b}).then(x=>x.json()); }catch(e){ r={ok:false}; }
  if(r&&r.ok){ NOTES=r.notes; buildTL(); if(RTAB==='notes') renderRight(); toast(t('micSaved')); setTimeout(async()=>{ NOTES=await api('/hs/notes'); buildTL(); if(RTAB==='notes') renderRight(); },20000); } else toast((r&&r.msg)||t('failed')); }
for(const id of ['#bMic','#mMic']){ const b=$(id); if(!b) continue; b.addEventListener('pointerdown',e=>{ e.preventDefault(); recStart(b); }); ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>{ if(REC.mr&&REC.mr.state==='recording'||REC.btn===b) recStop(); })); b.addEventListener('contextmenu',e=>e.preventDefault()); }

/* ═══════════ 4.3: لمستنا ═══════════ */
const buzz=n=>{ try{ navigator.vibrate&&navigator.vibrate(n||12); }catch(e){} };
/* يكمل من وين وقفت */
let _posT=0; function posSave(){ if(!INFO||!ST) return; clearTimeout(_posT); _posT=setTimeout(()=>{ try{ localStorage.setItem('hsPos:'+INFO.work,String(r3(T))); }catch(e){} },400); }
let _posDone=false; function posRestore(){ if(_posDone||!INFO) return; _posDone=true; try{ const v=+localStorage.getItem('hsPos:'+INFO.work); if(v>0.5&&v<dur()-0.5){ seek(v); toast(t('resumed',fmt(v).replace(/\.\d+$/,''))); } }catch(e){} }
/* شريط Claude الحي فوق المعاينة */
function tickerSync(p){ const el=$('#ticker'); if(!el) return; const on=!!(p&&p.agent&&p.agent.running); el.classList.toggle('on',on);
  if(on){ const last=[...ACT].reverse().find(a=>a.kind==='claude'||a.kind==='tool'||a.kind==='ask'); $('#tickTx').textContent=t('tickWorking')+(last?' · '+String(last.text).replace(/\s+/g,' ').slice(0,90):''); } }
$('#ticker').onclick=()=>{ if(MOBILE) mView('claude'); else { RTAB='claude'; markTabs(); renderRight(); } };
/* طلبات بضغطة */
const QUICK=['qkFillers','qk30','qkCards','qkHook','qkCaps','qkEn'];
function quickHtml(){ return '<div class="sec"><h4>'+t('qkTitle')+'</h4><div class="quick">'+QUICK.map(k=>'<button class="sm" data-quick="'+k+'">'+t(k)+'</button>').join('')+'</div></div>'; }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-quick]'); if(!b) return; buzz(); runAgent(t(b.dataset.quick+'_task')); toast(t('qkSent')); });
/* إيماءات المعاينة: ضغطتين = تشغيل/إيقاف · سحب يمين/يسار = الجملة اللي قبل/بعد */
(function(){ const st=$('#stage'); let x0=0,y0=0,t0=0,lastTap=0;
  const GI={prev:'<svg width="44" height="44" viewBox="0 0 24 24" fill="#fff"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',next:'<svg width="44" height="44" viewBox="0 0 24 24" fill="#fff"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',play:'<svg width="44" height="44" viewBox="0 0 24 24" fill="#fff"><path d="M7 4l13 8-13 8z"/></svg>',pause:'<svg width="44" height="44" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'};
  const hint=s=>{ const h=$('#gestHint'); h.innerHTML=GI[s]||''; h.classList.add('on'); clearTimeout(hint._t); hint._t=setTimeout(()=>h.classList.remove('on'),500); };
  st.addEventListener('touchstart',e=>{ if(e.target.closest('button,#giz')||e.touches.length>1) return; x0=e.touches[0].clientX; y0=e.touches[0].clientY; t0=Date.now(); },{passive:true});
  st.addEventListener('touchend',e=>{ if(!ST||e.target.closest('button,#giz')||!t0) return; const dx=e.changedTouches[0].clientX-x0, dy=e.changedTouches[0].clientY-y0, dt=Date.now()-t0; t0=0;
    if(Math.abs(dx)>60&&Math.abs(dy)<50&&dt<600){ const cs=ST.caps.cards;
      const back=document.documentElement.dir==='rtl'?dx<0:dx>0; let tgt=null;
      if(!back){ const n=cs.find(c=>c.s>T+0.05); tgt=n?n.s:null; } else { const prev=[...cs].reverse().find(c=>c.s<T-0.3); tgt=prev?prev.s:0; }
      if(tgt!=null){ if(playing) stop(); seek(tgt); buzz(8); hint(back?'prev':'next'); } return; }
    if(Math.abs(dx)<10&&Math.abs(dy)<10&&dt<300){ const now=Date.now(); if(now-lastTap<320){ lastTap=0; play(); hint(playing?'play':'pause'); buzz(8); } else lastTap=now; } },{passive:true});
  st.addEventListener('dblclick',e=>{ if(!ST||e.target.closest('button')) return; play(); });
})();
/* قرصة على التايم لاين = زوم */
(function(){ const sc=$('#scroller'); let d0=0,p0=0;
  const dist=e=>Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  sc.addEventListener('touchstart',e=>{ if(e.touches.length===2){ d0=dist(e); p0=PX; } },{passive:true});
  sc.addEventListener('touchmove',e=>{ if(e.touches.length===2&&d0){ e.preventDefault(); setZoom(Math.round(p0*dist(e)/d0)); } },{passive:false});
  sc.addEventListener('touchend',()=>{ d0=0; },{passive:true});
  sc.addEventListener('wheel',e=>{ if(e.ctrlKey){ e.preventDefault(); setZoom(Math.round(PX*(e.deltaY<0?1.12:0.89))); } },{passive:false});
})();
/* ═══════════ 3.3: أمثلة المؤثرات + انتقال عند القص ═══════════ */
const TRANS=['curve','push','pull','rack','whip','spin','iris','flash','zoom','glitch'];
function thumbAt(x){ return '/hs/th/'+(Math.max(0,Math.floor(x))+1)+'.jpg'; }
function fxTile(f,attr,on,x){ return '<div class="tile fxt'+(on?' sel':'')+'" '+attr+' title="'+esc(t('fx_'+f))+'"><div class="pv"><i class="fxp fxp-'+f+'" style="background-image:url('+thumbAt(x==null?T:x)+')"></i></div><span>'+t('fx_'+f)+'</span></div>'; }
function seamFx(sm){ return hs().layers.find(l=>l.type==='fx'&&(l.auto==='transitions'||l.auto==='trans')&&(l.seam!=null?Math.abs(l.seam-sm)<0.02:Math.abs(l.s+0.02-sm)<0.12)); }
function seamPick(sm){ seek(Math.max(0,sm-0.4)); const cur=seamFx(sm);
  modal('<h3>'+t('cutTitle')+'</h3><p class="hint" style="margin-top:0">'+t('cutHint',fmt(sm))+'</p><div class="grid3 g6">'+'<div class="tile fxt'+(!cur?' sel':'')+'" data-tr=""><div class="pv"><i class="fxp" style="background-image:url('+thumbAt(sm)+')"></i></div><span>'+t('cutNone')+'</span></div>'+TRANS.map(f=>fxTile(f,'data-tr="'+f+'"',cur&&cur.fx===f,sm)).join('')+'</div><div class="row" style="margin:14px 0 0"><button id="trAll">'+t('cutAll')+'</button><button id="qNo">'+t('close')+'</button></div>',true);
  $('#qNo').onclick=closeModal; let pick=cur?cur.fx:'';
  $('#mbox').querySelectorAll('[data-tr]').forEach(el=>el.onclick=()=>{ pick=el.dataset.tr; seamSet(sm,pick); closeModal(); seek(Math.max(0,sm-0.5)); });
  $('#trAll').onclick=()=>{ const f=pick||'flash'; snap(); (INFO.seams||[]).forEach(q=>seamSet(q,f,true)); buildTL(); live(); closeModal(); toast(t('cutAllDone',(INFO.seams||[]).length)); }; }
function seamSet(sm,f,quiet){ if(!quiet) snap(); const h=hs(), old=seamFx(sm); if(old) h.layers=h.layers.filter(l=>l!==old);
  if(f&&sm>0.2&&sm<total()-0.2){ const id='L'+(Math.max(0,...h.layers.map(l=>parseInt(String(l.id).replace(/\D/g,''))||0))+1), long=f==='zoom'||f==='blur';
    if(TRS.includes(f)) h.layers.push({id,...trAdd(f,sm),s:r3(sm-0.3),e:r3(sm+0.35)}); else h.layers.push({id,type:'fx',fx:f,auto:'trans',seam:r3(sm),s:r3(sm-(long?0.12:0.02)),e:r3(sm+(long?0.38:0.3)),amount:f==='flash'?0.35:0.55,track:2}); }
  if(!quiet){ buildTL(); live(); } }
/* ═══════════ 3.1: المقاس ومناطق الأمان ═══════════ */
async function frameSync(){ const h=hs(), f=h.frame||{}; const r=await api('/hs/frame',{ar:f.ar||'9:16',cy:f.cy,platforms:h.platforms||[]}); if(r.ok) INFO.safe=r.safe; dirty(); drawSafe(); $('#safe').classList.add('on'); if(RTAB==='proj'||RTAB==='cap') renderRight(); }
function drawSafe(){ const el=$('#safe'), z=INFO&&INFO.safe; if(!el||!z) return; const c=z.crop||[0,100], hh=c[1]-c[0], Z=z.zone; let o='';
  if(z.crop) o+='<div class="mask" style="top:0;left:0;right:0;height:'+c[0]+'%"></div><div class="mask" style="bottom:0;left:0;right:0;height:'+(100-c[1])+'%"></div>';
  o+='<div style="top:'+c[0]+'%;left:0;right:0;height:'+(Z[0]*hh/100)+'%"></div><div style="top:'+(c[1]-Z[1]*hh/100)+'%;left:0;right:0;height:'+(Z[1]*hh/100)+'%"></div>';
  o+='<div style="left:0;top:'+(c[0]+Z[0]*hh/100)+'%;height:'+(hh*(100-Z[0]-Z[1])/100)+'%;width:'+Z[2]+'%"></div><div style="right:0;top:'+(c[0]+hh*0.45)+'%;height:'+(hh*(55-Z[1])/100)+'%;width:'+Z[3]+'%"></div>';
  if(z.ar==='16:9') o+='<span class="tag">'+t('fh_16x9')+'</span>'; el.innerHTML=o; }
let SFXLIB=[], _sfxNow=null, MYDIR='';
function sfxSet(items){ SFXLIB=items||[]; SFXLIB.forEach(x=>{ I18N['sfx_'+x.id]=[x.ar,x.en]; }); }
async function sfxLibLoad(){ try{ const r=await api('/hs/sfxlib'); MYDIR=r.myDir||''; sfxSet(r.items); }catch(e){} }
function sfxLibHtml(){ const mine=SFXLIB.filter(x=>x.mine), lib=SFXLIB.filter(x=>!x.mine), miss=lib.filter(x=>!x.have).length;
  let o='<h4 style="margin-top:14px">'+t('mySounds')+'<span><button class="sm" data-up="sound">'+t('upload')+'</button>'+(INFO&&INFO.local?' <button class="sm ghost" id="myOpen">'+t('myOpen')+'</button>':'')+'</span></h4>';
  o+=mine.length?'<div class="sfxlist">'+mine.map(x=>'<div class="sfxrow"><button class="sm ghost" data-sfxplay="'+x.id+'" title="'+esc(t('listen'))+'">▶</button><span dir="auto" data-myedit="'+x.id+'" title="'+esc(x.note||t('myEdit'))+'" style="cursor:pointer">'+esc(x.ar)+(x.long?' <small>'+t('myLong')+'</small>':'')+'</span><small>'+esc(x.dur)+'</small><button class="sm" data-sfxlib="'+x.id+'">'+t('add')+'</button></div>').join('')+'</div>':'';
  o+='<p class="hint">'+t(mine.length?'myHint':'myEmpty')+'</p>';
  if(lib.length) o+='<h4 style="margin-top:14px">'+t('sfxLib')+(miss?'<button class="sm" id="sfxAll">'+t('sfxAll',miss)+'</button>':'')+'</h4><div class="sfxlist">'+lib.map(x=>'<div class="sfxrow"><button class="sm ghost" data-sfxplay="'+x.id+'" title="'+esc(t('listen'))+'">▶</button><span dir="auto">'+esc(LANG==='ar'?x.ar:x.en)+'</span><small>'+esc(x.dur)+'</small><button class="sm" data-sfxlib="'+x.id+'">'+t('add')+'</button></div>').join('')+'</div><p class="hint">'+t('sfxLibHint')+'</p>';
  return o; }
function myEdit(id){ const it=SFXLIB.find(x=>x.id===id); if(!it) return; modal('<h3>'+t('myEdit')+'</h3><input type="text" id="myN" dir="auto" value="'+esc(it.ar)+'" placeholder="'+esc(t('myNamePh'))+'" style="margin-bottom:8px"><input type="text" id="myT" dir="auto" value="'+esc(it.note||'')+'" placeholder="'+esc(t('myNotePh'))+'"><p class="hint">'+t('myNoteHint')+'</p><div class="row" style="margin:12px 0 0"><button class="pri" id="myOk">'+t('save')+'</button><button class="ghost" id="myDel">'+t('delete')+'</button><button class="ghost" id="qNo">'+t('cancel')+'</button></div>');
  $('#qNo').onclick=closeModal; $('#myOk').onclick=async()=>{ const r=await api('/hs/mysfx_edit',{id,name:$('#myN').value,note:$('#myT').value}); sfxSet(r.items); closeModal(); renderLeft(); buildTL(); };
  $('#myDel').onclick=async()=>{ const r=await api('/hs/mysfx_edit',{id,delete:true}); sfxSet(r.items); if(ST.studio.sfx&&ST.studio.sfx[id]){ snap(); delete ST.studio.sfx[id]; dirty(); } closeModal(); renderLeft(); buildTL(); }; }
function sfxPlay(id){ const it=SFXLIB.find(x=>x.id===id); if(!it) return; if(_sfxNow){ _sfxNow.pause(); const same=_sfxNow._id===id; _sfxNow=null; if(same) return; } const au=new Audio(it.have?'/sfx_prev/'+id+'.wav':it.prev); au._id=id; _sfxNow=au; au.play().catch(()=>toast(t('sfxNoNet'))); au.onended=()=>{ if(_sfxNow===au) _sfxNow=null; }; }
function sfxAdd(k){ snap(); ST.studio.sfx=ST.studio.sfx||{}; const it=SFXLIB.find(x=>x.id===k), long=it&&it.mine&&it.long; (ST.studio.sfx[k]=ST.studio.sfx[k]||[]).push(long?[r3(T),0.6,r3(Math.min(parseFloat(it.dur)||10,total()-T))]:r3(T)); ST.studio.sfx[k].sort((a,b)=>(Array.isArray(a)?a[0]:a)-(Array.isArray(b)?b[0]:b)); buildTL(); dirty(); try{ new Audio('/sfx_prev/'+k+'.wav').play().catch(()=>{}); }catch(e){} }
async function autoFx(kind,on){ await save(); const r=await api('/hs/auto',{kind,on}); await load(true); toast(on?t('autoAdded',r.n):t('autoCleared')); }
function coverShot(){ try{ const w=F.contentWindow, a=document.createElement('a'); a.href=w.document.getElementById('cv').toDataURL('image/png'); a.download=(INFO.name||'cover')+'-'+T.toFixed(2)+'.png'; a.click(); }catch(e){ toast(t('failed')); } }
function phoneFile(f){ let svg=''; const u=INFO.lan.replace('/?k=','/'+f+'?k='); try{ const q=qrcode(0,'M'); q.addData(u); q.make(); svg=q.createSvgTag({cellSize:6,margin:3,scalable:true}); }catch(e){}
  modal('<h3>'+t('phoneFileTitle')+'</h3><div style="display:flex;gap:18px;flex-wrap:wrap;align-items:center"><div style="width:230px;background:#fff;border-radius:10px;padding:6px;line-height:0">'+svg+'</div><div style="flex:1;min-width:220px"><p style="line-height:1.9;margin-top:0">'+t('phoneFileHint')+'</p><div class="copy"><span style="direction:ltr;text-align:left">'+esc(u)+'</span></div></div></div><div class="row" style="margin:14px 0 0"><button id="qNo">'+t('close')+'</button></div>'); $('#qNo').onclick=closeModal; }

/* ───── النبض: بث حي + إعادة تحميل لما Claude يعدّل ───── */
async function pulse(){ let p; try{ p=await api('/hs/pulse?since='+lastAct); }catch(e){ return; } if(!p||!p.sig) return; PULSE=p;
  if(p.act&&p.act.length){ ACT.push(...p.act); if(ACT.length>300) ACT=ACT.slice(-300); lastAct=ACT[ACT.length-1].id; if(RTAB==='claude'&&ST) renderFeed(); }
  else if(RTAB==='claude'&&ST){ const st=$('#pStages'); if(st) st.innerHTML=stagesHtml(); }
  const busy=p.agent.running?t('claudeWorking',p.agent.elapsed):p.job.running?t('jobWorking'):(p.vis&&p.vis.busy)?t(p.vis.what==='face'?'visFace':'visMask'):''; $('#busy').classList.toggle('on',!!busy); $('#busyTx').textContent=busy;
  if(RTAB==='claude'&&ST){ const g=$('#agGo'); if(g) g.disabled=p.agent.running; if(!!$('#agStop')!==p.agent.running&&document.activeElement!==$('#agTx')) renderRight(); }
  if(p.brief==='pending'){ if(!$('#brief').classList.contains('on')&&!BR_OPENING){ BR_OPENING=true; openBrief().finally(()=>BR_OPENING=false); } } else $('#brief').classList.remove('on');
  if(p.vis&&p.vis.busy&&!VISB) toast(t(p.vis.what==='face'?'visFace':'visMask')); VISB=!!(p.vis&&p.vis.busy);
  if(p.aux!==undefined&&p.aux!==AUXS){ const first=AUXS===null; AUXS=p.aux; const w=F.contentWindow; if(!first&&READY&&w&&w.hsAux){ w.hsAux().then(()=>{ lastFrame=-1; drawT(T); if(RTAB==='sel') renderRight(); }).catch(()=>{}); } }
  pillSync(); tickerSync(p);
  document.body.classList.toggle('nr',!p.ready);
  if(!p.ready){ READY=false; $('#live').classList.add('on'); renderLive(); SIG=p.sig; return; }
  if(!READY){ READY=true; $('#live').classList.remove('on'); SIG=p.sig; await load(false); return; }
  if(SIG===null||adoptSig){ SIG=p.sig; adoptSig=false; return; }
  if(p.sig!==SIG&&!dragging&&!p.job.running&&!$('#modal').classList.contains('on')&&!_saveT_pending()){ SIG=p.sig; await load(true); toast(t('externalChange')); } }
let BR_OPENING=false, VISB=false, AUXS=null;
function _saveT_pending(){ return $('#saved').textContent===t('saving'); }
applyLang(); pulse(); setInterval(pulse,1500);
(function(){ const d=document.createElement('datalist'); d.id='hsCities'; d.innerHTML=Object.keys(CITIES).map(c=>'<option value="'+c+'">').join(''); document.body.appendChild(d); })();

/* ───── 4.4: رسم حر على الفيديو (بيدك، بالماوس أو بإصبعك) ───── */
let DRW=null; const DRC=['#FFFFFF','#FFD21F','#FF4D6D','#4C8DFF','#2FBF9B','#15151C'], DRW_W=[6,12,22];
function drawStart(edit){ if(!ST||DRW) return; if(playing) stop(); const w=$('#wrap'); let c0='#FFD21F', w0=12; try{ c0=localStorage.getItem('hsDrawC')||c0; w0=+localStorage.getItem('hsDrawW')||w0; }catch(e){}
  DRW={pts:edit?(edit.pts||[]).slice():[],color:edit?(edit.color||c0):c0,lw:edit?(edit.lw||w0):w0,edit:edit?edit.id:null,hist:[],down:false};
  const cv=document.createElement('canvas'); cv.id='drawCv'; w.appendChild(cv); const bar=document.createElement('div'); bar.id='drawBar'; $('#stage').appendChild(bar); document.body.classList.add('drawing');
  const fit=()=>{ const R=w.getBoundingClientRect(), d=devicePixelRatio||1; cv.width=Math.round(R.width*d); cv.height=Math.round(R.height*d); drawPaint(); }; fit(); DRW.fit=fit; addEventListener('resize',fit);
  const at=e=>{ const R=cv.getBoundingClientRect(); return [+clamp((e.clientX-R.left)/R.width,0,1).toFixed(4),+clamp((e.clientY-R.top)/R.height,0,1).toFixed(4)]; };
  cv.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); cv.setPointerCapture(e.pointerId); DRW.hist.push(DRW.pts.length); if(DRW.pts.length) DRW.pts.push(null); DRW.pts.push(at(e)); DRW.down=true; drawPaint(); });
  cv.addEventListener('pointermove',e=>{ if(!DRW||!DRW.down) return; e.preventDefault(); const p=at(e), q=DRW.pts[DRW.pts.length-1]; if(q&&Math.hypot((p[0]-q[0])*1080,(p[1]-q[1])*1920)<4) return; DRW.pts.push(p); drawPaint(); });
  const up=e=>{ if(DRW) DRW.down=false; }; cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  ['touchstart','touchmove','touchend','click','dblclick'].forEach(k=>cv.addEventListener(k,e=>e.stopPropagation()));
  drawBar(); }
function drawBar(){ const b=$('#drawBar'); if(!b||!DRW) return;
  b.innerHTML='<div class="dsw">'+DRC.map(c=>'<i data-dc="'+c+'" class="'+(DRW.color===c?'on':'')+'" style="background:'+c+'"></i>').join('')+'<input type="color" id="dcI" value="'+esc(DRW.color)+'"></div>'
   +'<div class="dw">'+DRW_W.map(v=>'<button data-dw="'+v+'" class="'+(DRW.lw===v?'on':'')+'"><i style="width:'+(v/2+3)+'px;height:'+(v/2+3)+'px"></i></button>').join('')+'</div>'
   +'<span class="sp"></span><button class="ic" id="dUndo" title="'+esc(t('undo'))+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg></button><button class="sm ghost" id="dClear">'+t('drawClear')+'</button><button class="sm" id="dNo">'+t('cancel')+'</button><button class="sm pri" id="dOk">'+t('done')+'</button>';
  b.querySelectorAll('[data-dc]').forEach(x=>x.onclick=()=>{ DRW.color=x.dataset.dc; try{ localStorage.setItem('hsDrawC',DRW.color); }catch(e){} drawBar(); drawPaint(); });
  $('#dcI').oninput=e=>{ DRW.color=e.target.value; drawPaint(); }; $('#dcI').onchange=()=>drawBar();
  b.querySelectorAll('[data-dw]').forEach(x=>x.onclick=()=>{ DRW.lw=+x.dataset.dw; try{ localStorage.setItem('hsDrawW',DRW.lw); }catch(e){} drawBar(); drawPaint(); });
  $('#dUndo').onclick=()=>{ if(!DRW.hist.length) return; DRW.pts.length=DRW.hist.pop(); while(DRW.pts.length&&DRW.pts[DRW.pts.length-1]===null) DRW.pts.pop(); drawPaint(); };
  $('#dClear').onclick=()=>{ DRW.hist.push(DRW.pts.length); DRW.pts=[]; DRW.hist=[]; drawPaint(); };
  $('#dNo').onclick=()=>drawEnd(false); $('#dOk').onclick=()=>drawEnd(true); }
function drawPaint(){ const cv=$('#drawCv'); if(!cv||!DRW) return; const x=cv.getContext('2d'), W=cv.width, H=cv.height; x.clearRect(0,0,W,H); x.lineCap='round'; x.lineJoin='round'; x.strokeStyle=DRW.color; x.lineWidth=DRW.lw*W/1080; x.shadowColor='rgba(0,0,0,.35)'; x.shadowBlur=8*W/1080;
  x.beginPath(); let pen=false; for(const p of DRW.pts){ if(!p){ pen=false; continue; } if(!pen){ x.moveTo(p[0]*W,p[1]*H); x.lineTo(p[0]*W+0.01,p[1]*H); pen=true; } else x.lineTo(p[0]*W,p[1]*H); } x.stroke(); }
function drawEnd(ok){ const d=DRW; if(!d) return; DRW=null; removeEventListener('resize',d.fit); ['#drawCv','#drawBar'].forEach(s=>{ const e=$(s); if(e) e.remove(); }); document.body.classList.remove('drawing');
  while(d.pts.length&&d.pts[d.pts.length-1]===null) d.pts.pop(); if(!ok) return; if(d.pts.filter(Boolean).length<2){ toast(t('drawEmpty')); return; }
  if(d.edit){ const L=hs().layers.find(l=>l.id===d.edit); if(L){ snap(); L.pts=d.pts; L.color=d.color; L.lw=d.lw; live(); renderAll(); return; } }
  addLayer({type:'draw',pts:d.pts,color:d.color,lw:d.lw,reveal:0.9,glow:'shadow',anim:'fade',x:0.5,y:0.5,track:1}); renderAll(); toast(t('drawAdded')); }
document.addEventListener('keydown',e=>{ if(!DRW) return; e.stopImmediatePropagation(); if(e.key==='Escape') drawEnd(false); else if(e.key==='Enter') drawEnd(true); else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); $('#dUndo')&&$('#dUndo').click(); } },true);
(function(){ const b=$('#bDraw'); if(b){ b.title=t('drawTool'); b.onclick=()=>DRW?drawEnd(true):drawStart(); } })();

/* ───── 4.4: احفظ قبل ما تطلع (زر المكتبة، إغلاق الصفحة) ───── */
async function saveNow(){ if(!ST) return; if(_saveT||_saveT_pending()){ clearTimeout(_saveT); _saveT=null; try{ await save(); }catch(e){} } }
addEventListener('pagehide',()=>{ if(!ST||!_saveT_pending()) return; try{ navigator.sendBeacon('/api/save',new Blob([JSON.stringify({caps:ST.caps,theme:ST.theme,studio:ST.studio,outro:ST.outro||0})],{type:'application/json'})); }catch(e){} });
document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveNow(); });
document.addEventListener('click',e=>{ const b=e.target.closest('#drawAgain,[data-drawbin]'); if(!b) return; if(b.id==='drawAgain'){ const L=selLayer(); if(L&&L.type==='draw') drawStart(L); } else { if(document.body.classList.contains('m')) document.body.dataset.mv=''; drawStart(); } });
/* ───── 4.4: اسم المشروع ينعدّل من فوق ───── */
$('#proj').addEventListener('click',()=>{ if(!ST||document.body.classList.contains('m')) return; const el=$('#proj'); if(el.isContentEditable) return; el.contentEditable='true'; el.focus(); try{ const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }catch(e){}
  const fin=ok=>{ el.contentEditable='false'; const v=el.textContent.trim().slice(0,80); if(ok&&v&&v!==(INFO.title||INFO.name)){ hs().title=v; INFO.title=v; dirty(); } el.textContent=INFO.title||INFO.name; };
  el.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } else if(e.key==='Escape'){ el.onblur=null; fin(false); } e.stopPropagation(); }; el.onblur=()=>fin(true); });
$('#proj').title=t('renameP');
