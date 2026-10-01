/* The motion page's governor: one animation frame for every piece, run only while that piece is on screen.
   A piece rests on its finished frame while motion is paused here, switched off in the footer, or reduced.
   Adapted from the Motion Frontier lab's governor (core.js, 30 September 2026). */
(()=>{'use strict';
 const root=document.documentElement,pieces=[];
 let paused=false;
 const calm=()=>paused||root.classList.contains('motion-off');
 const seen='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{const p=pieces.find(k=>k.el===e.target);if(!p)return;p.visible=e.isIntersecting;p.piece.visible?.(p.visible,calm());}),{rootMargin:'160px 0px'}):null;
 window.CapraMotion={
  get calm(){return calm();},
  // piece: { frame(dt, time, calm), visible(isVisible, calm), calm(isCalm) }; every member is optional.
  register(el,piece){const p={el,piece,visible:!seen};pieces.push(p);if(seen)seen.observe(el);else piece.visible?.(true,calm());return p;},
 };
 let last=performance.now();
 function loop(now){
  const dt=Math.min((now-last)/1000,1/20),c=calm();last=now;
  if(!document.hidden)for(const p of pieces)if(p.visible)p.piece.frame?.(dt,now/1000,c);
  requestAnimationFrame(loop);
 }
 requestAnimationFrame(loop);

 // The page's own pause, styled like the pond's. The footer switch and reduced motion override it.
 const button=document.querySelector('.mo-pause'),status=document.getElementById('mo-status');
 function sync(){
  const off=root.classList.contains('motion-off');root.classList.toggle('mo-calm',calm());
  if(!button)return;
  button.hidden=false;button.disabled=off;button.setAttribute('aria-pressed',String(calm()));
  button.firstChild.textContent=off?'Motion is off ':paused?'Resume motion ':'Pause all motion ';
  button.querySelector('span').textContent=calm()?'▷':'Ⅱ';
 }
 const tell=()=>pieces.forEach(p=>p.piece.calm?.(calm()));
 button?.addEventListener('click',()=>{paused=!paused;sync();tell();if(status)status.textContent=paused?'Motion paused. Each piece shows its finished frame.':'Motion resumed.';});
 addEventListener('capra:motion',()=>{sync();tell();});
 sync();
})();
