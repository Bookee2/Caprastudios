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
 document.querySelectorAll('.project-panel,.project-image').forEach(el=>el.classList.add('spot'));
 document.querySelectorAll('.ai-offers article,.process-grid li,.case-points article').forEach(el=>el.classList.add('spot-rule'));
 let frame=0,target=null,x=0,y=0;
 function paint(){frame=0;if(!target)return;const r=target.getBoundingClientRect();target.style.setProperty('--mx',`${x-r.left}px`);target.style.setProperty('--my',`${y-r.top}px`);}
 document.querySelectorAll('.spot,.spot-rule').forEach(el=>el.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;target=el;x=event.clientX;y=event.clientY;if(!frame)frame=requestAnimationFrame(paint);},{passive:true}));
})();
