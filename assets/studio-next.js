/* Progressive enhancement. All content and navigation work without JavaScript. */
(()=>{
 const root=document.documentElement,menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation'),mobile=matchMedia('(max-width:800px)');
 function close(){nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');menu.innerHTML='Menu <span>+</span>';}
 if(menu&&nav){menu.hidden=false;root.classList.add('js');menu.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);menu.setAttribute('aria-expanded',String(open));menu.innerHTML=open?'Close <span>−</span>':'Menu <span>+</span>';});nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){close();menu.focus();}});mobile.addEventListener('change',close);}
 document.querySelector('#year').textContent=new Date().getFullYear();
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),buttons=[...document.querySelectorAll('.loop-control')];let paused=false;
 function sync(){root.classList.toggle('touches-running',!paused&&!reduced.matches&&!document.hidden);buttons.forEach(b=>{b.hidden=reduced.matches;b.setAttribute('aria-pressed',String(paused));b.textContent=paused?'Resume subtle motion ▷':'Pause subtle motion Ⅱ';});}
 buttons.forEach(b=>b.addEventListener('click',()=>{paused=!paused;sync();}));
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.dataset.visible=String(e.isIntersecting)));document.querySelectorAll('.ambient').forEach(e=>observer.observe(e));root.classList.add('motion-ready');}
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',()=>{sync();if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});sync();
 document.querySelectorAll('video').forEach(video=>{
  const failure=()=>{if(video.parentElement.querySelector('.media-error'))return;const note=document.createElement('p');note.className='media-error';note.setAttribute('role','status');note.append('The film couldn’t load. ');const a=document.createElement('a');a.href=video.querySelector('source').src;a.textContent='Open the video directly ↗';note.append(a);video.after(note);};
  video.addEventListener('error',failure);video.querySelectorAll('source').forEach(s=>s.addEventListener('error',failure));
 });
 document.querySelectorAll('[data-play-film]').forEach(button=>{const video=document.getElementById(button.dataset.playFilm);if(!video)return;button.hidden=false;button.addEventListener('click',()=>{video.play().then(()=>video.focus({preventScroll:true})).catch(()=>{button.textContent='Try playing the film again';});});video.addEventListener('play',()=>{button.hidden=true;});video.addEventListener('ended',()=>{button.hidden=false;});});
 const film=document.querySelector('#brand-film'),chapters=document.querySelector('.film-chapters');
 if(film&&chapters){chapters.hidden=false;const choices=[...chapters.querySelectorAll('[data-film-time]')];choices.forEach(button=>button.addEventListener('click',()=>{const time=Number(button.dataset.filmTime);film.currentTime=time;film.play().then(()=>film.focus({preventScroll:true})).catch(()=>{const play=document.querySelector('[data-play-film="brand-film"]');if(play){play.hidden=false;play.textContent='Try playing the film again';}});}));film.addEventListener('timeupdate',()=>{let current=0;choices.forEach((b,i)=>{if(film.currentTime>=Number(b.dataset.filmTime))current=i;});choices.forEach((b,i)=>{if(i===current)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});});}
 // User-started films stop when entirely offscreen; returning never overrides a pause.
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause();}));document.querySelectorAll('video').forEach(v=>observer.observe(v));}
})();
