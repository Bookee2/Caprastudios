/* Capra particle study. WebGL rendering and vertex-shader morphing; no framework. */
(async()=>{
'use strict';
const canvas=document.querySelector('#field'),fallback=document.querySelector('#fallback'),box=document.querySelector('#viewport'),controls=document.querySelector('#controls');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const stateNames=['Identity','Interface','Signature'];
const descriptions=['A familiar silhouette. A little room to play.','An idea finds its structure.','Every detail, unmistakably Capra.'];
const modes=['Identity in its simplest form','Design becomes experience','The studio signature'];
const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false});
if(!gl){document.querySelector('#hint').textContent='Static artwork · WebGL is unavailable.';return;}
let stopped=false,paused=false,visible=true,frame=0,time=0,last=0,shape=0,start=-10,sequence=false,next=0,burst=-10,w=1,h=1,dpr=1;
const N=matchMedia('(max-width:600px)').matches?6500:15000;
const from=new Float32Array(N*3),to=new Float32Array(N*3),seeds=new Float32Array(N);
let rng=1548;const random=()=>{rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;};
for(let i=0;i<N;i++)seeds[i]=random();
const vertex=`precision highp float;
attribute vec3 aFrom;attribute vec3 aTo;attribute float aSeed;
uniform vec2 uRes;uniform vec3 uPointer;uniform float uProgress;uniform float uTime;uniform float uBurst;uniform float uDpr;uniform float uCalm;
varying vec3 vColor;varying float vAlpha;
void main(){
 float t=clamp(uProgress*1.22-aSeed*.22,0.,1.);float e=t*t*t*(t*(t*6.-15.)+10.);float arc=sin(e*3.14159265);
 vec3 p=mix(aFrom,aTo,e);float phase=aSeed*6.2831853;
 p.xy+=vec2(cos(phase+e*3.3),sin(phase-e*2.5))*arc*(.2+aSeed*.43);
 p.z+=arc*sin(phase)*.3;
 float shimmer=sin(uTime*.7+phase);
 p.xy+=vec2(sin(uTime*.55+phase),cos(uTime*.43+phase))*.002*uCalm;
 vec2 delta=p.xy-uPointer.xy;float dist=length(delta);float push=pow(max(0.,1.-dist/.31),2.)*uPointer.z*uCalm;
 p.xy+=delta/max(dist,.015)*push*.13;
 float blow=max(0.,uBurst);p.xy+=vec2(cos(phase),sin(phase))*blow*(.12+aSeed*.8);
 float scale=min(uRes.x,uRes.y)*.86;vec2 pixel=p.xy*scale;
 gl_Position=vec4(pixel/uRes*2.,0.,1.);
 gl_PointSize=(1.4+aSeed*1.45+p.z*.8)*uDpr;
 vec3 blue=vec3(.48,.67,1.);vec3 violet=vec3(.76,.59,1.);vec3 ice=vec3(.58,.85,1.);
 vColor=mix(blue,violet,clamp(p.x*.6+p.y*.5+.4,0.,1.));vColor=mix(vColor,ice,step(.88,aSeed)*.65);
 vAlpha=.5+aSeed*.42+shimmer*.025*uCalm;
}`;
const fragment=`precision mediump float;varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(.35,1.,r);if(a<.01)discard;gl_FragColor=vec4(vColor,a*vAlpha);}`;
try{
const compile=(kind,src)=>{const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader compilation failed');return s;};
const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');gl.useProgram(program);
const buffers={};function attribute(name,array,size){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,array,gl.DYNAMIC_DRAW);const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);buffers[name]=b;}
attribute('aFrom',from,3);attribute('aTo',to,3);attribute('aSeed',seeds,1);
const U={};for(const n of ['uRes','uPointer','uProgress','uTime','uBurst','uDpr','uCalm'])U[n]=gl.getUniformLocation(program,n);
gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
const [mark,wordmark]=await Promise.all([load('../../assets/brand/mark.svg'),load('../../assets/brand/wordmark.svg')]);
const sample=(image,kind)=>{
 const c=document.createElement('canvas');c.width=1000;c.height=1000;const ctx=c.getContext('2d',{willReadFrequently:true});
 if(image){if(kind===0)ctx.drawImage(image,200,80,600,810);else ctx.drawImage(image,40,335,920,329);}
 else{ctx.strokeStyle='white';ctx.fillStyle='white';ctx.lineWidth=3;ctx.strokeRect(75,205,850,590);ctx.strokeRect(75,205,850,60);for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(102+i*20,235,4,0,7);ctx.fill();}ctx.fillRect(115,320,340,24);ctx.fillRect(115,360,270,24);ctx.fillRect(115,416,320,6);ctx.fillRect(115,434,260,6);ctx.fillRect(115,480,112,32);ctx.drawImage(mark,640,285,150,205);for(let i=0;i<3;i++){ctx.strokeRect(115+i*267,560,235,160);ctx.fillRect(135+i*267,580,100,8);ctx.fillRect(135+i*267,610,185,4);ctx.fillRect(135+i*267,625,160,4);}}
 const pixels=ctx.getImageData(0,0,1000,1000).data;const candidates=[];for(let y=0;y<1000;y+=2)for(let x=0;x<1000;x+=2)if(pixels[(y*1000+x)*4+3]>80)candidates.push([x,y]);
 const result=new Float32Array(N*3);for(let i=0;i<N;i++){const [x,y]=candidates[Math.floor(random()*candidates.length)];result[i*3]=(x+random()*2-500)/1000;result[i*3+1]=(500-y-random()*2)/1000;result[i*3+2]=(random()-.5)*.15;}return result;
};
let shapes=[sample(mark,0),sample(null,1),sample(wordmark,2)];
// Keep landscape shapes within a narrow phone canvas without cropping.
function shaped(index){const s=new Float32Array(shapes[index]);if(index!==0)for(let i=0;i<s.length;i+=3){s[i]*=Math.min(1.48,Math.max(1,w/h*.82));}return s;}
const upload=()=>{for(const [name,data]of [['aFrom',from],['aTo',to]]){gl.bindBuffer(gl.ARRAY_BUFFER,buffers[name]);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);}};
function resize(){const r=box.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);from.set(shaped(shape));to.set(from);start=-10;upload();draw();}
const pointer=[0,0,0];
function draw(){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(U.uRes,w,h);gl.uniform3fv(U.uPointer,pointer);gl.uniform1f(U.uProgress,(time-start)/2.3);gl.uniform1f(U.uTime,time);gl.uniform1f(U.uBurst,reduced.matches?0:Math.max(0,Math.sin(Math.min(1,Math.max(0,(time-burst)/1.8))*Math.PI))*.8);gl.uniform1f(U.uDpr,dpr);gl.uniform1f(U.uCalm,reduced.matches?0:1);gl.drawArrays(gl.POINTS,0,N);}
function setShape(index,announce=true){
 const p=Math.min(1,Math.max(0,(time-start)/2.3));
 for(let i=0;i<N;i++){const t=Math.min(1,Math.max(0,p*1.22-seeds[i]*.22));const e=t*t*t*(t*(t*6-15)+10),a=Math.sin(e*Math.PI),phase=seeds[i]*Math.PI*2;
  for(let j=0;j<3;j++)from[i*3+j]+=(to[i*3+j]-from[i*3+j])*e;
  from[i*3]+=Math.cos(phase+e*3.3)*a*(.2+seeds[i]*.43);from[i*3+1]+=Math.sin(phase-e*2.5)*a*(.2+seeds[i]*.43);from[i*3+2]+=a*Math.sin(phase)*.3;
 }
 shape=index;to.set(shaped(shape));start=time;if(reduced.matches||paused){from.set(to);start=-10;}upload();
 document.querySelectorAll('[data-shape]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.shape)===shape)));
 document.querySelector('#state-title').textContent=`0${shape+1} / ${stateNames[shape]}`;document.querySelector('#state-description').textContent=descriptions[shape];document.querySelector('#mode').textContent=modes[shape];
 if(announce)document.querySelector('#announcement').textContent=stateNames[shape];draw();wake();
}
function tick(ts){frame=0;if(stopped||paused||!visible||document.hidden||reduced.matches){last=0;return;}if(last)time+=Math.min((ts-last)/1000,.05);last=ts;
 if(sequence&&time>=next){if(shape===2){sequence=false;document.querySelector('#play').setAttribute('aria-pressed','false');document.querySelector('#play').textContent='Replay sequence ▷';}else{setShape(shape+1,false);next=time+5.4;}}
 draw();if(!frame)frame=requestAnimationFrame(tick);
}
function wake(){if(!frame&&!stopped&&!paused&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
function pauseFrame(){cancelAnimationFrame(frame);frame=0;last=0;}
function stopSequence(){sequence=false;document.querySelector('#play').setAttribute('aria-pressed','false');document.querySelector('#play').textContent='Play sequence ▷';}
for(const b of document.querySelectorAll('[data-shape]'))b.addEventListener('click',()=>{stopSequence();setShape(Number(b.dataset.shape));});
document.querySelector('#scatter').addEventListener('click',()=>{burst=time;wake();});
document.querySelector('#play').addEventListener('click',()=>{if(sequence){stopSequence();return;}paused=false;document.querySelector('#scatter').disabled=false;document.querySelector('#pause').textContent='Pause motion Ⅱ';document.querySelector('#pause').setAttribute('aria-pressed','false');setShape(0);sequence=true;next=time+4.5;document.querySelector('#play').textContent='Stop sequence □';document.querySelector('#play').setAttribute('aria-pressed','true');wake();});
document.querySelector('#pause').addEventListener('click',()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';document.querySelector('#pause').setAttribute('aria-pressed',String(paused));document.querySelector('#scatter').disabled=paused;if(paused)pauseFrame();else wake();});
canvas.addEventListener('pointermove',e=>{if(paused||reduced.matches||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect(),scale=Math.min(w,h)*.86;pointer[0]=(e.clientX-r.left-w/2)/scale;pointer[1]=(h/2-e.clientY+r.top)/scale;pointer[2]=1;});canvas.addEventListener('pointerleave',()=>{pointer[2]=0;});
const preferences=()=>{stopSequence();pauseFrame();document.querySelector('#play').hidden=reduced.matches;document.querySelector('#pause').hidden=reduced.matches;document.querySelector('#scatter').hidden=reduced.matches;document.querySelector('#hint').textContent=reduced.matches?'Reduced motion · choose a still composition.':matchMedia('(pointer:coarse)').matches?'Choose a form or tap Scatter.':'Move your pointer through the form.';if(reduced.matches){from.set(to);start=-10;upload();draw();}else wake();};
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopped=true;pauseFrame();canvas.hidden=true;fallback.hidden=false;controls.hidden=true;document.querySelector('#hint').textContent='Static artwork · reload to restore interaction.';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseFrame();else wake();});new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)wake();else pauseFrame();}).observe(box);
new ResizeObserver(resize).observe(box);reduced.addEventListener('change',preferences);
canvas.hidden=false;fallback.hidden=true;controls.hidden=false;resize();preferences();wake();
}catch(error){stopped=true;cancelAnimationFrame(frame);canvas.hidden=true;fallback.hidden=false;controls.hidden=true;document.querySelector('#hint').textContent='The static identity is available. Interactive rendering could not start.';console.error(error);}
})();

/* Quiet service loops and a particle signature. Independent of WebGL support. */
(()=>{
 const root=document.documentElement, preference=matchMedia('(prefers-reduced-motion: reduce)');
 const buttons=[...document.querySelectorAll('.loop-control')], note=document.querySelector('#loop-note');
 let userPaused=false;
 function sync(){
  root.classList.toggle('touches-running',!userPaused&&!preference.matches&&!document.hidden);
  for(const button of buttons){button.hidden=preference.matches;button.setAttribute('aria-pressed',String(userPaused));button.textContent=userPaused?'Resume subtle motion ▷':'Pause subtle motion Ⅱ';}
  note.textContent=preference.matches?'Reduced motion · finished compositions, without loops.':userPaused?'Subtle motion paused.':'Brief movements, with room to rest. Loops pause when they leave the screen.';
 }
 for(const button of buttons)button.addEventListener('click',()=>{userPaused=!userPaused;sync();});
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)entry.target.dataset.visible=String(entry.isIntersecting);},{threshold:0});document.querySelectorAll('.ambient').forEach(el=>observer.observe(el));root.classList.add('motion-ready');}
 preference.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);sync();
 // Sample the approved vector into a small, deterministic SVG dot field.
 const image=new Image();image.onload=()=>{try{
  const c=document.createElement('canvas');c.width=400;c.height=540;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,400,540);const data=ctx.getImageData(0,0,400,540).data;
  const svg=document.querySelector('#signature-particles'),ns='http://www.w3.org/2000/svg';
  for(let column=0;column<27;column++){const g=document.createElementNS(ns,'g');g.classList.add('signature-column','motion-piece');g.style.setProperty('--column',column);
   for(let x=column*15;x<column*15+15&&x<400;x+=5)for(let y=0;y<540;y+=5){if(data[(y*400+x)*4+3]<100)continue;const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx',x+Math.sin(y+x)*.7);circle.setAttribute('cy',y);circle.setAttribute('r','1.15');g.append(circle);}svg.append(g);
  }
  svg.removeAttribute('hidden');document.querySelector('#signature-fallback').hidden=true;
 }catch{/* Original vector remains visible if pixel sampling fails. */}};image.src='../../assets/brand/mark.svg';
})();
