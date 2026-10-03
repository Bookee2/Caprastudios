/* The Web page's hero: the same homepage in both lights. A mouse moves a soft lamp across it; the slider
   below sweeps the other light in from the left, for touch and keyboards. With motion off, the slider still works. */
(()=>{'use strict';
 const hero=document.querySelector('.lens-hero');if(!hero)return;
 const stage=hero.querySelector('.lens-hero-stage'),range=hero.querySelector('input[type=range]'),root=document.documentElement;
 const hover=matchMedia('(hover:hover) and (pointer:fine)');
 let x=0,y=0,tx=0,ty=0,r=0,tr=0,inside=false,swept=0,frame=0;
 const paint=()=>{
  frame=0;
  // The slider wins once it has been moved; otherwise the lamp follows the pointer.
  if(swept>0){stage.style.setProperty('--clip',`inset(0 ${100-swept}% 0 0)`);return;}
  const ease=root.classList.contains('motion-off')?1:.18;
  x+=(tx-x)*ease;y+=(ty-y)*ease;r+=(tr-r)*ease;
  stage.style.setProperty('--clip',`circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`);
  if(Math.abs(tx-x)>.3||Math.abs(ty-y)>.3||Math.abs(tr-r)>.3)frame=requestAnimationFrame(paint);
 };
 const queue=()=>{if(!frame)frame=requestAnimationFrame(paint);};
 const local=e=>{const b=stage.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top];};
 stage.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;inside=true;[tx,ty]=local(e);if(!r){x=tx;y=ty;}tr=Math.max(120,stage.clientWidth*.19);hero.classList.add('is-lit');queue();});
 stage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!inside)return;[tx,ty]=local(e);queue();},{passive:true});
 stage.addEventListener('pointerleave',()=>{inside=false;tr=0;queue();});
 // A tap on a phone swings the lamp open at that spot, so the hero answers touch too.
 stage.addEventListener('click',e=>{if(hover.matches||swept>0)return;[tx,ty]=local(e);x=tx;y=ty;tr=tr?0:Math.max(120,stage.clientWidth*.26);hero.classList.toggle('is-lit',tr>0);queue();});
 range.addEventListener('input',()=>{swept=Number(range.value);hero.classList.toggle('is-lit',swept>0);if(swept===0){tr=0;r=0;}queue();});
 hero.classList.add('is-ready');
})();
