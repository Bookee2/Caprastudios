/* One navigation bar: it steps aside on the way down, returns on the way up, and marks where you are.
   It also owns two site preferences: motion (the footer toggle, or reduced motion) and light (the lamp). */
(()=>{'use strict';
 const root=document.documentElement,header=document.querySelector('.site-header'),nav=document.querySelector('#navigation');
 if(!header||!nav)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),toggles=[...document.querySelectorAll('.motion-toggle')];
 let chosenOff=false;try{chosenOff=localStorage.getItem('capra-motion')==='off';}catch{}
 function applyMotion(){
  const off=chosenOff||reduced.matches;root.classList.toggle('motion-off',off);
  toggles.forEach(b=>{b.hidden=false;b.disabled=reduced.matches;b.setAttribute('aria-pressed',String(!off));b.querySelector('span').textContent=reduced.matches?'reduced':off?'off':'on';});
  if(off)header.classList.remove('nav-hidden');
 }
 const announce=()=>dispatchEvent(new CustomEvent('capra:motion'));
 toggles.forEach(b=>b.addEventListener('click',()=>{chosenOff=!chosenOff;try{localStorage.setItem('capra-motion',chosenOff?'off':'on');}catch{}applyMotion();announce();}));
 reduced.addEventListener('change',()=>{applyMotion();announce();});
 applyMotion();root.classList.add('nav-enhanced');

 // The lamp: the same wall in daylight or under black light. It follows the system theme until the visitor
 // flips it; a choice that differs from the system is remembered per browser. The page head applies it before paint.
 const lamps=[...document.querySelectorAll('.lamp')],theme=document.querySelector('meta[name="theme-color"]'),systemDark=matchMedia('(prefers-color-scheme: dark)');
 const saved=()=>{try{return localStorage.getItem('capra-light');}catch{return null;}};
 function light(){const on=root.classList.contains('bl');lamps.forEach(b=>{b.hidden=false;b.setAttribute('aria-pressed',String(on));const label=b.querySelector('span');if(label)label.textContent=on?'Lights on':'Lights off';});theme?.setAttribute('content',on?'#0e0b16':'#f3f1ea');}
 lamps.forEach(b=>b.addEventListener('click',()=>{const on=root.classList.toggle('bl');try{if(on===systemDark.matches)localStorage.removeItem('capra-light');else localStorage.setItem('capra-light',on?'bl':'day');}catch{}light();}));
 systemDark.addEventListener('change',()=>{if(saved())return;root.classList.toggle('bl',systemDark.matches);light();});
 light();

 // A single line slides to the hovered or focused link and rests on the current one.
 const pill=document.createElement('span'),links=[...nav.querySelectorAll('a:not(.nav-contact)')];
 pill.className='nav-pill';pill.setAttribute('aria-hidden','true');nav.append(pill);
 let pointed=null;
 const current=()=>links.find(a=>a.hasAttribute('aria-current'));
 function place(link){if(!link){pill.style.opacity='0';return;}pill.style.transform=`translateX(${link.offsetLeft}px) scaleX(${link.offsetWidth})`;pill.style.opacity='1';}
 links.forEach(a=>{const point=()=>{pointed=a;place(a);};a.addEventListener('pointerenter',point);a.addEventListener('focus',point);a.addEventListener('blur',()=>{pointed=null;place(current());});});
 nav.addEventListener('pointerleave',()=>{pointed=null;place(current());});
 place(current());requestAnimationFrame(()=>requestAnimationFrame(()=>pill.classList.add('is-ready')));
 const replace=()=>place(pointed||current());addEventListener('resize',replace);document.fonts?.ready.then(replace);

 // On the homepage, links that name a section are current while that section holds the middle of the screen.
 const spies=[...nav.querySelectorAll('a[data-spy]')].map(a=>{const el=document.getElementById(a.dataset.spy);return [a,el?.closest('section')||el];}).filter(([,el])=>el);
 function spy(){
  const line=innerHeight*.4;let active=null;
  spies.forEach(([a,el])=>{const r=el.getBoundingClientRect();if(r.top<=line&&r.bottom>line)active=a;});
  spies.forEach(([a])=>{if(a===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  if(!pointed)place(current());
 }

 // Hide only after a deliberate scroll down; any scroll up, focus, or open menu brings it back.
 let lastY=scrollY,travel=0,frame=0;
 function update(){
  frame=0;const y=Math.max(0,scrollY),dy=y-lastY;lastY=y;
  travel=Math.sign(dy)===Math.sign(travel)?travel+dy:dy;
  header.classList.toggle('is-scrolled',y>4);
  const keep=root.classList.contains('motion-off')||y<header.offsetHeight*2||header.contains(document.activeElement)||nav.classList.contains('is-open');
  if(keep||travel<-10)header.classList.remove('nav-hidden');else if(travel>28)header.classList.add('nav-hidden');
  if(spies.length)spy();
 }
 addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
 header.addEventListener('focusin',()=>header.classList.remove('nav-hidden'));
 addEventListener('pageshow',update);update();
})();
