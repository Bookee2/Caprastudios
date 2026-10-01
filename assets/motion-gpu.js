/* WebGPU for the motion page: one device shared by every canvas, created only when a GPU piece comes near.
   Each piece lives in its own script under assets/gpu/ and loads on approach. Without WebGPU, its poster stays.
   Helpers and lifecycle are adapted from the Motion Frontier lab's core.js (30 September 2026). */
(()=>{'use strict';
 const M=window.CapraMotion,stages=[...document.querySelectorAll('[data-gpu]')];
 if(!M||!stages.length)return;
 let device=null,format='bgra8unorm',booting=null;
 const defined={},waiting={},phone=()=>innerWidth<700;

 const VS=/* wgsl */`
struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f }
@vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VO; o.pos = vec4f(p[i], 0.0, 1.0); o.uv = p[i] * vec2f(0.5, -0.5) + 0.5; return o;
}
struct U { a: vec4f, b: vec4f, c: vec4f, d: vec4f }
`;
 const NOISE=/* wgsl */`
fn hash21(p: vec2f) -> f32 { var q = fract(p * vec2f(123.34, 456.21)); q += dot(q, q + 45.32); return fract(q.x * q.y); }
fn vnoise(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p); let w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), w.x), mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), w.x), w.y);
}
fn fbm(p0: vec2f) -> f32 { var p = p0; var a = 0.5; var s = 0.0; for (var i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2f(17.0, 9.0); a *= 0.5; } return s; }
`;
 const G=window.CapraGPU={
  VS,NOISE,
  get device(){return device;},get format(){return format;},
  define(id,init){defined[id]=init;waiting[id]?.(init);},
  module(code,label){const m=device.createShaderModule({code,label});m.getCompilationInfo().then(info=>{for(const x of info.messages)if(x.type==='error')console.error(`[wgsl ${label}] ${x.lineNum}:${x.linePos} ${x.message}`);});return m;},
  fs(label,fs,targets){const m=G.module(VS+fs,label);return device.createRenderPipeline({label,layout:'auto',vertex:{module:m,entryPoint:'vs'},fragment:{module:m,entryPoint:'fs',targets:targets.map(t=>typeof t==='string'?{format:t}:t)}});},
  bind(pipe,entries,group=0){return device.createBindGroup({layout:pipe.getBindGroupLayout(group),entries:entries.map((r,i)=>({binding:i,resource:r instanceof GPUBuffer?{buffer:r}:r instanceof GPUTexture?r.createView():r}))});},
  tex(w,h,fmt='rgba16float',usage){return device.createTexture({size:[w,h],format:fmt,usage:usage??(GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST)});},
  pair(w,h,fmt){const t=[G.tex(w,h,fmt),G.tex(w,h,fmt)];return {t,i:0,get read(){return t[this.i];},get write(){return t[1-this.i];},swap(){this.i=1-this.i;}};},
  ubo(floats=16){return device.createBuffer({size:floats*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});},
  write(b,arr){device.queue.writeBuffer(b,0,arr);},
  draw(enc,pipe,bg,view,o={}){const p=enc.beginRenderPass({colorAttachments:[{view,loadOp:o.load?'load':'clear',storeOp:'store',clearValue:o.clear??[0,0,0,1]}]});p.setPipeline(pipe);p.setBindGroup(0,bg);p.draw(o.count??3);p.end();},
  clear(enc,tex,value=[0,0,0,0]){enc.beginRenderPass({colorAttachments:[{view:tex.createView(),loadOp:'clear',storeOp:'store',clearValue:value}]}).end();},
  sampler(o={}){return device.createSampler({magFilter:'linear',minFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge',...o});},
  // Canvas 2D to texture; draw(ctx2d, w, h) paints the content.
  canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=G.tex(w,h,'rgba8unorm');device.queue.copyExternalImageToTexture({source:c},{texture:t},[w,h]);return t;},
  async image(src){const img=new Image();img.decoding='async';img.src=src;await img.decode();return img;},
 };

 function note(stage,text){let n=stage.querySelector('.gpu-note');if(!n){n=document.createElement('p');n.className='gpu-note mono';stage.append(n);}n.textContent=text;}
 function boot(){
  booting??=(async()=>{
   if(!navigator.gpu)throw new Error('This browser does not run WebGPU, so this piece is showing a still.');
   const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'}).catch(()=>null);
   if(!adapter)throw new Error('WebGPU is switched off here, so this piece is showing a still.');
   device=await adapter.requestDevice();format=navigator.gpu.getPreferredCanvasFormat();
   device.addEventListener('uncapturederror',e=>console.error('[gpu]',e.error.message));
   device.lost.then(info=>{if(info.reason==='destroyed')return;pieces.forEach(p=>{p.state='lost';p.stage.classList.remove('is-live');note(p.stage,'The graphics device was lost. Reload to restart this piece.');});});
   return device;
  })();
  return booting;
 }
 const load=id=>defined[id]?Promise.resolve(defined[id]):new Promise((resolve,reject)=>{waiting[id]=resolve;const s=document.createElement('script');s.src=`assets/gpu/${id}.js`;s.onerror=()=>reject(new Error('This piece could not load.'));document.head.append(s);});

 // Each stage: a poster in the HTML, a canvas that takes over once the first frame is drawn.
 const pieces=stages.map(stage=>({stage,id:stage.dataset.gpu,rest:Number(stage.dataset.rest||60),canvas:stage.querySelector('canvas'),state:'idle',t:0,frames:0,rested:false,nudge:0,ratio:0}));
 function fit(p){
  const c=p.canvas,cap=Math.min(p.inst?.maxDpr??2,phone()?1.5:2),d=Math.min(devicePixelRatio||1,cap);
  const w=Math.max(2,Math.round(c.clientWidth*d)),h=Math.max(2,Math.round(c.clientHeight*d));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;Object.assign(p.ctx,{w,h,aspect:w/h});p.inst?.resize?.(w,h);p.rested=false;}
 }
 function pointer(p){
  const c=p.canvas,pt={x:.5,y:.5,dx:0,dy:0,down:false,active:false,type:'mouse'};
  const move=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(pt.active){pt.dx+=x-pt.x;pt.dy+=y-pt.y;}Object.assign(pt,{x,y,active:true,type:e.pointerType});p.rested=false;p.nudge=30;};
  c.addEventListener('pointermove',move);c.addEventListener('pointerdown',e=>{move(e);pt.down=true;});
  addEventListener('pointerup',()=>{pt.down=false;});c.addEventListener('pointerleave',()=>{pt.active=false;pt.down=false;});c.addEventListener('pointercancel',()=>{pt.active=false;pt.down=false;});
  return pt;
 }
 async function start(p){
  if(p.state!=='idle')return;p.state='loading';
  try{
   const [init]=await Promise.all([load(p.id),boot()]);
   const gctx=p.canvas.getContext('webgpu');gctx.configure({device,format,alphaMode:'opaque'});
   p.ctx={id:p.id,stage:p.stage,canvas:p.canvas,pointer:pointer(p),w:2,h:2,aspect:1,get phone(){return phone();},view:()=>gctx.getCurrentTexture().createView(),poke(){p.rested=false;p.nudge=2;}};
   device.pushErrorScope('validation');
   p.inst=await init(p.ctx);
   const err=await device.popErrorScope();if(err)throw new Error(err.message);
   fit(p);p.state='ready';
  }catch(e){p.state='error';console.warn(`[${p.id}]`,e);note(p.stage,e.message.startsWith('This')||e.message.startsWith('WebGPU')?e.message:'This piece could not start here, so it is showing a still.');}
 }
 function run(p,dt){p.t+=dt;const enc=device.createCommandEncoder();p.inst.frame(p.t,dt,enc,p.ctx);device.queue.submit([enc.finish()]);p.ctx.pointer.dx=0;p.ctx.pointer.dy=0;p.frames++;if(p.frames===2)p.stage.classList.add('is-live');}
 // On a phone only the most visible piece draws.
 const leader=()=>pieces.filter(q=>q.state==='ready'&&q.ratio>0).sort((a,b)=>b.ratio-a.ratio)[0];
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pieces.forEach(p=>p.inst?.idle?.());});
 const near=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)start(pieces.find(p=>p.stage===e.target));}),{rootMargin:'600px 0px'});
 const shown=new IntersectionObserver(es=>es.forEach(e=>{const p=pieces.find(q=>q.stage===e.target);if(p)p.ratio=e.isIntersecting?e.intersectionRatio:0;}),{threshold:[0,.25,.5,.75,1]});
 pieces.forEach(p=>{
  near.observe(p.stage);shown.observe(p.stage);
  M.register(p.stage,{
   frame(dt,time,calm){
    if(p.state!=='ready')return;
    if(phone()&&leader()!==p)return;
    fit(p);
    if(!calm){run(p,dt);return;}
    if(p.rested)return;
    const n=p.frames<p.rest?p.rest-p.frames:1;for(let k=0;k<n;k++)run(p,1/60);
    if(p.nudge>0)p.nudge--;else p.rested=true;
   },
   visible(on){if(!on)p.inst?.idle?.();},
   calm(){p.rested=false;},
  });
 });
 // For the poster capture script: draw one more frame and read it back in the same task.
 G.snap=(id,q=.9)=>{const p=pieces.find(k=>k.id===id);if(!p||p.state!=='ready')return null;fit(p);run(p,1/60);return p.canvas.toDataURL('image/jpeg',q);};
 G.state=id=>pieces.find(k=>k.id===id)?.state;
 G.frames=id=>pieces.find(k=>k.id===id)?.frames??0;
})();
