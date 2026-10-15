/* Hojas Studio — إضافة الكابشن والطبقات فوق compose.html.
   تنحقن بسطر واحد آخر compose.html:  <script src="hs-ext.js"></script>
   تقرأ studio.json ← hs  وتتحكم بالكابشن كامل (خط · وزن · حجم · ألوان · مكان · عرض السطر) + سطر الترجمة.
   لو hs.cap.on مو true  ← المحرّك الأصلي يرسم كابشنه كما هو (صفر أثر). */
(function(){
  if(window.__hsExt) return; window.__hsExt='4.2';
  const GF={ /* خطوط قوقل والأوزان المتوفرة فعلاً لكل خط */
    'Cairo':[400,500,600,700,800,900],'Tajawal':[400,500,700,800,900],'IBM Plex Sans Arabic':[400,500,600,700],
    'Alexandria':[400,500,600,700,800,900],'El Messiri':[400,500,600,700],'Noto Sans Arabic':[400,500,600,700,800,900],
    'Noto Kufi Arabic':[400,500,600,700,800,900],'Readex Pro':[400,500,600,700],'Almarai':[400,700,800],
    'Changa':[400,500,600,700,800],'Rubik':[400,500,600,700,800,900],'Aref Ruqaa':[400,700],'Lalezar':[400],
    'Reem Kufi':[400,500,600,700],'Amiri':[400,700],'Marhey':[400,500,600,700],'Baloo Bhaijaan 2':[400,500,600,700,800],
    'Lemonada':[400,500,600,700],'Noto Naskh Arabic':[400,500,600,700],'Markazi Text':[400,500,600,700],
    'Inter':[400,500,600,700,800,900],'Poppins':[400,500,600,700,800,900],'Montserrat':[400,500,600,700,800,900],
    'Bebas Neue':[400],'Oswald':[400,500,600,700],'Space Grotesk':[400,500,600,700],
    'IBM Plex Mono':[400,500,600,700],'Playfair Display':[400,700,900] };
  window.__hsFonts=GF;
  const DEF={ on:false, font:'Cairo', weight:800, size:64, color:'#FFFFFF', active:'#F2B33D', bg:'none',
              stroke:0, strokeColor:'#000000', shadow:true, y:76, width:760, lines:2, gap:16, mode:'line',
              enter:'rise', bgColor:'#000000', bgOpacity:0.62,
              hl:'color', chunk:0, actScale:1, fill:'solid', shadowColor:'#000000' };
  /* 3.1: bg bar|lines · hl color|under|dim · chunk (كم كلمة تظهر مع بعض) · actScale (تكبير الكلمة المنطوقة) · fill outline · shadow 'hard' */
  const DEFEN={ on:false, font:'Inter', weight:700, size:40, color:'#FFFFFF', pos:'below', gap:18, map:{} };
  let CAP={...DEF}, EN={...DEFEN}, LOCAL=[], HSX={};
  const nearest=(fam,w)=>{ const a=GF[fam]; if(!a) return w; return a.reduce((b,x)=>Math.abs(x-w)<Math.abs(b-w)?x:b,a[0]); };
  const fstr=(o,size)=>nearest(o.font,o.weight)+' '+size+'px "'+o.font+'"';
  function loadFont(fam){
    if(!fam) return Promise.resolve();
    const loc=LOCAL.find(f=>f.name===fam);
    if(loc){ if(!document.getElementById('hsf-'+loc.file)){ const st=document.createElement('style'); st.id='hsf-'+loc.file;
        st.textContent='@font-face{font-family:"'+fam+'";src:url("fonts/'+encodeURIComponent(loc.file)+'");font-weight:100 900;font-display:block}';
        document.head.appendChild(st); }
      return document.fonts.load('700 60px "'+fam+'"').catch(()=>{}); }
    const ws=GF[fam]; if(!ws) return document.fonts.load('700 60px "'+fam+'"').catch(()=>{});
    const id='hsg-'+fam.replace(/\s+/g,'-');
    const wait=()=>Promise.all(ws.map(w=>document.fonts.load(w+' 60px "'+fam+'"','اب Ab'))).catch(()=>{});
    if(document.getElementById(id)) return wait();
    return new Promise(res=>{ const l=document.createElement('link'); l.id=id; l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(fam).replace(/%20/g,'+')+':wght@'+ws.join(';')+'&display=block';
      l.onload=()=>wait().then(res); l.onerror=()=>res(); document.head.appendChild(l); setTimeout(res,8000); });
  }
  function apply(hs){ hs=hs||{}; HSX=hs; CAP={...DEF,...(hs.cap||{})}; EN={...DEFEN,...(hs.en||{})}; if(!EN.map) EN.map={};
    LOCAL=Array.isArray(hs.fonts)?hs.fonts:LOCAL;
    const jobs=[]; if(CAP.on) jobs.push(loadFont(CAP.font)); if(EN.on) jobs.push(loadFont(EN.font));
    for(const L of (hs.layers||[])){ if(L.font) jobs.push(loadFont(L.font)); if(L.src&&L.src!=='clock'&&L.src!=='video') jobs.push(loadImg(L.src)); if(Array.isArray(L.draw)) for(const e of L.draw){ if(e&&e.src) jobs.push(loadImg(e.src)); } if(Array.isArray(L.items)) for(const e of L.items){ if(e&&e.src) jobs.push(loadImg(e.src)); } if(L.kind==='news') jobs.push(loadFont('Noto Naskh Arabic')); }
    const hk=hs.hooks; if(hk&&hk.on&&hk.font) jobs.push(loadFont(hk.font));
    /* 4.2: خطوط وصور أسلوب الدحيح والورق المتحرك */
    const Ls42=hs.layers||[], dk=hs.dahih&&hs.dahih.on, desk=dk||Ls42.some(L=>L.type==='desk'), kin=Ls42.some(L=>L.type==='kinetic');
    if(desk) ['IBM Plex Mono',(hs.dahih&&hs.dahih.font)||'Cairo',(hs.dahih&&hs.dahih.numFont)||'Cairo'].forEach(f=>jobs.push(loadFont(f)));
    if(kin){ jobs.push(loadFont((hs.kin&&hs.kin.font)||'Cairo')); jobs.push(loadFont('IBM Plex Mono')); Ls42.forEach(L=>{ if(L.type==='kinetic'&&L.font) jobs.push(loadFont(L.font)); }); }
    [hs.dahih&&hs.dahih.avatar,hs.dahih&&hs.dahih.logo,hs.kin&&hs.kin.avatar].forEach(s=>{ if(s&&s!=='claude'&&s!=='none') jobs.push(loadImg(s)); });
    return Promise.all(jobs); }
  const IMG={};
  function loadImg(src){ if(IMG[src]&&IMG[src].ok) return Promise.resolve();
    return new Promise(res=>{ const im=new Image(); IMG[src]=im; im.onload=()=>{im.ok=true; (im.decode?im.decode():Promise.resolve()).then(res,res);}; im.onerror=()=>res(); im.src=src; setTimeout(res,6000); }); }
  /* ═══ 3.5: فريم الفيديو ما يختفي أبداً ═══
     قبل: كل فريم جديد يبدّل مصدر الصورة نفسها، فلو انرسمت الشاشة والصورة لسه تتحمّل يطلع الفيديو فاضي (شاشة سوداء تومض).
     الحين: الفريم يتحمّل بصورة جانبية، وما يصير هو المعروض إلا بعد ما يجهز كامل. والمعروض يبقى لين يجي اللي بعده.
     ═══ 3.8: الوجه بمكانه + قناع الشخص ═══
     hs-face.js (مكان الوجه) و hs-mask.js + mk/NNNNN.png (قناع الشخص) يبنيها engine/scripts/21_vision.js.
     الوجه: أي كرت يقص الفيديو (شاشة مقسومة، كرت صغير) يتحرك قصّه عشان الوجه يبقى كامل وبمكان مريح.
     القناع: يخلّي الشخص ينرسم فوق خلفية جديدة أو فوق نص (النص يمر وراه). */
  const FR={cur:null,mask:null,n:0,seq:0,shown:0,cache:new Map(),mk:new Map()};
  let TNOW=0, FACE=null, MASK=null, _inP=false;
  const _di=CanvasRenderingContext2D.prototype.drawImage;
  const _PC=document.createElement('canvas'); _PC.width=1080; _PC.height=1920; const _PX=_PC.getContext('2d');
  function faceAt(t){ if(!FACE||!FACE.pts||!FACE.pts.length) return null; const p=FACE.pts; if(p.length<2||t<=p[0][0]) return p[0]; const last=p[p.length-1]; if(t>=last[0]) return last;
    let i=Math.min(p.length-2,Math.max(0,Math.floor((t-p[0][0])/Math.max(0.05,p[1][0]-p[0][0])))); while(i>0&&p[i][0]>t) i--; while(i<p.length-2&&p[i+1][0]<t) i++;
    const a=p[i], b=p[i+1], k=Math.max(0,Math.min(1,(t-a[0])/Math.max(0.001,b[0]-a[0]))); return [t,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k,a[3]+(b[3]-a[3])*k,a[4]+(b[4]-a[4])*k]; }
  window.__hsFaceAt=faceAt;
  CanvasRenderingContext2D.prototype.drawImage=function(im){
    if(im!==VF||!FR.cur) return _di.apply(this,arguments);
    const a=Array.prototype.slice.call(arguments); a[0]=FR.cur; const main=a.length===9&&this===X&&!_inP, sw=VF.naturalWidth||1080, shh=VF.naturalHeight||1920;
    if(main&&HSX.faceCrop!==false){ const f=faceAt(TNOW); if(f){ const cw=a[3], ch=a[4];
        if(ch<shh-2){ const k=f[4]*shh>ch*0.72?0.5:0.42; a[2]=Math.max(0,Math.min(shh-ch,f[2]*shh-ch*k)); }
        if(cw<sw-2) a[1]=Math.max(0,Math.min(sw-cw,f[1]*sw-cw/2)); } }
    const u=main?a.slice():null;
    if(a.length===9&&VF.naturalWidth&&FR.cur.naturalWidth!==VF.naturalWidth){ const kx=FR.cur.naturalWidth/VF.naturalWidth, ky=FR.cur.naturalHeight/VF.naturalHeight; a[1]*=kx; a[2]*=ky; a[3]*=kx; a[4]*=ky; }
    const G=main?gradeOf():null; if(G){ this.save(); this.filter=G.f; }
    const r=_di.apply(this,a);
    if(G){ this.restore(); if(G.tint){ this.save(); this.globalCompositeOperation='soft-light'; this.globalAlpha=Math.min(1,G.tint[1]*3); this.fillStyle=G.tint[0]; this.fillRect(a[5],a[6],a[7],a[8]); this.restore(); } }
    if(main){ try{ personPass(u,sw,shh); }catch(e){ if(!window.__hsPE){ window.__hsPE=1; console.error('hs person: '+e.message); } } }
    return r; };
  /* الشخص فوق خلفية جديدة (type=bg) أو فوق نص يمر وراه (type=behind). ينرسم داخل قص كرت الفيديو نفسه فيتحرك معه */
  function personPass(u,sw,shh){ const t=TNOW, Ls=(HSX.layers||[]).filter(L=>!L.off&&(L.type==='bg'||L.type==='behind')&&t>=L.s&&t<L.e); if(!Ls.length) return; const mk=FR.mask, fr=FR.cur; if(!mk||!fr) return;
    const sx=u[1], sy=u[2], cw=u[3], ch=u[4], dx=u[5], dy=u[6], dw=u[7], dh=u[8], kx=fr.naturalWidth/sw, ky=fr.naturalHeight/shh, mx=mk.naturalWidth/sw, my=mk.naturalHeight/shh;
    _inP=true; X.save();
    try{
      for(const L of Ls){ if(L.type!=='bg') continue; const k=cl((t-L.s)/0.3,0,1)*cl((L.e-t)/0.3,0,1)*(L.opacity==null?1:L.opacity), m=L.mode||'blur', am=L.amount==null?0.6:L.amount, c1=L.color||BG, acc=L.accent||ACC; X.save(); X.globalAlpha=k;
        if(m==='blur'){ const o=44; X.filter='blur('+(6+26*am).toFixed(1)+'px)'; _di.call(X,fr,sx*kx,sy*ky,cw*kx,ch*ky,dx-o,dy-o,dw+2*o,dh+2*o); X.filter='none'; X.fillStyle='rgba(0,0,0,'+(0.22*am).toFixed(3)+')'; X.fillRect(dx,dy,dw,dh); }
        else if(m==='bw'){ X.filter='grayscale(1) brightness('+(1-0.4*am).toFixed(2)+')'; _di.call(X,fr,sx*kx,sy*ky,cw*kx,ch*ky,dx,dy,dw,dh); X.filter='none'; }
        else if(m==='dim'){ X.fillStyle='rgba(0,0,0,'+(0.3+0.6*am).toFixed(3)+')'; X.fillRect(dx,dy,dw,dh); }
        else if(m==='image'&&IMG[L.src]&&IMG[L.src].ok){ X.beginPath(); X.rect(dx,dy,dw,dh); X.clip(); coverDraw(IMG[L.src],dx,dy,dw,dh,1+0.08*cl((t-L.s)/Math.max(0.5,L.e-L.s),0,1)); if(L.dim){ X.fillStyle='rgba(0,0,0,'+(+L.dim||0.3)+')'; X.fillRect(dx,dy,dw,dh); } }
        else if(m==='grad'){ const g=X.createLinearGradient(dx,dy,dx+dw*0.4,dy+dh); g.addColorStop(0,c1); g.addColorStop(1,L.color2||acc); X.fillStyle=g; X.fillRect(dx,dy,dw,dh); }
        else if(m==='studio'){ X.fillStyle=c1; X.fillRect(dx,dy,dw,dh); const f=faceAt(t), gx=dx+dw*0.5, gy=dy+dh*(f?Math.max(0.2,Math.min(0.7,(f[2]*shh-sy)/ch)):0.4), g=X.createRadialGradient(gx,gy,0,gx,gy,Math.max(dw,dh)*0.72); g.addColorStop(0,rgba(acc,0.55)); g.addColorStop(0.55,rgba(acc,0.12)); g.addColorStop(1,rgba(acc,0)); X.fillStyle=g; X.fillRect(dx,dy,dw,dh); }
        else { X.fillStyle=c1; X.fillRect(dx,dy,dw,dh); }
        X.restore(); }
      if(dw>=860&&dh>=1500) for(const L of Ls){ if(L.type==='behind') behindDraw(L,t,{sx,sy,cw,ch,dx,dy,dw,dh,sw,shh}); }
      const pw=Math.min(1080,Math.ceil(dw)), ph=Math.min(1920,Math.ceil(dh));
      _PX.setTransform(1,0,0,1,0,0); _PX.globalCompositeOperation='source-over'; _PX.clearRect(0,0,1080,1920);
      _di.call(_PX,fr,sx*kx,sy*ky,cw*kx,ch*ky,0,0,pw,ph); _PX.globalCompositeOperation='destination-in'; _di.call(_PX,mk,sx*mx,sy*my,cw*mx,ch*my,0,0,pw,ph); _PX.globalCompositeOperation='source-over';
      { const G=gradeOf(); if(G) X.filter=G.f; _di.call(X,_PC,0,0,pw,ph,dx,dy,dw,dh); X.filter='none'; }
    } finally { X.restore(); _inP=false; } }
  function behindDraw(L,t,M){ const f=faceAt(t), k=M.dh/M.ch, fy=f?(M.dy+(f[2]*M.shh-M.sy)*k)/1920:0, fh=f?f[4]*M.shh*k/1920:0, full=M.dh>=1900;
    const y=L.y!=null?L.y:(f?cl(fy-fh*0.66,(M.dy+90)/1920,(M.dy+M.dh*0.6)/1920):(M.dy+M.dh*0.3)/1920);
    const o={...L,x:L.x==null?(M.dx+M.dw/2)/1080:L.x,y:y,size:(L.size||270)*(full?1:Math.max(0.6,Math.min(1,M.dh/1500))),weight:L.weight||900,color:L.color||'#FFFFFF',bg:'none',shadow:false,width:L.width||1060,anim:L.anim||'rise',hollow:L.fill==='outline'};
    textBlock(o,t,enterK(o,t)); }
  const frNo=src=>{ const m=String(src).match(/(\d{5})\.jpg/); return m?+m[1]:0; };
  const mkWanted=n=>{ if(!MASK||!n||!MASK.ranges||!MASK.ranges.some(r=>n>=r[0]&&n<=r[1])) return false; const t=(n-1)/30; return (HSX.layers||[]).some(L=>!L.off&&(L.type==='bg'||L.type==='behind')&&t>=L.s-0.05&&t<L.e+0.05)||dkNeedMask(t); };
  function mkImg(n){ let p=FR.mk.get(n); if(p){ FR.mk.delete(n); FR.mk.set(n,p); return p; }
    p=new Promise(res=>{ const im=new Image(); im.onload=()=>{ (im.decode?im.decode():Promise.resolve()).then(()=>res(im),()=>res(im)); }; im.onerror=()=>{ FR.mk.delete(n); res(null); }; im.src='mk/'+String(n).padStart(5,'0')+'.png?v='+MASK.v; });
    FR.mk.set(n,p); while(FR.mk.size>40) FR.mk.delete(FR.mk.keys().next().value); return p; }
  function frImg(src){ let p=FR.cache.get(src); if(p){ FR.cache.delete(src); FR.cache.set(src,p); return p; }
    p=new Promise(res=>{ const im=new Image(); im.onload=()=>{ (im.decode?im.decode():Promise.resolve()).then(()=>res(im),()=>res(im)); }; im.onerror=()=>{ FR.cache.delete(src); res(null); }; im.src=src; });
    FR.cache.set(src,p); while(FR.cache.size>36) FR.cache.delete(FR.cache.keys().next().value); return p; }
  const _sf=window.setFrame;
  window.setFrame=function(src){ const my=++FR.seq, n=frNo(src);
    return Promise.all([frImg(src),mkWanted(n)?mkImg(n):null]).then(async rs=>{ const im=rs[0]; if(!im){ if(!FR.cur){ try{ await _sf(src); }catch(e){} } return; }
      if(my>FR.shown){ FR.shown=my; FR.cur=im; FR.mask=rs[1]||null; FR.n=n; }
      if(!VF.naturalWidth){ try{ await _sf(src); }catch(e){} } }); };
  window.hsPrefetch=function(list){ (list||[]).forEach(s=>{ frImg(s); const n=frNo(s); if(mkWanted(n)) mkImg(n); }); };
  /* ملفات العين (الوجه والقناع) تتحمّل كسكربت عادي: يشتغل من الخادم ومن الملف مباشرة وقت التصدير */
  function loadAux(){ return Promise.all(['hs-face.js','hs-mask.js'].map(f=>new Promise(res=>{ const s=document.createElement('script'); let d=false; const fin=()=>{ if(d) return; d=true; try{ s.remove(); }catch(e){} res(); }; s.onload=fin; s.onerror=fin; s.src=f+'?v='+Date.now(); document.head.appendChild(s); setTimeout(fin,3000); })))
      .then(()=>{ const f=window.__hsFace, m=window.__hsMask; FACE=f&&f.found&&f.pts&&f.pts.length?f:null; if(!MASK||!m||MASK.v!==m.v) FR.mk.clear(); MASK=m&&m.ranges?m:null; }); }
  window.hsAux=()=>loadAux().then(()=>{ scenesSync(); return {face:!!FACE,mask:MASK?MASK.ranges:[]}; });
  /* 3.8: معاينة أخف للجوال: نفس الرسم على شاشة أصغر (كل الإحداثيات تبقى 1080×1920) */
  let LOWK=1;
  window.hsLowRes=function(k){ k=Math.max(0.3,Math.min(1,+k||1)); if(k===LOWK&&C.width===Math.round(1080*k)) return; LOWK=k;
    if(!X.__st){ X.__st=X.setTransform; X.setTransform=function(a,b,c,d,e,f){ if(a&&typeof a==='object'){ const m=a; return X.__st.call(X,m.a*LOWK,m.b*LOWK,m.c*LOWK,m.d*LOWK,m.e*LOWK,m.f*LOWK); } return X.__st.call(X,a*LOWK,b*LOWK,c*LOWK,d*LOWK,e*LOWK,f*LOWK); };
      X.__rt=X.resetTransform; X.resetTransform=function(){ return X.__st.call(X,LOWK,0,0,LOWK,0,0); }; }
    C.width=Math.round(1080*k); C.height=Math.round(1920*k); X.setTransform(1,0,0,1,0,0); };

  /* ═══ 3.5: المشاهد بلا فجوات + كرت الشاشة المقسومة ═══
     المحرّك لو لقى لحظة ما يغطيها أي مشهد يرجع لآخر مشهد بالقائمة، فلو آخر مشهد «المتحدث مختفي» يختفي الفيديو بكل الفجوات.
     هنا نرتّب المشاهد ونعبّي أي فجوة بملء الشاشة، ونضيف مشهد «نص تحت» لكل طبقة split. */
  let BASE_SC=null;
  const splitRect=L=>{ let k=+L.ratio; if(!(k>0)){ k=0.5; if(FACE&&FACE.avg) k=1-Math.max(0.40,Math.min(0.58,FACE.avg[3]*1.75)); } k=Math.min(0.62,Math.max(0.38,k)); const y=Math.round(1920*k); return {x:0,y:y,w:1080,h:1920-y,r:0,split:true}; };
  function scenesSync(){ try{
      if(typeof SCENES==='undefined') return; if(!SCENES.__hs||!BASE_SC) BASE_SC=SCENES.map(x=>({...x}));
      const ex=(HSX.layers||[]).filter(L=>!L.off&&L.e>L.s&&(L.type==='split'||L.type==='pip'||(L.type==='viz'&&vizLayout(L).rect))).map(L=>L.type==='pip'?{s:L.s,e:L.e,m:pipRect(L)}:L.type==='split'?{s:L.s,e:L.e,m:splitRect(L),nocap:true}:{s:L.s,e:L.e,m:vizLayout(L).rect,nocap:!!vizLayout(L).rect.nocapHs});
      const pts=[0]; BASE_SC.concat(ex).forEach(x=>{ pts.push(Math.max(0,x.s),Math.max(0,x.e)); }); pts.push(1e6);
      const u=[...new Set(pts.map(v=>Math.round(v*1000)/1000))].sort((a,b)=>a-b), out=[];
      for(let i=0;i<u.length-1;i++){ const a=u[i], b=u[i+1], mid=(a+b)/2;
        const src=ex.find(x=>mid>=x.s&&mid<x.e)||BASE_SC.find(x=>mid>=x.s&&mid<x.e)||{m:R_FULL};
        const last=out[out.length-1]; if(last&&last.m===src.m&&last.__src===src) last.e=b; else out.push({...src,s:a,e:b,__src:src}); }
      out.__hs=true; SCENES=out; try{ _RES=false; }catch(e){} }catch(e){ if(!window.__hsSE){ window.__hsSE=1; console.error('hs scenes: '+e.message); } } }
  const _init=window.init;
  window.init=function(d){ const p=Promise.resolve(_init(d)); return Promise.all([p.then(()=>{ if(d&&d.studio&&Array.isArray(d.studio.scenes)&&d.studio.scenes.length) BASE_SC=null; HSX=(d&&d.studio&&d.studio.hs)||{}; scenesSync(); if(LOWK!==1) window.hsLowRes(LOWK); }),apply((d&&d.studio&&d.studio.hs)||{}),loadFont(d&&d.studio&&d.studio.outro&&d.studio.outro.font),loadAux()]).then(r=>{ scenesSync(); return r; }); };
  /* تحديث حيّ من الاستوديو بلا إعادة تهيئة كاملة (سحب السلايدر) */
  window.hsSet=function(hs){ const p=apply(hs); scenesSync(); return p; };
  window.hsLoadFont=loadFont;

  const cardKey=c=>c.w.map(w=>w.t).join(' ');
  function wrapWords(ws,font,maxw,gap){ X.font=font;
    const it=ws.map(w=>({...w,w:X.measureText(w.t).width})); const L=[]; let c=[],cw=0;
    const isNum=w=>/^[0-9٠-٩]+$/.test(w.t);
    for(let k=0;k<it.length;k++){ const i=it[k]; const add=c.length?i.w+gap:i.w;
      const glue=(k+1<it.length&&isNum(i))?it[k+1].w+gap:0;       /* الرقم ووحدته بسطر واحد */
      if(cw+add+glue>maxw&&c.length){ L.push({items:c,w:cw}); c=[i]; cw=i.w; } else { c.push(i); cw+=add; } }
    if(c.length) L.push({items:c,w:cw}); return L; }
  function wrapText(txt,font,maxw){ X.font=font; const words=String(txt).split(/\s+/).filter(Boolean); const L=[]; let cur='';
    for(const w of words){ const tr=cur?cur+' '+w:w; if(X.measureText(tr).width>maxw&&cur){ L.push(cur); cur=w; } else cur=tr; }
    if(cur) L.push(cur); return L; }
  function lumOf(hex){ try{ return lum(hex); }catch(e){ return 1; } }

  /* 4.3: بودكاست مترجم — عنوان فوق ومصدره، وترجمة نظيفة تحت والأصل بخط أصغر */
  function podDraw(t){ const P=HSX.pod||{}, F=n=>'"'+(n||CAP.font||'Cairo')+'","Cairo","IBM Plex Sans Arabic",sans-serif';
    X.save(); X.textAlign='center'; X.textBaseline='middle'; X.shadowColor='rgba(0,0,0,0.7)'; X.shadowBlur=16; X.shadowOffsetY=3;
    if(P.title&&P.titleOn!==false){ const fsT=+P.tsize||52, ty=1920*(+P.ty||12)/100; X.direction='rtl';
      const tf='800 '+fsT+'px '+F(P.font), tl=wrapText(P.title,tf,900).slice(0,2); X.font=tf; X.fillStyle=P.tcolor||'#FFFFFF';
      tl.forEach((l,i)=>X.fillText(l,540,ty+i*fsT*1.3));
      if(P.credit){ const cf='600 '+Math.round(fsT*0.5)+'px '+F(P.font); X.font=cf; X.fillStyle='rgba(255,255,255,0.8)'; X.direction='auto'; X.fillText(P.credit,540,ty+tl.length*fsT*1.3-fsT*0.18); } }
    X.restore();
    if(HSX.nocap||!CAP.on) return;
    const c=CAPS.find(c=>t>=c.s&&t<c.e); if(!c) return;
    const key=cardKey(c), tr=((EN.map||{})[key]||'').trim(), ar=P.lang==='ar';
    const main=ar?key:(tr||key), sub=ar?(EN.on?tr:''):((P.orig!==false&&tr)?key:'');
    const lt=t-c.s, rt=c.e-t, a=Math.min(1,lt/0.12,rt/0.1); if(a<=0) return;
    const fs=+CAP.size||44, sfs=Math.round(fs*(+P.subScale||0.62)), mf=(CAP.weight||700)+' '+fs+'px '+F(CAP.font), sf='500 '+sfs+'px '+F(EN.font||'Cairo');
    const ML=wrapText(main,mf,+CAP.width||880).slice(0,3), SL=sub?wrapText(sub,sf,920).slice(0,2):[];
    const lh=Math.round(fs*1.38), slh=Math.round(sfs*1.34), H=ML.length*lh+(SL.length?SL.length*slh+10:0), bottom=1920*(+CAP.y||74)/100, top=bottom-H, cx=10.8*(CAP.x==null?50:+CAP.x);
    X.save(); X.globalAlpha=a; X.textAlign='center'; X.textBaseline='middle';
    if(CAP.bg==='box'){ let bw=0; X.font=mf; ML.forEach(l=>bw=Math.max(bw,X.measureText(l).width)); X.font=sf; SL.forEach(l=>bw=Math.max(bw,X.measureText(l).width));
      X.fillStyle=rgba(CAP.bgColor||'#000000',CAP.bgOpacity==null?0.55:CAP.bgOpacity); rr(cx-bw/2-fs*0.5,top-fs*0.3,bw+fs,H+fs*0.6,fs*0.3); X.fill(); }
    if(CAP.shadow!==false){ X.shadowColor='rgba(0,0,0,0.8)'; X.shadowBlur=Math.round(fs*0.35); X.shadowOffsetY=2; }
    X.font=mf; X.fillStyle=CAP.color||'#FFFFFF'; X.direction=(ar||tr)?'rtl':'ltr'; ML.forEach((l,i)=>X.fillText(l,cx,top+lh*i+lh/2));
    if(SL.length){ X.font=sf; X.fillStyle='rgba(255,255,255,0.78)'; X.direction=ar?'ltr':'auto'; SL.forEach((l,i)=>X.fillText(l,cx,top+ML.length*lh+10+slh*i+slh/2)); }
    X.restore(); }
  let CAPFORCE=false;
  const _cap=window.caption;
  window.caption=function(t){
    if(t<VEND&&!CAPFORCE){ X.save(); try{ layers(t,true); }catch(e){} X.restore(); }
    if(t<VEND&&!CAPFORCE){ X.save(); try{ if(dkOn()) dkOverlay(t,dkStage()); deskItems(t); }catch(e){ if(!window.__hsDKE){ window.__hsDKE=1; console.error('hs desk: '+e.message); } } X.restore(); }
    if(t<VEND&&kinAt(t)) return;
    if(t<VEND&&!CAPFORCE&&HSX.pod&&HSX.pod.on){ podDraw(t); return; }
    if(HSX.nocap) return;
    if((HSX.layers||[]).some(L=>!L.off&&t>=L.s&&t<L.e&&(L.type==='cover'||(L.type==='viz'&&L.kind==='cta')))) return;
    if(!CAP.on) return _cap(t);
    if(!CAPFORCE&&SCENES.some(sc=>sc.nocap&&t>=sc.s&&t<sc.e)) return;
    if(typeof BEHIND!=='undefined'&&BEHIND&&PRS_OK&&isFull(vrect(t))&&BEHIND.lines.some(l=>t>=l.s&&t<=l.e&&!BEHIND_OFF.includes(l.card))) return;
    if(collageActive(t)) return;
    const c=CAPS.find(c=>t>=c.s&&t<c.e); if(!c) return;
    const _ov=(HSX.capOv||{})[cardKey(c)], _CAP0=CAP; if(_ov) CAP={...CAP,..._ov};
    try{ return capDraw(c,t); } finally { CAP=_CAP0; } };
  function capDraw(c,t){
    const lt=t-c.s, rt=c.e-t; let a=1, dy=0, sc=1;
    let dx=0; const EN_=CAP.enter||'rise';
    if(lt<0.22&&EN_!=='none'&&EN_!=='words'){ const k=lt/0.22;
      if(EN_==='rise'){ a=ease(k); dy=(1-ease(k))*24; sc=0.94+0.06*back(k); }
      else if(EN_==='pop'){ a=Math.min(1,k*2.2); sc=0.55+0.45*back(k); }
      else if(EN_==='slide'){ a=ease(k); dx=(1-ease(k))*220; }
      else if(EN_==='drop'){ a=ease(k); dy=-(1-back(k))*150; }
      else if(EN_==='zoom'){ a=ease(k); sc=1.5-0.5*ease(k); }
      else if(EN_==='fade'){ a=k; } }
    if(rt<0.13){ const k=rt/0.13; a=k; dy=-(1-k)*10; }
    const fs=CAP.size, gap=Math.round(fs*0.26)+ (CAP.gap-16)+(CAP.actScale>1?Math.round(fs*(CAP.actScale-1)*1.1):0), font=fstr(CAP,fs), lh=Math.round(fs*1.36);
    let L;
    const CH=CAP.mode==='word'?1:Math.max(0,CAP.chunk|0);
    if(CH>0){ let ix=0; for(let k=0;k<c.w.length;k++) if(t>=c.w[k].s) ix=k; const g=Math.floor(ix/CH)*CH; L=wrapWords(c.w.slice(g,g+CH),font,CAP.width,gap); }
    else { L=wrapWords(c.w,font,CAP.width,gap);
      const ML=Math.max(1,CAP.lines|0);
      if(L.length>ML){ const pages=[]; for(let i=0;i<L.length;i+=ML) pages.push(L.slice(i,i+ML));
        let pg=pages.find(p=>{ const f=p[0].items[0], l=p[p.length-1].items[p[p.length-1].items.length-1]; return t>=f.s&&t<l.e; });
        if(!pg) pg=pages.find(p=>t<p[0].items[0].s)||pages[pages.length-1]; L=pg; } }
    /* سطر الترجمة */
    let EL=[], efs=EN.size, elh=Math.round(efs*1.3), efont=fstr(EN,efs);
    if(EN.on){ const tx=EN.map[cardKey(c)]; if(tx) EL=wrapText(tx,efont,Math.max(CAP.width,820)).slice(0,2); }
    const bhA=L.length*lh, bhE=EL.length?EL.length*elh+EN.gap:0, bh=bhA+bhE;
    const BOXED=CAP.bg==='box'||CAP.bg==='bar'||CAP.bg==='lines'||CAP.bg==='glass';
    const padX=BOXED?Math.round(fs*(CAP.bg==='lines'?0.34:0.6)):0, padY=BOXED?Math.round(fs*(CAP.bg==='lines'?0.08:0.38)):0;
    /* المكان: y = نسبة أسفل الكابشن من ارتفاع الشاشة. بوضع كرت الفيديو تحت ← فوق الكرت دايماً (ما ينكتب على الوجه) */
    const R=vtarget(t), LOW=R.y>700&&!R.off;
    const CUT=(cutoutActive(t)||headoutActive(t))&&PTOP>200;
    let bottom=Math.round(1920*CAP.y/100);
    if(CUT) bottom=PTOP-46; else if(LOW) bottom=Math.max(200+bh, R.y-46-padY);
    const top=bottom-bh, cx=Math.round(10.8*(CAP.x==null?50:+CAP.x));
    const aTop=(EN.on&&EL.length&&EN.pos==='above')?top+bhE:top, eTop=(EN.pos==='above')?top:top+bhA+EN.gap;
    X.save(); X.globalAlpha=a; X.translate(cx+dx,top+bh/2+dy); X.scale(sc,sc); X.translate(-cx,-(top+bh/2));
    if(CAP.bg==='box'){ const bw=Math.max(...L.map(l=>l.w), ...(EL.length?EL.map(s=>{X.font=efont;return X.measureText(s).width;}):[0]))+padX*2;
      X.fillStyle=rgba(CAP.bgColor||'#000000',CAP.bgOpacity==null?0.62:CAP.bgOpacity); rr(cx-bw/2,top-padY,bw,bh+padY*2,Math.round(fs*0.36)); X.fill(); }
    else if(CAP.bg==='glass'){ const bw=Math.max(...L.map(l=>l.w), ...(EL.length?EL.map(s=>{X.font=efont;return X.measureText(s).width;}):[0]))+padX*2; glass(cx-bw/2,top-padY,bw,bh+padY*2,Math.round(fs*0.42)); }
    else if(CAP.bg==='bar'){ X.fillStyle=rgba(CAP.bgColor||'#000000',CAP.bgOpacity==null?0.62:CAP.bgOpacity); X.fillRect(-200,top-padY,1480,bh+padY*2); }
    else if(CAP.bg==='lines'){ X.fillStyle=rgba(CAP.bgColor||'#000000',CAP.bgOpacity==null?0.62:CAP.bgOpacity); L.forEach((ln,li)=>{ rr(cx-ln.w/2-padX,aTop+lh*li+1,ln.w+padX*2,lh-2,Math.round(fs*0.16)); X.fill(); }); }
    X.font=font; X.textAlign='right'; X.textBaseline='middle'; X.direction='rtl'; X.lineJoin='round';
    const HARD=CAP.shadow==='hard', HOFF=Math.max(4,Math.round(fs*0.1));
    const shadowOn=()=>{ if(CAP.shadow&&!HARD&&!BOXED){ X.shadowColor='rgba(0,0,0,0.75)'; X.shadowBlur=Math.round(fs*0.3); X.shadowOffsetY=Math.round(fs*0.07); } };
    const shadowOff=()=>{ X.shadowColor='transparent'; X.shadowBlur=0; X.shadowOffsetY=0; };
    L.forEach((ln,li)=>{ let x=cx+ln.w/2; const cy=aTop+lh*li+lh/2;
      for(const i of ln.items){ const act=t>=i.s&&t<i.e, sp=t>=i.s; if(EN_==='words'&&!sp){ x-=i.w+gap; continue; }
        let ps=1, ddx=0, ddy=0, clip=1, lift=0;
        if(act&&!i.fx){ const k=Math.min(1,(t-i.s)/0.12); lift=-fs*0.08*Math.sin(k*Math.PI); }
        if(EN_==='words'&&sp){ const k=Math.min(1,(t-i.s)/0.16); ps*=0.7+0.3*back(k); }
        if(i.hot&&sp){ const k=Math.min(1,(t-i.s)/0.35); ps=1+0.10*Math.sin(k*Math.PI)+0.05*k; }
        if(act&&CAP.actScale>1){ ps*=1+(CAP.actScale-1)*ease(Math.min(1,(t-i.s)/0.1)); }
        if(i.fx&&sp){ const k=cl((t-i.s)/0.38,0,1);
          if(i.fx==='drop'){ const kk=cl((t-i.s)/0.34,0,1); ddy=kk<0.72?-(1-Math.pow(kk/0.72,2))*300:-Math.sin((kk-0.72)/0.28*Math.PI)*14; }
          else if(i.fx==='shake'||i.fx==='crack'){ ddx=Math.sin(k*46)*(1-k)*14; }
          else if(i.fx==='type'){ clip=ease(k); }
          else { ps*=1+0.26*Math.sin(k*Math.PI); } }
        X.save(); const cxw=x-i.w/2; X.translate(cxw+ddx,cy+lift+ddy); X.scale(ps,ps); X.translate(-cxw,-(cy+lift));
        if(clip<1){ X.beginPath(); X.rect(x-i.w*clip-4,cy-fs,i.w*clip+8,fs*2); X.clip(); }
        let fill=(act||(i.hot&&sp))?CAP.active:CAP.color; const on=act||(i.hot&&sp);
        if(CAP.hl==='under'){ fill=CAP.color; if(on){ shadowOff(); X.fillStyle=CAP.active; rr(x-i.w,cy+lift+fs*0.5,i.w,Math.max(5,Math.round(fs*0.1)),Math.round(fs*0.05)); X.fill(); } }
        if(CAP.hl==='dim'&&!sp) X.globalAlpha*=0.36;
        if(CAP.hl==='marker'){ fill=CAP.color; if(on){ shadowOff(); const g=ease(cl((t-i.s)/0.16,0,1)); X.fillStyle=CAP.active; rr(x-i.w*g-fs*0.12,cy+lift-fs*0.52,i.w*g+fs*0.24,fs*1.04,Math.round(fs*0.12)); X.fill(); fill=lumOf(CAP.active)>0.45?'#111111':'#FFFFFF'; } }
        const HOLLOW=CAP.fill==='outline'&&!on&&!(CAP.bg==='pill'&&act);
        if(HARD&&!(CAP.bg==='pill'&&act)){ X.fillStyle=CAP.shadowColor||'#000000'; X.strokeStyle=X.fillStyle; X.lineWidth=Math.max(2,CAP.stroke*2); if(CAP.stroke>0||HOLLOW) X.strokeText(i.t,x-HOFF,cy+lift+HOFF); if(!HOLLOW) X.fillText(i.t,x-HOFF,cy+lift+HOFF); }
        if(CAP.bg==='pill'&&act){ shadowOff(); X.fillStyle=CAP.active; rr(x-i.w-fs*0.2,cy+lift-fs*0.66,i.w+fs*0.4,fs*1.3,Math.round(fs*0.24)); X.fill();
          fill=lumOf(CAP.active)>0.45?'#111111':'#FFFFFF'; }
        if(CAP.stroke>0&&!(CAP.bg==='pill'&&act)){ shadowOff(); X.strokeStyle=CAP.strokeColor; X.lineWidth=CAP.stroke*2; X.strokeText(i.t,x,cy+lift); }
        if(!(CAP.bg==='pill'&&act)) shadowOn();
        if(CAP.hl==='glow'&&on){ const dt=t-i.s, env=dt<0.06?dt/0.06:Math.max(0.35,1-(dt-0.06)/0.45); X.shadowColor=CAP.active; X.shadowBlur=Math.round(fs*(0.2+0.6*env)); X.shadowOffsetY=0; }
        if(HOLLOW){ X.strokeStyle=CAP.color; X.lineWidth=Math.max(2,Math.round(fs*0.032)); X.strokeText(i.t,x,cy+lift); }
        else { X.fillStyle=fill; X.fillText(i.t,x,cy+lift); } shadowOff();
        X.restore(); x-=i.w+gap; } });
    if(EL.length){ X.font=efont; X.direction='ltr'; X.textAlign='center'; X.textBaseline='middle';
      EL.forEach((s,k)=>{ const cy=eTop+elh*k+elh/2;
        if(CAP.stroke>0){ X.strokeStyle=CAP.strokeColor; X.lineWidth=Math.max(2,CAP.stroke*1.4); X.strokeText(s,cx,cy); }
        shadowOn(); X.fillStyle=EN.color; X.fillText(s,cx,cy); shadowOff(); }); }
    X.restore();
    window.__hsCapBox={top:top-padY,bottom:bottom+padY};
  }

  /* ═══════════ الطبقات: نص · صورة · شخصية · مؤثرات (studio.json ← hs.layers) ═══════════ */
  const hasAr=s=>/[؀-ۿ]/.test(s);
  function enterK(L,t){ /* يرجّع {a,dx,dy,sc} لدخول وخروج الطبقة */
    const d=0.28, lt=t-L.s, rt=L.e-t; let a=1,dx=0,dy=0,sc=1; const an=L.anim||'pop';
    if(lt<d&&an!=='none'){ const k=cl(lt/d,0,1);
      if(an==='pop'){ a=Math.min(1,k*2.5); sc=0.4+0.6*back(k); }
      else if(an==='rise'){ a=ease(k); dy=(1-ease(k))*70; }
      else if(an==='drop'){ a=ease(k); dy=-(1-back(k))*220; }
      else if(an==='slide'){ a=ease(k); dx=(1-ease(k))*320; }
      else if(an==='slideL'){ a=ease(k); dx=-(1-ease(k))*320; }
      else if(an==='zoom'){ a=ease(k); sc=1.7-0.7*ease(k); }
      else if(an==='fade'){ a=k; } }
    if(rt<0.18){ a*=cl(rt/0.18,0,1); }
    return {a,dx,dy,sc}; }
  function textBlock(o,t,K){ /* o: text,font,weight,size,color,bg,bgColor,bgOpacity,x,y,width,stroke,strokeColor,shadow,anim */
    const fs=o.size||96, fam=o.font||CAP.font||FONT, wt=nearest(fam,o.weight||900), font=wt+' '+fs+'px "'+fam+'"';
    const maxw=o.width||900, lh=Math.round(fs*1.28); let lines=[];
    String(o.text||'').split('\n').forEach(par=>{ const w=wrapText(par,font,maxw); lines.push(...(w.length?w:[''])); });
    if(o.anim==='type'){ const n=lines.join('\n').length, kk=cl((t-o.s)/Math.max(0.3,Math.min(1.4,n*0.045)),0,1); let left=Math.ceil(n*kk);
      lines=lines.map(l=>{ const s=l.slice(0,Math.max(0,left)); left-=l.length+1; return s; }); }
    X.font=font; const ws=lines.map(l=>X.measureText(l).width), bw=Math.max(1,...ws), bh=lines.length*lh;
    const cx=(o.x==null?0.5:o.x)*1080, cy=(o.y==null?0.3:o.y)*1920, top=cy-bh/2;
    X.save(); X.globalAlpha=K.a*(o.opacity==null?1:o.opacity); X.translate(cx+K.dx,cy+K.dy); X.scale(K.sc,K.sc); X.rotate((o.rot||0)*Math.PI/180); X.translate(-cx,-cy);
    X.textAlign='center'; X.textBaseline='middle'; X.lineJoin='round';
    const px=Math.round(fs*0.42), py=Math.round(fs*0.22), bgc=rgba(o.bgColor||'#000000',o.bgOpacity==null?1:o.bgOpacity);
    if(o.bg==='box'){ X.fillStyle=bgc; rr(cx-bw/2-px,top-py,bw+px*2,bh+py*2,Math.round(fs*0.3)); X.fill(); }
    if(o.bg==='glass') glass(cx-bw/2-px*1.3,top-py*1.6,bw+px*2.6,bh+py*3.2,Math.round(fs*0.36));
    lines.forEach((l,i)=>{ const y=top+lh*i+lh/2; X.font=font; X.direction=hasAr(l)?'rtl':'ltr';
      if(o.bg==='pill'&&l){ X.fillStyle=bgc; rr(cx-ws[i]/2-px,y-lh/2+2,ws[i]+px*2,lh-4,Math.round(fs*0.26)); X.fill(); }
      if(o.stroke>0){ X.strokeStyle=o.strokeColor||'#000000'; X.lineWidth=o.stroke*2; X.strokeText(l,cx,y); }
      if(o.shadow!==false&&o.bg!=='box'&&o.bg!=='pill'){ X.shadowColor='rgba(0,0,0,0.7)'; X.shadowBlur=Math.round(fs*0.28); X.shadowOffsetY=Math.round(fs*0.06); }
      if(o.hollow){ X.strokeStyle=o.color||'#FFFFFF'; X.lineWidth=Math.max(4,Math.round(fs*0.035)); X.strokeText(l,cx,y); } else { X.fillStyle=o.color||'#FFFFFF'; X.fillText(l,cx,y); } X.shadowColor='transparent'; X.shadowBlur=0; X.shadowOffsetY=0; });
    X.restore(); }

  /* شخصيات مبنية بالبكسل (تصاميم أصلية للاستوديو) — B جسم · D ظل · W بياض العين · E بؤبؤ · M فم · A تمييز */
  const SPR={
    robo:['......AA......','......AA......','..BBBBBBBBBB..','.BBBBBBBBBBBB.','.BBWWBBBBWWBB.','.BBWEBBBBWEBB.','.BBBBBBBBBBBB.','.BBBMMMMMMBBB.','.BBBBBBBBBBBB.','..BBBBBBBBBB..','...DDDDDDDD...','..BBBBBBBBBB..','..BBB....BBB..','..DDD....DDD..'],
    sprout:['.......AA.....','......AA......','......A.......','...BBBBBBBB...','..BBBBBBBBBB..','.BBWWBBBBWWBB.','.BBWEBBBBWEBB.','.BBBBBBBBBBBB.','.BBBBBMMBBBBB.','.BBBBBBBBBBBB.','..BBBBBBBBBB..','...BBBBBBBB...','...DD....DD...','..............'],
    star:['......BB......','......BB......','.....BBBB.....','.....BBBB.....','BBBBBBBBBBBBBB','.BBBWEBBWEBBB.','..BBBBBBBBBB..','...BBBMMBBB...','...BBBBBBBB...','..BBBBBBBBBB..','..BBBB..BBBB..','.BBB......BBB.','.BB........BB.','..............'],
    cube:['..............','.BBBBBBBBBBBB.','.BAAAAAAAAAAB.','.BBBBBBBBBBBB.','.BBWWBBBBWWBB.','.BBEWBBBBEWBB.','.BBBBBBBBBBBB.','.BBBBMMMMBBBB.','.BBBBBBBBBBBB.','.BBBBBBBBBBBB.','.DDDDDDDDDDDD.','..DD......DD..','..DD......DD..','..............'] };
  window.__hsChars=Object.keys(SPR); window.__hsSpr=SPR;
  const shade=(hex,k)=>{ const c=hx(hex).map(v=>Math.max(0,Math.min(255,Math.round(v*k)))); return 'rgb('+c[0]+','+c[1]+','+c[2]+')'; };
  function speaking(t){ for(const c of CAPS){ if(t<c.s||t>=c.e) continue; for(const w of c.w){ if(t>=w.s&&t<w.e) return w; } } return null; }
  function charLayer(L,t,K){ const size=(L.size||0.28)*1080, cx=(L.x==null?0.2:L.x)*1080, cy=(L.y==null?0.62:L.y)*1920;
    const w=L.react===false?null:speaking(t); let jump=0, sq=1;
    const bob=Math.sin(t*2.4)*size*0.012;
    if(w){ sq=1+0.03*Math.sin(t*26); if(w.hot){ const k=cl((t-w.s)/0.38,0,1); jump=-Math.sin(k*Math.PI)*size*0.22; } }
    X.save(); X.globalAlpha=K.a*(L.opacity==null?1:L.opacity); X.translate(cx+K.dx,cy+K.dy+bob+jump); X.scale(K.sc*(L.flip?-1:1),K.sc*sq); X.rotate((L.rot||0)*Math.PI/180);
    if(L.src){ const im=IMG[L.src]; if(im&&im.ok){ const h=size*im.naturalHeight/im.naturalWidth; X.shadowColor='rgba(0,0,0,0.35)'; X.shadowBlur=18; X.shadowOffsetY=8; X.drawImage(im,-size/2,-h/2,size,h); } X.restore(); return; }
    const g=SPR[L.char]||SPR.robo, n=g[0].length, px=size/n, body=L.color||'#8F73F5', acc=L.accent||'#F2B33D';
    const blink=(t%3.4)<0.13, open=!!w&&Math.floor(t*9)%2===0, ox=-size/2, oy=-(g.length*px)/2;
    X.imageSmoothingEnabled=false;
    for(let r=0;r<g.length;r++) for(let c=0;c<n;c++){ const ch=g[r][c]; if(ch==='.') continue; let col=body;
      if(ch==='D') col=shade(body,0.68); else if(ch==='A') col=acc;
      else if(ch==='W') col=blink?body:'#FFFFFF'; else if(ch==='E') col=blink?shade(body,0.5):'#15151A';
      else if(ch==='M') col=open?'#15151A':shade(body,0.6);
      X.fillStyle=col; X.fillRect(Math.round(ox+c*px),Math.round(oy+r*px),Math.ceil(px)+0.5,Math.ceil(px)+0.5); }
    X.restore(); }
  function coverDraw(im,x,y,w,h,k){ const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight)*k, dw=im.naturalWidth*sc, dh=im.naturalHeight*sc; X.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh); }
  function imageLayer(L,t,K){ const im=IMG[L.src]; if(!im||!im.ok) return; const kk=cl((t-L.s)/Math.max(0.01,L.e-L.s),0,1), kb=L.kb===false?1:1+0.12*kk;
    if(L.fit==='cover'){ X.save(); X.globalAlpha=K.a*(L.opacity==null?1:L.opacity); X.beginPath(); X.rect(0,0,1080,1920); X.clip(); coverDraw(im,0,0,1080,1920,kb); X.restore(); return; }
    if(L.fit==='card'){ const w=(L.w||0.76)*1080, h=w*(L.ratio||0.68), cx=(L.x==null?0.5:L.x)*1080, cy=(L.y==null?0.28:L.y)*1920;
      X.save(); X.globalAlpha=K.a*(L.opacity==null?1:L.opacity); X.translate(cx+K.dx,cy+K.dy); X.scale(K.sc,K.sc); X.rotate((L.rot||0)*Math.PI/180);
      X.shadowColor='rgba(0,0,0,0.45)'; X.shadowBlur=40; X.shadowOffsetY=16; X.fillStyle='#000'; rr(-w/2,-h/2,w,h,L.round==null?36:L.round); X.fill(); X.shadowColor='transparent'; X.shadowBlur=0; X.shadowOffsetY=0;
      rr(-w/2,-h/2,w,h,L.round==null?36:L.round); X.clip(); coverDraw(im,-w/2,-h/2,w,h,kb); X.restore(); return; }
    if(L.frame==='browser'||L.frame==='post'){ framed(L,im,t,K,kk); return; }
    const w=(L.w||0.5)*1080, h=w*im.naturalHeight/im.naturalWidth, cx=(L.x==null?0.5:L.x)*1080, cy=(L.y==null?0.35:L.y)*1920;
    X.save(); X.globalAlpha=K.a*(L.opacity==null?1:L.opacity); X.translate(cx+K.dx,cy+K.dy); X.scale(K.sc,K.sc); X.rotate((L.rot||0)*Math.PI/180);
    if(L.frame==='glass'){ const pd=Math.max(w,h)*0.17; glass(-w/2-pd,-h/2-pd,w+pd*2,h+pd*2,(Math.max(w,h)+pd*2)*0.24); }
    if(L.frame==='ring'){ const r=Math.max(w,h)*0.74; X.lineWidth=Math.max(6,r*0.07); X.strokeStyle='rgba(255,255,255,0.26)'; X.beginPath(); X.arc(0,0,r,0,6.2832); X.stroke(); X.strokeStyle=L.ringColor||'#FFFFFF'; X.lineCap='round'; X.beginPath(); const a0=L.ringFull?0:t*5.2; X.arc(0,0,r,a0,a0+(L.ringFull?6.2832:2.3)); X.stroke(); }
    if(L.round||L.frame==='glass'){ rr(-w/2,-h/2,w,h,L.round||Math.max(w,h)*0.2); X.clip(); } X.drawImage(im,-w/2,-h/2,w,h); X.restore(); }
  const isUnder=L=>L.type==='image'&&(L.fit==='cover'||L.fit==='card')&&L.under!==false;
  function layers(t,under){ const Ls=(HSX.layers||[]).filter(L=>L.type!=='fx'&&L.type!=='split'&&L.type!=='viz'&&L.type!=='cover'&&L.type!=='bg'&&L.type!=='behind'&&L.type!=='pip'&&L.type!=='collage'&&L.type!=='kinetic'&&L.type!=='desk'&&!L.off&&t>=L.s&&t<L.e&&isUnder(L)===!!under&&(L.overKin||!kinAt(t))).sort((a,b)=>(b.track||0)-(a.track||0));
    for(const L of Ls){ const K=enterK(L,t); X.save(); try{
        if(L.type==='text') textBlock(L,t,K); else if(L.type==='char') charLayer(L,t,K); else if(L.type==='image') imageLayer(L,t,K);
        else if(L.type==='mark') markLayer(L,t,K); else if(L.type==='cursor') cursorLayer(L,t); else if(L.type==='lt') ltLayer(L,t,K);
      }catch(e){ if(!window.__hsLE){window.__hsLE=1;console.error('hs layer '+L.id+': '+e.message);} } X.restore(); } }
  /* ═══════════ 3.8: كروت الشرح بالموشن ═══════════
     الكرت يملأ المساحة اللي فوق الفيديو بالضبط فيتحرك معه دخولاً وخروجاً. style يحدد شكل الشرح:
     list نقاط · steps خطوات مرقّمة · flow مخطط بأسهم · versus مقارنة · stat رقم كبير · check صح وغلط · timeline خط زمني · funnel قمع · quote اقتباس · draw رسم حر (عناصر Claude يرتبها) */
  function wrapTxt(txt,maxW){ const out=[]; for(const para of String(txt||'').split('\n')){ let line=''; for(const w of para.split(/\s+/)){ const tr=line?line+' '+w:w; if(line&&X.measureText(tr).width>maxW){ out.push(line); line=w; } else line=tr; } out.push(line); } return out; }
  const ICON={ check:'M5 12.5l4.5 4.5L19 7.5', x:'M6.5 6.5l11 11M17.5 6.5l-11 11', plus:'M12 5v14M5 12h14', minus:'M5 12h14', arrow:'M4 12h15M13 6l6 6-6 6', back:'M20 12H5M11 6l-6 6 6 6', up:'M12 20V5M6 11l6-6 6 6', down:'M12 4v15M6 13l6 6 6-6', star:'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8z', heart:'M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z', user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5a7.5 7.5 0 0 1 15 0', users:'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18.3 14a6.5 6.5 0 0 1 3.2 6', clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2', money:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.8 9.3c-.5-1-1.5-1.6-2.8-1.6-1.6 0-2.8.9-2.8 2.1 0 2.9 5.7 1.5 5.7 4.4 0 1.3-1.3 2.2-2.9 2.2-1.4 0-2.5-.6-3-1.7M12 6v1.7M12 16.4V18', bulb:'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.6.6.8 1.2.8 2.4h6c0-1.2.2-1.8.8-2.4A6 6 0 0 0 12 3z', rocket:'M12 3c3.2 2.2 4.6 5.6 4.3 9.5L14 15h-4l-2.3-2.5C7.4 8.6 8.8 5.2 12 3zM12 10.8a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM10 15l-.8 4.5 2.8-1.8 2.8 1.8L14 15M7.7 11.5L4.5 14l1 3M16.3 11.5l3.2 2.5-1 3', lock:'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5V17', chart:'M4 20h16M7 20v-6M12 20V8M17 20V4', trend:'M3 17l6-6 4 4 8-8M15 7h6v6', cart:'M3 4h2.5l2.2 10.5h10l2-7.5H7M9.5 19.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM16.5 19.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', chat:'M4 5h16v11H10l-5 4v-4H4z', gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1', fire:'M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.3-2.3-5-3.3-7.3-1.2 1-1.7 2.2-1.7 3.5C12 9.5 11 6 12 3 8.5 5 5.5 9 5.5 14.3 5.5 18.2 8.1 21 12 21z', bolt:'M13 2.5L5 13.5h6l-1 8 8-11h-6z', eye:'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9s-1.2 6.3-3.7 9c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3z', play:'M7 4.5v15l12-7.5z', cloud:'M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 10.2a4.2 4.2 0 0 1-.5 8.3z', code:'M8.5 7l-5 5 5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15', search:'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5l5 5', bell:'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0', doc:'M6.5 3h8L18 6.5V21H6.5zM14 3v4h4M9 12h6M9 16h6', camera:'M4 8h3.5L9 5.5h6L16.5 8H20v11H4zM12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z', pin:'M12 21.5s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11zM12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', phone:'M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM10.5 18.5h3', laptop:'M5 5.5h14v10H5zM2.5 19h19', target:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', gift:'M4 10h16v10.5H4zM3 6.5h18V10H3zM12 6.5v14M12 6.5C10.5 3 7 3.5 7.5 5.5c.3 1.2 2.5 1 4.5 1zM12 6.5c1.5-3.5 5-3 4.5-1-.3 1.2-2.5 1-4.5 1z', brain:'M9.5 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1.5 4.5A3 3 0 0 0 12 18V6.5A2.5 2.5 0 0 0 9.5 4zM14.5 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1.5 4.5A3 3 0 0 1 12 18', shield:'M12 3l7.5 2.5v6c0 4.5-3 8-7.5 9.5-4.5-1.5-7.5-5-7.5-9.5v-6zM8.5 12l2.5 2.5 4.5-5', warn:'M12 3.5L22 20H2zM12 10v4.5M12 17.2v.3', wand:'M5 19L16 8M14 6l4 4M18.5 2.5v3M17 4h3M7 4v2M6 5h2M19 14v2M18 15h2', flag:'M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12' };
  window.__hsIcons=Object.keys(ICON);
  const _IC={};
  function icon(name,cx,cy,size,color,p,wd){ const d=ICON[name]; if(!d) return false; const pa=_IC[name]||(_IC[name]=new Path2D(d)); X.save(); X.translate(cx-size/2,cy-size/2); X.scale(size/24,size/24); X.strokeStyle=color; X.lineWidth=wd||2; X.lineCap='round'; X.lineJoin='round'; if(p!=null&&p<1) X.setLineDash([110*Math.max(0.001,p),400]); X.stroke(pa); X.restore(); return true; }
  window.__hsIconDraw=(ctx,name,size,color)=>{ const d=ICON[name]; if(!d) return; ctx.save(); ctx.scale(size/24,size/24); ctx.strokeStyle=color; ctx.lineWidth=2; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke(new Path2D(d)); ctx.restore(); };
  const inkOn=bg=>lumOf(bg)>0.55?'#15151C':'#FFFFFF';
  function cardItems(txt){ return String(txt||'').split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{ const o={}; let m=s.match(/^\[([a-z]+)\]\s*/i); if(m&&ICON[m[1].toLowerCase()]){ o.icon=m[1].toLowerCase(); s=s.slice(m[0].length); }
      m=s.match(/^([+\-✓✗xX×])\s+/); if(m){ o.mark=/[+✓]/.test(m[1])?1:-1; s=s.slice(m[0].length); } const p=s.split(/\s*\|\s*/); o.main=p[0]||''; o.sub=p.slice(1).join(' · '); o.parts=p; return o; }); }
  const stag=(i,n,dur)=>0.4+i*Math.min(0.75,Math.max(0.2,(dur*0.6)/Math.max(1,n)));
  const fitFs=(fs,need,have)=>need>have?Math.max(26,Math.floor(fs*Math.max(0.55,have/need))):fs;
  /* عنصر نصي مع قياس: يرجّع الأسطر */
  function tLines(s,font,maxW,maxL){ X.font=font; const l=wrapTxt(s,maxW); return maxL?l.slice(0,maxL):l; }
  const CARD={
    list(A,L,lt,S){ const it=cardItems(L.text); if(!it.length) return; let fs=Math.round((L.size||84)*(it.length<=3?0.8:it.length===4?0.7:0.62)), rows, tot;
      for(let pass=0;pass<4;pass++){ const f='700 '+fs+'px '+S.fam, f2='500 '+Math.round(fs*0.7)+'px '+S.fam; tot=0; rows=it.map(o=>{ const a=tLines(o.main,f,A.w-fs*1.5,3), b=o.sub?tLines(o.sub,f2,A.w-fs*1.5,2):[]; const h=a.length*fs*1.3+b.length*fs*0.92+fs*0.5; tot+=h; return {o,a,b,h}; }); if(tot<=A.h) break; fs=fitFs(fs,tot,A.h); }
      let y=A.y+Math.max(0,(A.h-tot)*0.25); const xr=A.x+A.w; X.direction='rtl'; X.textAlign='right'; X.textBaseline='middle';
      rows.forEach((r,i)=>{ const a=cl((lt-stag(i,rows.length,S.dur))/0.32,0,1); if(a<=0){ y+=r.h; return; } const e=ease(a), cy=y+fs*0.65, bx=xr-fs*0.45, off=(1-e)*46; X.globalAlpha=S.k*a;
        if(r.o.icon){ X.fillStyle=rgba(S.acc,0.16); X.beginPath(); X.arc(bx,cy,fs*0.56,0,6.2832); X.fill(); icon(r.o.icon,bx,cy,fs*0.7,S.acc,a); }
        else if(L.num){ X.fillStyle=S.acc; X.beginPath(); X.arc(bx,cy,fs*0.5*back(a),0,6.2832); X.fill(); vtx(String(i+1),bx,cy+2,'900 '+Math.round(fs*0.56)+'px '+S.fam,inkOn(S.acc)); X.direction='rtl'; X.textAlign='right'; }
        else { X.fillStyle=S.acc; X.beginPath(); X.arc(bx,cy,fs*0.17*back(a),0,6.2832); X.fill(); }
        X.font='700 '+fs+'px '+S.fam; X.fillStyle=S.ink; r.a.forEach((ln,j)=>X.fillText(ln,xr-fs*1.25+off,y+fs*0.65+j*fs*1.3));
        if(r.b.length){ X.font='500 '+Math.round(fs*0.7)+'px '+S.fam; X.fillStyle=S.dim; r.b.forEach((ln,j)=>X.fillText(ln,xr-fs*1.25+off,y+r.a.length*fs*1.3+fs*0.42+j*fs*0.92)); }
        y+=r.h; }); X.globalAlpha=S.k; },
    steps(A,L,lt,S){ const it=cardItems(L.text).slice(0,6); if(!it.length) return; const n=it.length; let fs=Math.round((L.size||84)*0.74); const rowH=Math.min(250,A.h/n); fs=Math.min(fs,Math.round(rowH*0.34)); const rad=Math.min(54,rowH*0.3), cx=A.x+A.w-rad-6, y0=A.y+Math.max(0,(A.h-rowH*n)*0.3)+rowH/2;
      const tt=it.map((o,i)=>stag(i,n,S.dur)), prog=cl((lt-tt[0])/Math.max(0.3,tt[n-1]-tt[0]+0.3),0,1);
      X.strokeStyle=S.mut; X.lineWidth=6; X.lineCap='round'; X.beginPath(); X.moveTo(cx,y0); X.lineTo(cx,y0+rowH*(n-1)); X.globalAlpha=S.k*0.6; X.stroke(); X.globalAlpha=S.k; X.strokeStyle=S.acc; X.beginPath(); X.moveTo(cx,y0); X.lineTo(cx,y0+rowH*(n-1)*prog); X.stroke();
      let cur=0; it.forEach((o,i)=>{ if(lt>=tt[i]) cur=i; });
      it.forEach((o,i)=>{ const a=cl((lt-tt[i])/0.3,0,1), cy=y0+rowH*i; if(a<=0){ X.globalAlpha=S.k*0.5; X.fillStyle=S.bg; X.strokeStyle=S.mut; X.lineWidth=5; X.beginPath(); X.arc(cx,cy,rad*0.6,0,6.2832); X.fill(); X.stroke(); X.globalAlpha=S.k; return; }
        const on=i===cur, r=rad*(0.7+0.3*back(a))*(on?1+0.05*Math.sin(lt*5):1); X.globalAlpha=S.k; X.fillStyle=on?S.acc:S.bg; X.strokeStyle=S.acc; X.lineWidth=6; X.beginPath(); X.arc(cx,cy,r,0,6.2832); X.fill(); X.stroke();
        if(i<cur) icon('check',cx,cy,rad*1.05,S.acc,1,2.6); else vtx(String(i+1),cx,cy+2,'900 '+Math.round(rad*0.95)+'px '+S.fam,on?inkOn(S.acc):S.acc);
        X.globalAlpha=S.k*a*(i<cur?0.62:1); X.direction='rtl'; X.textAlign='right'; X.textBaseline='middle'; const f='800 '+fs+'px '+S.fam, ls=tLines(o.main,f,A.w-rad*2-50,2), sub=o.sub?tLines(o.sub,'500 '+Math.round(fs*0.66)+'px '+S.fam,A.w-rad*2-50,1):[]; const th=ls.length*fs*1.22+sub.length*fs*0.84, ty=cy-th/2+fs*0.61, off=(1-ease(a))*40;
        X.font=f; X.fillStyle=S.ink; ls.forEach((ln,j)=>X.fillText(ln,cx-rad-34+off,ty+j*fs*1.22)); if(sub.length){ X.font='500 '+Math.round(fs*0.66)+'px '+S.fam; X.fillStyle=S.dim; X.fillText(sub[0],cx-rad-34+off,ty+ls.length*fs*1.22+fs*0.1); } }); X.globalAlpha=S.k; },
    flow(A,L,lt,S){ const it=cardItems(L.text).slice(0,5); if(!it.length) return; const n=it.length, gap=Math.min(86,A.h*0.1), bh=Math.min(170,(A.h-gap*(n-1))/n), bw=Math.min(A.w,820), x=A.x+(A.w-bw)/2, tot=bh*n+gap*(n-1), y0=A.y+(A.h-tot)/2, fs=Math.min(Math.round((L.size||84)*0.6),Math.round(bh*0.36));
      it.forEach((o,i)=>{ const t0=stag(i,n,S.dur), a=cl((lt-t0)/0.34,0,1), y=y0+i*(bh+gap); if(i>0){ const pa=cl((lt-t0+0.22)/0.26,0,1); if(pa>0){ const ax=A.x+A.w/2, ay=y-gap+6, ae=ay+(gap-14)*ease(pa); X.globalAlpha=S.k; X.strokeStyle=S.acc; X.lineWidth=7; X.lineCap='round'; X.lineJoin='round'; X.beginPath(); X.moveTo(ax,ay); X.lineTo(ax,ae); X.stroke(); X.beginPath(); X.moveTo(ax-16,ae-16); X.lineTo(ax,ae); X.lineTo(ax+16,ae-16); X.stroke(); } }
        if(a<=0) return; const last=i===n-1&&L.last!==false, sc=0.86+0.14*back(a); X.save(); X.globalAlpha=S.k*a; X.translate(A.x+A.w/2,y+bh/2); X.scale(sc,sc); X.translate(-(A.x+A.w/2),-(y+bh/2));
        X.fillStyle=last?S.acc:rgba(S.acc,0.13); rr(x,y,bw,bh,Math.min(34,bh*0.3)); X.fill(); X.strokeStyle=S.acc; X.lineWidth=4; rr(x,y,bw,bh,Math.min(34,bh*0.3)); X.stroke();
        const ic=o.icon?bh*0.5:0, col=last?inkOn(S.acc):S.ink; if(o.icon) icon(o.icon,x+bw-ic*0.9-12,y+bh/2,ic,last?inkOn(S.acc):S.acc,a,2.2);
        const f='800 '+fs+'px '+S.fam, ls=tLines(o.main,f,bw-60-ic*1.4,o.sub?1:2), cxm=x+(bw-ic*1.3)/2, th=ls.length*fs*1.2+(o.sub?fs*0.8:0); ls.forEach((ln,j)=>vtx(ln,cxm,y+bh/2-th/2+fs*0.6+j*fs*1.2,f,col)); if(o.sub) vtx(tLines(o.sub,'500 '+Math.round(fs*0.62)+'px '+S.fam,bw-60-ic*1.4,1)[0],cxm,y+bh/2+th/2-fs*0.36,'500 '+Math.round(fs*0.62)+'px '+S.fam,last?col:S.dim);
        X.restore(); }); X.globalAlpha=S.k; },
    versus(A,L,lt,S){ const it=cardItems(L.text).slice(0,5), c2=L.color2||'#8A8F9E', gw=34, cw=(A.w-gw)/2, xR=A.x+cw+gw, xL=A.x, hh=Math.min(120,A.h*0.2), fs=Math.min(Math.round((L.size||84)*0.52),46), rowH=Math.min(150,(A.h-hh-24)/Math.max(1,it.length));
      const head=(x,txt,col,a)=>{ if(a<=0) return; X.globalAlpha=S.k*a; X.fillStyle=col; rr(x,A.y+(1-ease(a))*-30,cw,hh,26); X.fill(); const f='900 '+Math.round(Math.min(56,hh*0.44))+'px '+S.fam; vtx(tLines(txt,f,cw-30,1)[0]||'',x+cw/2,A.y+hh/2+2+(1-ease(a))*-30,f,inkOn(col)); };
      head(xR,L.a||'الأول',S.acc,cl((lt-0.3)/0.3,0,1)); head(xL,L.b||'الثاني',c2,cl((lt-0.48)/0.3,0,1));
      const va=cl((lt-0.6)/0.3,0,1); if(va>0){ X.globalAlpha=S.k*va; X.fillStyle=S.ink; X.beginPath(); X.arc(A.x+A.w/2,A.y+hh/2,38*back(va),0,6.2832); X.fill(); vtx('VS',A.x+A.w/2,A.y+hh/2+2,'900 30px Inter, Arial',S.bg); }
      it.forEach((o,i)=>{ const y=A.y+hh+24+rowH*i, t0=0.9+i*Math.min(0.7,Math.max(0.25,(S.dur*0.55)/Math.max(1,it.length)));
        [[xR,o.parts[0],S.acc,0],[xL,o.parts[1]||'',c2,0.16]].forEach(q=>{ const a=cl((lt-t0-q[3])/0.3,0,1); if(a<=0||!q[1]) return; X.globalAlpha=S.k*a; X.fillStyle=rgba(q[2],0.14); rr(q[0],y+6+(1-ease(a))*24,cw,rowH-12,20); X.fill(); const f='700 '+fs+'px '+S.fam, ls=tLines(q[1],f,cw-36,2), th=ls.length*fs*1.22; ls.forEach((ln,j)=>vtx(ln,q[0]+cw/2,y+rowH/2-th/2+fs*0.61+j*fs*1.22+(1-ease(a))*24,f,S.ink)); }); }); X.globalAlpha=S.k; },
    stat(A,L,lt,S){ const v=+L.value||0, p=ease(cl((lt-0.3)/Math.min(1.6,Math.max(0.7,S.dur*0.4)),0,1)), from=+L.from||0, cur=from+(v-from)*p, dec=(String(L.value).split('.')[1]||'').length, str=(dec?cur.toFixed(dec):fmtN(Math.round(cur)))+(L.unit||''), cx=A.x+A.w/2;
      let fs=Math.min(330,A.h*0.46); X.font='900 '+fs+'px '+S.fam; const tw=X.measureText((dec?v.toFixed(dec):fmtN(Math.round(v)))+(L.unit||'')).width; if(tw>A.w*0.92) fs=Math.floor(fs*A.w*0.92/tw);
      const has=L.label||L.text, cy=A.y+A.h*(has?0.36:0.48), a=cl((lt-0.15)/0.3,0,1); X.globalAlpha=S.k*a;
      if(L.unit==='%'&&L.ring!==false){ const rad=Math.min(A.w*0.34,A.h*0.33); X.lineWidth=Math.max(14,rad*0.11); X.lineCap='round'; X.strokeStyle=S.mut; X.beginPath(); X.arc(cx,cy,rad,0,6.2832); X.stroke(); X.strokeStyle=S.acc; X.beginPath(); X.arc(cx,cy,rad,-Math.PI/2,-Math.PI/2+6.2832*cl(cur/100,0,1)); X.stroke(); fs=Math.min(fs,rad*0.78); }
      X.save(); X.translate(cx,cy); const sc=0.8+0.2*back(a); X.scale(sc,sc); vtx(str,0,4,'900 '+Math.round(fs)+'px '+S.fam,S.acc); X.restore();
      if(L.trend){ const up=L.trend!=='down', ty=cy-fs*0.62; X.globalAlpha=S.k*cl((lt-0.9)/0.3,0,1); icon(up?'trend':'down',cx+Math.min(A.w*0.4,fs*1.1),ty,70,up?'#2FBF9B':'#E0533A',1,2.4); }
      if(has){ const la=cl((lt-0.75)/0.35,0,1); X.globalAlpha=S.k*la; const f='800 '+Math.round(Math.min(60,(L.size||84)*0.68))+'px '+S.fam, ls=tLines(L.label||L.text,f,A.w*0.94,3), y0=A.y+A.h*0.74-(ls.length-1)*38; ls.forEach((ln,j)=>vtx(ln,cx,y0+j*76+(1-ease(la))*26,f,S.ink)); } X.globalAlpha=S.k; },
    check(A,L,lt,S){ const it=cardItems(L.text).slice(0,6); if(!it.length) return; const n=it.length, rowH=Math.min(170,A.h/n), fs=Math.min(Math.round((L.size||84)*0.6),Math.round(rowH*0.36)), tot=rowH*n, y0=A.y+Math.max(0,(A.h-tot)*0.3), xr=A.x+A.w;
      it.forEach((o,i)=>{ const a=cl((lt-stag(i,n,S.dur))/0.32,0,1); if(a<=0) return; const good=(o.mark||1)>0, col=good?'#2FBF9B':'#E0533A', cy=y0+rowH*i+rowH/2, bx=xr-rowH*0.36, e=ease(a); X.globalAlpha=S.k*a;
        X.fillStyle=rgba(col,0.13); rr(A.x+(1-e)*-50,cy-rowH*0.42,A.w,rowH*0.84,24); X.fill(); X.fillStyle=col; X.beginPath(); X.arc(bx,cy,rowH*0.25*back(a),0,6.2832); X.fill(); icon(good?'check':'x',bx,cy,rowH*0.32,'#FFFFFF',cl((lt-stag(i,n,S.dur)-0.12)/0.3,0,1),3);
        X.direction='rtl'; X.textAlign='right'; X.textBaseline='middle'; const f='700 '+fs+'px '+S.fam, ls=tLines(o.main,f,A.w-rowH*0.9-30,2), th=ls.length*fs*1.22; X.font=f; X.fillStyle=S.ink; if(!good) X.globalAlpha*=0.82; ls.forEach((ln,j)=>X.fillText(ln,xr-rowH*0.74,cy-th/2+fs*0.61+j*fs*1.22)); }); X.globalAlpha=S.k; },
    timeline(A,L,lt,S){ const it=cardItems(L.text).slice(0,5); if(!it.length) return; const n=it.length, rowH=Math.min(200,A.h/n), fs=Math.min(Math.round((L.size||84)*0.54),Math.round(rowH*0.3)), bw=Math.min(230,A.w*0.26), lx=A.x+A.w-bw-36, y0=A.y+rowH/2, tt=it.map((o,i)=>stag(i,n,S.dur)), prog=cl((lt-tt[0]+0.1)/Math.max(0.4,tt[n-1]-tt[0]+0.4),0,1);
      X.globalAlpha=S.k; X.strokeStyle=S.mut; X.lineWidth=5; X.lineCap='round'; X.beginPath(); X.moveTo(lx,A.y+6); X.lineTo(lx,A.y+rowH*n-6); X.stroke(); X.strokeStyle=S.acc; X.beginPath(); X.moveTo(lx,A.y+6); X.lineTo(lx,A.y+6+(rowH*n-12)*prog); X.stroke();
      it.forEach((o,i)=>{ const a=cl((lt-tt[i])/0.3,0,1); if(a<=0) return; const cy=y0+rowH*i, e=ease(a); X.globalAlpha=S.k*a; X.fillStyle=S.acc; X.beginPath(); X.arc(lx,cy,15*back(a),0,6.2832); X.fill(); X.fillStyle=S.bg; X.beginPath(); X.arc(lx,cy,6,0,6.2832); X.fill();
        X.fillStyle=rgba(S.acc,0.16); rr(lx+26,cy-rowH*0.24,bw,rowH*0.48,rowH*0.24); X.fill(); const fy='900 '+Math.round(Math.min(50,rowH*0.27))+'px '+S.fam; vtx(tLines(o.main,fy,bw-20,1)[0]||'',lx+26+bw/2,cy+2,fy,S.acc);
        const f='700 '+fs+'px '+S.fam, ls=tLines(o.sub||'',f,lx-A.x-44,2), th=ls.length*fs*1.22; X.direction='rtl'; X.textAlign='right'; X.textBaseline='middle'; X.font=f; X.fillStyle=S.ink; ls.forEach((ln,j)=>X.fillText(ln,lx-30+(1-e)*36,cy-th/2+fs*0.61+j*fs*1.22)); }); X.globalAlpha=S.k; },
    funnel(A,L,lt,S){ const it=cardItems(L.text).slice(0,5); if(!it.length) return; const n=it.length, gap=14, bh=Math.min(150,(A.h-gap*(n-1))/n), tot=bh*n+gap*(n-1), y0=A.y+(A.h-tot)/2, cx=A.x+A.w/2, fs=Math.min(Math.round((L.size||84)*0.52),Math.round(bh*0.36));
      it.forEach((o,i)=>{ const a=cl((lt-stag(i,n,S.dur))/0.34,0,1); if(a<=0) return; const w0=A.w*(1-0.62*i/Math.max(1,n)), w1=A.w*(1-0.62*(i+1)/Math.max(1,n)), y=y0+i*(bh+gap), e=ease(a), k=0.25+0.75*e; X.globalAlpha=S.k*a; X.fillStyle=rgba(S.acc,1-0.62*i/Math.max(1,n-1||1)*0.7); X.beginPath(); X.moveTo(cx-w0/2*k,y); X.lineTo(cx+w0/2*k,y); X.lineTo(cx+w1/2*k,y+bh); X.lineTo(cx-w1/2*k,y+bh); X.closePath(); X.fill();
        const col=i<n/2?inkOn(S.acc):S.ink, f='800 '+fs+'px '+S.fam, s=o.main+(o.sub?'  ·  '+o.sub:''); vtx(tLines(s,f,Math.max(200,w1-30),1)[0]||'',cx,y+bh/2+2,f,col); }); X.globalAlpha=S.k; },
    quote(A,L,lt,S){ const a=cl((lt-0.25)/0.4,0,1), cx=A.x+A.w/2; X.globalAlpha=S.k*a*0.9; vtx('”',A.x+A.w-70,A.y+110,'900 300px Georgia, serif',S.acc); X.globalAlpha=S.k;
      let fs=Math.round((L.size||84)*0.8); let ls; for(let p=0;p<4;p++){ ls=tLines(L.text||'',(L.weight||700)+' '+fs+'px '+S.fam,A.w*0.9,7); if(ls.length*fs*1.38<=A.h*0.66) break; fs=Math.round(fs*0.88); }
      const th=ls.length*fs*1.38, y0=A.y+A.h*0.5-th/2+fs*0.3; ls.forEach((ln,j)=>{ const la=cl((lt-0.4-j*0.16)/0.36,0,1); X.globalAlpha=S.k*la; vtx(ln,cx,y0+j*fs*1.38+(1-ease(la))*24,(L.weight||700)+' '+fs+'px '+S.fam,S.ink); });
      if(L.by){ const la=cl((lt-0.6-ls.length*0.16)/0.36,0,1); X.globalAlpha=S.k*la; X.fillStyle=S.acc; X.fillRect(cx-40,y0+th+6,80,6); vtx(L.by,cx,y0+th+56,'700 '+Math.round(fs*0.6)+'px '+S.fam,S.dim); } X.globalAlpha=S.k; },
    draw(A,L,lt,S){ drawEls(A,Array.isArray(L.draw)?L.draw:[],lt,S); } };
  window.__hsCards=Object.keys(CARD);
  /* الرسم الحر: عناصر على شبكة 0..100 (x من اليسار، y من فوق) داخل مساحة الكرت. كل عنصر له at (ثانية ظهوره من بداية الكرت) */
  function drawEls(A,els,lt,S){ const px=x=>A.x+A.w*(+x||0)/100, py=y=>A.y+A.h*(+y||0)/100, u=A.w/100, ids={}; els.forEach(e=>{ if(e&&e.id!=null) ids[e.id]=e; });
    const pt=(q,o)=>{ if(Array.isArray(q)) return [px(q[0]),py(q[1])]; const e=ids[q]; if(!e) return null; return [px(e.x==null?50:e.x),py(e.y==null?50:e.y)]; };
    const half=e=>{ if(!e) return [0,0]; if(e.k==='circle') return [(e.r||9)*u,(e.r||9)*u]; if(e.k==='icon') return [(e.size||12)*u*0.62,(e.size||12)*u*0.62]; if(e.k==='box') return [(e.w||34)*u/2,(e.h||13)*u/2]; if(e.k==='img') return [(e.w||30)*u/2,(e.w||30)*u/2*(e.ratio||1)]; return [(e.size||48)*0.9,(e.size||48)*0.7]; };
    els.forEach((e,i)=>{ if(!e||!e.k) return; const at=e.at!=null?+e.at:0.3+i*0.3, k=cl((lt-at)/(e.dur||0.4),0,1); if(k<=0) return; const out=e.out!=null?cl((+e.out-lt)/0.25,0,1):1; if(out<=0) return;
      const ek=ease(k), an=e.anim||(e.k==='arrow'||e.k==='line'?'draw':e.k==='text'||e.k==='num'?'rise':'pop'), col=e.color||S.acc, x=px(e.x==null?50:e.x), y=py(e.y==null?50:e.y);
      X.save(); X.globalAlpha=S.k*out*(an==='draw'?1:Math.min(1,k*2.2)); let sc=1, dy=0; if(an==='pop') sc=0.4+0.6*back(k); else if(an==='rise') dy=(1-ek)*40; else if(an==='drop') dy=-(1-back(k))*120; if(e.pulse) sc*=1+0.045*Math.sin(lt*5.2);
      if(e.k!=='arrow'&&e.k!=='line'){ X.translate(x,y+dy); X.scale(sc,sc); X.rotate((e.rot||0)*Math.PI/180); X.translate(-x,-y); }
      if(e.k==='box'){ const w=(e.w||34)*u, h=(e.h||13)*u, r=e.r!=null?e.r*u:Math.min(30,h*0.3), fill=e.solid?col:(e.fill||rgba(col,0.14)); X.fillStyle=fill; rr(x-w/2,y-h/2,w,h,r); X.fill(); if(e.border!==false){ X.strokeStyle=col; X.lineWidth=e.lw||4; if(e.dash) X.setLineDash([14,12]); rr(x-w/2,y-h/2,w,h,r); X.stroke(); X.setLineDash([]); }
        if(e.icon){ icon(e.icon,x,y-(e.text?h*0.16:0),Math.min(w,h)*0.46,e.solid?inkOn(col):col,k,2.2); }
        if(e.text){ let fs=e.size||Math.round(Math.min(46,h*0.34)); const f=(e.weight||800)+' '+fs+'px '+S.fam, ls=tLines(e.text,f,w-24,3), th=ls.length*fs*1.2, ty=e.icon?y+h*0.3:y; ls.forEach((ln,j)=>vtx(ln,x,ty-th/2+fs*0.62+j*fs*1.2,f,e.textColor||(e.solid?inkOn(col):S.ink))); } }
      else if(e.k==='circle'){ const r=(e.r||9)*u; X.fillStyle=e.solid===false?(e.fill||rgba(col,0.14)):col; X.beginPath(); X.arc(x,y,r,0,6.2832); X.fill(); if(e.solid===false){ X.strokeStyle=col; X.lineWidth=e.lw||4; X.stroke(); }
        const tc=e.textColor||(e.solid===false?S.ink:inkOn(col)); if(e.icon) icon(e.icon,x,y,r*1.1,tc,k,2.2); else if(e.text){ const fs=e.size||Math.round(r*0.62), f=(e.weight||900)+' '+fs+'px '+S.fam, ls=tLines(e.text,f,r*1.8,2), th=ls.length*fs*1.15; ls.forEach((ln,j)=>vtx(ln,x,y-th/2+fs*0.6+j*fs*1.15,f,tc)); } }
      else if(e.k==='text'){ const fs=e.size||48, f=(e.weight||800)+' '+fs+'px '+S.fam, ls=tLines(e.text||'',f,(e.w||90)*u,4), th=ls.length*fs*1.25; ls.forEach((ln,j)=>vtx(ln,x,y-th/2+fs*0.62+j*fs*1.25,f,e.color||S.ink,e.align||'center')); }
      else if(e.k==='icon'){ const s=(e.size||12)*u; if(e.badge){ X.fillStyle=rgba(col,0.16); X.beginPath(); X.arc(x,y,s*0.78,0,6.2832); X.fill(); } icon(e.name,x,y,s,col,an==='draw'?k:1,e.lw||2); }
      else if(e.k==='num'){ const v=+e.value||0, fr=+e.from||0, p=ease(cl((lt-at)/(e.count||1.1),0,1)), dec=(String(e.value).split('.')[1]||'').length, cur=fr+(v-fr)*p; vtx((e.pre||'')+(dec?cur.toFixed(dec):fmtN(Math.round(cur)))+(e.unit||''),x,y,(e.weight||900)+' '+(e.size||150)+'px '+S.fam,col); }
      else if(e.k==='bar'){ const w=(e.w||70)*u, h=(e.h||5)*u, p=ease(cl((lt-at)/0.9,0,1)), v=cl(+e.value||0,0,100); X.fillStyle=S.mut; rr(x-w/2,y-h/2,w,h,h/2); X.fill(); X.fillStyle=col; const fw=Math.max(h,w*v/100*p); rr(e.ltr?x-w/2:x+w/2-fw,y-h/2,fw,h,h/2); X.fill(); if(e.text) vtx(e.text,x,y-h/2-30,'700 34px '+S.fam,S.ink); if(e.show!==false) vtx(fmtN(Math.round(v*p))+'%',e.ltr?x+w/2+56:x-w/2-56,y+2,'800 34px '+S.fam,col); }
      else if(e.k==='ring'){ const r=(e.r||14)*u, p=ease(cl((lt-at)/1.0,0,1)), v=cl(+e.value||0,0,100); X.lineWidth=e.lw||Math.max(10,r*0.16); X.lineCap='round'; X.strokeStyle=S.mut; X.beginPath(); X.arc(x,y,r,0,6.2832); X.stroke(); X.strokeStyle=col; X.beginPath(); X.arc(x,y,r,-Math.PI/2,-Math.PI/2+6.2832*v/100*p); X.stroke(); vtx(fmtN(Math.round(v*p))+'%',x,y+2,'900 '+Math.round(r*0.56)+'px '+S.fam,S.ink); }
      else if(e.k==='img'){ const im=IMG[e.src]; if(im&&im.ok){ const w=(e.w||30)*u, h=w*im.naturalHeight/im.naturalWidth; if(e.round!=null){ rr(x-w/2,y-h/2,w,h,e.round*u); X.clip(); } X.drawImage(im,x-w/2,y-h/2,w,h); } }
      else if(e.k==='arrow'||e.k==='line'){ let a=pt(e.from), b=pt(e.to); if(a&&b){ const ha=Array.isArray(e.from)?[0,0]:half(ids[e.from]), hb=Array.isArray(e.to)?[0,0]:half(ids[e.to]), dx0=b[0]-a[0], dy0=b[1]-a[1], len=Math.hypot(dx0,dy0)||1, ux=dx0/len, uy=dy0/len;
          const cut=(h)=>{ if(!h[0]&&!h[1]) return 0; const tx=Math.abs(ux)>1e-3?h[0]/Math.abs(ux):1e9, ty=Math.abs(uy)>1e-3?h[1]/Math.abs(uy):1e9; return Math.min(tx,ty)+12; }; const ca=cut(ha), cb=cut(hb); a=[a[0]+ux*ca,a[1]+uy*ca]; b=[b[0]-ux*cb,b[1]-uy*cb];
          const cv=+e.curve||0, mx=(a[0]+b[0])/2-uy*len*0.25*cv, my=(a[1]+b[1])/2+ux*len*0.25*cv, Q=q=>[(1-q)*(1-q)*a[0]+2*(1-q)*q*mx+q*q*b[0],(1-q)*(1-q)*a[1]+2*(1-q)*q*my+q*q*b[1]], p=an==='draw'?ek:1;
          X.strokeStyle=col; X.lineWidth=e.lw||7; X.lineCap='round'; X.lineJoin='round'; if(e.dash) X.setLineDash([4,18]); X.beginPath(); for(let q=0;q<=p+1e-4;q+=0.04){ const z=Q(Math.min(q,p)); if(q===0) X.moveTo(z[0],z[1]); else X.lineTo(z[0],z[1]); } const tip=Q(p); X.lineTo(tip[0],tip[1]); X.stroke(); X.setLineDash([]);
          if(e.k==='arrow'&&p>0.12){ const z0=Q(Math.max(0,p-0.06)), ang=Math.atan2(tip[1]-z0[1],tip[0]-z0[0]), hs=e.head||22; X.beginPath(); X.moveTo(tip[0]-hs*Math.cos(ang-0.5),tip[1]-hs*Math.sin(ang-0.5)); X.lineTo(tip[0],tip[1]); X.lineTo(tip[0]-hs*Math.cos(ang+0.5),tip[1]-hs*Math.sin(ang+0.5)); X.stroke(); }
          if(e.text&&p>0.6){ X.globalAlpha*=cl((p-0.6)/0.4,0,1); const z=Q(0.5); vtx(e.text,z[0]-uy*34,z[1]+ux*34-2,'700 '+(e.size||32)+'px '+S.fam,S.dim); } } }
      X.restore(); }); X.globalAlpha=S.k; }
  /* خلفية الكرت: لمسة حركة خفيفة بدل لون مسطّح */
  function cardDeco(w,h,L,S,lt){ const d=L.deco||'glow'; if(d==='none') return; X.save();
    if(d==='glow'||d==='dots'){ const gx=w*(0.82+0.05*Math.sin(lt*0.7)), gy=h*(0.12+0.04*Math.cos(lt*0.6)), g=X.createRadialGradient(gx,gy,0,gx,gy,w*0.9); g.addColorStop(0,rgba(S.acc,0.22)); g.addColorStop(1,rgba(S.acc,0)); X.fillStyle=g; X.fillRect(0,0,w,h); }
    if(d==='glow'||d==='dots'){ X.fillStyle=rgba(S.ink,d==='dots'?0.1:0.055); for(let y=30;y<h;y+=54) for(let x=30;x<w;x+=54){ X.beginPath(); X.arc(x,y,3,0,6.2832); X.fill(); } }
    if(d==='grid'){ X.strokeStyle=rgba(S.ink,0.07); X.lineWidth=2; X.beginPath(); for(let x=60;x<w;x+=90){ X.moveTo(x,0); X.lineTo(x,h); } for(let y=60;y<h;y+=90){ X.moveTo(0,y); X.lineTo(w,y); } X.stroke(); }
    if(d==='waves'){ X.strokeStyle=rgba(S.acc,0.2); X.lineWidth=4; for(let i=0;i<4;i++){ X.beginPath(); for(let x=0;x<=w;x+=20){ const y=h*(0.72+i*0.07)+Math.sin(x/130+lt*1.3+i)*22; if(x===0) X.moveTo(x,y); else X.lineTo(x,y); } X.stroke(); } }
    if(d==='halftone'){ X.fillStyle=rgba(S.acc,0.18); for(let y=0;y<h;y+=26) for(let x=(y/26)%2?13:0;x<w;x+=26){ const r=Math.max(0,1-Math.hypot(x-w,y)/Math.max(w,h)*1.25)*11; if(r>0.5){ X.beginPath(); X.arc(x,y,r,0,6.2832); X.fill(); } } }
    if(d==='lattice'){ X.strokeStyle=rgba(S.acc,0.16); X.lineWidth=3; const s=120; for(let y=-s;y<h+s;y+=s) for(let x=-s;x<w+s;x+=s){ X.beginPath(); for(let i=0;i<8;i++){ const an=i*Math.PI/4+Math.PI/8, r=i%2?s*0.3:s*0.5; const px=x+Math.cos(an)*r, py=y+Math.sin(an)*r; i?X.lineTo(px,py):X.moveTo(px,py); } X.closePath(); X.stroke(); X.beginPath(); X.rect(x-s*0.18,y-s*0.18,s*0.36,s*0.36); X.stroke(); } }
    if(d==='paper'){ X.fillStyle=rgba(S.ink,0.035); for(let i=0;i<260;i++){ X.fillRect(rnd(i*3)*w,rnd(i*7)*h,2+rnd(i)*40,1.5); } }
    if(d==='scan'){ X.fillStyle=rgba(S.ink,0.05); for(let y=0;y<h;y+=6) X.fillRect(0,y,w,2); }
    if(d==='blueprint'){ X.strokeStyle=rgba(S.ink,0.06); X.lineWidth=1; X.beginPath(); for(let x=0;x<w;x+=30){ X.moveTo(x,0); X.lineTo(x,h); } for(let y=0;y<h;y+=30){ X.moveTo(0,y); X.lineTo(w,y); } X.stroke(); X.strokeStyle=rgba(S.ink,0.13); X.lineWidth=2; X.beginPath(); for(let x=0;x<w;x+=150){ X.moveTo(x,0); X.lineTo(x,h); } for(let y=0;y<h;y+=150){ X.moveTo(0,y); X.lineTo(w,y); } X.stroke(); }
    X.restore(); }
  function cardBody(L,A,lt,S){ const st=L.style&&CARD[L.style]?L.style:(Array.isArray(L.draw)&&L.draw.length?'draw':'list'); try{ CARD[st](A,L,lt,S); }catch(e){ if(!window.__hsCE){ window.__hsCE=1; console.error('hs card '+st+': '+e.message); } } }
  const capRoom=()=>CAP.on?Math.round(Math.min(CAP.size,60)*1.36)+2*Math.round(Math.min(CAP.size,60)*0.38)+70:230;
  function splits(t){ if(t>=VEND) return false; const Ls=(HSX.layers||[]).filter(L=>L.type==='split'&&!L.off&&t>=L.s&&t<L.e+0.5); if(!Ls.length) return false;
    const L=Ls[Ls.length-1], Hh=Math.round(vrect(t).y); if(Hh<4) return false; const full=splitRect(L).y, lt=t-L.s, dur=Math.max(0.3,L.e-L.s);
    const bg=L.bgColor||BG, ink=L.color||(lumOf(bg)>0.55?'#15151C':INK), acc=L.accent||ACC, fam='"'+(L.font||CAP.font||FONT)+'"';
    const S={k:1,bg:bg,ink:ink,acc:acc,fam:fam,dur:dur,mut:lumOf(bg)>0.55?'#C9CDD8':'rgba(255,255,255,0.22)',dim:lumOf(bg)>0.55?'#5A5F6E':'rgba(255,255,255,0.66)'};
    X.save(); X.beginPath(); X.rect(0,0,1080,Hh); X.clip(); X.translate(0,Hh-full);
    X.fillStyle=bg; X.fillRect(0,0,1080,full); cardDeco(1080,full,L,S,lt);
    const im=L.src&&IMG[L.src]; let top=158; const bottom=full-(HSX.nocap||L.capRoom===false?46:capRoom());
    if(im&&im.ok){ const ih=(L.title||L.text||L.draw)?Math.round(full*0.5):full; X.save(); X.beginPath(); X.rect(0,0,1080,ih); X.clip(); coverDraw(im,0,0,1080,ih,1+0.06*cl(lt/dur,0,1)); X.restore(); top=ih+70; }
    if(L.title){ const fs=Math.min(L.size||84,78), f='900 '+fs+'px '+fam, tl=tLines(L.title,f,912,2), a=cl((lt-0.15)/0.32,0,1), st=L.style||'list', center=st==='stat'||st==='flow'||st==='versus'||st==='funnel'||st==='quote'||st==='draw';
      X.globalAlpha=a; X.textBaseline='middle'; if(center){ tl.forEach((ln,i)=>vtx(ln,540,top+fs*0.6+i*fs*1.2+(1-ease(a))*-22,f,ink)); const tw=Math.min(200,X.measureText(tl[0]||'').width*0.4); X.fillStyle=acc; X.fillRect(540-tw*ease(a)/2,top+tl.length*fs*1.2+10,tw*ease(a),8); }
      else { X.direction='rtl'; X.textAlign='right'; X.font=f; X.fillStyle=acc; X.fillRect(996-120*ease(a),top-18,120*ease(a),9); X.fillStyle=ink; tl.forEach((ln,i)=>X.fillText(ln,996,top+fs*0.62+i*fs*1.2+(1-ease(a))*-22)); }
      top+=tl.length*fs*1.2+40; X.globalAlpha=1; }
    const A={x:84,y:top,w:912,h:Math.max(120,bottom-top)}; cardBody(L,A,lt,S);
    X.fillStyle=acc; X.fillRect(0,full-8,1080,8);
    X.restore(); return true; }
  /* ═══════════ 3.7: قزاز · شاشة كلمة · حركات أرقام · خريطة ومسار · إطارات الصور ═══════════ */
  /* قزاز مغبّش: ياخذ اللي وراه من الشاشة نفسها ويغبّشه، فيشتغل فوق الفيديو وفوق أي خلفية */
  function glass(x,y,w,h,r,o){ o=o||{}; if(w<4||h<4) return; const m=X.getTransform(), sx=Math.abs(m.a)||1, sy=Math.abs(m.d)||1, p=28;
    X.save(); X.shadowColor='rgba(0,0,0,0.30)'; X.shadowBlur=34; X.shadowOffsetY=12; X.fillStyle='rgba(0,0,0,0.22)'; rr(x,y,w,h,r); X.fill(); X.restore();
    X.save(); rr(x,y,w,h,r); X.clip();
    try{ X.filter='blur('+(o.blur||18)+'px)'; X.drawImage(C,m.e+(x-p)*sx,m.f+(y-p)*sy,(w+2*p)*sx,(h+2*p)*sy,x-p,y-p,w+2*p,h+2*p); }catch(e){} X.filter='none';
    X.fillStyle=o.tint||'rgba(255,255,255,0.13)'; X.fillRect(x,y,w,h);
    const g=X.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'rgba(255,255,255,0.22)'); g.addColorStop(0.5,'rgba(255,255,255,0.02)'); g.addColorStop(1,'rgba(255,255,255,0.08)'); X.fillStyle=g; X.fillRect(x,y,w,h);
    X.restore(); X.save(); X.strokeStyle='rgba(255,255,255,0.44)'; X.lineWidth=2.5; rr(x+1.2,y+1.2,w-2.4,h-2.4,Math.max(0,r-1)); X.stroke(); X.restore(); }
  const VPAL=['#2FBF9B','#E0633A','#5B6BD6','#E5A823','#C24D8E','#8A8F9E'];
  const fmtN=v=>{ const n=Math.round(v*10)/10; return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,','); };
  const rnd=i=>{ const x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); };
  const vtx=(s,x,y,font,color,al)=>{ s=String(s==null?'':s); X.font=font; X.fillStyle=color; X.textAlign=al||'center'; X.textBaseline='middle'; X.direction=hasAr(s)?'rtl':'ltr'; X.fillText(s,x,y); };
  function vizLayout(L){ const lay=L.kind==='cta'?'bare':(L.layout||'stage');
    if(lay==='stage') return {lay,rect:{x:350,y:1350,w:380,h:510,r:36,nocapHs:true},P:{x:64,y:120,w:952,h:1060}};
    if(lay==='full') return {lay,rect:{x:350,y:1920,w:380,h:510,r:36,off:true,nocapHs:true},P:{x:64,y:290,w:952,h:1330}};
    if(lay==='split'){ const r=splitRect(L); return {lay,rect:r,P:{x:0,y:0,w:1080,h:r.y}}; }
    if(lay==='over'){ const w=(L.w||0.82)*1080, h=w*(L.ratio||0.8); return {lay,rect:null,P:{x:(L.x==null?0.5:L.x)*1080-w/2,y:(L.y==null?0.3:L.y)*1920-h/2,w:w,h:h}}; }
    return {lay:'bare',rect:null,P:{x:0,y:0,w:1080,h:1920}}; }
  /* ── الأنواع ── كل نوع يرسم داخل R ويستلم S={k,ink,acc,mut,fam,dur} */
  const DOTC={};
  function dotPts(str){ if(DOTC[str]) return DOTC[str]; const c=document.createElement('canvas'); c.width=320; c.height=120; const x=c.getContext('2d'); x.font='900 100px Arial, Helvetica, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.direction='ltr'; x.fillText(str,160,64,300);
    const d=x.getImageData(0,0,320,120).data, pts=[]; for(let yy=2;yy<120;yy+=3) for(let xx=2;xx<320;xx+=3) if(d[(yy*320+xx)*4+3]>120) pts.push([xx/320-0.5,(yy-60)/320]); return DOTC[str]=pts; }
  const LAND=atob('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//4AAf///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////h//////7eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/7//4////////wAAAAAAAAAAAMAAAAAHgAAAAAAAAAAAAAAAAAAAAAAAAAAA///8Af//////8AAAAB7nwAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAEDzH3/4////////4AAAAAfkAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAYAAAP/Af///////+AAAAAPCAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAADtDAM2f+AH///////4AAAAAAAAAAAAAB4AAAAB/8AAAAAAAAAAAAAAAAAAAAAH/wcz78AAAP/////8AAAAAAAAAAAAD4AAAA////AAAB/gAAAAAAAAAAAAAACAQAAAIAAAAH/////8AAAAAAAAAAAAOAAAAP///4AAAAAAAAAAAAAAAAAAAAP8AIe+M/gAAD/////4AAAAAAAAAAAA4AAAH////f8DAAGAAAAAAAAAAAAAAAfv+4+Q//wAAB/////wAAAAAAAAAAABwAHgH///////4APwAAAAAwAAAAAAAAOP/8E4///AABf////wAAAAAAAAAAADwAPL////////42//gAAAAAAAP8AAAAAH/+A8f//4AA////+wAAAAAAB/AAAAAAfv/////////////8AAAAAB///+F/3H//CeBwf+AAn////AAAAAAA//4AAAAcPv/////////////+9n8wAP///////+Q4DPzwD8AAX///wAAAAAAH///wADf/3m/////////////////+AD////////////3wZ/wA///4AAAAAAAH///+I////v//////////////////4E/////////////gD/8Af//gAAAAAAAf//9+P////f/////////////////Lwf////////////6AD+YAf/wAAf8AAAA/8f+D///////////////////////AgAf///////////zw7/gAP/gAAP4AAAB/4/+f//////////////////////8AAAf///////////DAA/gAH/gAADAAAAH/z/////////////////////////+AAH///////////8AAgGAAD/AAAAAAAA//H/////////////////////////6AAP///////////wAA/AAAB+AAAAAAAB/+H//////////////////////jP+AAAH/9z////////gAA/wAAAGAAAAAAAB//D7////////////////////+A/YAAAA/zAB///////gAA/wQAAAAAAAAAAA//gb///////////////////+cBgAAAAADwAAf//////4AA/94AAAAAAAAAQA5+A///////////////////4AAHAAAAAADIAAP//////4AAf/8AAAAAAAAA8AA+C///////////////////wAAfgAAAAAMAAAD///////wAf/+AAAAAAAAA4AMcH///////////////////AAA/gAAAAAgAAAB///////8Af//AAAAAAAAAcANQH//////////////////8AAA/AAAAAAAAAAAf///////x///wAAAAAAAHGAEBv//////////////////+AAA+AAAAAAAAAABP///////x///8AAAAAAAPHAf/////////////////////6AA8AAAAAAAAAAAH///////x///8AAAAAAAPPx//////////////////////6AAwAAAAAAAAAAAD///////9///8AAAAAAAAPj//////////////////////6AAQAAAAAAAAAAAD///////////EAAAAAAAAYP//////////////////////7AAAAAAAAAAAAAAB/////////+APAAAAAAAAA///////////////////////zAAAAAAAAAAAAAAAf/////////gfAAAAAAAAP///////////////////////yAAAAAAAAAAAAAAAP/////////gDgAAAAAAAH///////////////////////iAAAAAAAAAAAAAAAP/////////xAAAAAAAAAD/////vP////////////////CAAAAAAAAAAAAAAAP/////////+AAAAAAAAAB/////Gf///////////////+AAAAAAAAAAAAAAAAP////////8wAAAAAAAAAB//H/+AP///////////////8CAAAAAAAAAAAAAAAP////////wAAAAAAAAADj/jz/8AD///////////////4HgAAAAAAAAAAAAAAP////////gAAAAAAAAAH/4Bw/8AB//////////////+ALAAAAAAAAAAAAAAAP////////gAAAAAAAAAH/wAcf8PB//////////////8AAAAAAAAAAAAAAAAAP///////8AAAAAAAAAAH/gMHfN///////////////v4AMAAAAAAAAAAAAAAAP///////8AAAAAAAAAAH/AMCOP//////////////+JwAMAAAAAAAAAAAAAAAH///////4AAAAAAAAAAH/AAAHH//////////////8BwAIAAAAAAAAAAAAAAAD///////wAAAAAAAAAAH+AAYGH//////////////+w4AYAAAAAAAAAAAAAAAD///////wAAAAAAAAAAAgf+AABM//////////////g4D4AAAAAAAAAAAAAAAB///////wAAAAAAAAAAAh/+AAAA//////////////A4fwAAAAAAAAAAAAAAAA///////gAAAAAAAAAAB//8AAAA//////////////AB+AAAAAAAAAAAAAAAAAP/////+AAAAAAAAAAAD//+AAAB//////////////gDwAAAAAAAAAAAAAAAAAH/////8AAAAAAAAAAAH///4GAB//////////////gDAAAAAAAAAAAAAAAAAAG/////4AAAAAAAAAAAP///8P4D//////////////wCAAAAAAAAAAAAAAAAAACf////4AAAAAAAAAAAP////v////////////////gAAAAAAAAAAAAAAAAAAABP//hAYAAAAAAAAAAAP/////////H///////////wAAAAAAAAAAAAAAAAAAAAv//AAYAAAAAAAAAAAf/////////H///////////wAAAAAAAAAAAAAAAAAAAA3/+AAcAAAAAAAAAAB///////8//h///////////gAAAAAAAAAAAAAAAAAAAAR/+AAMAAAAAAAAAAD///////8//wH//////////AAAAAAAAAAAAAAAAAAAAAJ/+AAEAAAAAAAAAAH///////+f/8B/////////+AAAAAAAAAAAAAAAAAAAAAI/8AAAAAAAAAAAAAH///////+f/84Af///////8QAAAAAAAAAAAAAAAAAAAAAf8AAAAAAAAAAAAAP////////H//+AP///////4gAAAAAAAAAAAAAAAAAAAAAP8AAuAAAAAAAAAAP////////H///AH///////AgAAAAAAAAAAAAAAAAAAAAAH8AYBgAAAAAAAAAf////////n//+AD//4P//YAAAAAAAAAAAAAAAAAAAAAAAH+A4A4AAAAAAAAAP////////j//8AAf/4H/+AAAAAAAAAAAAAAAAgAAAAAAAH/BwABwAAAAAAAAP////////h//8AAf/gD/8YAAAAAAAAAAAAAAAAAAAAAAAD/nwAB4AAAAAAAAP////////x//4AAf/AD/8QAAAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAP////////4//gAAf+AB/+AAwAAAAAAAAAAAAAAAAAAAAAAH/wAAAAAAAAAAAP////////4f+AAAf8ADf/AAwAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAf////////8f8AAAPwAAP/gAwAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAf////////+fgAAAPwAAP/gAQAAAAAAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAf/////////eAAAAHwAAP/gAEAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAf/////////gAAAAHwAAE/gAAAAAAAAAAAAAAAAAAAAAAAAAADABIAAAAAAAAP/////////gIAAADwAAEfgAIAAAAAAAAAAAAAAAAAAAAAAAADgH/IAAAAAAAH/////////34AAADwAAIOAAEAAAAAAAAAAAAAAAAAAAAAAAAAiPf+AAAAAAAD//////////4AAADgAAIEAAAAAAAAAAAAAAAAAAAAAAAAAAAAd///AAAAAAAB//////////wAAABIAAMAAAHAAAAAAAAAAAAAAAAAAAAAAAAAE///gAAAAAAB//////////wAAAAMAAEAAALgAAAAAAAAAAAAAAAAAAAAAAAAAf//wAAAAAAAf/////////gAAAAMAADAAMDAAAAAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAP/B///////gAAAAAAADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAf///wAAAAAACAA3//////AAAAAAAAxgA8AAAAAAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAD/////+AAAAAAAAZgB8AAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAAAAD/////8AAAAAAAAMwH8AAAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAD/////4AAAAAAAAHQf8AAAAAAAAAAAAAAAAAAAAAAAAAAD////8AAAAAAAAAH/////gAAAAAAAAHwf8UAAAAAAAAAAAAAAAAAAAAAAAAAD////+AAAAAAAAAH/////AAAAAAAAADwf4AAgAAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAAH/////AAAAAAAAABwP5wBwAAAAAAAAAAAAAAAAAAAAAAAH/////+AAAAAAAAD////+AAAAAAAAAB8PxwAz4AAAAAAAAAAAAAAAAAAAAAAD//////4AAAAAAAB////8AAAAAAAAAA8AxQgf/AAAAAAAAAAAAAAAAAAAAAAH//////8AAAAAAAA////4AAAAAAAAAAcAAIAD/gIAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAA////4AAAAAAAAAAMAAAAA/xwAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAAf///4AAAAAAAAAADAAAAAf8AAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAAf///4AAAAAAAAAAB+AAAA/4AAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///4AAAAAAAAAAAAGgAAOMAAAAAAAAAAAAAAAAAAAAAA///////AAAAAAAAf///8AAAAAAAAAAAAACAAAGAAAAAAAAAAAAAAAAAAAAAA//////+AAAAAAAAP///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////+AAAAAAAAP///8AAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAf///+AQAAAAAAAAAAAAB+CAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAAf///+AwAAAAAAAAAAAAD8DAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAA////+AwAAAAAAAAAAAAz8DgAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAA////8BwAAAAAAAAAAAB/8DgAAAAAAAAAAAAAAAAAAAAAAB/////4AAAAAAAA////8HwAAAAAAAAAAAD//HwAAAAAAAAAAAAAAAAAAAAAAAf////4AAAAAAAA////wPgAAAAAAAAAAAP//3wAAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAA////gPgAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAAf//+APgAAAAAAAAAAAf///4AAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAAf//+APgAAAAAAAAAAD////+AAAAAAAAAAAAAAAAAAAAAAAP////gAAAAAAAAP//+APAAAAAAAAAAAf////+AAAAAAAAAAAAAAAAAAAAAAAP////AAAAAAAAAP///AfAAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAP//+APAAAAAAAAAAA//////gAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAAAAH//+AOAAAAAAAAAAB//////wAAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AEAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAH//4AAAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAH//4AAAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAD//wAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAf//8AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA//AAAAAAAAAAAAAAP/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA/+AAAAAAAAAAAAAAP/AP//wAAAAAAAAAAAAAAAAAAAAAA///gAAAAAAAAAAA/4AAAAAAAAAAAAAAf8AG//gAAAAAAAAAAAAAAAAAAAAAA///AAAAAAAAAAAAYAAAAAAAAAAAAAAAOAAE//gAAAAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/AAABAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAQAAAAAAAAAAAAAAAAAB//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAAcAAAAAAAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAADAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAHAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAOAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAHwAAAAAA7+PgBD/AAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAD//gAAB//////////AAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAB////8A////////////kAAAAAAAAAAAAAAAAAAAAAAz8AAAAAAAAAAAAAAAGD////4D/////////////4AAAAAAAAAAAAAAAAAAAAAb8AAAAAAAAAAAM/gB//////4//////////////+gAAAAAAAAAAAAAAAAAAAD9+AAAAAAAAb+///////////5////////////////wAAAAAAAAAAAAAAMAAAAZ+AAAAAAAA//////////////////////////////wAAAAAAAAAAAAAB///Ht/+AAAAAAAP/////////////////////////////+AAAAAAAAAAAXfoAf/////8AAAAAAA//////////////////////////////4AAAAAAAAX////////////wAAAAAAB//////////////////////////////gAAAAAAAD///////////PwAAAAAAf///////////////////////////////gAAAAAD+f///////////8AAAAAAP////////////////////////////////wAAAAAAf////////////AAAAD8A/////////////////////////////////wAAAAB4B////////////gQAAH+AB///////////////////////////////+AAAAAAAA////////////wAAA/wAH///////////////////////////////+AAAAAAAP//////////////AAAA//////////////////////////////////AAAAAAAP//////////////wD/3//////////////////////////////////4AAAAAP//////////////////////////////////////////////////////4A/wAH////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////');
  const landAt=(la,lo)=>{ const j=Math.floor(90-la), i=Math.floor(((lo+180)%360+360)%360); if(j<0||j>179) return 0; const ix=j*360+i; return (LAND.charCodeAt(ix>>3)>>(7-(ix&7)))&1; };
  const MAPC={};
  const VK={
    pctdots(R,lt,L,S){ const vals=Array.isArray(L.values)&&L.values.length?L.values:[L.value==null?60:L.value], seg=S.dur/vals.length, i=Math.min(vals.length-1,Math.floor(lt/seg)), ls=lt-i*seg;
      const str=fmtN(+vals[i]||0)+(L.unit==null?'%':L.unit), pts=dotPts(str), W=R.w*0.96, cx=R.x+R.w/2, cy=R.y+R.h*(L.label?0.42:0.5), out=vals.length>1&&i<vals.length-1?cl((seg-ls)/0.32,0,1):1;
      X.fillStyle=S.acc; for(let j=0;j<pts.length;j++){ const h1=rnd(j+1), p=ease(cl((ls-h1*0.45)/0.55,0,1))*ease(out);
        const sx=cx+(rnd(j+77)-0.5)*R.w*1.05, sy=cy+(rnd(j+191)-0.5)*R.h*0.85, tx=cx+pts[j][0]*W, ty=cy+pts[j][1]*W;
        X.globalAlpha=S.k*(0.22+0.78*p); X.beginPath(); X.arc(sx+(tx-sx)*p,sy+(ty-sy)*p+Math.sin(lt*2.2+j)*(1-p)*8,4.4,0,6.2832); X.fill(); }
      X.globalAlpha=S.k; if(L.label) wrapTxtC(L.label,R.x+R.w/2,R.y+R.h*0.8,R.w*0.9,'700 44px '+S.fam,S.ink,2); },
    people(R,lt,L,S){ const v=cl(+L.value||0,0,100), lab=L.label?120:0, numH=170, cell=Math.min(R.w/10,(R.h-numH-lab)/10), gx=R.x+(R.w-cell*10)/2, n=Math.round(v*cl((lt-0.35)/1.3,0,1)), s=cell*0.36;
      for(let i=0;i<100;i++){ const x=gx+(9-i%10)*cell+cell/2, y=R.y+Math.floor(i/10)*cell+cell/2, ap=cl((lt-i*0.004)/0.25,0,1); X.globalAlpha=S.k*ap; X.fillStyle=i<n?S.acc:S.mut;
        X.beginPath(); X.arc(x,y-s*0.66,s*0.38,0,6.2832); X.fill(); rr(x-s*0.5,y-s*0.2,s,s*1.15,s*0.42); X.fill(); }
      X.globalAlpha=S.k; vtx(fmtN(n)+'%',R.x+R.w/2,R.y+cell*10+numH*0.5,'900 124px '+S.fam,S.acc); if(L.label) wrapTxtC(L.label,R.x+R.w/2,R.y+cell*10+numH+lab*0.4,R.w*0.9,'700 42px '+S.fam,S.ink,2); },
    fill(R,lt,L,S){ const v=cl(+L.value||0,0,100), lab=L.label?130:0, rad=Math.min(R.w,R.h-lab)*0.42, cx=R.x+R.w/2, cy=R.y+(R.h-lab)/2, lv=v*ease(cl((lt-0.3)/1.4,0,1));
      X.save(); X.beginPath(); X.arc(cx,cy,rad,0,6.2832); X.clip(); X.fillStyle=L.color2||S.mut; X.fillRect(cx-rad,cy-rad,rad*2,rad*2);
      const top=cy+rad-2*rad*lv/100, wv=(lv>1&&lv<99)?11:0; X.fillStyle=S.acc; X.beginPath(); X.moveTo(cx-rad,cy+rad); for(let x=-rad;x<=rad;x+=8) X.lineTo(cx+x,top+Math.sin(x/40+lt*3.1)*wv); X.lineTo(cx+rad,cy+rad); X.closePath(); X.fill(); X.restore();
      X.save(); X.shadowColor='rgba(0,0,0,0.35)'; X.shadowBlur=14; X.shadowOffsetY=4; vtx(fmtN(Math.round(lv))+'%',cx,cy,'900 '+Math.round(rad*0.52)+'px '+S.fam,'#FFFFFF'); X.restore();
      if(L.label) wrapTxtC(L.label,cx,R.y+R.h-lab*0.45,R.w*0.9,'700 42px '+S.fam,S.ink,2); },
    bars(R,lt,L,S){ const it=(Array.isArray(L.items)?L.items:[]).filter(b=>b&&isFinite(+b.value)).slice(0,6); if(!it.length) return; const mx=Math.max(...it.map(b=>+b.value))||1, n=it.length, labH=130, topH=80, gh=R.h-labH-topH, step=R.w/n, bw=Math.min(170,step*0.56), by=R.y+topH+gh;
      X.strokeStyle=S.mut; X.lineWidth=3; X.beginPath(); X.moveTo(R.x,by); X.lineTo(R.x+R.w,by); X.stroke();
      it.forEach((b,i)=>{ const x=R.x+step*(n-1-i)+step/2, p=ease(cl((lt-0.25-i*0.3)/0.75,0,1)), h=Math.max(2,gh*(+b.value/mx)*p);
        X.globalAlpha=S.k; X.fillStyle=b.color||VPAL[i%VPAL.length]; rr(x-bw/2,by-h,bw,h,Math.min(16,bw/4,h/2)); X.fill(); X.fillRect(x-bw/2,by-Math.min(h,16),bw,Math.min(h,16));
        X.globalAlpha=S.k*cl(p*2,0,1); vtx(fmtN(Math.round(+b.value*p))+(L.unit?' '+L.unit:''),x,by-h-38,'800 38px '+S.fam,S.ink);
        X.globalAlpha=S.k; wrapTxtC(b.label||'',x,by+34,step*0.92,'700 30px '+S.fam,S.ink,2,'top'); }); X.globalAlpha=S.k; },
    route(R,lt,L,S){ const A=L.from||{}, B=L.to||{}; if(!isFinite(+A.lat)||!isFinite(+A.lon)||!isFinite(+B.lat)||!isFinite(+B.lon)) return; const infoH=160, M={x:R.x,y:R.y,w:R.w,h:R.h-infoH};
      let lo0=Math.min(A.lon,B.lon), lo1=Math.max(A.lon,B.lon), la0=Math.min(A.lat,B.lat), la1=Math.max(A.lat,B.lat); const pl=Math.max(9,(lo1-lo0)*0.4), pa=Math.max(9,(la1-la0)*0.4); lo0-=pl; lo1+=pl; la0-=pa; la1+=pa;
      const sc=Math.min(M.w/(lo1-lo0),M.h/(la1-la0)), cl0=(lo0+lo1)/2, ca0=(la0+la1)/2, px=lo=>M.x+M.w/2+(lo-cl0)*sc, py=la=>M.y+M.h/2-(la-ca0)*sc;
      const key=[A.lat,A.lon,B.lat,B.lon,Math.round(M.w),Math.round(M.h),L.sea,L.land].join('|'); let mc=MAPC[key];
      if(!mc){ mc=MAPC[key]=document.createElement('canvas'); mc.width=Math.round(M.w); mc.height=Math.round(M.h); const g=mc.getContext('2d'); g.fillStyle=L.sea||'#DCE8F4'; g.fillRect(0,0,mc.width,mc.height); g.fillStyle=L.land||'#9DB4CC';
        const stp=sc<6?Math.ceil(6/sc):1, d=sc*stp, rr0=d*0.4; for(let la=Math.floor(ca0-M.h/2/sc)-stp; la<=ca0+M.h/2/sc+stp; la+=stp) for(let lo=Math.floor(cl0-M.w/2/sc)-stp; lo<=cl0+M.w/2/sc+stp; lo+=stp){ if(!landAt(la+stp/2,lo+stp/2)) continue; const x=M.w/2+(lo+stp/2-cl0)*sc, y=M.h/2-(la+stp/2-ca0)*sc; g.beginPath(); g.arc(x,y,rr0,0,6.2832); g.fill(); } }
      X.save(); rr(M.x,M.y,M.w,M.h,28); X.clip(); X.drawImage(mc,M.x,M.y,M.w,M.h);
      const x0=px(A.lon), y0=py(A.lat), x1=px(B.lon), y1=py(B.lat), len=Math.hypot(x1-x0,y1-y0)||1, nx=-(y1-y0)/len, ny=(x1-x0)/len, sg=ny>0?-1:1, cxp=(x0+x1)/2+nx*sg*len*0.2, cyp=(y0+y1)/2+ny*sg*len*0.2;
      const p=eio(cl((lt-0.5)/Math.min(3.4,Math.max(1.2,S.dur*0.55)),0,1)), Q=u=>[(1-u)*(1-u)*x0+2*(1-u)*u*cxp+u*u*x1,(1-u)*(1-u)*y0+2*(1-u)*u*cyp+u*u*y1];
      const path=()=>{ X.beginPath(); for(let u=0;u<=p+0.0001;u+=0.01){ const q=Q(Math.min(u,p)); if(u===0) X.moveTo(q[0],q[1]); else X.lineTo(q[0],q[1]); } X.stroke(); }; X.lineCap='round'; X.strokeStyle='rgba(255,255,255,0.9)'; X.lineWidth=13; path(); X.strokeStyle='#15151C'; X.lineWidth=7; X.setLineDash([2,17]); path(); X.setLineDash([]);
      const pin=(x,y,a)=>{ X.globalAlpha=S.k*a; X.fillStyle='#FFFFFF'; X.beginPath(); X.arc(x,y,19,0,6.2832); X.fill(); X.fillStyle=S.acc; X.beginPath(); X.arc(x,y,12,0,6.2832); X.fill(); };
      const lbl=(s,x,y,a,up)=>{ if(!s) return; X.globalAlpha=S.k*a; X.font='800 38px '+S.fam; X.textAlign='center'; X.textBaseline='middle'; X.direction=hasAr(s)?'rtl':'ltr'; X.lineJoin='round'; X.strokeStyle='#FFFFFF'; X.lineWidth=9; const xx=cl(x,M.x+110,M.x+M.w-110), yy=cl(y+(up?-50:54),M.y+30,M.y+M.h-30); const _u=0; X.strokeText(s,xx,yy); X.fillStyle='#15151C'; X.fillText(s,xx,yy); };
      pin(x0,y0,cl(lt/0.3,0,1)); pin(x1,y1,cl(lt/0.3,0,1)*(0.5+0.5*cl((p-0.9)/0.1,0,1)));
      const h=Q(p), h2=Q(Math.min(1,p+0.01)), ang=Math.atan2(h2[1]-h[1],h2[0]-h[0]); X.globalAlpha=S.k; X.save(); X.translate(h[0],h[1]); X.rotate(p>=1?Math.atan2(y1-cyp,x1-cxp):ang); X.scale(1.5,1.5); X.fillStyle=S.acc; X.strokeStyle='#FFFFFF'; X.lineWidth=3; X.lineJoin='round';
      if(L.mode==='car'){ rr(-24,-13,48,26,9); X.stroke(); X.fill(); X.fillStyle='#FFFFFF'; X.fillRect(-2,-9,14,18); }
      else { X.beginPath(); X.moveTo(30,0); X.lineTo(-6,-7); X.lineTo(-18,-26); X.lineTo(-26,-26); X.lineTo(-18,-6); X.lineTo(-30,-5); X.lineTo(-36,-14); X.lineTo(-40,-14); X.lineTo(-36,0); X.lineTo(-40,14); X.lineTo(-36,14); X.lineTo(-30,5); X.lineTo(-18,6); X.lineTo(-26,26); X.lineTo(-18,26); X.lineTo(-6,7); X.closePath(); X.stroke(); X.fill(); }
      X.restore(); lbl(A.name,x0,y0,cl(lt/0.4,0,1),y0<=y1); lbl(B.name,x1,y1,cl((p-0.85)/0.15,0,1),y1<y0); X.restore(); X.globalAlpha=S.k;
      const R0=6371, r=Math.PI/180, hav=2*R0*Math.asin(Math.sqrt(Math.pow(Math.sin((B.lat-A.lat)*r/2),2)+Math.cos(A.lat*r)*Math.cos(B.lat*r)*Math.pow(Math.sin((B.lon-A.lon)*r/2),2))), km=+L.km||Math.round(hav/10)*10, kmNow=p>=1?km:Math.round(km*p);
      const iy=R.y+R.h-infoH*0.42, s1=fmtN(kmNow)+' كم', s2=L.time?String(L.time):''; if(s2){ vtx(s1,R.x+R.w*0.72,iy,'900 64px '+S.fam,S.acc); vtx(s2,R.x+R.w*0.27,iy,'800 52px '+S.fam,S.ink); X.fillStyle=S.mut; X.fillRect(R.x+R.w/2-2,iy-34,4,68); } else vtx(s1,R.x+R.w/2,iy,'900 68px '+S.fam,S.acc); },
    shot(R,lt,L,S){ const im=L.src&&IMG[L.src]; if(!im||!im.ok) return; X.save(); rr(R.x,R.y,R.w,R.h,24); X.clip(); const s=R.w/im.naturalWidth, ih=im.naturalHeight*s, pan=ih>R.h&&L.scroll!==false?(ih-R.h)*eio(cl((lt/S.dur-0.12)/0.76,0,1)):0; X.drawImage(im,R.x,R.y-pan,R.w,ih); X.restore(); },
    draw(R,lt,L,S){ drawEls(R,Array.isArray(L.draw)?L.draw:[],lt,{...S,bg:S.cb||'#F5F6FA',dim:S.dim||S.ink}); },
    card(R,lt,L,S){ cardBody(L,R,lt,{...S,bg:S.cb||'#F5F6FA',dim:S.dim||S.ink}); },
    cta(R,lt,L,S){ X.globalAlpha=S.k*0.55; X.fillStyle='#000000'; X.fillRect(0,0,1080,1920); X.globalAlpha=S.k; const cy=(L.y==null?0.7:L.y)*1920, wp=back(cl((lt-0.18)/0.42,0,1)), fs=L.size||200;
      X.save(); X.shadowColor='rgba(0,0,0,0.5)'; X.shadowBlur=22; X.shadowOffsetY=6; if(L.pre) vtx(L.pre,540,cy-fs*0.82,'800 66px '+S.fam,'#FFFFFF');
      X.save(); X.translate(540,cy); X.scale(wp,wp); vtx(L.word||'',0,0,'900 '+fs+'px '+S.fam,S.acc); X.restore();
      if(L.post){ X.globalAlpha=S.k*cl((lt-0.5)/0.3,0,1); vtx(L.post,540,cy+fs*0.8,'800 62px '+S.fam,'#FFFFFF'); } X.restore(); X.globalAlpha=S.k; } };
  function wrapTxtC(txt,cx,y,maxW,font,color,maxL,base){ X.font=font; const ls=wrapTxt(txt,maxW).slice(0,maxL||3), fs=parseInt(String(font).match(/(\d+)px/)[1],10), lh=fs*1.3, y0=base==='top'?y+lh/2:y-(ls.length-1)*lh/2; ls.forEach((l,i)=>vtx(l,cx,y0+i*lh,font,color)); }
  function vizs(t){ if(t>=VEND) return false; const Ls=(HSX.layers||[]).filter(L=>L.type==='viz'&&!L.off&&t>=L.s&&t<L.e+0.42); let stage=false;
    for(const L of Ls){ const V=vizLayout(L), lt=t-L.s, dur=Math.max(0.2,L.e-L.s), k=ease(cl(lt/0.4,0,1))*cl((L.e+0.42-t)/0.42,0,1), acc=L.accent||ACC, fam='"'+(L.font||CAP.font||FONT)+'"', P=V.P; let ink='#FFFFFF', mut='rgba(255,255,255,0.3)';
      X.save();
      if(V.lay==='stage'||V.lay==='full'){ stage=true; const R=vrect(t), vis=R.y<1919; X.save(); X.globalAlpha=k; X.beginPath(); X.rect(0,0,1080,1920);
          if(vis){ const r=Math.min(R.r||0,R.w/2,R.h/2); X.moveTo(R.x+r,R.y); X.arcTo(R.x+R.w,R.y,R.x+R.w,R.y+R.h,r); X.arcTo(R.x+R.w,R.y+R.h,R.x,R.y+R.h,r); X.arcTo(R.x,R.y+R.h,R.x,R.y,r); X.arcTo(R.x,R.y,R.x+R.w,R.y,r); X.closePath(); }
          X.clip('evenodd'); X.fillStyle=L.stageColor||'#0B0A12'; X.fillRect(0,0,1080,1920); const g=X.createRadialGradient(180,120,0,180,120,950); g.addColorStop(0,rgba(acc,0.22)); g.addColorStop(1,rgba(acc,0)); X.fillStyle=g; X.fillRect(0,0,1080,1920); X.restore();
          if(vis){ X.save(); X.globalAlpha=k; X.strokeStyle=acc; X.lineWidth=5; rr(R.x,R.y,R.w,R.h,R.r||0); X.stroke(); X.restore(); }
          const cb=L.bgColor||'#F5F6FA'; ink=L.color||(lumOf(cb)>0.5?'#15151C':'#FFFFFF'); mut=lumOf(cb)>0.5?'#C9CDD8':'rgba(255,255,255,0.28)';
          X.globalAlpha=k; X.translate(0,(1-ease(cl(lt/0.45,0,1)))*70); X.fillStyle=cb; rr(P.x,P.y,P.w,P.h,44); X.fill(); X.strokeStyle=acc; X.lineWidth=5; rr(P.x,P.y,P.w,P.h,44); X.stroke(); }
      else if(V.lay==='split'){ const Hh=Math.round(vrect(t).y); if(Hh<4){ X.restore(); continue; } const cb=L.bgColor||BG; ink=L.color||INK; mut=lumOf(cb)>0.5?'#C9CDD8':'rgba(255,255,255,0.28)';
          X.beginPath(); X.rect(0,0,1080,Hh); X.clip(); X.translate(0,Hh-P.h); X.fillStyle=cb; X.fillRect(0,0,1080,P.h); X.fillStyle=acc; X.fillRect(0,P.h-8,1080,8); }
      else if(V.lay==='over'){ X.globalAlpha=k; const K=enterK(L,t); X.translate(P.x+P.w/2+K.dx,P.y+P.h/2+K.dy); X.scale(K.sc,K.sc); X.translate(-(P.x+P.w/2),-(P.y+P.h/2)); glass(P.x,P.y,P.w,P.h,44); }
      const _cb=(V.lay==='stage'||V.lay==='full')?(L.bgColor||'#F5F6FA'):V.lay==='split'?(L.bgColor||BG):'#20202A', S={k:V.lay==='split'?1:k,ink:ink,acc:acc,mut:mut,fam:fam,dur:dur,cb:_cb,dim:lumOf(_cb)>0.55?'#5A5F6E':'rgba(255,255,255,0.7)'}; X.globalAlpha=S.k; let top=P.y+56;
      if(L.title&&V.lay!=='bare'){ X.font='800 40px '+fam; const tw=X.measureText(L.title).width+76, ty=(V.lay==='stage'||V.lay==='full')?P.y:P.y+70; X.fillStyle='#15151C'; rr(540-tw/2,ty-36,tw,72,36); X.fill(); vtx(L.title,540,ty+2,'800 40px '+fam,'#FFFFFF'); top=ty+36+40; }
      const R0={x:P.x+56,y:top,w:P.w-112,h:P.y+P.h-56-top-(V.lay==='split'?8:0)};
      try{ (VK[L.kind]||VK.pctdots)(V.lay==='bare'?P:R0,lt,L,S); }catch(e){ if(!window.__hsVE){ window.__hsVE=1; console.error('hs viz '+L.kind+': '+e.message); } }
      X.restore(); X.setTransform(1,0,0,1,0,0); X.globalAlpha=1; X.setLineDash([]); }
    return stage; }
  /* شاشة كاملة بكلمة وحدة */
  function covers(t){ if(t>=VEND) return; for(const L of (HSX.layers||[])){ if(L.type!=='cover'||L.off||t<L.s||t>=L.e) continue; const a=cl((t-L.s)/0.1,0,1)*cl((L.e-t)/0.1,0,1), bg=L.bgColor||'#F3F2EE';
      X.save(); X.globalAlpha=a; X.fillStyle=bg; X.fillRect(0,0,1080,1920); X.restore();
      const o={...L,x:0.5,y:L.y==null?0.44:L.y,size:L.size||230,weight:L.weight||900,color:L.color||(lumOf(bg)>0.5?'#15151C':'#FFFFFF'),bg:'none',shadow:false,width:960,anim:L.anim||'pop'}; X.save(); X.globalAlpha=a; textBlock(o,t,enterK(o,t)); X.restore(); } }
  /* إطارات الصور: متصفح · بوست · قزاز · حلقة */
  function framed(L,im,t,K,kk){ const cx=(L.x==null?0.5:L.x)*1080, cy=(L.y==null?0.36:L.y)*1920; X.save(); X.globalAlpha=K.a*(L.opacity==null?1:L.opacity); X.translate(cx+K.dx,cy+K.dy); X.scale(K.sc,K.sc);
    if(L.frame==='browser'){ const w=(L.w||0.84)*1080, bar=Math.round(w*0.085), ch=w*(L.ratio||1.25), h=bar+ch;
      X.shadowColor='rgba(0,0,0,0.45)'; X.shadowBlur=50; X.shadowOffsetY=20; X.fillStyle='#FFFFFF'; rr(-w/2,-h/2,w,h,28); X.fill(); X.shadowColor='transparent'; X.shadowBlur=0; X.shadowOffsetY=0;
      rr(-w/2,-h/2,w,h,28); X.clip(); X.fillStyle='#ECECF1'; X.fillRect(-w/2,-h/2,w,bar);
      ['#FF5F57','#FEBC2E','#28C840'].forEach((c,i)=>{ X.fillStyle=c; X.beginPath(); X.arc(-w/2+bar*0.5+i*bar*0.4,-h/2+bar/2,bar*0.12,0,6.2832); X.fill(); });
      const uw=w*0.56; X.fillStyle='#FFFFFF'; rr(-uw/2,-h/2+bar*0.2,uw,bar*0.6,bar*0.3); X.fill(); if(L.url){ X.save(); X.beginPath(); X.rect(-uw/2+14,-h/2,uw-28,bar); X.clip(); vtx(String(L.url).replace(/^https?:\/\//,''),0,-h/2+bar/2+1,'600 '+Math.round(bar*0.3)+'px Inter, Arial','#55555F'); X.restore(); }
      X.beginPath(); X.rect(-w/2,-h/2+bar,w,ch); X.clip(); const s=w/im.naturalWidth, ih=im.naturalHeight*s, pan=ih>ch&&L.scroll!==false?(ih-ch)*eio(cl((kk-0.12)/0.76,0,1)):0; X.drawImage(im,-w/2,-h/2+bar-pan,w,ih); }
    else { const w=(L.w||0.76)*1080, head=Math.round(w*0.14), foot=Math.round(w*(L.caption?0.24:0.15)), ih=w*(L.ratio||1.12), h=head+ih+foot, x0=-w/2, y0=-h/2, dk='#15151C';
      X.shadowColor='rgba(0,0,0,0.45)'; X.shadowBlur=50; X.shadowOffsetY=20; X.fillStyle='#FFFFFF'; rr(x0,y0,w,h,30); X.fill(); X.shadowColor='transparent'; X.shadowBlur=0; X.shadowOffsetY=0;
      X.save(); rr(x0,y0,w,h,30); X.clip(); X.fillStyle=L.accent||ACC; X.beginPath(); X.arc(x0+head*0.55,y0+head/2,head*0.29,0,6.2832); X.fill();
      vtx(String(L.handle||(typeof HANDLE!=='undefined'&&HANDLE!=='@handle'?HANDLE:'')||'').replace(/^@/,''),x0+head*1.0,y0+head/2+1,'700 '+Math.round(head*0.3)+'px Inter, Arial',dk,'left');
      X.fillStyle=dk; for(let i=0;i<3;i++){ X.beginPath(); X.arc(x0+w-head*0.42-i*head*0.16,y0+head/2,head*0.04,0,6.2832); X.fill(); }
      X.save(); X.beginPath(); X.rect(x0,y0+head,w,ih); X.clip(); coverDraw(im,x0,y0+head,w,ih,1); X.restore();
      const fy=y0+head+ih+w*0.075, u=w*0.03; X.strokeStyle=dk; X.lineWidth=Math.max(3,w*0.006); X.lineJoin='round'; X.lineCap='round';
      let ix=x0+w*0.07; X.beginPath(); X.moveTo(ix,fy+u); X.bezierCurveTo(ix-u*1.5,fy-u*0.2,ix-u*0.6,fy-u*1.2,ix,fy-u*0.3); X.bezierCurveTo(ix+u*0.6,fy-u*1.2,ix+u*1.5,fy-u*0.2,ix,fy+u); X.stroke();
      ix+=w*0.09; X.beginPath(); X.arc(ix,fy,u*0.95,0.5,6.0); X.lineTo(ix+u*1.15,fy+u*1.05); X.closePath(); X.stroke();
      ix+=w*0.09; X.beginPath(); X.moveTo(ix-u,fy-u*0.9); X.lineTo(ix+u*1.1,fy-u*0.9); X.lineTo(ix-u*0.1,fy+u); X.lineTo(ix-u*0.25,fy-u*0.1); X.closePath(); X.stroke();
      ix=x0+w*0.93; X.beginPath(); X.moveTo(ix-u*0.7,fy-u); X.lineTo(ix+u*0.7,fy-u); X.lineTo(ix+u*0.7,fy+u); X.lineTo(ix,fy+u*0.35); X.lineTo(ix-u*0.7,fy+u); X.closePath(); X.stroke();
      if(L.caption){ const fs=Math.round(w*0.04); X.font='600 '+fs+'px "'+(L.font||CAP.font||FONT)+'"'; const ls=wrapTxt(L.caption,w*0.88).slice(0,1); vtx(ls[0]||'',hasAr(ls[0]||'')?x0+w*0.94:x0+w*0.06,fy+w*0.085,X.font,dk,hasAr(ls[0]||'')?'right':'left'); }
      X.restore(); }
    X.restore(); }
  /* الهوك: عنوان أول المقطع — عدة صيغ تتبدّل (hs.hooks) */
  function hook(t){ const h=HSX.hooks; if(!h||!h.on||!h.items||!h.items.length) return; const d=h.dur||2.6; if(t>=d) return;
    const it=h.items[Math.min(h.items.length-1,h.active||0)]; if(!it||!it.text) return;
    const st=h.style||'box', o={s:0,e:d,text:it.text,font:h.font||CAP.font,weight:900,size:h.size||104,width:920,x:0.5,y:h.y==null?0.2:h.y,color:h.color||'#FFFFFF',anim:h.anim||'pop',
      bg:st==='box'?'box':st==='pill'?'pill':st==='glass'?'glass':'none',bgColor:h.bgColor||ACC,bgOpacity:1,stroke:st==='plain'?6:0,strokeColor:'#000000'};
    textBlock(o,t,enterK(o,t)); }
  /* المؤثرات على الصورة كاملة */
  const _T=document.createElement('canvas'); _T.width=1080; _T.height=1920; const _TX=_T.getContext('2d');
  function fx(t){ if(t>=VEND) return; const Fs=(HSX.layers||[]).filter(L=>L.type==='fx'&&!L.off&&t>=L.s&&t<L.e); if(!Fs.length) return;
    for(const F of Fs){ const a=F.amount==null?0.5:F.amount, k=cl((t-F.s)/Math.max(0.01,F.e-F.s),0,1), lt=t-F.s, rt=F.e-t, edge=Math.max(0,Math.min(1,lt/0.14,rt/0.14)); X.save();
      const grab=()=>{ _TX.clearRect(0,0,1080,1920); _TX.drawImage(C,0,0,1080,1920); }, fc=()=>{ const f=faceAt(t), R=vrect(t); return (f&&R.w>=1079&&R.h>=1919)?[f[1]*1080,f[2]*1920,f[4]*1920]:[540,820,480]; };
      const xf=(sc,dx,dy,flt)=>{ _TX.clearRect(0,0,1080,1920); _TX.drawImage(C,0,0,1080,1920); X.setTransform(1,0,0,1,0,0); X.fillStyle='#000'; X.fillRect(0,0,1080,1920);
        if(flt) X.filter=flt; X.translate(540+dx,960+dy); X.scale(sc,sc); X.drawImage(_T,-540,-960); X.filter='none'; };
      if(F.fx==='zoom') xf(1+0.3*a*k,0,0);
      else if(F.fx==='punch') xf(1+0.2*a*ease(edge),0,0);
      else if(F.fx==='shake'){ const m=22*a*edge; xf(1.04,Math.sin(t*61)*m,Math.cos(t*53)*m*0.7); }
      else if(F.fx==='bw') xf(1,0,0,'grayscale('+edge+')');
      else if(F.fx==='blur') xf(1.02,0,0,'blur('+(14*a*edge).toFixed(1)+'px)');
      else if(F.fx==='flash'){ X.globalAlpha=Math.max(0,1-lt/0.3)*(0.5+0.5*a); X.fillStyle='#FFFFFF'; X.fillRect(0,0,1080,1920); }
      else if(F.fx==='vignette'){ const g=X.createRadialGradient(540,960,520,540,960,1150); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,'+(0.85*a*edge).toFixed(3)+')'); X.fillStyle=g; X.fillRect(0,0,1080,1920); }
      else if(F.fx==='letterbox'){ const hh=1920*0.13*a*ease(edge); X.fillStyle='#000'; X.fillRect(0,0,1080,hh); X.fillRect(0,1920-hh,1080,hh); }
      else if(F.fx==='tint'){ X.globalCompositeOperation='soft-light'; X.globalAlpha=0.8*a*edge; X.fillStyle=F.color||'#F2B33D'; X.fillRect(0,0,1080,1920); }
      else if(F.fx==='glitch'){ grab(); const f=Math.floor(t*30); if(f%3!==2){ for(let i=0;i<7;i++){ const y=((f*97+i*331)%1920), h=30+((f*13+i*71)%120), dx=(((f*7+i*53)%100)/100-0.5)*160*a; X.drawImage(_T,0,y,1080,h,dx,y,1080,h); } X.globalCompositeOperation='screen'; X.globalAlpha=0.35*a; X.drawImage(_T,10*a,0); } }
      else if(F.fx==='grain'){ /* 3.9: حبيبات فيلم حقيقية بدل نقاط متفرقة ما تبين */
      if(!window._GRN){ const g=document.createElement('canvas'); g.width=g.height=256; const gx=g.getContext('2d'), im=gx.createImageData(256,256); for(let i=0;i<im.data.length;i+=4){ const v=Math.random()*255|0; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255; } gx.putImageData(im,0,0); window._GRN=g; }
      const f=Math.floor(t*24), ox=(f*97)%256, oy=(f*57)%256; X.save(); X.globalCompositeOperation='overlay'; X.globalAlpha=Math.min(0.85,0.3+0.5*a); X.fillStyle=X.createPattern(window._GRN,'repeat'); X.translate(-ox,-oy); X.fillRect(0,0,1080+256,1920+256); X.restore(); }

      else if(F.fx==='sepia') xf(1,0,0,'sepia('+edge.toFixed(2)+') contrast(1.05)');
      else if(F.fx==='invert') xf(1,0,0,'invert('+edge.toFixed(2)+')');
      else if(F.fx==='pulse'){ const b=Math.pow(Math.abs(Math.sin(lt*Math.PI*2.1)),3); xf(1+0.09*a*b*edge,0,0); }
      else if(F.fx==='tilt'){ grab(); X.setTransform(1,0,0,1,0,0); X.fillStyle='#000'; X.fillRect(0,0,1080,1920); const an=(F.dir===-1?-1:1)*0.075*a*ease(edge), z=1+Math.abs(an)*2.3; X.translate(540,960); X.rotate(an); X.scale(z,z); X.drawImage(_T,-540,-960); }
      else if(F.fx==='facezoom'){ const c=fc(), z=1+0.42*a*eio(cl(lt/Math.max(0.3,(F.e-F.s)*0.6),0,1))*cl(rt/0.25,0,1); grab(); X.setTransform(1,0,0,1,0,0); X.fillStyle='#000'; X.fillRect(0,0,1080,1920); const ox=cl(c[0],540-540/z*(z-1),540+540/z*(z-1)), oy=cl(c[1],960-960/z*(z-1),960+960/z*(z-1)); X.translate(ox,oy); X.scale(z,z); X.drawImage(_T,-ox,-oy); }
      else if(F.fx==='spotlight'){ const c=fc(), r0=Math.max(240,c[2]*0.85), g=X.createRadialGradient(c[0],c[1],r0,c[0],c[1],r0*2.3); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,'+(0.86*a*edge).toFixed(3)+')'); X.fillStyle=g; X.fillRect(0,0,1080,1920); }
      else if(F.fx==='rgb'){ grab(); const d=(8+26*a)*edge*(0.6+0.4*Math.sin(t*40)); X.setTransform(1,0,0,1,0,0); X.fillStyle='#000'; X.fillRect(0,0,1080,1920); X.globalCompositeOperation='lighter';
        [['#FF0000',-d],['#00FF00',0],['#0000FF',d]].forEach(q=>{ _PX.setTransform(1,0,0,1,0,0); _PX.globalCompositeOperation='source-over'; _PX.clearRect(0,0,1080,1920); _di.call(_PX,_T,0,0); _PX.globalCompositeOperation='multiply'; _PX.fillStyle=q[0]; _PX.fillRect(0,0,1080,1920); _PX.globalCompositeOperation='source-over'; _di.call(X,_PC,q[1],0); }); }
      else if(F.fx==='pixel'){ grab(); const n=Math.max(18,Math.round(180-150*a*edge)), hh=Math.round(n*16/9); _PX.setTransform(1,0,0,1,0,0); _PX.globalCompositeOperation='source-over'; _PX.imageSmoothingEnabled=true; _PX.clearRect(0,0,n,hh); _di.call(_PX,_T,0,0,1080,1920,0,0,n,hh); X.setTransform(1,0,0,1,0,0); X.imageSmoothingEnabled=false; _di.call(X,_PC,0,0,n,hh,0,0,1080,1920); X.imageSmoothingEnabled=true; }
      else if(F.fx==='mirror'){ grab(); X.setTransform(1,0,0,1,0,0); X.translate(1080,0); X.scale(-1,1); X.beginPath(); X.rect(0,0,540,1920); X.clip(); X.drawImage(_T,0,0); }
      else if(F.fx==='vhs'){ xf(1.01,Math.sin(t*90)*3*a,0,'saturate('+(1+0.5*a).toFixed(2)+') contrast(1.08)'); X.setTransform(1,0,0,1,0,0); X.globalAlpha=0.16*a*edge+0.05; X.fillStyle='#000'; for(let y=0;y<1920;y+=6) X.fillRect(0,y,1080,2); const f=Math.floor(t*30), by=(f*37)%1920; X.globalAlpha=0.22*a*edge; X.fillStyle='#FFFFFF'; X.fillRect(0,by,1080,26); X.globalCompositeOperation='screen'; X.globalAlpha=0.14*a*edge; X.fillStyle='#3A6BFF'; X.fillRect(0,0,1080,1920); }
      else if(F.fx==='leak'){ const px=-500+2100*k, g=X.createLinearGradient(px-520,0,px+520,1920); g.addColorStop(0,'rgba(255,120,40,0)'); g.addColorStop(0.5,'rgba(255,170,70,'+(0.75*a*edge).toFixed(3)+')'); g.addColorStop(1,'rgba(255,60,90,0)'); X.globalCompositeOperation='screen'; X.fillStyle=g; X.fillRect(0,0,1080,1920); }
      else if(F.fx==='strobe'){ if(Math.floor(lt*14)%2===0){ X.globalAlpha=(0.25+0.5*a)*edge; X.fillStyle=F.color||'#FFFFFF'; X.fillRect(0,0,1080,1920); } }
      else if(F.fx==='speed'){ const c=fc(), f=Math.floor(t*30); X.strokeStyle='rgba(255,255,255,'+(0.5*a*edge+0.15).toFixed(3)+')'; X.lineCap='round'; for(let i=0;i<46;i++){ const an=rnd(i*7+f)*6.2832, r1=400+rnd(i*13+f*3)*240, r2=r1+160+rnd(i*5+f)*420; X.lineWidth=3+rnd(i+f)*7; X.beginPath(); X.moveTo(c[0]+Math.cos(an)*r1,c[1]+Math.sin(an)*r1*1.4); X.lineTo(c[0]+Math.cos(an)*r2,c[1]+Math.sin(an)*r2*1.4); X.stroke(); } }
      else if(F.fx==='duotone'){ xf(1,0,0,'grayscale(1) contrast(1.15)'); X.setTransform(1,0,0,1,0,0); X.globalAlpha=edge; X.globalCompositeOperation='multiply'; X.fillStyle=F.color||'#FF5A8A'; X.fillRect(0,0,1080,1920); X.globalCompositeOperation='lighten'; X.fillStyle=F.color2||'#1B1F6B'; X.fillRect(0,0,1080,1920); }
      else if(TRF[F.fx]) trDraw(F,t,a,fc); else if(F.fx==='confetti') confetti(F,t,a,fc);
      X.restore(); X.setTransform(1,0,0,1,0,0); X.globalCompositeOperation='source-over'; X.globalAlpha=1; X.filter='none'; X.imageSmoothingEnabled=true; } }
  /* ═══════════ 4.0: الدمج ═══════════
     انتقالات تكمّل سرعة اللقطة · صورة داخل صورة · علامات بخط اليد · مؤشر ماوس · شريط اسم · كولاج ورقي · تلوين الفيديو · طابع المقطع.
     أفكار مأخوذة من HyperFrames (Apache-2.0) و lemo-opuscar و gbro-collage-broll (MIT)، ومكتوبة من الصفر للكانفس العمودي والعربي. */
  const spring=(k,z)=>{ z=z==null?0.72:z; if(k<=0) return 0; if(k>=1) return 1; const w=10.5, wd=w*Math.sqrt(1-z*z); return 1-Math.exp(-z*w*k)*(Math.cos(wd*k)+z*w/wd*Math.sin(wd*k)); };
  const p4i=k=>k*k*k*k, p4o=k=>1-Math.pow(1-k,4), p2i=k=>k*k, p2o=k=>1-(1-k)*(1-k), p3o=k=>1-Math.pow(1-k,3);
  const mkCv=(w,h)=>{ const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w)); c.height=Math.max(1,Math.round(h)); return c; };

  /* ── انتقالات عند القص: نص الحركة قبل القص ونصها بعده بنفس الاتجاه والسرعة (ما فيه ذوبان) ── */
  const TRF={curve:1,push:1,pull:1,rack:1,whip:1,spin:1,iris:1};
  function trDraw(F,t,a,fc){ const m=F.seam!=null?+F.seam:(F.s+F.e)/2, out=t<m, po=cl((t-F.s)/Math.max(0.01,m-F.s),0,1), pi=cl((t-m)/Math.max(0.01,F.e-m),0,1), f=F.fx;
    const dir=F.dir||HSX.trDir||'right', vx=dir==='left'?-1:dir==='right'?1:0, vy=dir==='up'?-1:dir==='down'?1:0;
    _TX.clearRect(0,0,1080,1920); _TX.drawImage(C,0,0,1080,1920); X.setTransform(1,0,0,1,0,0); X.fillStyle='#000'; X.fillRect(0,0,1080,1920);
    if(f==='iris'){ const c=fc(), R=Math.hypot(1080,1920)*1.05, r=out?R*(1-p4i(po)):R*p4o(pi); if(r<2) return;
      X.save(); X.beginPath(); X.arc(c[0],c[1],r,0,6.2832); X.clip(); X.drawImage(_T,0,0); X.restore();
      X.strokeStyle=F.color||ACC; X.lineWidth=10*(0.4+a); X.beginPath(); X.arc(c[0],c[1],r,0,6.2832); X.stroke(); return; }
    let sc=1, dx=0, dy=0, rot=0, bl=0, smear=0;
    if(f==='curve'){ const D=(vy?240:150)*(0.6+0.8*a), q=out?p4i(po):-(1-p4o(pi)); dx=vx*D*q; dy=vy*D*q; sc=1.12; bl=10*a*Math.pow(out?po:1-pi,2); smear=Math.abs(q); }
    else if(f==='push'){ sc=out?1+0.22*p4i(po):0.88+0.12*p4o(pi); bl=14*a*Math.pow(out?po:1-pi,2); }
    else if(f==='pull'){ sc=out?1-0.2*p4i(po):1.25-0.25*p4o(pi); bl=14*a*Math.pow(out?po:1-pi,2); }
    else if(f==='rack'){ sc=out?1+0.06*p2i(po):1.06-0.06*p2o(pi); bl=(6+8*a)*(out?p2i(po):1-p2o(pi)); }
    else if(f==='whip'){ const D=900*(0.6+0.5*a), q=out?Math.pow(po,3):-Math.pow(1-pi,3); dx=(vx||(vy?0:1))*D*q; dy=vy*D*q; sc=1.08; bl=(10+12*a)*(out?po:1-pi); smear=Math.abs(q)*2; }
    else if(f==='spin'){ const q=out?p4i(po):-(1-p4o(pi)); rot=(vx<0?-1:1)*0.16*(0.6+0.6*a)*q; sc=1.2+0.25*Math.abs(q); bl=12*a*Math.abs(q); }
    const one=(ox,oy,al)=>{ X.save(); X.globalAlpha=al; if(bl>0.4) X.filter='blur('+bl.toFixed(1)+'px)'; X.translate(540+dx+ox,960+dy+oy); X.rotate(rot); X.scale(sc,sc); X.drawImage(_T,-540,-960); X.restore(); };
    one(0,0,1);
    if(smear>0.05&&(vx||vy)){ const n=4, sp=60*smear*(0.5+a); for(let i=1;i<=n;i++) one(-(vx||0)*sp*i/n,-(vy||0)*sp*i/n,0.22*(1-i/(n+1))); } }

  /* ── قصاصات احتفال (مؤثر confetti) ── */
  function confetti(F,t,a,fc){ const lt=t-F.s, dur=Math.max(0.6,F.e-F.s), n=Math.round(90+120*a), c=F.from==='face'?fc():[540,1980], cols=[ACC,'#FFFFFF',F.color||'#FFD21F','#2FBF9B','#E0633A','#5B6BD6'];
    for(let i=0;i<n;i++){ const an=-Math.PI/2+(rnd(i*3+1)-0.5)*1.7, v=1500+rnd(i*7+2)*1500, g=2600, dl=rnd(i*11+3)*0.18, tt=Math.max(0,lt-dl); if(tt<=0) continue;
      const x=c[0]+Math.cos(an)*v*tt*0.6+Math.sin(tt*6+i)*20, y=c[1]+Math.sin(an)*v*tt+0.5*g*tt*tt; if(y>2050) continue; const fade=cl((dur-lt)/0.4,0,1);
      X.save(); X.globalAlpha=fade; X.translate(x,y); X.rotate(tt*8+i); X.scale(1,Math.cos(tt*11+i)); X.fillStyle=cols[i%cols.length]; X.fillRect(-9,-5,18,10); X.restore(); } }

  /* ── صورة داخل صورة: وجهك بكرت صغير بالزاوية والشرح ياخذ الشاشة ── */
  const pipRect=L=>{ const w=Math.round((L.size||0.36)*1080), h=Math.round(w*(L.circle?1:(L.ratio||1.25))), mg=48, p=L.pos||'tr';
    const x=p==='tl'||p==='bl'?mg:p==='tc'||p==='bc'?Math.round((1080-w)/2):1080-mg-w, y=p==='bl'||p==='br'||p==='bc'?1920-h-300:170;
    return {x,y,w,h,r:L.circle?Math.round(w/2):(L.round==null?36:+L.round),pip:true}; };
  const pipAt=t=>{ const Ls=(HSX.layers||[]).filter(L=>L.type==='pip'&&!L.off&&t>=L.s&&t<L.e); return Ls.length?Ls[Ls.length-1]:null; };
  const _dv=window.drawVideo;
  if(typeof _dv==='function') window.drawVideo=function(t){ const P=pipAt(t);
    if(P){ const R=vrect(t); if(R.w<1000){ const bg=P.bgColor||BG, S={acc:P.accent||ACC,ink:lumOf(bg)>0.55?'#15151C':'#FFFFFF'}; X.save(); X.fillStyle=bg; X.fillRect(0,0,1080,1920); cardDeco(1080,1920,{deco:P.deco||'grid'},S,t-P.s); X.restore(); } }
    return _dv(t); };

  /* ── علامات بخط اليد فوق الفيديو: خط تحت · دائرة · سهم · مربع · تظليل · صح · خطأ ── */
  const jit=(i,s)=>(rnd(i*17.3+(s||0))-0.5);
  function markPts(L){ const cx=(L.x==null?0.5:L.x)*1080, cy=(L.y==null?0.4:L.y)*1920, w=(L.w||0.42)*1080, h=(L.h||0.07)*1920, k=L.kind||'circle', P=[], sd=(String(L.id||'').length+1)*3.7;
    if(k==='circle'){ for(let i=0;i<=52;i++){ const an=-0.3+i/48*6.2832*1.04, wob=1+jit(i,sd)*0.05; P.push([cx+Math.cos(an)*w/2*wob,cy+Math.sin(an)*h/2*wob]); } }
    else if(k==='underline'){ for(let i=0;i<=24;i++){ const u=i/24; P.push([cx+w/2-u*w,cy+h/2+Math.sin(u*3.1)*h*0.08+jit(i,sd)*4]); } }
    else if(k==='box'){ const c=[[cx+w/2,cy-h/2],[cx-w/2,cy-h/2],[cx-w/2,cy+h/2],[cx+w/2,cy+h/2],[cx+w/2+6,cy-h/2-8]]; for(let s=0;s<4;s++) for(let i=0;i<=10;i++){ const u=i/10; P.push([c[s][0]+(c[s+1][0]-c[s][0])*u+jit(s*11+i,sd)*5,c[s][1]+(c[s+1][1]-c[s][1])*u+jit(s*13+i,sd)*5]); } }
    else if(k==='arrow'){ const x0=cx+w/2, y0=cy+h/2, x1=cx-w/2, y1=cy-h/2, mx=(x0+x1)/2+(y1-y0)*0.25, my=(y0+y1)/2-(x1-x0)*0.25; for(let i=0;i<=30;i++){ const u=i/30; P.push([(1-u)*(1-u)*x0+2*(1-u)*u*mx+u*u*x1,(1-u)*(1-u)*y0+2*(1-u)*u*my+u*u*y1]); } }
    else if(k==='check'){ const s=Math.min(w,h*3)/2; P.push([cx+s*0.75,cy-s*0.05],[cx+s*0.25,cy+s*0.45],[cx-s*0.8,cy-s*0.6]); }
    else if(k==='cross'){ const s=Math.min(w,h*3)/2; P.push([cx+s*0.7,cy-s*0.7],[cx-s*0.7,cy+s*0.7],null,[cx-s*0.7,cy-s*0.7],[cx+s*0.7,cy+s*0.7]); }
    return {P,cx,cy,w,h,k}; }
  function strokePart(P,k){ let tot=0; const seg=[]; for(let i=1;i<P.length;i++){ if(!P[i]||!P[i-1]){ seg.push(0); continue; } const d=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]); seg.push(d); tot+=d; }
    let left=tot*k; X.beginPath(); let pen=false; for(let i=1;i<P.length&&left>0;i++){ const a=P[i-1], b=P[i]; if(!a||!b){ pen=false; continue; } if(!pen){ X.moveTo(a[0],a[1]); pen=true; } const d=seg[i-1], u=Math.min(1,left/d); X.lineTo(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u); left-=d; } X.stroke(); return left<=0; }
  function markLayer(L,t,K){ const M=markPts(L), lt=t-L.s, dur=L.dur||(M.k==='circle'?0.55:0.4), k=p3o(cl(lt/dur,0,1)), col=L.color||'#FFD21F', lw=(L.lw||10);
    X.save(); X.globalAlpha=K.a*(L.opacity==null?1:L.opacity); X.lineCap='round'; X.lineJoin='round'; X.shadowColor='rgba(0,0,0,0.35)'; X.shadowBlur=10;
    if(M.k==='highlight'){ const g=k; X.shadowBlur=0; X.fillStyle=rgba(col,0.5); X.beginPath(); X.moveTo(M.cx+M.w/2,M.cy-M.h/2); X.lineTo(M.cx+M.w/2-M.w*g,M.cy-M.h/2+3); X.lineTo(M.cx+M.w/2-M.w*g,M.cy+M.h/2); X.lineTo(M.cx+M.w/2,M.cy+M.h/2-3); X.closePath(); X.fill(); X.restore(); return; }
    X.strokeStyle=col; X.lineWidth=lw; const done=strokePart(M.P,k);
    if(M.k==='arrow'&&done){ const n=M.P.length, b=M.P[n-1], a=M.P[n-4], an=Math.atan2(b[1]-a[1],b[0]-a[0]), hs=lw*4.2, g=cl((lt-dur)/0.12,0,1); X.beginPath(); X.moveTo(b[0]-Math.cos(an-0.5)*hs*g,b[1]-Math.sin(an-0.5)*hs*g); X.lineTo(b[0],b[1]); X.lineTo(b[0]-Math.cos(an+0.5)*hs*g,b[1]-Math.sin(an+0.5)*hs*g); X.stroke(); }
    X.restore(); }

  /* ── مؤشر ماوس كبير: يدخل من تحت، يضغط، والضغطة تشغّل اللي بعدها ── */
  const CUR=[[0,0],[0,34],[9,26],[15,40],[21,37],[15,24],[27,24]];
  function cursorLayer(L,t){ const lt=t-L.s, dur=L.e-L.s, s=(L.size||0.1)*1080/40, tx=(L.x==null?0.5:L.x)*1080, ty=(L.y==null?0.45:L.y)*1920, at=L.at==null?Math.min(0.95,dur*0.5):+L.at;
    const sx=L.from==='left'?-120:L.from==='right'?1200:tx+260, sy=L.from==='left'||L.from==='right'?ty+180:2080, inK=p3o(cl(lt/0.75,0,1)), outK=cl((lt-(dur-0.45))/0.45,0,1);
    let x=sx+(tx-sx)*inK, y=sy+(ty-sy)*inK; if(outK>0){ x+=(1240-tx)*p4i(outK)*0.9; y+=(2100-ty)*p4i(outK)*0.4; }
    const dc=lt-at, press=dc>=0&&dc<0.32?(dc<0.1?1-0.16*p2i(dc/0.1):0.84+0.16*p2o((dc-0.1)/0.22)):1;
    if(dc>=0&&dc<0.6){ const r=40+260*p3o(dc/0.6); X.save(); X.globalAlpha=0.55*(1-dc/0.6); X.strokeStyle=L.ring||ACC; X.lineWidth=10; X.beginPath(); X.arc(tx,ty,r,0,6.2832); X.stroke(); X.restore(); }
    const dark=L.style==='dark'; X.save(); X.translate(x,y); X.scale(s*press,s*press); X.beginPath(); CUR.forEach((p,i)=>i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1])); X.closePath();
    X.shadowColor='rgba(0,0,0,0.4)'; X.shadowBlur=6; X.shadowOffsetY=2; X.fillStyle=dark?'#15151C':'#FFFFFF'; X.fill(); X.shadowColor='transparent'; X.lineJoin='round'; X.lineWidth=2.2; X.strokeStyle=dark?'#FFFFFF':'#15151C'; X.stroke(); X.restore(); }

  /* ── شريط اسم (Lower third): الاسم وتحته صفته ── */
  function ltLayer(L,t,K){ const lt=t-L.s, st=L.style||'bar', fam=L.font||CAP.font||FONT, fs=L.size||64, nm=L.text||'', sub=L.sub||'', right=(L.side||'right')==='right', y=(L.y==null?0.7:L.y)*1920, acc=L.accent||ACC, col=L.color||'#FFFFFF';
    X.font='800 '+fs+'px "'+fam+'"'; const w1=X.measureText(nm).width; X.font='500 '+Math.round(fs*0.56)+'px "'+fam+'"'; const w2=X.measureText(sub).width, W=Math.max(w1,w2)+fs*1.1, x0=right?1080-64:64, dirx=right?-1:1;
    const g=p4o(cl(lt/0.45,0,1)), g2=p3o(cl((lt-0.18)/0.4,0,1)), g3=p3o(cl((lt-0.3)/0.4,0,1));
    X.save(); X.globalAlpha=K.a; X.textBaseline='middle'; X.direction=hasAr(nm)?'rtl':'ltr'; X.textAlign=right?'right':'left';
    const bx=right?x0-W*g:x0, bh=fs*1.25;
    if(st==='bar'){ X.fillStyle=acc; X.fillRect(right?x0-12:x0,y-bh/2,12,bh*(sub?1.75:1)); X.fillStyle=rgba('#000000',0.62); X.fillRect(right?x0-12-W*g:x0+12,y-bh/2,W*g,bh); if(sub){ X.fillStyle=acc; X.fillRect(right?x0-12-W*0.8*g2:x0+12,y+bh/2,W*0.8*g2,bh*0.75); } }
    else if(st==='card'){ X.fillStyle=rgba('#FFFFFF',0.95); rr(bx,y-bh/2,W*g,bh*(sub?1.8:1.1),22); X.fill(); }
    else if(st==='tag'){ X.fillStyle=acc; rr(bx,y-bh/2,W*g,bh,bh/2); X.fill(); }
    else { X.fillStyle=acc; X.fillRect(right?x0-W*g:x0,y+bh*0.62,W*g,6); }
    const tx=right?x0-(st==='bar'?36:fs*0.55):x0+(st==='bar'?36:fs*0.55), ink=st==='card'?'#15151C':st==='tag'?(lumOf(acc)>0.55?'#15151C':'#FFFFFF'):col;
    X.globalAlpha=K.a*g2; X.font='800 '+fs+'px "'+fam+'"'; X.fillStyle=ink; X.fillText(nm,tx+dirx*(1-g2)*-30,y);
    if(sub){ X.globalAlpha=K.a*g3; X.font='500 '+Math.round(fs*0.56)+'px "'+fam+'"'; X.direction=hasAr(sub)?'rtl':'ltr'; X.fillStyle=st==='bar'?(lumOf(acc)>0.55?'#15151C':'#FFFFFF'):st==='card'?'#5A5F6E':rgba(col,0.85); X.fillText(sub,tx,y+bh*(st==='bar'?0.88:0.92)); }
    X.restore(); }

  /* ── كولاج ورقي (فكرة gbro-collage-broll بدون أي API): قصاصات أبيض وأسود منقّطة تتركّب من فاضي ── */
  const HTC={};
  function halftone(im,w,step){ const key=(im.src||'')+'|'+w+'|'+step; if(HTC[key]) return HTC[key]; const h=Math.round(w*im.naturalHeight/im.naturalWidth), s=step||14;
    const a=mkCv(w,h), ax=a.getContext('2d'); ax.filter='grayscale(1) contrast(1.3) brightness(1.06)'; ax.drawImage(im,0,0,w,h); ax.filter='none';
    const tile=mkCv(s,s), tx=tile.getContext('2d'), g=tx.createRadialGradient(s/2,s/2,0,s/2,s/2,s*0.72); g.addColorStop(0,'#000'); g.addColorStop(1,'#FFF'); tx.fillStyle=g; tx.fillRect(0,0,s,s);
    const pat=ax.createPattern(tile,'repeat'); try{ pat.setTransform(new DOMMatrix().rotate(45)); }catch(e){} ax.globalCompositeOperation='lighter'; ax.fillStyle=pat; ax.fillRect(0,0,w,h); ax.globalCompositeOperation='source-over';
    const m=mkCv(w,h), mx=m.getContext('2d'); mx.filter='invert(1) brightness(40)'; mx.drawImage(a,0,0); mx.filter='none';
    const b=mkCv(w,h), bx=b.getContext('2d'); bx.filter='invert(1)'; bx.drawImage(m,0,0); bx.filter='none';
    bx.globalCompositeOperation='multiply'; bx.fillStyle='#F2EBDD'; bx.fillRect(0,0,w,h); bx.globalCompositeOperation='destination-in'; bx.drawImage(im,0,0,w,h); bx.globalCompositeOperation='source-over';
    return HTC[key]=b; }
  function piece(im,w,L){ const key='pc|'+(im.src||'')+'|'+w+'|'+(L.halftone===false?0:1); if(HTC[key]) return HTC[key]; const src=L.halftone===false?im:halftone(im,w,L.dot||14), h=src.height*(w/src.width), kw=Math.max(6,Math.round(w*0.018)), pd=kw+30;
    const c=mkCv(w+pd*2,h+pd*2), x=c.getContext('2d'), sil=mkCv(w,h), sx=sil.getContext('2d'); sx.drawImage(src,0,0,w,h); sx.globalCompositeOperation='source-in'; sx.fillStyle=L.keyline||'#F4EBD8'; sx.fillRect(0,0,w,h);
    x.shadowColor='rgba(0,0,0,0.32)'; x.shadowBlur=22; x.shadowOffsetY=10; for(let i=0;i<16;i++){ const an=i/16*6.2832; x.drawImage(sil,pd+Math.cos(an)*kw,pd+Math.sin(an)*kw); } x.shadowColor='transparent'; x.drawImage(src,pd,pd,w,h);
    return HTC[key]=c; }
  function collages(t){ if(t>=VEND) return false; const Ls=(HSX.layers||[]).filter(L=>L.type==='collage'&&!L.off&&t>=L.s&&t<L.e); if(!Ls.length) return false; const L=Ls[Ls.length-1], lt=t-L.s, dur=Math.max(0.5,L.e-L.s);
    const inA=cl(lt/0.25,0,1), outA=cl((L.e-t)/0.25,0,1), bg=L.bgColor||'#E07A3F', cols=Array.isArray(L.accents)&&L.accents.length?L.accents:['#F2C14E','#2E6B5A','#5B3A7A','#E9E2D3'];
    X.save(); X.globalAlpha=Math.min(inA,outA); X.fillStyle=bg; X.fillRect(0,0,1080,1920);
    for(let i=0;i<3;i++){ const k=spring(cl((lt-0.05-i*0.1)/0.7,0,1),0.6), w=360+rnd(i*5+2)*320, h=w*(0.5+rnd(i*9+4)*0.6), x=120+rnd(i*7+1)*840, y=380+i*420+rnd(i*3)*120, ox=(i%2?-1:1)*1100*(1-k);
      X.save(); X.translate(x+ox,y); X.rotate((rnd(i*13)-0.5)*0.4); X.fillStyle=cols[i%cols.length]; X.shadowColor='rgba(0,0,0,0.22)'; X.shadowBlur=14; X.shadowOffsetY=6; if(i===1){ X.beginPath(); X.arc(0,0,w*0.42,0,6.2832); X.fill(); } else X.fillRect(-w/2,-h/2,w,h); X.restore(); }
    const items=(Array.isArray(L.items)&&L.items.length?L.items:(L.src?[{src:L.src}]:[])).slice(0,6), n=items.length;
    items.forEach((it,i)=>{ const im=IMG[it.src]; if(!im||!im.ok) return; const auto=n===1?[0.5,0.42,0.78]:[[0.34,0.3,0.56],[0.66,0.56,0.56],[0.4,0.78,0.48],[0.68,0.24,0.42],[0.3,0.58,0.4],[0.62,0.82,0.4]][i];
      const w=Math.round((it.w||auto[2])*1080), cx=(it.x==null?auto[0]:it.x)*1080, cy=(it.y==null?auto[1]:it.y)*1920, pc=piece(im,w,L), at=0.25+i*0.16, k=spring(cl((lt-at)/0.75,0,1),0.55);
      if(k<=0) return; const from=i%3===0?[0,1]:i%3===1?[(cx<540?-1:1),0]:[0,-1], D=1300*(1-k), sq=1+0.06*Math.sin(cl((lt-at)/0.5,0,1)*Math.PI)*(k>0.95?1:0);
      X.save(); X.translate(cx+from[0]*D,cy+from[1]*D); X.rotate(((it.rot==null?(rnd(i*7+3)-0.5)*8:+it.rot))*Math.PI/180*(0.4+0.6*k)); X.scale(sq,1/sq); X.drawImage(pc,-pc.width/2,-pc.height/2); X.restore(); });
    if(!window._GRN){ const g=mkCv(256,256), gx=g.getContext('2d'), im=gx.createImageData(256,256); for(let i=0;i<im.data.length;i+=4){ const v=Math.random()*255|0; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255; } gx.putImageData(im,0,0); window._GRN=g; }
    X.globalCompositeOperation='multiply'; X.globalAlpha=0.16*Math.min(inA,outA); X.fillStyle=X.createPattern(window._GRN,'repeat'); X.fillRect(0,0,1080,1920); X.restore(); return true; }

  /* ── تلوين الفيديو (Grade): يطبّق على الفيديو فقط، مو على الكتابة والرسوم ── */
  const GRADES={ natural:{c:1.05,s:1.06}, skin:{c:0.97,s:0.94,b:1.04,tint:['#FFB38A',0.07]}, studio:{c:1.09,s:1.03,b:1.03}, warm:{s:1.08,sep:0.12,b:1.02,tint:['#FF9A3D',0.08]},
    cool:{c:1.06,s:0.95,hue:-8,tint:['#3D7BFF',0.08]}, night:{b:1.13,c:0.95,s:0.9}, muted:{s:0.7,c:1.05}, pop:{s:1.32,c:1.08}, teal:{c:1.1,s:1.1,tint:['#1A8C8C',0.12]}, bw:{g:1,c:1.18}, film:{c:1.04,s:0.85,sep:0.18,tint:['#E8B07A',0.06]} };
  window.__hsGrades=Object.keys(GRADES);
  function gradeOf(){ const G=HSX.grade; if(!G||!G.preset||G.preset==='none'||!GRADES[G.preset]) return null; const p=GRADES[G.preset], a=G.amount==null?1:+G.amount, m=(v,d)=>(d+(v-d)*a).toFixed(3);
    let f=''; if(p.g) f+='grayscale('+m(p.g,0)+') '; if(p.sep) f+='sepia('+m(p.sep,0)+') '; if(p.c) f+='contrast('+m(p.c,1)+') '; if(p.s) f+='saturate('+m(p.s,1)+') '; if(p.b) f+='brightness('+m(p.b,1)+') '; if(p.hue) f+='hue-rotate('+m(p.hue,0)+'deg) ';
    return {f:f.trim()||'none',tint:p.tint?[p.tint[0],p.tint[1]*a]:null}; }

  /* ── طابع المقطع (Look): طبقة خفيفة فوق كل شي ── */
  function lookOverlay(t){ const Lk=HSX.look; if(!Lk||!Lk.overlay||Lk.overlay==='none') return; const o=Lk.overlay, a=Lk.amount==null?0.6:+Lk.amount;
    if(!window._GRN){ const g=mkCv(256,256), gx=g.getContext('2d'), im=gx.createImageData(256,256); for(let i=0;i<im.data.length;i+=4){ const v=Math.random()*255|0; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255; } gx.putImageData(im,0,0); window._GRN=g; }
    const f=Math.floor(t*24), grain=al=>{ X.save(); X.globalCompositeOperation='overlay'; X.globalAlpha=al; X.fillStyle=X.createPattern(window._GRN,'repeat'); X.translate(-((f*97)%256),-((f*57)%256)); X.fillRect(0,0,1336,2176); X.restore(); };
    const vig=al=>{ const g=X.createRadialGradient(540,900,500,540,960,1250); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,'+al.toFixed(3)+')'); X.fillStyle=g; X.fillRect(0,0,1080,1920); };
    if(o==='grain') grain(0.35*a+0.15);
    else if(o==='film'){ grain(0.4*a+0.15); vig(0.55*a); X.globalAlpha=0.05*a*(rnd(f)>0.5?1:0.4); X.fillStyle='#FFF8E8'; X.fillRect(0,0,1080,1920); X.globalAlpha=0.5*a; X.strokeStyle='rgba(255,255,255,0.5)'; X.lineWidth=2; for(let i=0;i<2;i++){ if(rnd(f*3+i)>0.6){ const x=rnd(f*7+i)*1080; X.beginPath(); X.moveTo(x,0); X.lineTo(x+rnd(f+i)*30,1920); X.stroke(); } } X.globalAlpha=1; }
    else if(o==='scan'){ X.globalAlpha=0.18*a+0.06; X.fillStyle='#000'; for(let y=0;y<1920;y+=5) X.fillRect(0,y,1080,2); X.globalAlpha=1; vig(0.5*a); X.globalCompositeOperation='screen'; X.globalAlpha=0.08*a; X.fillStyle='#3AF0FF'; X.fillRect(0,0,1080,1920); }
    else if(o==='paper'){ X.globalCompositeOperation='multiply'; X.globalAlpha=0.12*a+0.05; X.fillStyle='#E9DCC0'; X.fillRect(0,0,1080,1920); X.globalCompositeOperation='source-over'; grain(0.25*a+0.1); }
    else if(o==='halftone'){ X.globalCompositeOperation='multiply'; X.globalAlpha=0.16*a+0.06; X.fillStyle='#000'; for(let y=8;y<1920;y+=16) for(let x=(y/16)%2?16:8;x<1080;x+=16){ X.beginPath(); X.arc(x,y,2.2,0,6.2832); X.fill(); } }
    else if(o==='vignette') vig(0.75*a);
    X.globalCompositeOperation='source-over'; X.globalAlpha=1; }
  window.__hsLookOverlays=['none','grain','film','scan','paper','halftone','vignette'];

  /* ── حركات أرقام جديدة: خط بياني · عدّاد سلوت · خبر بتظليل ── */
  VK.line=function(R,lt,L,S){ const v=(Array.isArray(L.values)&&L.values.length?L.values:[12,18,15,26,31,44]).map(Number), n=v.length, mx=Math.max(...v)*1.12, mn=Math.min(0,...v), lab=Array.isArray(L.labels)?L.labels:[];
    const x0=R.x+20, x1=R.x+R.w-20, y0=R.y+R.h*0.12, y1=R.y+R.h*(L.label?0.74:0.86), X_=i=>x1-(x1-x0)*i/Math.max(1,n-1), Y_=val=>y1-(y1-y0)*(val-mn)/Math.max(1e-6,mx-mn), k=eio(cl((lt-0.3)/Math.max(0.6,S.dur*0.6),0,1));
    X.strokeStyle=S.mut; X.lineWidth=2; for(let g=0;g<=3;g++){ const y=y1-(y1-y0)*g/3; X.beginPath(); X.moveTo(x0,y); X.lineTo(x1,y); X.stroke(); }
    lab.slice(0,n).forEach((s,i)=>vtx(s,X_(i),y1+40,'600 30px '+S.fam,S.dim||S.ink));
    const upto=k*(n-1), ii=Math.floor(upto), fr=upto-ii; X.strokeStyle=S.acc; X.lineWidth=9; X.lineJoin='round'; X.lineCap='round'; X.beginPath();
    for(let i=0;i<=ii;i++){ const p=[X_(i),Y_(v[i])]; i?X.lineTo(p[0],p[1]):X.moveTo(p[0],p[1]); } let tip=[X_(ii),Y_(v[ii])], tv=v[ii];
    if(ii<n-1){ tip=[X_(ii)+(X_(ii+1)-X_(ii))*fr,Y_(v[ii])+(Y_(v[ii+1])-Y_(v[ii]))*fr]; tv=v[ii]+(v[ii+1]-v[ii])*fr; X.lineTo(tip[0],tip[1]); } X.stroke();
    X.globalAlpha=S.k*0.14; X.fillStyle=S.acc; X.lineTo(tip[0],y1); X.lineTo(X_(0),y1); X.closePath(); X.fill(); X.globalAlpha=S.k;
    X.fillStyle=S.acc; X.beginPath(); X.arc(tip[0],tip[1],15,0,6.2832); X.fill(); const tag=fmtN(tv)+(L.unit||''); X.font='800 46px '+S.fam; const tw=X.measureText(tag).width+40; X.fillStyle='#15151C'; rr(tip[0]-tw/2,tip[1]-96,tw,62,31); X.fill(); vtx(tag,tip[0],tip[1]-64,'800 46px '+S.fam,'#FFFFFF');
    if(L.label) wrapTxtC(L.label,R.x+R.w/2,R.y+R.h*0.93,R.w*0.9,'700 42px '+S.fam,S.ink,1); };
  VK.slot=function(R,lt,L,S){ const val=Math.round(+L.value||0), str=String(Math.abs(val)), fs=Math.min(260,Math.round(R.w/(str.length*0.68+0.6))), cy=R.y+R.h*(L.label?0.42:0.5), cw=fs*0.66, tot=cw*str.length, x0=R.x+R.w/2+tot/2;
    X.save(); X.beginPath(); X.rect(R.x,cy-fs*0.62,R.w,fs*1.24); X.clip(); X.font='900 '+fs+'px '+S.fam; X.textAlign='center'; X.textBaseline='middle'; X.direction='ltr'; X.fillStyle=S.acc;
    for(let i=0;i<str.length;i++){ const d=+str[str.length-1-i], end=0.5+i*0.22+0.7, k=p4o(cl((lt-0.2)/(end-0.2),0,1)), turns=2+i, pos=(turns*10+d)*k, x=x0-cw*(i+0.5);
      for(const o of [0,1]){ const dig=(Math.floor(pos)+o)%10, y=cy+(o-(pos%1))*fs*1.05; X.fillText(String(dig),x,y); } }
    X.restore(); if(L.unit) vtx(L.unit,R.x+R.w/2-tot/2-fs*0.32,cy+fs*0.18,'800 '+Math.round(fs*0.36)+'px '+S.fam,S.ink);
    if(L.label) wrapTxtC(L.label,R.x+R.w/2,R.y+R.h*0.82,R.w*0.9,'700 44px '+S.fam,S.ink,2); };
  VK.news=function(R,lt,L,S){ const fam='"Noto Naskh Arabic", '+S.fam, fs=L.size||66, k=p3o(cl(lt/0.4,0,1)), hx0=R.x+R.w-30;
    X.save(); X.globalAlpha=S.k*k; X.translate(0,(1-k)*40); X.fillStyle='#FFFFFF'; X.shadowColor='rgba(0,0,0,0.3)'; X.shadowBlur=30; X.shadowOffsetY=10; rr(R.x,R.y,R.w,R.h,24); X.fill(); X.shadowColor='transparent';
    let y=R.y+70; X.direction='rtl'; X.textAlign='right'; X.textBaseline='middle'; if(L.source){ vtx(L.source,hx0,y,'700 32px '+S.fam,S.acc,'right'); y+=56; X.fillStyle='#E4E2DC'; X.fillRect(R.x+30,y-20,R.w-60,3); y+=24; }
    const im=L.src&&IMG[L.src]; if(im&&im.ok){ const ih=Math.round(R.h*0.34); X.save(); X.beginPath(); rr(R.x+30,y,R.w-60,ih,14); X.clip(); coverDraw(im,R.x+30,y,R.w-60,ih,1); X.restore(); y+=ih+40; }
    const font='700 '+fs+'px '+fam, lines=tLines(L.text||'',font,R.w-80,5), mk=String(L.mark||'').trim(), lh=fs*1.42; X.font=font;
    const mws=mk?mk.split(/\s+/).filter(Boolean):[]; let mi=0;
    lines.forEach((ln,i)=>{ const cy=y+lh*i+lh/2, ws=ln.split(' '); let pre='';
      ws.forEach((w,j)=>{ if(mi<mws.length&&w.replace(/[،.,!؟?]/g,'')===mws[mi]){ const wp=X.measureText(pre).width, wm=X.measureText(w).width, g=p3o(cl((lt-0.7-mi*0.18)/0.4,0,1)); X.fillStyle=rgba(L.markColor||'#FFD21F',0.85); rr(hx0-wp-wm*g-8,cy-fs*0.5,wm*g+16,fs*1.0,8); X.fill(); mi++; } else if(mi>0&&mi<mws.length) mi=0; pre+=w+' '; });
      X.fillStyle='#15151C'; X.fillText(ln,hx0,cy); });
    X.restore(); };
  window.__hsVizKinds=Object.keys(VK);

  /* ═══════════ 4.2: أسلوب «ورق متحرك» وأسلوب «الدحيح» ═══════════
     ورق متحرك (type=kinetic): شاشة ورق فاتح بشبكة نقط، الكلام ينكتب كلمة كلمة على وقت نطقها، وسطر كبير
       وسطر بصندوق أسود، وكرت بظل ناعم (طرفية · جوال · زر · تعليق · حساب · صورة) وزهور وملصقات بلون الطين. الفيديو يختفي والصوت يكمل.
     الدحيح (hs.dahih + type=desk): رأس أسود فيه الصورة والعنوان والشعار، ونافذة عرضية فيها مكتب ورق ورا المتحدث المقصوص،
       وكروت مشبوكة بمشبك أحمر، أرقام بدائرة يد، شطب واستبدال، فاتورة، ملفات، ساعة، أعمدة، وكابشن برتقالي قصير. */
  const ST42={};
  const KP={paper:'#F2F1EC',line:'rgba(20,20,19,0.055)',dot:'rgba(20,20,19,0.14)',ink:'#151513',mute:'#C4C2BA',clay:'#D97757',clayD:'#C2603F'};
  const MONO='"IBM Plex Mono","Courier New",monospace';
  /* 4.2: الخط المعتمد Cairo (أنظف). يتغيّر من لوحة الأسلوب: dahih.font للكروت · dahih.numFont للأرقام · kin.font للورق */
  const AR=()=>'"'+((HSX.dahih&&HSX.dahih.font)||'Cairo')+'","IBM Plex Sans Arabic","Noto Sans Arabic",sans-serif', NUM=()=>((HSX.dahih&&HSX.dahih.numFont)?'"'+HSX.dahih.numFont+'",':'')+AR();
  const e3=k=>1-Math.pow(1-k,3), e4=k=>1-Math.pow(1-k,4);
  const mixC=(a,b,k)=>{ const A=hx(a), B=hx(b); return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')+')'; };
  const nrmW=w=>String(w||'').replace(/[ً-ْـ«»"'“”.,،؛;:!؟?()\[\]]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase();
  function softSh(b,y,al){ X.shadowColor='rgba(20,20,19,'+(al==null?0.18:al)+')'; X.shadowBlur=b; X.shadowOffsetY=y; X.shadowOffsetX=0; }
  function noSh(){ X.shadowColor='transparent'; X.shadowBlur=0; X.shadowOffsetY=0; X.shadowOffsetX=0; }
  function spokenIn(a,b){ const o=[]; if(typeof CAPS==='undefined') return o; for(const c of CAPS){ if(c.e<a||c.s>b) continue; for(const w of (c.w||[])) if(w.s>=a&&w.s<b) o.push(w); } return o; }
  /* وقت ظهور كل كلمة: وقت نطقها لو لقيناها بالتفريغ، وإلا بين جاراتها، وإلا بالتساوي */
  function wordTimes(words,s,e,mode){ const key='wt|'+words.join('|')+'|'+s+'|'+e+'|'+mode; if(ST42[key]) return ST42[key];
    const n=words.length, out=new Array(n).fill(null);
    if(mode==='all'){ for(let i=0;i<n;i++) out[i]=s+0.06+i*0.035; return ST42[key]=out; }
    if(mode!=='even'){ const sp=spokenIn(s-0.3,e); let j=0;
      for(let i=0;i<n;i++){ const q=nrmW(words[i]); if(!q) continue;
        for(let k=j;k<Math.min(sp.length,j+6);k++){ const p=nrmW(sp[k].t); if(p&&(p===q||(q.length>2&&p.length>2&&(p.includes(q)||q.includes(p))))){ out[i]=Math.max(s,sp[k].s); j=k+1; break; } } } }
    if(out.every(v=>v==null)){ const span=Math.min(Math.max(0.5,(e-s)*0.7),n*0.3); for(let i=0;i<n;i++) out[i]=s+0.06+span*i/Math.max(1,n); return ST42[key]=out; }
    for(let i=0;i<n;i++){ if(out[i]!=null) continue; let a=i-1; while(a>=0&&out[a]==null) a--; let b=i+1; while(b<n&&out[b]==null) b++;
      const ta=a>=0?out[a]:s, tb=b<n?out[b]:Math.min(e-0.12,ta+0.28*(b-a)); out[i]=ta+(tb-ta)*(i-a)/(b-a); }
    for(let i=1;i<n;i++) if(out[i]<out[i-1]) out[i]=out[i-1];
    return ST42[key]=out; }
  function starburst(x,y,r,col,lw){ X.save(); X.strokeStyle=col; X.lineCap='round'; X.lineWidth=lw||Math.max(2,r*0.15);
    for(let i=0;i<12;i++){ const an=i*Math.PI/6+0.13, r0=r*0.12, r1=r*(i%2?0.74:1); X.beginPath(); X.moveTo(x+Math.cos(an)*r0,y+Math.sin(an)*r0); X.lineTo(x+Math.cos(an)*r1,y+Math.sin(an)*r1); X.stroke(); } X.restore(); }
  function flowerShape(r,seed){ X.beginPath(); const n=7; for(let i=0;i<n;i++){ const a0=i/n*6.2832, len=r*(0.72+0.28*rnd(seed+i)), wd=0.42; const ax=Math.cos(a0-wd)*r*0.18, ay=Math.sin(a0-wd)*r*0.18, bx=Math.cos(a0+wd)*r*0.18, by=Math.sin(a0+wd)*r*0.18, tx=Math.cos(a0)*len, ty=Math.sin(a0)*len;
      if(i===0) X.moveTo(ax,ay); else X.lineTo(ax,ay); X.quadraticCurveTo(Math.cos(a0-0.22)*len*1.08,Math.sin(a0-0.22)*len*1.08,tx,ty); X.quadraticCurveTo(Math.cos(a0+0.22)*len*1.08,Math.sin(a0+0.22)*len*1.08,bx,by); } X.closePath(); }

  /* ── ورق متحرك ── */
  const kinAll=()=>(HSX.layers||[]).filter(L=>L.type==='kinetic'&&!L.off&&L.e>L.s);
  const kinAt=t=>{ const Ls=kinAll().filter(L=>t>=L.s&&t<L.e); return Ls.length?Ls[Ls.length-1]:null; };
  const kinPrev=L=>kinAll().find(P=>P!==L&&P.s<L.s&&Math.abs(P.e-L.s)<0.08);
  const kinNext=L=>kinAll().find(N=>N!==L&&N.s>L.s&&Math.abs(N.s-L.e)<0.08);
  function kinParse(txt){ return String(txt||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{ let k='s';
      if(/^\*/.test(l)){ k='b'; l=l.replace(/^\*+\s*/,''); } else if(/^>/.test(l)){ k='x'; l=l.replace(/^>\s*/,''); } else if(/^\+/.test(l)){ k='m'; l=l.replace(/^\+\s*/,''); }
      return {k,t:l}; }); }
  function runsOf(t){ const R=[]; for(const w of String(t).split(/\s+/).filter(Boolean)){ const ar=hasAr(w)||!/[A-Za-z0-9]/.test(w), last=R[R.length-1]; if(!ar&&last&&!last.ar) last.ws.push(w); else R.push({ar,ws:[w]}); } return R; }
  function kinLayout(L){ const fam=L.font||(HSX.kin&&HSX.kin.font)||'Cairo', key='kl|'+L.text+'|'+fam, FB=',"IBM Plex Sans Arabic","Noto Sans Arabic",Inter,Arial,sans-serif'; if(ST42[key]) return ST42[key];
    const SZ={s:[46,600],m:[62,700],b:[106,900],x:[72,800]}, rows=[], words=[];
    for(const ln of kinParse(L.text)){ const fs=SZ[ln.k][0], font=SZ[ln.k][1]+' '+fs+'px "'+fam+'"'+FB; X.font=font; const gap=Math.round(fs*0.27); let cur=[], cw=0;
      const flush=()=>{ if(cur.length){ rows.push({k:ln.k,fs,font,gap,runs:cur,w:cw-gap}); cur=[]; cw=0; } };
      for(const r of runsOf(ln.t)){ const txt=r.ws.join(' '), w=X.measureText(txt).width; if(cur.length&&cw+w>(ln.k==='b'?960:900)) flush(); cur.push({ar:r.ar,txt,w,wi:words.length,first:r.ws[0]}); words.push(r.ws[0]); cw+=w+gap; }
      flush(); }
    const LH={s:1.4,m:1.3,b:1.16,x:1.55}; let H=0; rows.forEach(r=>{ r.h=Math.round(r.fs*LH[r.k]); H+=r.h; });
    return ST42[key]={rows,words,H}; }
  function kinBg(a,wipe){ X.save(); if(wipe<1){ X.beginPath(); X.rect(0,1920*(1-wipe),1080,1920*wipe+2); X.clip(); } X.globalAlpha=a;
    X.fillStyle=KP.paper; X.fillRect(0,0,1080,1920);
    const g=X.createRadialGradient(540,880,120,540,880,1150); g.addColorStop(0,'rgba(255,255,255,0.6)'); g.addColorStop(1,'rgba(255,255,255,0)'); X.fillStyle=g; X.fillRect(0,0,1080,1920);
    X.strokeStyle=KP.line; X.lineWidth=2; X.setLineDash([3,10]);
    for(let gx=90;gx<1080;gx+=90){ X.beginPath(); X.moveTo(gx,300); X.lineTo(gx,1620); X.stroke(); } for(let gy=300;gy<=1620;gy+=90){ X.beginPath(); X.moveTo(40,gy); X.lineTo(1040,gy); X.stroke(); } X.setLineDash([]);
    X.fillStyle=KP.dot; for(let gx=90;gx<1080;gx+=90) for(let gy=300;gy<=1620;gy+=90){ X.beginPath(); X.arc(gx,gy,2.6,0,6.2832); X.fill(); }
    const K0=HSX.kin||{}, mk=K0.mark!=null?K0.mark:(HANDLE&&HANDLE!=='@handle'?HANDLE:''); if(mk){ X.font='600 38px "'+(K0.font||'Cairo')+'",sans-serif'; X.fillStyle='rgba(20,20,19,0.17)'; X.textAlign='center'; X.textBaseline='middle'; X.direction='ltr'; X.fillText(String(mk).replace(/^@/,''),540,1712); }
    X.restore(); }
  function kinDeco(L,t,a,t0){ const d=L.deco||'none'; if(d==='none') return; const k=cl((t-t0)/0.55,0,1), sc=k<1?back(k):1;
    X.save(); X.globalAlpha=a;
    if(d==='flowers'||d==='both'){ [[70,150,250,0.0,1],[1010,1750,270,2.1,2],[-10,1180,150,1.2,3]].forEach(([x,y,r,r0,sd],i)=>{ const kk=cl((t-t0-i*0.08)/0.55,0,1); if(kk<=0) return; X.save(); X.translate(x,y); X.rotate(r0+(t-t0)*0.12*(i%2?-1:1)); X.scale(back(kk),back(kk)); X.fillStyle=KP.clay; flowerShape(r,sd*7); X.fill(); X.restore(); }); }
    if(d==='badges'||d==='both'){ [[880,430,78],[190,1140,96],[900,1290,64]].forEach(([x,y,r],i)=>{ const kk=cl((t-t0-0.12-i*0.1)/0.5,0,1); if(kk<=0) return; const fl=Math.sin(t*1.4+i*1.7)*7; X.save(); X.translate(x,y+fl); X.scale(back(kk),back(kk));
        softSh(34,14,0.2); X.fillStyle='#F6F5F1'; X.beginPath(); X.arc(0,0,r,0,6.2832); X.fill(); noSh(); X.strokeStyle='rgba(20,20,19,0.06)'; X.lineWidth=2; X.stroke(); starburst(0,0,r*0.62,KP.clay,r*0.1); X.restore(); }); }
    X.restore(); }
  function kinText(L,t,a){ const Lay=kinLayout(L), T0=wordTimes(Lay.words,L.s,L.e,L.reveal||'spoken'), hasCard=L.card&&L.card!=='none';
    const cy=(L.y!=null?+L.y:(hasCard?0.25:0.43))*1920; let y=cy-Lay.H/2;
    for(const r of Lay.rows){ const rtl=r.runs.some(q=>q.ar), mid=y+r.h/2; X.font=r.font; X.textBaseline='middle';
      if(r.k==='x'){ const t0=T0[r.runs[0].wi], g=e3(cl((t-t0)/0.32,0,1)); if(g>0){ const bw=r.w+r.fs*0.55, bh=r.fs*1.28, x0=540-bw/2; X.save(); X.globalAlpha=a; X.fillStyle=KP.ink; if(rtl) X.fillRect(x0+bw*(1-g),mid-bh/2,bw*g,bh); else X.fillRect(x0,mid-bh/2,bw*g,bh); X.restore(); } }
      let x=rtl?540+r.w/2:540-r.w/2;
      for(const q of r.runs){ const ts=T0[q.wi], k=cl((t-ts)/0.3,0,1);
        if(k>0){ const ee=e3(k), col=r.k==='x'?'#FFFFFF':mixC(KP.mute,KP.ink,cl((t-ts-0.06)/0.42,0,1)); X.save(); X.globalAlpha=a*Math.min(1,k*1.7); X.fillStyle=col; X.direction=q.ar?'rtl':'ltr'; X.textAlign=rtl?'right':'left';
          const sc=r.k==='b'?0.88+0.12*back(Math.min(1,k*1.15)):1, cxw=rtl?x-q.w/2:x+q.w/2; X.translate(cxw,mid+(1-ee)*18); X.scale(sc,sc); X.translate(-cxw,0); X.fillText(q.txt,x,0); X.restore(); }
        x+=rtl?-(q.w+r.gap):(q.w+r.gap); }
      y+=r.h; }
    return y; }
  function iconStar(x,y,s){ X.save(); X.fillStyle=KP.ink; rr(x-s/2,y-s/2,s,s,s*0.16); X.fill(); X.fillStyle='#FFFFFF'; X.beginPath(); for(let i=0;i<8;i++){ const an=i*Math.PI/4-Math.PI/2, rr2=i%2?s*0.12:s*0.34; X.lineTo(x+Math.cos(an)*rr2,y+Math.sin(an)*rr2); } X.closePath(); X.fill(); X.restore(); }
  function kinCard(L,t,a,top){ const kind=L.card; if(!kind||kind==='none') return; const lt=t-L.s, at=L.cardAt!=null?+L.cardAt:0.18, k=cl((lt-at)/0.5,0,1); if(k<=0) return;
    const ee=e3(k), fl=Math.sin(t*1.5)*5, Y0=L.cardY!=null?+L.cardY*1920:top+80, fam=(L.font||(HSX.kin&&HSX.kin.font)||'Cairo')+'","IBM Plex Sans Arabic",Inter,"Noto Sans Arabic';
    X.save(); X.globalAlpha=a*Math.min(1,k*1.6);
    if(kind==='terminal'){ const out=Array.isArray(L.cardOut)?L.cardOut:(L.cardOut?String(L.cardOut).split(/\n|\|/).map(x=>x.trim()).filter(Boolean):[]), w=880, h=out.length?250+out.length*46:240, x0=100, y0=Y0+(1-ee)*70+fl;
      softSh(70,30,0.3); X.fillStyle='#1B1B1A'; rr(x0,y0,w,h,22); X.fill(); noSh();
      starburst(x0+44,y0+44,13,KP.clay,3.5); X.font='500 24px '+MONO; X.fillStyle='#8E8C85'; X.textAlign='left'; X.textBaseline='middle'; X.direction='ltr'; X.fillText(L.cardTitle||'Claude Code · ~/project',x0+70,y0+45);
      X.strokeStyle='#3A3936'; X.lineWidth=2; rr(x0+30,y0+86,w-60,74,12); X.stroke();
      const typ=String(L.cardText||''), ts=at+0.45, n=Math.max(0,Math.min(typ.length,Math.floor((lt-ts)*20))), shown=typ.slice(0,n);
      X.font='500 30px '+(hasAr(typ)?'"'+fam+'"':MONO); X.fillStyle='#ECEAE4'; X.fillText('>',x0+52,y0+124); X.direction=hasAr(typ)?'rtl':'ltr'; X.textAlign=hasAr(typ)?'right':'left';
      const tx=hasAr(typ)?x0+w-56:x0+86; X.fillText(shown,tx,y0+124); X.direction='ltr';
      if(n<typ.length||Math.floor(t*2.2)%2===0){ X.font='500 30px '+MONO; const cw=X.measureText(shown).width; X.fillStyle=KP.clay; X.fillRect(hasAr(typ)?tx-cw-16:tx+cw+4,y0+106,13,36); }
      const td=ts+typ.length/20+0.25; out.forEach((ln,i)=>{ const kk=cl((lt-td-i*0.28)/0.25,0,1); if(kk<=0) return; X.globalAlpha=a*kk; X.font='500 25px '+(hasAr(ln)?'"'+fam+'"':MONO); X.fillStyle=i===out.length-1?'#9BD49B':'#CFCBC2'; X.direction=hasAr(ln)?'rtl':'ltr'; X.textAlign=hasAr(ln)?'right':'left'; X.fillText((hasAr(ln)?'':'• ')+ln,hasAr(ln)?x0+w-56:x0+56,y0+200+i*46); }); }
    else if(kind==='phone'){ const w=420, h=660, x0=540-w/2, y0=Y0+(1-ee)*90+fl; softSh(60,26,0.22); X.fillStyle='#FFFFFF'; rr(x0,y0,w,h,40); X.fill(); noSh(); X.strokeStyle='rgba(20,20,19,0.08)'; X.lineWidth=2; X.stroke();
      const im=L.src&&IMG[L.src]; if(im&&im.ok){ X.save(); rr(x0+18,y0+18,w-36,h-36,26); X.clip(); coverDraw(im,x0+18,y0+18,w-36,h-36,1); X.restore(); }
      else { X.font='700 30px "'+fam+'"'; X.fillStyle=KP.ink; X.textAlign='right'; X.textBaseline='middle'; X.direction='rtl'; X.fillText(L.cardTitle||'',x0+w-40,y0+70);
        const k2=e3(cl((lt-at-0.3)/0.4,0,1)); X.save(); X.globalAlpha*=k2; softSh(24,8,0.14); X.fillStyle='#FFFFFF'; rr(x0+34,y0+130+(1-k2)*20,w-68,190,16); X.fill(); noSh(); X.strokeStyle='rgba(20,20,19,0.08)'; X.stroke();
          X.font='700 26px "'+fam+'"'; X.fillStyle=KP.ink; X.fillText(L.cardText||'',x0+w-60,y0+180+(1-k2)*20); X.fillStyle='rgba(20,20,19,0.12)'; [0,1,2].forEach(i=>{ X.fillRect(x0+60,y0+222+i*28+(1-k2)*20,(w-120)*(i===2?0.55:1),10); }); X.restore();
          X.fillStyle='rgba(20,20,19,0.07)'; [0,1,2,3].forEach(i=>X.fillRect(x0+50,y0+380+i*44,(w-100)*(i%2?0.7:1),14)); } }
    else if(kind==='pill'){ const txt=L.cardText||'', f='800 46px "'+fam+'"'; X.font=f; const tw=X.measureText(txt).width, w=tw+200, h=118, x0=540-w/2, y0=Y0+(1-ee)*40, sc=0.86+0.14*back(k);
      X.translate(540,y0+h/2); X.scale(sc,sc); X.translate(-540,-(y0+h/2));
      softSh(40,18,0.2); X.fillStyle='#C9C7BF'; rr(x0+8,y0+12,w,h,22); X.fill(); noSh(); X.fillStyle='#F7F6F2'; rr(x0,y0,w,h,22); X.fill(); X.strokeStyle='rgba(20,20,19,0.10)'; X.lineWidth=2; X.stroke();
      iconStar(x0+w-62,y0+h/2,78); X.fillStyle=KP.ink; X.textAlign='right'; X.textBaseline='middle'; X.direction=hasAr(txt)?'rtl':'ltr'; X.fillText(txt,x0+w-122,y0+h/2+2); }
    else if(kind==='comment'){ const txt=L.cardText||'', f='800 52px "'+fam+'"'; X.font=f; const tw=X.measureText(txt).width, w=Math.max(460,tw+230), h=128, x0=540-w/2+(1-ee)*140, y0=Y0+fl*0.6;
      X.translate(540,y0+h/2); X.rotate(-0.07*(1-ee)); X.translate(-540,-(y0+h/2));
      softSh(46,18,0.2); X.fillStyle='#FFFFFF'; rr(x0,y0,w,h,30); X.fill(); noSh();
      const ax=x0+w-70; X.fillStyle='#D9D7D0'; X.beginPath(); X.arc(ax,y0+h/2,36,0,6.2832); X.fill(); const im=L.src&&IMG[L.src]; if(im&&im.ok){ X.save(); X.beginPath(); X.arc(ax,y0+h/2,36,0,6.2832); X.clip(); coverDraw(im,ax-36,y0+h/2-36,72,72,1); X.restore(); }
      X.fillStyle=KP.ink; X.textAlign='right'; X.textBaseline='middle'; X.direction='rtl'; X.fillText(txt,ax-56,y0+h/2+2);
      X.strokeStyle='#8E8C85'; X.lineWidth=3; const hx0=x0+48, hy=y0+h/2; X.beginPath(); X.moveTo(hx0,hy+12); X.bezierCurveTo(hx0-26,hy-6,hx0-12,hy-22,hx0,hy-10); X.bezierCurveTo(hx0+12,hy-22,hx0+26,hy-6,hx0,hy+12); X.stroke();
      if(L.cardSub){ X.globalAlpha=a*cl((lt-at-0.45)/0.3,0,1); X.font='600 36px "'+fam+'"'; X.fillStyle='#8E8C85'; X.textAlign='center'; X.fillText(L.cardSub,540,y0+h+60); } }
    else if(kind==='profile'){ const r=118, cx=540, cy=Y0+r+20, sc=0.7+0.3*back(k), K0=HSX.kin||{}, src=L.src||K0.avatar, im=src&&IMG[src], hd=L.cardText||K0.handle||(HANDLE&&HANDLE!=='@handle'?HANDLE:'');
      X.translate(cx,cy); X.scale(sc,sc); X.translate(-cx,-cy);
      softSh(50,20,0.25); X.fillStyle='#FFFFFF'; X.beginPath(); X.arc(cx,cy,r+10,0,6.2832); X.fill(); noSh();
      X.save(); X.beginPath(); X.arc(cx,cy,r,0,6.2832); X.clip(); if(im&&im.ok) coverDraw(im,cx-r,cy-r,2*r,2*r,1); else { X.fillStyle=KP.clay; X.fillRect(cx-r,cy-r,2*r,2*r); X.font='800 110px "'+fam+'"'; X.fillStyle='#FFFFFF'; X.textAlign='center'; X.textBaseline='middle'; X.fillText(String(hd).replace('@','').slice(0,1).toUpperCase(),cx,cy+6); } X.restore();
      const kh=cl((lt-at-0.3)/0.3,0,1); X.globalAlpha=a*kh; X.font='700 48px "'+fam+'"'; X.fillStyle=KP.ink; X.textAlign='center'; X.textBaseline='middle'; X.direction='ltr'; X.fillText(hd,cx,cy+r+70);
      const fol=lt>at+Math.max(0.9,(L.e-L.s)*0.55), bw=220, bh=70; X.fillStyle=fol?'#BDBBB4':KP.ink; rr(cx-bw/2,cy+r+120,bw,bh,14); X.fill(); X.font='700 32px Inter,sans-serif'; X.fillStyle='#FFFFFF'; X.fillText(fol?(L.cardSub||'Following'):(L.cardSub?'Follow':'Follow'),cx,cy+r+156); }
    else if(kind==='image'){ const im=L.src&&IMG[L.src]; if(im&&im.ok){ const w=Math.min(820,(L.cardW||0.76)*1080), h=w*im.naturalHeight/im.naturalWidth, x0=540-w/2, y0=Y0+(1-ee)*70+fl; softSh(60,26,0.24); X.fillStyle='#FFFFFF'; rr(x0-14,y0-14,w+28,h+28,24); X.fill(); noSh(); X.save(); rr(x0,y0,w,h,14); X.clip(); X.drawImage(im,x0,y0,w,h); X.restore(); } }
    X.restore(); }
  function kinetics(t){ if(t>=VEND) return false; const L=kinAt(t); if(!L) return false; const P=kinPrev(L), N=kinNext(L), lt=t-L.s, rt=L.e-t;
    let r0=L; while(true){ const q=kinPrev(r0); if(!q) break; r0=q; } const runStart=r0.s;
    const wipe=e4(cl((t-runStart)/0.38,0,1)), out=N?1:cl(rt/0.3,0,1);
    if(!N&&out<1){ X.save(); X.beginPath(); X.rect(0,0,1080,1920*e3(out)); X.clip(); }
    kinBg(1,wipe);
    let d0=L; while(true){ const q=kinPrev(d0); if(!q||(q.deco||'none')!==(L.deco||'none')) break; d0=q; }
    kinDeco(L,t,1,d0.s+(d0===r0?0.2:0));
    const ca=(N?cl(rt/0.14,0,1):cl(rt/0.2+0.3,0,1))*cl((t-runStart-0.2)/0.12,0,1);
    if(ca>0){ X.save(); const top=kinText(L,t,ca); kinCard(L,t,ca,top); X.restore(); }
    if(!N&&out<1) X.restore();
    return true; }

  /* ── الدحيح ── */
  const dkOn=()=>!!(HSX.dahih&&HSX.dahih.on);
  const dkStage=()=>(!dkOn()||(HSX.dahih||{}).layout==='full'?{x:0,y:0,w:1080,h:1920,full:true}:{x:0,y:660,w:1080,h:608,full:false});
  function dkMode(t){ const D=HSX.dahih||{}, bs=(D.bgs||[]).filter(b=>b&&b.mode).slice().sort((a,b)=>a.s-b.s); let m=D.bg||'paper', prev=null, ms=-9;
    for(const b of bs){ if(t>=b.s){ prev=m; m=b.mode; ms=b.s; } } return {m,prev,ms}; }
  const dkNeedMask=t=>dkOn()&&dkMode(t).m!=='original';
  let DKN=null; function dkNoise(){ if(DKN) return DKN; const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'), d=g.createImageData(256,256);
    for(let i=0;i<d.data.length;i+=4){ const v=rnd(i*0.37)*255; d.data[i]=d.data[i+1]=d.data[i+2]=v; d.data[i+3]=16; } g.putImageData(d,0,0); return DKN=c; }
  function dkPaint(m,R,t){ X.save(); X.beginPath(); X.rect(R.x,R.y,R.w,R.h); X.clip();
    if(m==='navy'){ X.fillStyle='#14294A'; X.fillRect(R.x,R.y,R.w,R.h); X.strokeStyle='rgba(255,255,255,0.055)'; X.lineWidth=1.5; for(let x=R.x;x<R.x+R.w;x+=36){ X.beginPath(); X.moveTo(x,R.y); X.lineTo(x,R.y+R.h); X.stroke(); } for(let y=R.y;y<R.y+R.h;y+=36){ X.beginPath(); X.moveTo(R.x,y); X.lineTo(R.x+R.w,y); X.stroke(); }
      const g=X.createRadialGradient(R.x+R.w*0.6,R.y+R.h*0.45,50,R.x+R.w*0.6,R.y+R.h*0.45,R.w*0.8); g.addColorStop(0,'rgba(60,110,170,0.25)'); g.addColorStop(1,'rgba(0,0,0,0.25)'); X.fillStyle=g; X.fillRect(R.x,R.y,R.w,R.h); }
    else if(m==='green'){ X.fillStyle='#1BB43B'; X.fillRect(R.x,R.y,R.w,R.h); }
    else if(m==='orange'){ const g=X.createLinearGradient(R.x,R.y,R.x+R.w,R.y+R.h); g.addColorStop(0,'#E8946A'); g.addColorStop(1,'#D9784F'); X.fillStyle=g; X.fillRect(R.x,R.y,R.w,R.h); }
    else if(m==='dark'){ X.fillStyle='#1A1917'; X.fillRect(R.x,R.y,R.w,R.h); }
    else { X.fillStyle='#E8E1D0'; X.fillRect(R.x,R.y,R.w,R.h); const g=X.createRadialGradient(R.x+R.w*0.5,R.y+R.h*0.45,60,R.x+R.w*0.5,R.y+R.h*0.45,R.w*0.75); g.addColorStop(0,'rgba(255,252,242,0.55)'); g.addColorStop(1,'rgba(150,130,100,0.18)'); X.fillStyle=g; X.fillRect(R.x,R.y,R.w,R.h);
      X.globalAlpha=0.9; const N=dkNoise(); for(let x=R.x;x<R.x+R.w;x+=256) for(let y=R.y;y<R.y+R.h;y+=256) X.drawImage(N,x,y); X.globalAlpha=1;
      X.strokeStyle='rgba(120,90,70,0.16)'; X.lineWidth=2.2; const u=R.w/1080; [[0.04,0.24],[0.05,0.62],[0.86,0.86]].forEach(([fx,fy],i)=>{ for(let j=0;j<3;j++){ X.beginPath(); const x0=R.x+R.w*fx, y0=R.y+R.h*fy+j*9*u; for(let s=0;s<=20;s++) X.lineTo(x0+s*4.2*u,y0+Math.sin(s*0.9+i)*4*u); X.stroke(); } }); }
    X.restore(); }
  function dkBackground(t,R){ const M=dkMode(t); if(M.m==='original'&&!(M.prev&&t-M.ms<0.5)) return;
    if(M.prev&&t-M.ms<0.5){ if(M.prev!=='original') dkPaint(M.prev,R,t); if(M.m==='original') return; const k=e3(cl((t-M.ms)/0.5,0,1)), cx=R.x+R.w*0.32, cy=R.y+R.h*0.58, rmax=Math.hypot(R.w,R.h);
      X.save(); X.beginPath(); X.arc(cx,cy,rmax*k,0,6.2832); X.clip(); dkPaint(M.m,R,t); X.restore(); }
    else dkPaint(M.m,R,t); }
  function dkPerson(t,R){ const fr=FR.cur, mk=FR.mask, sw=VF.naturalWidth||1080, shh=VF.naturalHeight||1920; if(!fr) return false; const M=dkMode(t);
    const cutout=M.m!=='original'&&mk; const f=faceAt(t), D=HSX.dahih||{};
    if(R.full){ if(!cutout) return false; const kx=fr.naturalWidth/sw, ky=fr.naturalHeight/shh, mx=mk.naturalWidth/sw, my=mk.naturalHeight/shh;
      _PX.setTransform(1,0,0,1,0,0); _PX.globalCompositeOperation='source-over'; _PX.clearRect(0,0,1080,1920); _di.call(_PX,fr,0,0,sw*kx,shh*ky,0,0,1080,1920); _PX.globalCompositeOperation='destination-in'; _di.call(_PX,mk,0,0,sw*mx,shh*my,0,0,1080,1920); _PX.globalCompositeOperation='source-over';
      const G=gradeOf(); if(G) X.filter=G.f; _di.call(X,_PC,0,0,1080,1920,0,0,1080,1920); X.filter='none'; return true; }
    X.save(); X.beginPath(); X.rect(R.x,R.y,R.w,R.h); X.clip();
    if(!cutout){ const ch=Math.round(sw*R.h/R.w), sy=f?cl(f[2]*shh-ch*0.42,0,shh-ch):cl(shh*0.18,0,shh-ch); const G=gradeOf(); if(G) X.filter=G.f; _di.call(X,fr,0,sy*fr.naturalHeight/shh,fr.naturalWidth,ch*fr.naturalHeight/shh,R.x,R.y,R.w,R.h); X.filter='none'; X.restore(); return true; }
    const chs=Math.round(shh*(D.zoom||0.74)), sy=f?cl(f[2]*shh-chs*0.24,0,shh-chs):cl(shh*0.12,0,shh-chs), sc=R.h*1.04/chs, dw=sw*sc, dh=chs*sc;
    const side=D.side==='left'?0.29:0.71, fxs=f?f[1]*sw:sw/2, dx=R.x+R.w*side-fxs*sc, dy=R.y+R.h-dh+R.h*0.04;
    const kx=fr.naturalWidth/sw, ky=fr.naturalHeight/shh, mx=mk.naturalWidth/sw, my=mk.naturalHeight/shh, pw=Math.min(1080,Math.ceil(dw)), ph=Math.min(1920,Math.ceil(dh));
    _PX.setTransform(1,0,0,1,0,0); _PX.globalCompositeOperation='source-over'; _PX.clearRect(0,0,1080,1920);
    _di.call(_PX,fr,0,sy*ky,sw*kx,chs*ky,0,0,pw,ph); _PX.globalCompositeOperation='destination-in'; _di.call(_PX,mk,0,sy*my,sw*mx,chs*my,0,0,pw,ph); _PX.globalCompositeOperation='source-over';
    const G=gradeOf(); if(G) X.filter=G.f; if(M.m==='paper'){ X.shadowColor='rgba(60,40,20,0.22)'; X.shadowBlur=26; X.shadowOffsetX=-10; X.shadowOffsetY=6; } _di.call(X,_PC,0,0,pw,ph,dx,dy,dw,dh); X.filter='none'; noSh();
    X.restore(); return true; }
  function dkHeader(){ const D=HSX.dahih||{}; if(D.layout==='full') return; X.save(); X.fillStyle='#000'; X.fillRect(0,0,1080,1920);
    const y0=452, h=184, av=D.avatar&&IMG[D.avatar]; let left=40, right=1040;
    if(av&&av.ok){ X.save(); rr(left,y0,h,h,10); X.clip(); X.filter=D.avatarBW===false?'none':'grayscale(1) contrast(1.08)'; coverDraw(av,left,y0,h,h,1); X.filter='none'; X.restore(); left+=h+28; }
    if(D.logo&&D.logo!=='none'){ const s=160, lx=right-s, ly=y0+(h-s)/2; X.fillStyle='#FFFFFF'; rr(lx,ly,s,s,34); X.fill(); const lim=D.logo&&D.logo!=='claude'&&IMG[D.logo]; if(lim&&lim.ok) coverDraw(lim,lx+16,ly+16,s-32,s-32,1); else { starburst(lx+s/2,ly+s*0.42,s*0.3,KP.clay,s*0.06); X.font='600 26px Georgia,serif'; X.fillStyle='#4A4945'; X.textAlign='center'; X.textBaseline='middle'; X.direction='ltr'; X.fillText(D.logoText||'Claude',lx+s/2,ly+s*0.82); } right=lx-28; }
    const title=D.title||''; if(title){ let fs=74; const fam=D.font||'Cairo'; X.font='900 '+fs+'px "'+fam+'"'; while(X.measureText(title).width>right-left&&fs>40){ fs-=2; X.font='900 '+fs+'px "'+fam+'"'; }
      X.fillStyle='#FFFFFF'; X.textAlign='right'; X.textBaseline='middle'; X.direction='rtl'; X.fillText(title,right,y0+h/2+4); }
    X.restore(); }
  function dkOverlay(t,R){ const M=dkMode(t), dark=M.m==='navy'||M.m==='dark'||M.m==='green', ink=dark?'rgba(255,255,255,0.75)':'rgba(30,25,20,0.7)', D=HSX.dahih||{}, u=R.w/1080; X.save();
    X.strokeStyle=ink; X.lineWidth=2.5*u; const cn=26*u, ins=22*u; [[R.x+ins,R.y+ins,1,1],[R.x+R.w-ins,R.y+ins,-1,1],[R.x+ins,R.y+R.h-ins,1,-1],[R.x+R.w-ins,R.y+R.h-ins,-1,-1]].forEach(([x,y,sx,sy])=>{ X.beginPath(); X.moveTo(x,y+sy*cn); X.lineTo(x,y); X.lineTo(x+sx*cn,y); X.stroke(); });
    if(D.tag){ X.font='700 '+Math.round(26*u)+'px "'+(D.font||'Cairo')+'"'; X.fillStyle=ink; X.textAlign='left'; X.textBaseline='middle'; X.direction='rtl'; X.fillText(D.tag,R.x+64*u,R.y+40*u); }
    if(D.tc!==false){ const fr=Math.floor(t*30), ss=Math.floor(fr/30), tc='TC 00:'+String(Math.floor(ss/60)).padStart(2,'0')+':'+String(ss%60).padStart(2,'0')+':'+String(fr%30).padStart(2,'0');
      X.font='500 '+Math.round(16*u)+'px '+MONO; X.fillStyle=ink; X.textAlign='right'; X.direction='ltr'; X.fillText(tc,R.x+R.w-60*u,R.y+R.h-34*u);
      X.fillStyle=dark?'rgba(255,255,255,0.35)':'rgba(30,25,20,0.35)'; for(let i=0;i<14;i++){ const bw=(i%3===0?3:1.6)*u; X.fillRect(R.x+R.w-170*u+i*7*u,R.y+R.h-80*u,bw,26*u); } }
    X.restore(); }
  /* كروت المكتب: type=desk kind=note|polaroid|number|strike|invoice|file|clock|chart|swatches|sticker|label|cta */
  function clip(x,y,s){ X.save(); X.fillStyle='#B3261E'; rr(x-s*0.5,y-s*0.34,s,s*0.5,s*0.08); X.fill(); X.fillStyle='#7E1A15'; X.fillRect(x-s*0.5,y+s*0.1,s,s*0.06); X.strokeStyle='#8A8A86'; X.lineWidth=s*0.06; X.beginPath(); X.moveTo(x-s*0.32,y-s*0.34); X.lineTo(x-s*0.26,y-s*0.62); X.lineTo(x+s*0.26,y-s*0.62); X.lineTo(x+s*0.32,y-s*0.34); X.stroke(); X.restore(); }
  function paperCard(x,y,w,h,col){ softSh(28,12,0.22); X.fillStyle=col||'#F5F0E4'; X.fillRect(x,y,w,h); noSh(); X.strokeStyle='rgba(60,45,30,0.10)'; X.lineWidth=1.5; X.strokeRect(x,y,w,h); }
  function stampLbl(txt,x,y,s,al){ X.save(); X.font='700 '+s+'px '+MONO; const w=X.measureText(txt).width+s; X.fillStyle='#1A1917'; X.fillRect(al==='left'?x:x-w,y-s*0.75,w,s*1.5); X.fillStyle='#F4F1EA'; X.textBaseline='middle'; X.textAlign='center'; X.direction='ltr'; X.fillText(txt,al==='left'?x+w/2:x-w/2,y+1); X.restore(); }
  function arT(txt,x,y,font,col,al){ X.font=font; X.fillStyle=col; X.textBaseline='middle'; X.direction=hasAr(txt)?'rtl':'ltr'; X.textAlign=al||'right'; X.fillText(txt,x,y); }
  function handCircle(cx,cy,w,h,k,col,seed){ X.save(); X.strokeStyle=col||'#C8312A'; X.lineWidth=5; X.lineCap='round'; X.beginPath(); const n=Math.max(2,Math.round(56*k)); for(let i=0;i<=n;i++){ const an=-0.6+i/52*6.2832*1.06, wob=1+(rnd(i+(seed||1)*13)-0.5)*0.05; const px=cx+Math.cos(an)*w/2*wob, py=cy+Math.sin(an)*h/2*wob; i?X.lineTo(px,py):X.moveTo(px,py); } X.stroke(); X.restore(); }
  function deskItems(t){ if(!dkOn()&&!(HSX.layers||[]).some(L=>L.type==='desk')) return; const R=dkStage(), u=R.w/1080;
    const Ls=(HSX.layers||[]).filter(L=>L.type==='desk'&&!L.off&&t>=L.s&&t<L.e);
    for(const L of Ls){ const lt=t-L.s, rt=L.e-t, k=cl(lt/0.45,0,1), ko=cl(rt/0.25,0,1), ee=e3(k), sd=String(L.id||'x').length*7+(+String(L.id||'0').replace(/\D/g,'')||0);
      const fam=L.font||(HSX.dahih&&HSX.dahih.font)||'Cairo', kind=L.kind||'note', cx=R.x+R.w*(L.x==null?0.3:+L.x), cy=R.y+R.h*(L.y==null?0.42:+L.y), rot=(L.rot!=null?+L.rot:(rnd(sd)-0.5)*5)*Math.PI/180;
      const from=L.from||(kind==='sticker'||kind==='label'||kind==='cta'?'pop':'drop'); let dx=0, dy=0, sc=1, al=Math.min(1,k*2)*ko;
      if(from==='drop'){ dy=-(1-ee)*90*u; sc=1.04-0.04*ee; } else if(from==='left'){ dx=-(1-ee)*520*u; } else if(from==='right'){ dx=(1-ee)*520*u; } else if(from==='pop'){ sc=0.5+0.5*back(k); } else if(from==='up'){ dy=(1-ee)*120*u; }
      if(rt<0.25) dy+=(1-ko)*30*u;
      X.save(); X.globalAlpha=al; X.translate(cx+dx,cy+dy); X.rotate(rot*(from==='drop'?(0.4+0.6*ee):1)+(from==='drop'?(1-ee)*0.12:0)); X.scale(sc*u,sc*u);
      try{ deskDraw(L,kind,lt,fam); }catch(e){ if(!window.__hsDK){ window.__hsDK=1; console.error('hs desk: '+e.message); } }
      X.restore(); } }
  function deskDraw(L,kind,lt,fam){ const W=(L.w||0)*1080;
    if(kind==='note'){ const w=W||430, lines=tLines(L.text||'','700 46px '+AR(),w-70,3), h=Math.max(190,120+lines.length*62+(L.sub?40:0)); paperCard(-w/2,-h/2,w,h,'#F6F1E5');
      if(L.head){ X.font='500 15px '+MONO; X.fillStyle='rgba(40,35,30,0.55)'; X.textAlign='left'; X.textBaseline='middle'; X.direction='ltr'; X.fillText(L.head,-w/2+22,-h/2+26); }
      if(L.label) stampLbl(L.label,w/2-22,-h/2+52,17);
      lines.forEach((ln,i)=>arT(ln,w/2-34,-h/2+98+i*62,'700 46px '+AR(),'#1D1A16'));
      X.fillStyle='rgba(40,35,30,0.13)'; const ly=-h/2+98+lines.length*62; [0,1].forEach(i=>X.fillRect(-w/2+34,ly+i*20,(w-68)*(i?0.62:1),4));
      if(L.sub) arT(L.sub,w/2-34,h/2-30,'600 26px '+AR(),'#6B6157');
      if(L.clip!==false) clip(0,-h/2+4,64); if(L.sticker) { const k2=back(cl((lt-0.4)/0.4,0,1)); X.save(); X.translate(w/2-30,h/2-20); X.scale(k2,k2); softSh(22,8,0.2); X.fillStyle='#FFFFFF'; X.beginPath(); X.arc(0,0,48,0,6.2832); X.fill(); noSh(); starburst(0,0,30,KP.clay,5); X.restore(); } }
    else if(kind==='polaroid'){ const w=W||430, iw=w-32, ih=L.src==='clock'?iw*0.78:iw*0.62, h=ih+(L.text?104:44); softSh(30,14,0.24); X.fillStyle='#FBFAF6'; X.fillRect(-w/2,-h/2,w,h); noSh();
      const ix=-w/2+16, iy=-h/2+16; X.save(); X.beginPath(); X.rect(ix,iy,iw,ih); X.clip();
      if(L.src==='clock'){ X.fillStyle='#1E1D1B'; X.fillRect(ix,iy,iw,ih); clockFace(ix+iw/2,iy+ih/2,Math.min(iw,ih)*0.36,lt); }
      else if(L.src==='video'&&FR.cur){ const fr=FR.cur, f=faceAt(TNOW), sh0=fr.naturalHeight, sw0=fr.naturalWidth, ch=sw0*ih/iw, sy=f?cl(f[2]*sh0-ch*0.4,0,sh0-ch):sh0*0.15; _di.call(X,fr,0,sy,sw0,ch,ix,iy,iw,ih); }
      else { const im=L.src&&IMG[L.src]; if(im&&im.ok) coverDraw(im,ix,iy,iw,ih,1); else { X.fillStyle='#1E1D1B'; X.fillRect(ix,iy,iw,ih); } }
      X.restore(); if(L.head){ X.font='500 13px '+MONO; X.fillStyle='rgba(40,35,30,0.55)'; X.textAlign='left'; X.direction='ltr'; X.textBaseline='middle'; X.fillText(L.head,ix,-h/2+8); }
      if(L.text) arT(L.text,0,h/2-46,'700 40px '+AR(),'#1D1A16','center'); if(L.clip!==false) clip(0,-h/2+2,58);
      if(L.label){ stampLbl(L.label,w/2-14,h/2+26,16); } }
    else if(kind==='number'){ const n=+L.n||0, f0=L.from!=null?+L.from:Math.max(0,n-Math.max(2,Math.round(n*0.1))), k=e3(cl(lt/0.8,0,1)), v=Math.round(f0+(n-f0)*k), s=L.size||170;
      arT(String(v)+(L.unit||''),0,-20,'900 '+s+'px '+NUM(),L.color||'#1A1917','center');
      if(L.sub){ X.font='700 34px '+AR(); const sw=X.measureText(L.sub).width+40; X.strokeStyle='#1A1917'; X.lineWidth=2.5; X.strokeRect(-sw/2,s*0.42,sw,58); arT(L.sub,0,s*0.42+30,'700 34px '+AR(),'#1A1917','center');
        if(L.strike){ const g=e3(cl((lt-0.9)/0.35,0,1)); X.strokeStyle='#C8312A'; X.lineWidth=5; X.beginPath(); X.moveTo(sw/2+10,s*0.42+30); X.lineTo(sw/2+10-(sw+20)*g,s*0.42+26); X.stroke(); } }
      if(L.circle!==false){ X.font='900 '+s+'px '+NUM(); const nw=X.measureText(String(n)+(L.unit||'')).width; const g=cl((lt-0.55)/0.5,0,1); if(g>0) handCircle(0,-10,nw+110,s*1.15,e3(g),L.accent||'#C8312A',(+L.n||3)); } }
    else if(kind==='strike'){ const w=W||520, h=L.sub?250:200; paperCard(-w/2,-h/2,w,h,'#FDFCF8'); const a1=L.text||'', a2=L.to||'';
      if(L.head){ X.font='500 13px '+MONO; X.fillStyle='rgba(40,35,30,0.5)'; X.textAlign='center'; X.direction='ltr'; X.textBaseline='middle'; X.fillText(L.head,0,-h/2+20); }
      const g1=e3(cl((lt-0.35)/0.35,0,1)), g2=e3(cl((lt-0.75)/0.4,0,1)); X.font='700 44px '+AR(); const w1=X.measureText(a1).width, w2=X.measureText(a2).width;
      const y1=-h/2+82, x1=a2?w/2-30-(w-60)*0:w/2-30;
      if(a2){ const xr=w/2-30; arT(a1,xr,y1,'700 40px '+AR(),'#8A8279'); X.strokeStyle='#C8312A'; X.lineWidth=4; X.beginPath(); X.moveTo(xr,y1+2); X.lineTo(xr-w1*0.92*g1,y1-2); X.stroke();
        if(g2>0){ X.globalAlpha*=g2; arT('←',xr-w1*0.92-24,y1,'700 36px '+AR(),'#1A1917'); const x2=xr-w1*0.92-70; X.fillStyle='rgba(232,140,110,0.45)'; X.fillRect(x2-w2-8,y1-26,(w2+16)*g2,52); arT(a2,x2,y1,'800 44px '+AR(),'#1A1917'); } }
      else { arT(a1,w/2-30,y1,'700 44px '+AR(),'#1A1917'); X.strokeStyle='#C8312A'; X.lineWidth=5; X.beginPath(); X.moveTo(w/2-30,y1+2); X.lineTo(w/2-30-w1*g1,y1-3); X.stroke(); }
      if(L.sub){ const g3=e3(cl((lt-1.1)/0.35,0,1)); X.globalAlpha*=g3; arT(L.sub,0,y1+90,'700 38px '+AR(),'#1A1917','center'); starburst(-w/2+60,y1+90,22,KP.clay,4.5); } }
    else if(kind==='invoice'){ const rows=Array.isArray(L.items)?L.items:String(L.items||L.text||'').split(/\n|\|/).map(x=>x.trim()).filter(Boolean), w=W||470, h=70+rows.length*44; paperCard(-w/2,-h/2,w,h,'#F7F3E9');
      X.font='500 14px '+MONO; X.fillStyle='rgba(40,35,30,0.5)'; X.textAlign='center'; X.direction='ltr'; X.textBaseline='middle'; X.fillText(L.head||'INVOICE',0,-h/2+20);
      rows.forEach((r,i)=>{ const g=cl((lt-0.25-i*0.18)/0.25,0,1); if(g<=0) return; const [a,b]=String(r).split('='); X.globalAlpha=Math.min(1,g); const yy=-h/2+56+i*44; X.font='600 22px '+MONO; X.fillStyle='#2A2621'; X.textAlign='left'; X.fillText(a.trim(),-w/2+28,yy);
        X.textAlign='right'; X.fillText((b||'').trim(),w/2-28,yy); X.fillStyle='rgba(40,35,30,0.35)'; const aw=X.measureText(a.trim()).width; for(let d=-w/2+40+aw;d<w/2-90;d+=10) X.fillRect(d,yy+6,3,3); }); }
    else if(kind==='file'){ const w=W||200, h=w*1.02; X.fillStyle='#FBFAF6'; softSh(24,10,0.24); X.fillRect(-w/2,-h/2,w,h); noSh(); X.fillStyle='#1E1D1B'; X.fillRect(-w/2+12,-h/2+30,w-24,h-44);
      X.font='500 12px '+MONO; X.fillStyle='rgba(40,35,30,0.5)'; X.textAlign='left'; X.direction='ltr'; X.textBaseline='middle'; X.fillText(L.head||'FILE:',-w/2+12,-h/2+15);
      arT(L.text||'',0,8,'900 '+Math.round(w*0.36)+'px '+NUM(),'#F4F1EA','center');
      if(L.x_out||L.cross){ const g=e3(cl((lt-0.5)/0.3,0,1)); X.strokeStyle='#C8312A'; X.lineWidth=7; X.beginPath(); X.moveTo(-w/2+20,-h/2+40); X.lineTo(-w/2+20+(w-40)*g,-h/2+40+(h-64)*g); X.stroke(); if(g>=1){ const g2=e3(cl((lt-0.8)/0.3,0,1)); X.beginPath(); X.moveTo(w/2-20,-h/2+40); X.lineTo(w/2-20-(w-40)*g2,-h/2+40+(h-64)*g2); X.stroke(); } }
      if(L.sub){ X.font='700 24px '+AR(); const sw=X.measureText(L.sub).width+28; X.fillStyle='#1E1D1B'; X.fillRect(-sw/2,h/2+10,sw,40); arT(L.sub,0,h/2+30,'700 24px '+AR(),'#F4F1EA','center'); } }
    else if(kind==='clock'){ const w=W||300, h=w*0.9; paperCard(-w/2,-h/2,w,h,'#FBFAF6'); X.fillStyle='#1E1D1B'; X.fillRect(-w/2+16,-h/2+16,w-32,h-32); clockFace(0,0,w*0.32,lt); if(L.clip!==false) clip(0,-h/2+2,52);
      if(L.sticker!==false){ const k2=back(cl((lt-0.3)/0.4,0,1)); X.save(); X.translate(w/2-6,-h/2+14); X.scale(k2,k2); softSh(18,6,0.2); X.fillStyle='#FFFFFF'; X.beginPath(); X.arc(0,0,40,0,6.2832); X.fill(); noSh(); starburst(0,0,24,KP.clay,4); X.restore(); } }
    else if(kind==='chart'){ const vals=(Array.isArray(L.values)?L.values:String(L.values||'100,70,45').split(/[,،\s]+/)).map(Number).filter(v=>isFinite(v)&&v>=0), cols=L.colors||['#1A1917','#B3261E','#3F7D4E','#C8A040'], w=W||330, h=w*0.95; paperCard(-w/2,-h/2,w,h,'#FBFAF6'); if(L.clip!==false) clip(0,-h/2+2,52);
      const bw=(w-80)/vals.length*0.62, mx=Math.max(...vals,1); vals.forEach((v,i)=>{ const g=e3(cl((lt-0.3-i*0.15)/0.5,0,1)), bh=(h-110)*v/mx*g, x=-w/2+40+(w-80)/vals.length*(i+0.19); X.fillStyle=cols[i%cols.length]; X.fillRect(x,h/2-40-bh,bw,bh); });
      if(L.text){ const g=e3(cl((lt-0.6)/0.4,0,1)); X.save(); X.globalAlpha*=g; X.translate(18,h/2+10); X.rotate(-0.03); paperCard(-w*0.48,-6,w*0.96,70,'#FFFFFF'); arT(L.text,w*0.42,30,'700 34px '+AR(),'#1A1917'); if(L.mark){ X.font='700 34px '+AR(); const mw=X.measureText(L.mark).width; X.fillStyle='rgba(120,150,210,0.35)'; X.fillRect(-w*0.42,12,mw+16,38); arT(L.mark,-w*0.42+8,30,'700 34px '+AR(),'#1A1917','left'); } X.restore(); } }
    else if(kind==='swatches'){ const cs=Array.isArray(L.colors)?L.colors:(L.colors?String(L.colors).split(/[,،\s]+/).filter(c=>/^#?[0-9a-f]{3,8}$/i.test(c)).map(c=>c[0]==='#'?c:'#'+c):['#FFFFFF','#B3261E','#3F7D4E','#1A1917']), s=W?W/cs.length:96; cs.forEach((c,i)=>{ const g=back(cl((lt-i*0.1)/0.4,0,1)); X.save(); X.translate(-s*cs.length/2+s*(i+0.5),0); X.rotate((rnd(i+3)-0.5)*0.12); X.scale(g,g); softSh(14,6,0.25); X.fillStyle='#FBFAF6'; X.fillRect(-s*0.44,-s*0.56,s*0.88,s*1.12); noSh(); X.fillStyle=c; X.fillRect(-s*0.36,-s*0.48,s*0.72,s*0.72); X.restore(); });
      if(L.text) arT(L.text,s*cs.length/2,s*0.95,'700 30px '+AR(),(HSX.dahih&&dkMode(TNOW).m==='navy')?'#FFFFFF':'#1A1917'); }
    else if(kind==='sticker'){ const r=(W||110)/2, g=back(cl(lt/0.4,0,1)); X.rotate(lt*0.5); X.scale(g,g); softSh(20,8,0.22); X.fillStyle='#FFFFFF'; X.beginPath(); X.arc(0,0,r,0,6.2832); X.fill(); noSh(); starburst(0,0,r*0.62,KP.clay,r*0.11); }
    else if(kind==='label'){ X.font='800 34px "'+fam+'"'; const tx=L.text||'', tw=X.measureText(tx).width+36; X.fillStyle=L.color||'#E8541E'; rr(-tw/2,-27,tw,54,6); X.fill(); arT(tx,0,1,'800 34px "'+fam+'"','#FFFFFF','center'); }
    else if(kind==='cta'){ X.font='800 44px "'+fam+'"'; const tx=L.text||'', tw=X.measureText(tx).width+130; X.fillStyle=L.color||'#E8541E'; softSh(20,8,0.25); X.fillRect(-tw/2,-38,tw,76); noSh(); X.strokeStyle='rgba(255,255,255,0.35)'; X.lineWidth=2; X.strokeRect(-tw/2+6,-32,tw-12,64);
      arT(tx,tw/2-36,2,'800 44px "'+fam+'"','#FFFFFF'); X.fillStyle='#FFFFFF'; X.beginPath(); X.ellipse(-tw/2+48,-2,22,16,0,0,6.2832); X.fill(); X.beginPath(); X.moveTo(-tw/2+40,10); X.lineTo(-tw/2+34,22); X.lineTo(-tw/2+50,12); X.fill(); } }
  function clockFace(cx,cy,r,lt){ X.save(); X.strokeStyle='#F2EEE6'; X.lineWidth=r*0.06; X.beginPath(); X.arc(cx,cy,r,0,6.2832); X.stroke(); for(let i=0;i<12;i++){ const an=i*Math.PI/6; X.lineWidth=r*(i%3?0.025:0.05); X.beginPath(); X.moveTo(cx+Math.cos(an)*r*0.78,cy+Math.sin(an)*r*0.78); X.lineTo(cx+Math.cos(an)*r*0.9,cy+Math.sin(an)*r*0.9); X.stroke(); }
    const hA=-Math.PI/2+lt*1.1, mA=-Math.PI/2+lt*7.5; X.lineCap='round'; X.lineWidth=r*0.07; X.beginPath(); X.moveTo(cx,cy); X.lineTo(cx+Math.cos(hA)*r*0.5,cy+Math.sin(hA)*r*0.5); X.stroke(); X.strokeStyle='#E0473A'; X.lineWidth=r*0.04; X.beginPath(); X.moveTo(cx,cy); X.lineTo(cx+Math.cos(mA)*r*0.78,cy+Math.sin(mA)*r*0.78); X.stroke(); X.fillStyle='#F2EEE6'; X.beginPath(); X.arc(cx,cy,r*0.06,0,6.2832); X.fill(); X.restore(); }
  /* الفيديو بأسلوب الدحيح: الرأس والنافذة والمكتب والشخص */
  const _dvD=window.drawVideo;
  if(typeof _dvD==='function') window.drawVideo=function(t){ if(!dkOn()||t>=VEND) return _dvD(t); const R=dkStage();
    if(R.full&&dkMode(t).m==='original'&&!(dkMode(t).prev&&t-dkMode(t).ms<0.5)) return _dvD(t);
    X.save(); try{ dkHeader(); if(R.full){ X.fillStyle='#000'; X.fillRect(0,0,1080,1920); }
      dkBackground(t,R);
      if(!dkPerson(t,R)){ if(R.full) _dvD(t); else { X.save(); X.beginPath(); X.rect(R.x,R.y,R.w,R.h); X.clip(); const fr=FR.cur||VF, sw=fr.naturalWidth||1080, shh=fr.naturalHeight||1920, ch=Math.round(sw*R.h/R.w), f=faceAt(t), sy=f?cl(f[2]*shh-ch*0.42,0,shh-ch):shh*0.15; if(fr.naturalWidth) _di.call(X,fr,0,sy,sw,ch,R.x,R.y,R.w,R.h); X.restore(); } }
    } finally { X.restore(); } };
  /* بأسلوب الدحيح المشاهد القديمة (كرت فيديو منزلق، قص الشخص، شريط التقدم) ما تنطبق: النافذة ثابتة */
  for(const fn of ['cutoutActive','headoutActive']){ const f0=window[fn]; if(typeof f0==='function') window[fn]=function(t){ return dkOn()?false:f0(t); }; }
  for(const fn of ['vrect','vtarget']){ const f0=window[fn]; if(typeof f0==='function') window[fn]=function(t){ return dkOn()&&t<VEND?R_FULL:f0(t); }; }
  { const f0=window.videoShift; if(typeof f0==='function') window.videoShift=function(t){ return dkOn()?null:f0(t); }; }
  { const f0=window.bar; if(typeof f0==='function') window.bar=function(t){ if(dkOn()||(HSX.pod&&HSX.pod.on&&!HSX.pod.bar)) return; return f0(t); }; }


  const _draw=window.draw;
  const capSmall=(x,o)=>{ if(!CAP.on) return; CAPFORCE=true; const _c0=CAP; CAP={...CAP,...o}; try{ window.caption(x); } finally { CAPFORCE=false; CAP=_c0; } };
  window.draw=function(t){ TNOW=t; _draw(t);
    for(const [n,f] of [['split',x=>{ if(!splits(x)) return; if(CAP.on) capSmall(x,{size:Math.min(CAP.size,60),lines:1,width:Math.min(CAP.width||760,920),bg:CAP.bg==='bar'?'box':CAP.bg}); else if(!HSX.nocap){ try{ _cap(x); }catch(e){} } }],['viz',x=>{ if(vizs(x)) capSmall(x,{y:69.6,size:Math.min(CAP.size,72),lines:1,width:Math.min(CAP.width||760,900)}); }],['collage',x=>{ if(collages(x)){ if(CAP.on) capSmall(x,{}); else if(!HSX.nocap){ try{ _cap(x); }catch(e){} } } }],['kinetic',kinetics],['layers',x=>layers(x,false)],['cover',covers],['hook',hook],['fx',x=>{ if(dkOn()&&(HSX.dahih.layout||'window')!=='full'){ const R=dkStage(); X.beginPath(); X.rect(R.x,R.y,R.w,R.h); X.clip(); } fx(x); }],['look',lookOverlay]]){ X.save(); try{ f(t); }catch(e){ if(!window['__hsE'+n]){ window['__hsE'+n]=1; console.error('hs '+n+': '+e.message); } } X.restore(); X.setTransform(1,0,0,1,0,0); X.globalAlpha=1; X.filter='none'; X.globalCompositeOperation='source-over'; } };
  window.__hsFx=['zoom','punch','shake','flash','bw','blur','vignette','letterbox','tint','glitch','grain','facezoom','spotlight','pulse','tilt','rgb','vhs','pixel','duotone','sepia','invert','mirror','leak','strobe','speed','confetti','curve','push','pull','rack','whip','spin','iris'];
  window.__hsAnims=['pop','rise','drop','slide','slideL','zoom','fade','type','none'];
})();
