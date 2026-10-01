/* Original Capra study: fixed tube geometry, GLSL lighting and deformation.
 * Ribbon boundaries follow the approved vector; no WebGPU or external renderer. */
(()=>{'use strict';
const canvas=document.querySelector('#filaments'),still=document.querySelector('#still'),stage=document.querySelector('#stage'),controls=document.querySelector('#controls'),hint=document.querySelector('#hint'),pause=document.querySelector('#pause'),pulse=document.querySelector('#pulse'),status=document.querySelector('#status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let gl,raf=0,last=0,time=0,paused=false,visible=true,lost=false,w=1,h=1,palette=0,burst=-20,px=0,py=0,tx=0,ty=0,hover=0,scrollProgress=0;
const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;};
function fallback(message){lost=true;stop();canvas.hidden=true;still.hidden=false;controls.hidden=true;hint.textContent=message;}
try{
gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl){fallback('Static signature · WebGL unavailable');return;}
// Each pair travels from the same ribbon tip to the same anatomical endpoint.
const ribbons=[
 ['M96 511C155 449 172 406 130 364C105 341 57 323 33 293C6 259 19 202 44 161C71 116 122 91 177 83','M96 511C136 500 184 483 216 453C260 411 251 372 194 334C154 307 108 295 85 271C60 244 67 201 100 158C122 128 155 110 205 106',42,0],
 ['M221 110L364 20','M247 145L364 20',19,.2],
 ['M198 80C196 107 205 125 228 143L286 191C316 215 321 237 305 255C294 267 277 269 265 258','M174 85C180 106 197 126 222 148L279 205C302 224 302 247 285 256C278 260 271 260 265 258',22,.47],
 ['M162 151C165 173 188 190 217 200C237 207 262 210 279 223C302 242 290 263 265 258','M162 151C180 172 208 183 235 186C251 190 266 196 279 205C312 229 305 262 265 258',14,.56],
 ['M174 85C159 61 168 43 184 48C207 52 224 76 222 99L204 120','M174 85C178 65 184 58 190 68C202 85 194 103 204 120',12,.8],
 ['M96 511C160 491 214 456 225 416C233 388 219 358 194 334','M96 511C152 498 202 474 232 438C261 405 244 367 194 334',9,.95]
];
const phone=matchMedia('(max-width:700px)').matches,steps=phone?90:100,sides=5,verts=[],indices=[];
function path(d){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);return p;}
for(const [a,b,total,offset]of ribbons){
 const pa=path(a),pb=path(b),la=pa.getTotalLength(),lb=pb.getTotalLength(),count=phone?Math.round(total*.7):total;
 function center(t,s){const aa=pa.getPointAtLength(t*la),bb=pb.getPointAtLength(t*lb);return [(aa.x*(1-s)+bb.x*s-190)/270,(270-aa.y*(1-s)-bb.y*s)/270,Math.sin(s*Math.PI)*.067+Math.sin(t*5+offset*4)*.065+offset*.015];}
 for(let j=0;j<count;j++){const s=(j+.5)/count,seed=(j*.6180339+offset)%1;const rings=[];
 for(let k=0;k<=steps;k++){const t=k/steps,p=center(t,s),p0=center(Math.max(0,t-.001),s),p1=center(Math.min(1,t+.001),s);let dx=p1[0]-p0[0],dy=p1[1]-p0[1],len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
 const rad=((phone?.0022:.00165)+seed*.00055)*(.25+.75*Math.sin(Math.PI*t)**.25);
 const ring=[];for(let l=0;l<sides;l++){const angle=l/sides*Math.PI*2,n=[-dy*Math.cos(angle),dx*Math.cos(angle),Math.sin(angle)];ring.push(verts.length/11);verts.push(...p,...n,t,s,seed,rad,offset);}rings.push(ring);}
 for(let k=0;k<steps;k++)for(let l=0;l<sides;l++){const n=(l+1)%sides;for(const v of [rings[k][l],rings[k+1][l],rings[k+1][n],rings[k][l],rings[k+1][n],rings[k][n]])indices.push(v);}
 }
}
const vertex=`precision highp float;
attribute vec3 aPos;attribute vec3 aNormal;attribute vec4 aData;attribute float aPart;
uniform vec2 uRes;uniform vec3 uPointer;uniform float uTime;uniform float uMotion;uniform float uGlow;uniform float uBurst;uniform float uScroll;
varying vec3 vNormal;varying vec3 vPosition;varying vec4 vData;varying float vPart;
void main(){vec3 p=aPos;float t=aData.x,s=aData.y,seed=aData.z;
 p.x+=sin(t*3.14159)*uScroll*.25;p.y-=uScroll*.12;
 float breath=sin(uTime*.6+t*7.+seed*2.)*.006*uMotion;
 p.z+=breath;p.x+=sin(t*9.+uTime*.35)*.004*uMotion;
 vec2 delta=p.xy-uPointer.xy;float influence=exp(-dot(delta,delta)*18.)*uPointer.z*uMotion;
 p.xy+=delta*influence*.24;p.z+=influence*.13;
 float wave=exp(-pow((t-uBurst*.42)*10.,2.))*step(0.,uBurst)*step(uBurst,3.2)*uMotion;
 p.z+=wave*.07;
 vec3 n=aNormal;p+=n*aData.w*(1.+uGlow*3.5);
 float yaw=.13-uScroll*.35+uPointer.x*.065*uMotion+sin(uTime*.19)*.055*uMotion;
 float pitch=-.07+uPointer.y*.035*uMotion;
 mat3 ry=mat3(cos(yaw),0.,-sin(yaw),0.,1.,0.,sin(yaw),0.,cos(yaw));
 mat3 rx=mat3(1.,0.,0.,0.,cos(pitch),sin(pitch),0.,-sin(pitch),cos(pitch));
 p=ry*rx*p;n=ry*rx*n;
 float scale=min(uRes.x/1.52,uRes.y/2.14)*.83*(1.-uScroll*.15);
 gl_Position=vec4(p.x*scale/uRes.x*2.,p.y*scale/uRes.y*2.+.03,-p.z*.4,1.);
 vNormal=n;vPosition=p;vData=aData;vPart=aPart;
}`;
const fragment=`precision highp float;
uniform float uTime;uniform float uPalette;uniform float uGlow;uniform float uMotion;uniform float uBurst;
varying vec3 vNormal;varying vec3 vPosition;varying vec4 vData;varying float vPart;
vec3 ramp(float x){
 vec3 a=vec3(.035,.82,.98),b=vec3(.45,.16,1.),c=vec3(1.,.07,.44),d=vec3(1.,.56,.16);
 if(uPalette>.5&&uPalette<1.5){a=vec3(.95,.13,.48);b=vec3(1.,.23,.14);c=vec3(1.,.57,.08);d=vec3(1.,.88,.4);}
 if(uPalette>1.5){a=vec3(.12,.37,1.);b=vec3(.015,.77,.81);c=vec3(.3,.93,1.);d=vec3(.8,1.,1.);}
 x=clamp(x,0.,.999);return x<.36?mix(a,b,x/.36):x<.74?mix(b,c,(x-.36)/.38):mix(c,d,(x-.74)/.26);
}
void main(){float t=vData.x,s=vData.y,seed=vData.z;
 float hue=clamp(t*.74+s*.22+vPart*.18+sin(t*5.+s*2.)*.07,0.,1.);
 vec3 color=ramp(hue);vec3 n=normalize(vNormal);
 float diffuse=max(0.,dot(n,normalize(vec3(-.5,.65,1.))));
 float spec=pow(max(0.,dot(n,normalize(vec3(-.3,.35,1.)))),24.);
 float rim=pow(1.-abs(n.z),3.);
 float travel=fract(t*.64-uTime*.10*uMotion+seed*.15+vPart*.2);
 float pulse=exp(-pow((travel-.5)*35.,2.))*step(.60,seed)*uMotion;
 float wave=exp(-pow((t-uBurst*.42)*12.,2.))*step(0.,uBurst)*step(uBurst,3.2)*uMotion;
 vec3 lit=color*(.36+diffuse*.75)+vec3(.65,.81,1.)*spec*.46+color*rim*.18;
 lit+=mix(color,vec3(1.),.5)*(pulse*.95+wave*.8);
 if(uGlow>.5){gl_FragColor=vec4(color,.048+pulse*.03+wave*.04);return;}
 gl_FragColor=vec4(lit,1.);
}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);const count=indices.length;verts.length=0;
const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);indices.length=0;
for(const [name,size,offset]of [['aPos',3,0],['aNormal',3,3],['aData',4,6],['aPart',1,10]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,44,offset*4);}
const U={};for(const name of ['uRes','uPointer','uTime','uMotion','uGlow','uPalette','uBurst','uScroll'])U[name]=gl.getUniformLocation(program,name);
function draw(){if(lost)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform2f(U.uRes,w,h);gl.uniform3f(U.uPointer,px,py,hover);gl.uniform1f(U.uTime,time);gl.uniform1f(U.uScroll,scrollProgress);gl.uniform1f(U.uMotion,reduced.matches?0:1);gl.uniform1f(U.uPalette,palette);gl.uniform1f(U.uBurst,time-burst);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.uniform1f(U.uGlow,1);gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
 gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.uniform1f(U.uGlow,0);gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_SHORT,0);
}
window.capraFilament={setScroll(value){const next=reduced.matches?0:Math.max(0,Math.min(1,value));if(next===scrollProgress)return;if(paused&&next!==0)return;scrollProgress=next;if(!raf&&visible&&!document.hidden)draw();}};
function tick(ts){raf=0;if(lost||paused||reduced.matches||!visible||document.hidden){last=0;return;}const dt=last?Math.min((ts-last)/1000,.05):0;last=ts;time+=dt;px+=(tx-px)*Math.min(1,dt*5);py+=(ty-py)*Math.min(1,dt*5);draw();raf=requestAnimationFrame(tick);}
function wake(){if(!raf&&!lost&&!paused&&!reduced.matches&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
function resize(){const r=stage.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,phone?1.5:2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);draw();}
function preference(){stop();pause.hidden=reduced.matches;pulse.hidden=reduced.matches;tx=ty=px=py=hover=0;hint.textContent=reduced.matches?'Reduced motion · still material':matchMedia('(pointer:coarse)').matches?'Tap the ribbon to send light.':'Move through the ribbon.';status.textContent=reduced.matches?'Reduced motion: select a palette for a still composition.':'Select a palette to explore the material.';draw();wake();}
for(const button of document.querySelectorAll('[data-palette]'))button.addEventListener('click',()=>{palette=Number(button.dataset.palette);document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));status.textContent=`${button.textContent.trim()} lighting${reduced.matches||paused?' · still composition':''}.`;draw();});
pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';pause.setAttribute('aria-pressed',String(paused));pulse.disabled=paused;if(paused)stop();else wake();status.textContent=paused?'Motion paused. You can still explore the palettes.':'Motion resumed.';});
pulse.addEventListener('click',()=>{if(paused||reduced.matches)return;burst=time;status.textContent='A light wave travels along the ribbon.';wake();});
canvas.addEventListener('pointermove',e=>{if(paused||reduced.matches||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect(),scale=Math.min(w/1.52,h/2.14)*.83;tx=(e.clientX-r.left-w/2)/scale;ty=(h/2-e.clientY+r.top)/scale;hover=1;});
canvas.addEventListener('pointerleave',()=>{tx=ty=hover=0;});canvas.addEventListener('pointerdown',()=>{if(!paused&&!reduced.matches){burst=time;wake();}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback('Static signature · reload to restore motion');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else wake();});new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();}).observe(stage);new ResizeObserver(resize).observe(stage);reduced.addEventListener('change',preference);
canvas.hidden=false;still.hidden=true;controls.hidden=false;resize();preference();wake();
}catch(e){fallback('The static signature is available.');console.error('Capra filament study:',e);}
})();
