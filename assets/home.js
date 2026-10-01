/* Homepage moments that need no GSAP: the film's overlay and the stacking capability cards.
   The closing line's word lighting is shared, in interactions.js. */
(()=>{'use strict';
 const root=document.documentElement,motionOff=()=>root.classList.contains('motion-off');
 let queued=false;const jobs=[];
 const onScroll=fn=>{jobs.push(fn);fn();};
 const run=()=>{queued=false;jobs.forEach(fn=>fn());};
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(run);}},{passive:true});
 addEventListener('resize',run);addEventListener('capra:motion',run);

 // The film's copy steps aside while it plays and returns when it stops.
 const bleed=document.querySelector('.cinema-bleed'),film=bleed?.querySelector('video');
 if(film){const sync=()=>bleed.classList.toggle('is-playing',!film.paused&&!film.ended);['play','pause','ended'].forEach(e=>film.addEventListener(e,sync));}

 // Each card is sticky; the one being covered settles back a little, so the stack reads as depth.
 const cards=[...document.querySelectorAll('.capability-card')],stacked=matchMedia('(min-width:801px)');
 if(cards.length){
  onScroll(()=>{
   const rects=cards.map(c=>c.getBoundingClientRect());
   cards.forEach((card,i)=>{
    const next=rects[i+1];
    const k=!next||motionOff()||!stacked.matches?0:Math.max(0,Math.min(1,1-(next.top-rects[i].top-16)/(rects[i].height-16)));
    card.style.transform=k?`scale(${(1-k*.05).toFixed(4)})`:'';card.style.filter=k?`brightness(${(1-k*.3).toFixed(3)})`:'';
   });
  });
  // The connected-systems diagram draws its paths when its card arrives.
  if('IntersectionObserver' in window){
   root.classList.add('draw-ready');
   const seen=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');seen.unobserve(e.target);}}),{threshold:.45});
   cards.forEach(c=>seen.observe(c));
  }
  // Fine pointer depth is a small adjustment to each illustration.
  cards.forEach(card=>{
   const art=card.querySelector('.capability-art');let frame=0;
   art.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||motionOff()||frame)return;const x=e.clientX,y=e.clientY;frame=requestAnimationFrame(()=>{frame=0;const r=art.getBoundingClientRect();art.style.setProperty('--look-x',((x-r.left)/r.width-.5)*5+'deg');art.style.setProperty('--look-y',((y-r.top)/r.height-.5)*-4+'deg');});});
   art.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);frame=0;art.style.removeProperty('--look-x');art.style.removeProperty('--look-y');});
  });
 }

})();
