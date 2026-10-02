/* Letters that grow: Gray-Scott reaction-diffusion confined to the word "capra".
   The feed and kill rates inside the letters choose the pattern: maze, loops or spots. */
(()=>{'use strict';
 const G=window.CapraGPU;
 G.define('grow',async ctx=>{
  const W=ctx.phone?384:640,H=ctx.phone?216:360,patterns=[{f:.029,k:.057},{f:.04,k:.0625},{f:.0545,k:.062}];
  await document.fonts?.load('900 160px "Red Hat Display"').catch(()=>{});
  const mask=G.canvasTex(W,H,(x,w,h)=>{
   x.fillStyle='#000';x.fillRect(0,0,w,h);
   let size=h*.66;x.font=`900 ${size}px "Red Hat Display", system-ui, sans-serif`;
   const mw=x.measureText('capra').width;if(mw>w*.84){size*=w*.84/mw;x.font=`900 ${size}px "Red Hat Display", system-ui, sans-serif`;}
   x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.fillText('capra',w/2,h*.47);
  });
  const sim=G.pair(W,H,'rgba16float');
  const step=G.fs('grow-step',G.NOISE+/* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var mask: texture_2d<f32>;
@group(0) @binding(2) var<uniform> u: U;
fn at(p: vec2i) -> vec2f { let s = vec2i(textureDimensions(src)); return textureLoad(src, clamp(p, vec2i(0), s - 1), 0).xy; }
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let p = vec2i(i.pos.xy);
  let m = textureLoad(mask, p, 0).r;
  if (u.c.x > 0.5) {
    let r = hash21(floor(vec2f(p) / 3.0) + u.a.x);
    return vec4f(1.0, select(0.0, 1.0, r > 0.93 && m > 0.5), 0.0, 1.0);
  }
  let c = at(p);
  let lap = (at(p + vec2i(1, 0)) + at(p - vec2i(1, 0)) + at(p + vec2i(0, 1)) + at(p - vec2i(0, 1))) * 0.2
          + (at(p + vec2i(1, 1)) + at(p - vec2i(1, 1)) + at(p + vec2i(1, -1)) + at(p + vec2i(-1, 1))) * 0.05 - c;
  let f = mix(0.016, u.c.y, m); let k = mix(0.07, u.c.z, m);
  let rr = c.x * c.y * c.y;
  let a = c.x + (lap.x - rr + f * (1.0 - c.x));
  var b = c.y + (0.5 * lap.y + rr - (k + f) * c.y);
  let asp = vec2f(u.a.z, 1.0);
  b += u.b.z * smoothstep(0.035, 0.0, distance(i.uv * asp, u.b.xy * asp)) * 0.4;
  return vec4f(clamp(a, 0.0, 1.0), clamp(b, 0.0, 1.0), 0.0, 1.0);
}`,['rgba16float']);
  const show=G.fs('grow-show',/* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var mask: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let e = 1.0 / vec2f(textureDimensions(src));
  let b = textureSample(src, smp, i.uv).y;
  let bx = textureSample(src, smp, i.uv + vec2f(e.x, 0.0)).y - textureSample(src, smp, i.uv - vec2f(e.x, 0.0)).y;
  let by = textureSample(src, smp, i.uv + vec2f(0.0, e.y)).y - textureSample(src, smp, i.uv - vec2f(0.0, e.y)).y;
  let m = textureSample(mask, smp, i.uv).r;
  let n = normalize(vec3f(-bx * 7.0, -by * 7.0, 1.0));
  let lit = dot(n, normalize(vec3f(-0.5, -0.65, 0.55)));
  let v = smoothstep(0.1, 0.3, b);
  let bg = vec3f(0.043, 0.04, 0.07) + m * vec3f(0.028, 0.028, 0.036);
  let lo = vec3f(0.10, 0.84, 0.81); let hi = vec3f(0.71, 1.0, 0.23);
  var col = mix(bg, mix(lo, hi, smoothstep(0.22, 0.45, b)), v);
  col += (lit - 0.55) * 0.5 * v;
  return vec4f(col, 1.0);
}`,[G.format]);
  const ub=G.ubo(),U=new Float32Array(16),smp=G.sampler();
  const bgStep=[0,1].map(i=>G.bind(step,[sim.t[i],mask,ub])),bgShow=[0,1].map(i=>G.bind(show,[sim.t[i],mask,smp]));
  const piece=ctx.stage.closest('.gpu-piece'),chips=[...(piece?.querySelectorAll('[data-pattern]')||[])];
  let pattern=0,reset=true,age=0,chosen=false;
  const set=i=>{pattern=i;reset=true;age=0;chips.forEach(c=>c.setAttribute('aria-pressed',String(Number(c.dataset.pattern)===i)));ctx.poke();};
  chips.forEach(c=>c.addEventListener('click',()=>{chosen=true;set(Number(c.dataset.pattern));}));
  piece?.querySelector('[data-regrow]')?.addEventListener('click',()=>{reset=true;age=0;ctx.poke();});
  set(0);
  return {
   frame(t,dt,enc){
    age+=dt;
    if(!chosen&&age>18&&!window.CapraMotion.calm)set((pattern+1)%patterns.length);
    const p=ctx.pointer,o=patterns[pattern];
    U.set([t,dt,W/H,0,p.x,p.y,p.active?1:0,0,0,o.f,o.k,0]);
    if(reset){U[8]=1;G.write(ub,U);G.draw(enc,step,bgStep[sim.i],sim.write.createView());sim.swap();reset=false;}
    else{G.write(ub,U);const n=ctx.phone?10:16;for(let s=0;s<n;s++){G.draw(enc,step,bgStep[sim.i],sim.write.createView());sim.swap();}}
    G.draw(enc,show,bgShow[sim.i],ctx.view());
   },
  };
 });
})();
