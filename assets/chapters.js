/* Natural page scrolling, progressively enhanced with local GSAP timelines. */
(()=>{'use strict';
 const root=document.documentElement;
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const desktop=matchMedia('(min-width:1000px) and (min-height:720px) and (pointer:fine)');
 // nav.js owns the motion preference; html.motion-off covers both the site toggle and reduced motion.
 const motionOff=()=>root.classList.contains('motion-off'), panels=[...document.querySelectorAll('.project-panel')],buttons=[...document.querySelectorAll('[data-project]')],switcher=document.querySelector('.work-switch');
 let animationContext=null,workTrigger=null,activeProject=-1;
 const setProject=index=>{if(activeProject===index)return;activeProject=index;panels.forEach((panel,i)=>{panel.inert=i!==index;panel.setAttribute('aria-hidden',String(i!==index));});buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));};
 function cleanup(){workTrigger=null;activeProject=-1;root.classList.remove('desktop-choreography');switcher.hidden=true;panels.forEach(p=>{p.inert=false;p.removeAttribute('aria-hidden');});window.capraFilament?.setScroll(0);}
 function setup(){
  animationContext?.revert();animationContext=null;cleanup();
  root.classList.toggle('scroll-effects-disabled',motionOff());
  if(motionOff())return;
  animationContext=gsap.context(()=>{
   if(desktop.matches){
    root.classList.add('desktop-choreography');switcher.hidden=false;
    gsap.fromTo('.project-stage',{y:35,scale:.97},{y:0,scale:1,ease:'none',scrollTrigger:{trigger:'.work-chapter',start:'top 95%',end:'top 30%',scrub:true}});
    const work=gsap.timeline({scrollTrigger:{id:'capra-work',trigger:'.work-chapter',start:'top top',end:'bottom bottom',scrub:true,invalidateOnRefresh:true,onUpdate:self=>setProject(self.progress>=.5?1:0)}});
    work.to({}, {duration:.2}).to('.trail-panel .project-visual img',{rotateY:-18,rotateZ:-4,scale:.88,xPercent:-6,duration:.6,ease:'none'},.2)
     .fromTo('.squirrel-panel .project-backdrop,.squirrel-panel .project-visual', {clipPath:'polygon(110% 0,110% 0,100% 100%,100% 100%)'}, {clipPath:'polygon(0% 0,110% 0,100% 100%,-10% 100%)',duration:.6,ease:'power1.inOut'},.2)
     .fromTo('.squirrel-panel .project-visual img',{rotateY:18,rotateZ:6,scale:1.12,xPercent:10},{rotateY:5,rotateZ:-2,scale:1,xPercent:0,duration:.6,ease:'none'},.2).to({}, {duration:.2});
    workTrigger=work.scrollTrigger;setProject(workTrigger.progress>=.5?1:0);
   }else{
    // Short reveals stay inside the natural card flow on touch and smaller screens.
    panels.forEach(panel=>gsap.fromTo(panel.querySelector('.project-visual img'),{y:24,scale:.96},{y:0,scale:1,ease:'none',scrollTrigger:{trigger:panel,start:'top 85%',end:'center 55%',scrub:true}}));
   }
   gsap.fromTo('.closing-art .plane-front',{rotateY:-18,rotateZ:-8,y:35},{rotateY:5,rotateZ:3,y:-12,ease:'none',scrollTrigger:{trigger:'.closing-stage',start:'top 90%',end:'bottom bottom',scrub:true}});
   gsap.fromTo('.closing-art .plane-middle',{x:5,y:12,rotateZ:-7},{x:-25,y:30,rotateZ:-13,ease:'none',scrollTrigger:{trigger:'.closing-stage',start:'top 90%',end:'bottom bottom',scrub:true}});
   return cleanup;
  });
  ScrollTrigger.refresh();
 }
 // Keep the current reading position when changing layout or motion preference.
 function rebuild(){
  const current=[...document.querySelectorAll('.hero-chapter,.work-chapter,#motion,#services,#studio,#contact')].find(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight*.5&&r.bottom>innerHeight*.5;});
  const previousProject=activeProject;
  const anchor=root.classList.contains('desktop-choreography')&&current?.id==='work'?panels[activeProject]:current;
  const before=anchor?.getBoundingClientRect().top;
  setup();
  if(current?.id==='work'&&workTrigger&&previousProject>=0){window.scrollTo({top:workTrigger.start+(workTrigger.end-workTrigger.start)*(previousProject ? .95 : .05),behavior:'instant'});}
  else if(anchor&&before!==undefined)window.scrollBy({top:anchor.getBoundingClientRect().top-before,behavior:'instant'});
  ScrollTrigger.update();
 }
 buttons.forEach(button=>button.addEventListener('click',()=>{if(!workTrigger)return;const index=Number(button.dataset.project);window.scrollTo({top:workTrigger.start+(workTrigger.end-workTrigger.start)*(index?.95:.05),behavior:'instant'});ScrollTrigger.update();}));
 window.addEventListener('capra:motion',rebuild);desktop.addEventListener('change',rebuild);
 setup();
 // A direct fragment can be resolved before fonts/enhancement change document height.
 // Align once after initial layout, but never override user input or Back/reload restoration.
 const initialHash=location.hash,initialNavigation=performance.getEntriesByType('navigation')[0]?.type;
 let interacted=false;
 for(const event of ['wheel','touchstart','pointerdown','keydown'])window.addEventListener(event,()=>{interacted=true;},{once:true,passive:true});
 const loaded=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
 Promise.all([document.fonts.ready,loaded]).then(()=>{ScrollTrigger.refresh();requestAnimationFrame(()=>{
  if(initialHash&&initialNavigation==='navigate'&&!interacted&&location.hash===initialHash){let id;try{id=decodeURIComponent(initialHash.slice(1));}catch{return;}document.getElementById(id)?.scrollIntoView({behavior:'instant',block:'start'});ScrollTrigger.update();}
 });});
 window.addEventListener('pageshow',()=>ScrollTrigger.refresh());
})();
