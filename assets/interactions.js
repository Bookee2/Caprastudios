/* Shared hover and focus craft. Every effect is an extra: each link and control works without it. */
(()=>{'use strict';
 // Rolling labels: each letter rolls up to a second copy. Screen readers hear the label once, without the arrow.
 document.querySelectorAll('a.button,.nav-contact').forEach(el=>{
  if(el.closest('.hero,.agent-dialog')||el.children.length)return;
  const text=el.textContent.trim(),match=text.match(/^(.*?)\s*([↗↓→])$/u),label=match?match[1]:text,arrow=match?match[2]:'';
  const spoken=document.createElement('span'),roll=document.createElement('span');
  spoken.className='sr-only';spoken.textContent=label;roll.className='roll';roll.setAttribute('aria-hidden','true');
  [...label].forEach((character,i)=>{const letter=document.createElement('span');letter.className='ch';letter.style.setProperty('--i',i);letter.textContent=character;roll.append(letter);});
  el.replaceChildren(spoken,roll);
  if(arrow){const mark=document.createElement('span');mark.className='arrow';mark.dataset.dir=arrow==='→'?'right':arrow==='↓'?'down':'out';mark.setAttribute('aria-hidden','true');mark.textContent=arrow;el.append(mark);}
 });

 // Spotlight edges: cards light their border, ruled items light their top rule, under a mouse.
 document.querySelectorAll('.project-panel,.project-image,.next-band').forEach(el=>el.classList.add('spot'));
 document.querySelectorAll('.ai-offers article,.process-grid li,.case-points article').forEach(el=>el.classList.add('spot-rule'));
 let frame=0,target=null,x=0,y=0;
 function paint(){frame=0;if(!target)return;const r=target.getBoundingClientRect();target.style.setProperty('--mx',`${x-r.left}px`);target.style.setProperty('--my',`${y-r.top}px`);}
 document.querySelectorAll('.spot,.spot-rule').forEach(el=>el.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;target=el;x=event.clientX;y=event.clientY;if(!frame)frame=requestAnimationFrame(paint);},{passive:true}));

 const root=document.documentElement,motionOff=()=>root.classList.contains('motion-off'),clamp=v=>Math.max(0,Math.min(1,v));
 const scrolled=[];let queued=false;
 const onScroll=fn=>{scrolled.push(fn);fn();};
 const run=()=>{queued=false;scrolled.forEach(fn=>fn());};
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(run);}},{passive:true});addEventListener('resize',run);addEventListener('capra:motion',run);
 const once=(els,cls,threshold=.2)=>{if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add(cls));return;}const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add(cls);io.unobserve(e.target);}}),{threshold,rootMargin:'0px 0px -6% 0px'});els.forEach(el=>io.observe(el));};

 // Headlines on inner pages rise once, line by line, out of a clipped line. The homepage keeps its own moments.
 if(!document.body.classList.contains('home-chapters')){
  const heads=[...document.querySelectorAll('main h1,main h2')].filter(h=>!h.hasAttribute('data-light-words'));
  heads.forEach(h=>{
   const lines=[[]];[...h.childNodes].forEach(n=>{if(n.nodeName==='BR')lines.push([]);else lines[lines.length-1].push(n);});
   h.replaceChildren(...lines.map((nodes,i)=>{const line=document.createElement('rise-line'),inner=document.createElement('rise-in');inner.style.setProperty('--i',i);inner.append(...nodes);line.append(inner);return line;}));
  });
  root.classList.add('rise-ready');once(heads,'risen');
 }

 // Process steps: a line draws through the three steps as they are read, and each step lights as it is reached.
 document.querySelectorAll('.process-grid').forEach(list=>{
  const steps=[...list.children];list.classList.add('process-live');
  onScroll(()=>{
   const r=list.getBoundingClientRect(),p=motionOff()?1:clamp((innerHeight*.82-r.top)/(innerHeight*.5));
   list.style.setProperty('--p',p.toFixed(4));
   steps.forEach(li=>li.classList.toggle('reached',p*list.clientWidth>=li.offsetLeft-1));
  });
 });

 // Statements marked data-light-words light word by word as they rise through the screen.
 document.querySelectorAll('[data-light-words]').forEach(line=>{
  const words=[];
  const split=node=>[...node.childNodes].forEach(child=>{
   if(child.nodeType===3){const frag=document.createDocumentFragment();child.textContent.split(/(\s+)/).forEach(part=>{if(!part)return;if(/^\s+$/.test(part)){frag.append(part);return;}const w=document.createElement('span');w.className='w';w.textContent=part;words.push(w);frag.append(w);});child.replaceWith(frag);}
   else if(child.nodeType===1&&child.tagName!=='BR')split(child);
  });
  split(line);line.classList.add('words-ready');
  onScroll(()=>{const r=line.getBoundingClientRect(),p=motionOff()?1:clamp((innerHeight*.88-r.top)/(innerHeight*.4+r.height*.5)),n=Math.round(p*words.length);words.forEach((w,i)=>w.classList.toggle('lit',i<n));});
 });

 // Diagrams marked data-draw draw their paths once, when they arrive.
 const drawn=[...document.querySelectorAll('[data-draw]')];
 if(drawn.length){root.classList.add('draw-ready');once(drawn,'is-drawn',.35);}
})();
