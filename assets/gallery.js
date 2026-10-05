/* The hero carousel: several featured motion pieces in one frame, stepped through with the arrows.
   Nothing rotates on its own, and only the piece on show runs. The page opens on the koi pond in daylight and the glow pond under black light.
   Without this script the first piece (the koi pond's poster) shows alone. */
(()=>{'use strict';
 const gallery=document.getElementById('gallery');if(!gallery)return;
 const root=document.documentElement,slides=[...gallery.querySelectorAll('.slide')],arrows=[...document.querySelectorAll('.gallery-arrow')];
 const note=document.getElementById('gallery-note'),status=document.getElementById('gallery-status'),pondControls=document.getElementById('controls');
 let current=0;
 function show(index,announce){
  current=(index+slides.length)%slides.length;
  slides.forEach((slide,i)=>{
   const on=i===current,frame=slide.querySelector('iframe[data-src]'),film=slide.querySelector('video');
   slide.hidden=!on;
   // The koi pond is a separate live page: load it when it comes up, unload it when it leaves.
   // On page load with motion off, its poster stays as the still; stepping to it loads it.
   if(frame){if(on&&(announce||!root.classList.contains('motion-off'))){if(frame.getAttribute('src')!==frame.dataset.src)frame.src=frame.dataset.src;}else if(!on)frame.removeAttribute('src');}
   if(film){const still=root.classList.contains('motion-off');film.controls=still;if(on&&!still)film.play().catch(()=>{film.controls=true;});else film.pause();}
  });
  const slide=slides[current];
  if(note)note.textContent=slide.dataset.note;
  if(announce&&status)status.textContent=`${slide.dataset.name}, ${current+1} of ${slides.length}`;
  pondControls?.classList.toggle('is-away',slide.dataset.slide!=='glow');
 }
 arrows.forEach(arrow=>{arrow.hidden=false;arrow.addEventListener('click',()=>show(current+(arrow.classList.contains('next')?1:-1),true));});
 gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight')show(current+1,true);else if(e.key==='ArrowLeft')show(current-1,true);});
 // Daylight opens on the koi pond; black light opens on the glow pond, which belongs to the dark.
 const forLight=()=>root.classList.contains('bl')?Math.max(0,slides.findIndex(s=>s.dataset.slide==='glow')):0;
 show(forLight());
 // Flipping the lamp brings up the piece that belongs to that light; the arrows still step through the rest.
 addEventListener('capra:light',()=>show(forLight(),true));
})();
