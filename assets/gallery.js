/* The hero gallery: several featured motion pieces in one frame. Nothing rotates on its own; the visitor chooses.
   Only the chosen piece runs. Without this script the first piece shows and the tabs stay hidden. */
(()=>{'use strict';
 const bar=document.getElementById('gallery-bar'),gallery=document.getElementById('gallery');
 if(!bar||!gallery)return;
 const root=document.documentElement,tabs=[...bar.querySelectorAll('[data-show]')],slides=[...gallery.querySelectorAll('.slide')];
 const note=document.getElementById('gallery-note'),pondControls=document.getElementById('controls');
 function show(id){
  slides.forEach(slide=>{
   const on=slide.dataset.slide===id,frame=slide.querySelector('iframe[data-src]'),film=slide.querySelector('video');
   slide.hidden=!on;
   // The koi pond is a separate live page: load it when chosen, unload it when left.
   if(frame){if(on){if(frame.getAttribute('src')!==frame.dataset.src)frame.src=frame.dataset.src;}else frame.removeAttribute('src');}
   if(film){const still=root.classList.contains('motion-off');film.controls=still;if(on&&!still)film.play().catch(()=>{film.controls=true;});else film.pause();}
  });
  tabs.forEach(tab=>{const on=tab.dataset.show===id;tab.setAttribute('aria-pressed',String(on));if(on&&note)note.textContent=tab.dataset.note;});
  pondControls?.classList.toggle('is-away',id!=='glow');
 }
 tabs.forEach(tab=>tab.addEventListener('click',()=>show(tab.dataset.show)));
 bar.hidden=false;
})();
