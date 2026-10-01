/* Natural page scrolling, progressively enhanced with local GSAP timelines. */
(()=>{'use strict';
 const root=document.documentElement, toggle=document.querySelector('.scroll-toggle');
 if(!window.gsap||!window.ScrollTrigger||!toggle)return;
 gsap.registerPlugin(ScrollTrigger);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'), panels=[...document.querySelectorAll('.project-panel')],buttons=[...document.querySelectorAll('[data-project]')],switcher=document.querySelector('.work-switch');
 let disabled=false,mm=null,workTrigger=null,activeProject=-1;
 const setProject=index=>{if(activeProject===index)return;activeProject=index;panels.forEach((panel,i)=>{panel.inert=i!==index;panel.setAttribute('aria-hidden',String(i!==index));});buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));};
 function cleanup(){workTrigger=null;activeProject=-1;root.classList.remove('desktop-choreography');switcher.hidden=true;panels.forEach(p=>{p.inert=false;p.removeAttribute('aria-hidden');});window.capraFilament?.setScroll(0);}
 function setup(){
  mm?.revert();cleanup();
  toggle.hidden=false;toggle.setAttribute('aria-pressed',String(disabled||reduced.matches));toggle.textContent=reduced.matches?'Reduced motion ':disabled?'Scroll effects off ':'Scroll effects on ';const icon=document.createElement('span');icon.setAttribute('aria-hidden','true');icon.textContent=disabled||reduced.matches?'○':'◉';toggle.append(icon);toggle.disabled=reduced.matches;
  if(disabled||reduced.matches)return;
  mm=gsap.matchMedia();
  mm.add({all:'all',desktop:'(min-width:1000px) and (min-height:720px) and (pointer:fine)',reduce:'(prefers-reduced-motion:reduce)'},context=>{
   if(context.conditions.reduce)return;
   if(context.conditions.desktop){
    root.classList.add('desktop-choreography');switcher.hidden=false;
    const hero=gsap.timeline({scrollTrigger:{trigger:'.hero-chapter',start:'top 60px',end:'bottom bottom',scrub:true,invalidateOnRefresh:true,onUpdate:self=>window.capraFilament?.setScroll(self.progress)}});
    hero.to('.hero-copy',{y:-65,opacity:.2,ease:'none'},0).to('.art-caption',{opacity:0,ease:'none'},0).fromTo('.ribbon-bridge',{y:140,opacity:0},{y:-125,opacity:1,ease:'none'},.1);
    gsap.fromTo('.project-stage',{clipPath:'polygon(-10% 0,0% 0,-10% 100%,-20% 100%)'},{clipPath:'polygon(0% 0,110% 0,100% 100%,0% 100%)',ease:'none',scrollTrigger:{trigger:'.work-chapter',start:'top 95%',end:'top 35%',scrub:true}});
    const work=gsap.timeline({scrollTrigger:{id:'capra-work',trigger:'.work-chapter',start:'top 60px',end:'bottom bottom',scrub:true,invalidateOnRefresh:true,onUpdate:self=>setProject(self.progress>=.5?1:0)}});
    work.to({}, {duration:.2}).to('.trail-panel .project-visual img',{rotateY:-18,rotateZ:-4,scale:.88,xPercent:-6,duration:.6,ease:'none'},.2)
     .fromTo('.squirrel-panel .project-backdrop,.squirrel-panel .project-visual', {clipPath:'polygon(110% 0,110% 0,100% 100%,100% 100%)'}, {clipPath:'polygon(0% 0,110% 0,100% 100%,-10% 100%)',duration:.6,ease:'power1.inOut'},.2)
     .fromTo('.squirrel-panel .project-visual img',{rotateY:18,rotateZ:6,scale:1.12,xPercent:10},{rotateY:5,rotateZ:-2,scale:1,xPercent:0,duration:.6,ease:'none'},.2).to({}, {duration:.2});
    workTrigger=work.scrollTrigger;setProject(workTrigger.progress>=.5?1:0);
   }else{
    // Short reveals stay inside the natural card flow on touch and smaller screens.
    panels.forEach(panel=>gsap.fromTo(panel.querySelector('.project-visual img'),{y:24,scale:.96},{y:0,scale:1,ease:'none',scrollTrigger:{trigger:panel,start:'top 85%',end:'center 55%',scrub:true}}));
   }
   gsap.fromTo('.film-frame',{scale:context.conditions.desktop?.84:.94,borderRadius:24},{scale:1,borderRadius:4,ease:'none',scrollTrigger:{trigger:'.film-expander',start:'top 92%',end:'top 25%',scrub:true}});
   const flow=gsap.timeline({scrollTrigger:{trigger:'.ai-workflow',start:'top 88%',end:'bottom 88%',scrub:true}});
   flow.fromTo('.ai-workflow>.flow-node:first-of-type',{y:16,opacity:.35},{y:0,opacity:1,duration:1})
    .fromTo('.flow-connector',{scaleY:.1,opacity:.25},{scaleY:1,opacity:1,stagger:1,duration:1},.3)
    .fromTo('.flow-core',{y:15,opacity:.4},{y:0,opacity:1,duration:1},.7)
    .fromTo('.flow-outcomes',{y:15,opacity:.35},{y:0,opacity:1,duration:1},1.8);
   return cleanup;
  });
  ScrollTrigger.refresh();
 }
 // Keep the current reading position when changing layout or motion preference.
 function rebuild(){
  const current=[...document.querySelectorAll('.hero-chapter,.work-chapter,#motion,#services,#ai-consulting,#studio,#contact')].find(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight*.5&&r.bottom>innerHeight*.5;});
  const anchor=current?.id==='work'&&root.classList.contains('desktop-choreography')?panels[activeProject]:current;
  const before=anchor?.getBoundingClientRect().top;
  setup();
  if(anchor&&before!==undefined)window.scrollBy({top:anchor.getBoundingClientRect().top-before,behavior:'instant'});
  ScrollTrigger.update();
 }
 buttons.forEach(button=>button.addEventListener('click',()=>{if(!workTrigger)return;const index=Number(button.dataset.project);window.scrollTo({top:workTrigger.start+(workTrigger.end-workTrigger.start)*(index?.95:.05),behavior:'instant'});ScrollTrigger.update();}));
 toggle.addEventListener('click',()=>{disabled=!disabled;rebuild();});reduced.addEventListener('change',rebuild);
 const chapterLinks=[...document.querySelectorAll('.chapter-links a')];
 const sections=chapterLinks.map(a=>document.querySelector(a.getAttribute('href')));
 // Only one update per scroll frame. No replacement wheel/touch handlers.
 let frame=0;
 function updateIndex(){frame=0;let active=-1;sections.forEach((s,i)=>{if(s.getBoundingClientRect().top<=innerHeight*.5)active=i;});chapterLinks.forEach((a,i)=>{if(i===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
 document.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(updateIndex);},{passive:true});
 setup();updateIndex();
 // A direct fragment can be resolved before fonts/enhancement change document height.
 // Align once after initial layout, but never override user input or Back/reload restoration.
 const initialHash=location.hash,initialNavigation=performance.getEntriesByType('navigation')[0]?.type;
 let interacted=false;
 for(const event of ['wheel','touchstart','pointerdown','keydown'])window.addEventListener(event,()=>{interacted=true;},{once:true,passive:true});
 const loaded=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
 Promise.all([document.fonts.ready,loaded]).then(()=>{ScrollTrigger.refresh();requestAnimationFrame(()=>{
  if(initialHash&&initialNavigation==='navigate'&&!interacted&&location.hash===initialHash){let id;try{id=decodeURIComponent(initialHash.slice(1));}catch{return;}document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});ScrollTrigger.update();}
  updateIndex();
 });});
 window.addEventListener('pageshow',()=>{ScrollTrigger.refresh();updateIndex();});
})();
