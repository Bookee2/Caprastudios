/* Motion page pieces. Each registers with the governor and works without a mouse, without hover and with motion off.
   Pointer, hover and scroll effects are adapted from the Pointer and Scroll Lab (fx.js, 30 September 2026). */
(()=>{'use strict';
 const M=window.CapraMotion;if(!M)return;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const hover=matchMedia('(hover:hover) and (pointer:fine)');

 // 01 Turntable: 60 Blender frames in one sprite sheet. Idles slowly, turns with scroll, drags with inertia.
 const tt=document.getElementById('turntable');
 if(tt){
  const stage=tt.querySelector('.tt-stage'),canvas=tt.querySelector('canvas'),ctx=canvas.getContext('2d'),range=tt.querySelector('input');
  const frames=Number(tt.dataset.frames),cols=Number(tt.dataset.cols),rows=Math.ceil(frames/cols),sheet=new Image();
  let ready=false,pos=0,vel=0,drawn=-1,drag=null,lastY=scrollY,hold=0;
  sheet.decoding='async';
  sheet.onload=()=>{ready=true;stage.classList.add('tt-live');range.disabled=false;drawn=-1;};
  const frameAt=p=>((Math.round(p)%frames)+frames)%frames;
  function draw(){
   const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*d),h=Math.round(r.height*d);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;drawn=-1;}
   const f=frameAt(pos);if(f===drawn||!ready)return;drawn=f;
   const sw=sheet.naturalWidth/cols,sh=sheet.naturalHeight/rows,s=Math.min(w/sw,h/sh);
   ctx.clearRect(0,0,w,h);ctx.drawImage(sheet,(f%cols)*sw,Math.floor(f/cols)*sh,sw,sh,(w-sw*s)/2,(h-sh*s)/2,sw*s,sh*s);
   range.value=String(f);range.setAttribute('aria-valuetext',`${Math.round(f/frames*360)} degrees`);
  }
  const used=()=>{stage.classList.add('tt-used');hold=2.5;};
  stage.addEventListener('pointerdown',e=>{if(!ready||e.button>0)return;drag={x:e.clientX,id:e.pointerId,v:0};stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');used();});
  stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;drag.x=e.clientX;const step=-dx*frames/(stage.clientWidth*1.1);pos+=step;drag.v=drag.v*.6+step*24;});
  const release=e=>{if(!drag||e.pointerId!==drag.id)return;vel=M.calm?0:clamp(drag.v,-60,60);drag=null;stage.classList.remove('is-dragging');};
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
  range.addEventListener('input',()=>{pos=Number(range.value);vel=0;used();draw();});
  M.register(stage,{
   visible(on){if(on&&!sheet.src)sheet.src=tt.dataset.sheet;},
   frame(dt,t,calm){
    const dy=scrollY-lastY;lastY=scrollY;hold=Math.max(0,hold-dt);
    if(!drag){
     if(calm)vel=0;
     else{pos+=dy*.045;vel+=((hold>0?0:3.2)-vel)*Math.min(1,dt*(Math.abs(vel)>3.2?1.6:.8));}
     pos+=vel*dt;
    }
    draw();
   },
  });
 }

 // 02 Shards: plays once when it comes into view, then waits for a replay. Motion off shows the finished tile.
 const shards=document.getElementById('shards-film');
 if(shards){
  const again=document.querySelector('.mo-replay');let played=false;
  const label=t=>{again.lastChild.textContent=' '+t;};
  const play=()=>{shards.currentTime=0;again.hidden=true;shards.play().catch(()=>{again.hidden=false;label('Play');});};
  shards.addEventListener('ended',()=>{again.hidden=false;label('Play again');});
  again.addEventListener('click',play);
  // Wait until half the film is on screen, so the rebuild is seen from its first shard.
  const arrive=(on,calm)=>{if(!on){shards.pause();return;}if(!played&&!calm){played=true;shards.preload='auto';play();}else if(shards.paused){again.hidden=false;label(played?'Play again':'Play');}};
  if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(e=>arrive(e.isIntersecting,M.calm)),{threshold:.5}).observe(shards);else arrive(true,M.calm);
  M.register(shards,{calm(c){if(c&&!shards.paused){shards.pause();again.hidden=false;label('Play again');}}});
 }

 // Pointer tiles invite a mouse until they are first used; on touch, a slow figure-eight stands in for the hand.
 document.querySelectorAll('.spot-stage,.lens-stage,.peek-stage,.dir-stage').forEach(stage=>{
  const hint=document.createElement('span');hint.className='tile-hint mono';hint.setAttribute('aria-hidden','true');hint.textContent='Move your pointer here';stage.append(hint);
  stage.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')stage.classList.add('was-used');},{once:false});
 });
 const wander=(t,w,h)=>({x:w*(.5+.32*Math.sin(t*.7)),y:h*(.5+.28*Math.sin(t*1.4))});
 const local=(el,e)=>{const r=el.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};

 // Spotlight edges on the mini cards are handled by interactions.js; the tile only adds a touch preview.
 const spotStage=document.querySelector('.spot-stage');
 if(spotStage){const cards=[...spotStage.querySelectorAll('.spot')];M.register(spotStage,{frame(dt,t,calm){if(hover.matches||calm){cards.forEach(c=>c.classList.remove('spot-auto'));return;}const i=Math.floor(t/1.6)%cards.length;cards.forEach((c,k)=>{c.classList.toggle('spot-auto',k===i);if(k===i){c.style.setProperty('--mx',`${c.clientWidth*(.5+.45*Math.sin(t*1.3))}px`);c.style.setProperty('--my','0px');}});}});}

 // Flashlight reveal.
 const lens=document.querySelector('.lens-stage');
 if(lens){
  let inside=false,tx=0,ty=0,x=0,y=0,started=false;
  lens.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;inside=true;({x:tx,y:ty}=local(lens,e));if(!started){x=tx;y=ty;started=true;}lens.style.setProperty('--lens-r','76px');});
  lens.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;({x:tx,y:ty}=local(lens,e));});
  lens.addEventListener('pointerleave',()=>{inside=false;});
  M.register(lens,{frame(dt,t,calm){
   const w=lens.clientWidth,h=lens.clientHeight;
   if(!inside){if(hover.matches){lens.style.setProperty('--lens-r','0px');return;}({x:tx,y:ty}=calm?{x:w*.62,y:h*.5}:wander(t,w,h));lens.style.setProperty('--lens-r','70px');}
   const k=calm||!started?1:Math.min(1,dt*14);started=true;x+=(tx-x)*k;y+=(ty-y)*k;
   lens.style.setProperty('--lx',`${x.toFixed(1)}px`);lens.style.setProperty('--ly',`${y.toFixed(1)}px`);
  }});
 }

 // A list with a floating preview: the card eases after the pointer and leans with its speed.
 const peek=document.querySelector('.peek-stage');
 if(peek){
  const card=peek.querySelector('.peek-card'),img=card.querySelector('img'),links=[...peek.querySelectorAll('a[data-img]')];
  let current=null,pinned=null,inside=false,tx=0,ty=0,x=0,y=0,lean=0,auto=0;
  const show=a=>{current=a;if(!a){card.classList.remove('on');return;}if(img.getAttribute('src')!==a.dataset.img)img.src=a.dataset.img;card.classList.add('on');};
  links.forEach(a=>{
   a.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;pinned=null;show(a);});
   a.addEventListener('focus',()=>{pinned={x:Math.min(a.offsetLeft+a.offsetWidth*.55,peek.clientWidth-230),y:a.offsetTop+a.offsetHeight/2};show(a);});
   a.addEventListener('blur',()=>{pinned=null;show(null);});
  });
  peek.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;inside=true;({x:tx,y:ty}=local(peek,e));});
  peek.addEventListener('pointerleave',()=>{inside=false;if(!pinned)show(null);});
  M.register(peek,{frame(dt,t,calm){
   if(!inside&&!pinned&&!hover.matches){
    if(calm){show(null);return;}
    auto+=dt;const a=links[Math.floor(auto/1.8)%links.length];if(a!==current)show(a);
    tx=peek.clientWidth*.6;ty=a.offsetTop+a.offsetHeight/2;
   }
   if(!current)return;
   const goal=pinned||{x:Math.min(tx,peek.clientWidth-230),y:ty},k=calm?1:Math.min(1,dt*10),nx=x+(goal.x-x)*k;
   lean+=((calm?0:clamp((nx-x)*.7,-10,10))-lean)*Math.min(1,dt*12);x=nx;y+=(goal.y-y)*k;
   card.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${lean.toFixed(2)}deg)`;
  }});
 }

 // Fill from the edge the pointer enters, leave by the edge it exits.
 const dirStage=document.querySelector('.dir-stage');
 if(dirStage){
  const tiles=[...dirStage.querySelectorAll('.dir')],edges=[[0,-101],[101,0],[0,101],[-101,0]];
  const edge=(el,e)=>{const {x,y}=local(el,e),d=[y/el.clientHeight,1-x/el.clientWidth,1-y/el.clientHeight,x/el.clientWidth];return edges[d.indexOf(Math.min(...d))];};
  const place=(el,v,animate)=>{el.classList.toggle('anim',animate&&!M.calm);el.style.setProperty('--dx',v[0]+'%');el.style.setProperty('--dy',v[1]+'%');el.classList.toggle('lit',!v[0]&&!v[1]);};
  const enter=(el,from)=>{place(el,from,false);void el.offsetWidth;place(el,[0,0],true);};
  tiles.forEach(el=>{
   el.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')enter(el,edge(el,e));});
   el.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')place(el,edge(el,e),true);});
   el.addEventListener('focus',()=>enter(el,edges[3]));el.addEventListener('blur',()=>place(el,edges[1],true));
  });
  let auto=0,step=-1;
  M.register(dirStage,{frame(dt,t,calm){
   if(hover.matches||calm)return;
   auto+=dt;const s=Math.floor(auto/1.1);if(s===step)return;step=s;
   const el=tiles[Math.floor(s/2)%tiles.length],from=edges[(s*3+1)%4];
   if(s%2===0)enter(el,from);else place(el,edges[(s+2)%4],true);
  }});
 }

 // Scroll tiles: progress through their own framed scroller, from 0 to 1.
 const progress=sc=>clamp(sc.scrollTop/Math.max(1,sc.scrollHeight-sc.clientHeight));
 const onScroll=(sc,fn)=>{let queued=false;const run=()=>{queued=false;fn(M.calm?1:progress(sc));};sc.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(run);}},{passive:true});addEventListener('capra:motion',run);document.querySelector('.mo-pause')?.addEventListener('click',run);run();};
 const words=document.querySelector('.words');
 if(words){
  const text=words.textContent.trim(),spoken=document.createElement('span'),shown=document.createElement('span');
  spoken.className='sr-only';spoken.textContent=text;shown.setAttribute('aria-hidden','true');
  const list=text.split(/\s+/).map(w=>{const s=document.createElement('span');s.className='w';s.textContent=w+' ';shown.append(s);return s;});
  words.replaceChildren(spoken,shown);
  onScroll(words.closest('.scroller'),p=>{const n=Math.round(clamp(p*1.15)*list.length);list.forEach((w,i)=>w.classList.toggle('lit',i<n));});
 }
 const route=document.querySelector('.route');
 if(route){
  const line=route.querySelector('.route-line'),dot=route.querySelector('.route-dot'),steps=[...document.querySelectorAll('.route-steps li')],len=line.getTotalLength();
  line.style.strokeDasharray=String(len);
  onScroll(route.closest('.scroller'),p=>{const pt=line.getPointAtLength(len*p);line.style.strokeDashoffset=String(len*(1-p));dot.setAttribute('cx',pt.x);dot.setAttribute('cy',pt.y);steps.forEach(s=>s.classList.toggle('past',p>=Number(s.dataset.at)-.001));});
 }

 // Rows on springs: FLIP offsets integrated as springs, so a second sort mid-flight simply retargets.
 const list=document.querySelector('.spring-list');
 if(list){
  const rows=[...list.children].map((el,i)=>({el,i,y:0,v:0,name:el.lastChild.textContent.trim()}));
  let moving=false;
  function arrange(order){
   const before=new Map(rows.map(r=>[r,r.el.offsetTop+r.y]));
   order.forEach(r=>list.append(r.el));
   rows.forEach(r=>{r.y=before.get(r)-r.el.offsetTop;if(M.calm){r.y=0;r.v=0;}r.el.style.transform=r.y?`translateY(${r.y}px)`:'';});
   moving=!M.calm;
  }
  const current=()=>[...list.children].map(el=>rows.find(r=>r.el===el));
  document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{
   const now=current();let next;
   if(b.dataset.sort==='az')next=[...rows].sort((a,c)=>a.name.localeCompare(c.name));
   else if(b.dataset.sort==='reset')next=[...rows].sort((a,c)=>a.i-c.i);
   else{do{next=[...rows].sort(()=>Math.random()-.5);}while(next.every((r,k)=>r===now[k]));}
   arrange(next);
  }));
  M.register(list,{frame(dt,t,calm){
   if(!moving)return;let still=true;
   for(const r of rows){
    if(calm){r.y=0;r.v=0;}else for(let k=0;k<2;k++){r.v+=(-170*r.y-17*r.v)*dt/2;r.y+=r.v*dt/2;}
    if(Math.abs(r.y)<.15&&Math.abs(r.v)<.5){r.y=0;r.v=0;}else still=false;
    r.el.style.transform=r.y?`translateY(${r.y.toFixed(2)}px)`:'';
   }
   moving=!still;
  }});
 }
})();
