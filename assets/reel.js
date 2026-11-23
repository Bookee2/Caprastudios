// The homepage reel: a silent loop that runs while it is on screen, unless the visitor prefers less motion.
// One button stops and starts it, and the visitor's choice wins over everything else.
(()=>{
  const video=document.querySelector('[data-reel]');
  const button=document.querySelector('[data-reel-toggle]');
  if(!video||!button)return;
  const root=document.documentElement;
  const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||root.classList.contains('motion-off');
  let wanted=!still(),chosen=false,onScreen=true;
  const run=()=>{
    button.textContent=wanted?'Pause the reel':'Play the reel';
    if(wanted&&onScreen&&document.visibilityState==='visible')video.play().catch(()=>{});
    else video.pause();
  };
  button.hidden=false;
  button.addEventListener('click',()=>{wanted=!wanted;chosen=true;run();});
  // A page opened in a background tab cannot start a video, so try again when it comes to the front.
  document.addEventListener('visibilitychange',run);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;run();},{threshold:.15}).observe(video);
  // The site's own motion switch sets a class on <html>; follow it until the visitor has chosen for themselves.
  new MutationObserver(()=>{if(!chosen){wanted=!still();run();}}).observe(root,{attributes:true,attributeFilter:['class']});
  run();
})();
