/* Ink in water: a stable-fluids solver (advect, divergence, Jacobi pressure, project) carrying three inks
   from the site palette, which glow on dark water. Two slow brushes circle; the pointer stirs. */
(()=>{'use strict';
 const G=window.CapraGPU;
 G.define('ink',async ctx=>{
  const VW=ctx.phone?192:320,VH=ctx.phone?108:180,DW=ctx.phone?640:1280,DH=ctx.phone?360:720;
  const vel=G.pair(VW,VH,'rgba16float'),prs=G.pair(VW,VH,'rgba16float'),dye=G.pair(DW,DH,'rgba16float'),div=G.tex(VW,VH,'rgba16float');
  const FU=/* wgsl */`struct Sp { pos: vec4f, col: vec4f }
struct FU { a: vec4f, c: vec4f, s: array<Sp, 3> }`;
  const advect=G.fs('ink-advect',FU+/* wgsl */`
@group(0) @binding(0) var vel: texture_2d<f32>;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
@group(0) @binding(3) var<uniform> u: FU;
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let tv = 1.0 / vec2f(textureDimensions(vel));
  let v = textureSample(vel, smp, i.uv).xy;
  var c = textureSample(src, smp, i.uv - u.a.y * v * tv) * u.c.x;
  let asp = vec2f(u.a.z, 1.0);
  for (var k = 0; k < 3; k++) {
    let d = (i.uv - u.s[k].pos.xy) * asp;
    let g = exp(-dot(d, d) / u.s[k].col.w);
    c += select(vec4f(u.s[k].col.rgb, 0.0), vec4f(u.s[k].pos.zw, 0.0, 0.0), u.c.y > 0.5) * g;
  }
  return c;
}`,['rgba16float']);
  const LOAD=/* wgsl */`
fn L(t: texture_2d<f32>, p: vec2i) -> vec4f { return textureLoad(t, clamp(p, vec2i(0), vec2i(textureDimensions(t)) - 1), 0); }`;
  const diverge=G.fs('ink-div',LOAD+/* wgsl */`
@group(0) @binding(0) var vel: texture_2d<f32>;
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let p = vec2i(i.pos.xy);
  let d = 0.5 * (L(vel, p + vec2i(1, 0)).x - L(vel, p - vec2i(1, 0)).x + L(vel, p + vec2i(0, 1)).y - L(vel, p - vec2i(0, 1)).y);
  return vec4f(d, 0.0, 0.0, 1.0);
}`,['rgba16float']);
  const jacobi=G.fs('ink-jacobi',LOAD+/* wgsl */`
@group(0) @binding(0) var prs: texture_2d<f32>;
@group(0) @binding(1) var dvg: texture_2d<f32>;
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let p = vec2i(i.pos.xy);
  let s = L(prs, p + vec2i(1, 0)).x + L(prs, p - vec2i(1, 0)).x + L(prs, p + vec2i(0, 1)).x + L(prs, p - vec2i(0, 1)).x;
  return vec4f((s - L(dvg, p).x) * 0.25, 0.0, 0.0, 1.0);
}`,['rgba16float']);
  const project=G.fs('ink-project',LOAD+/* wgsl */`
@group(0) @binding(0) var prs: texture_2d<f32>;
@group(0) @binding(1) var vel: texture_2d<f32>;
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let p = vec2i(i.pos.xy);
  let g = 0.5 * vec2f(L(prs, p + vec2i(1, 0)).x - L(prs, p - vec2i(1, 0)).x, L(prs, p + vec2i(0, 1)).x - L(prs, p - vec2i(0, 1)).x);
  let s = vec2i(textureDimensions(vel));
  var v = L(vel, p).xy - g;
  if (p.x == 0 || p.x == s.x - 1) { v.x = 0.0; }
  if (p.y == 0 || p.y == s.y - 1) { v.y = 0.0; }
  return vec4f(v, 0.0, 1.0);
}`,['rgba16float']);
  const show=G.fs('ink-show',G.NOISE+/* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var smp: sampler;
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let d = max(textureSample(src, smp, i.uv).rgb, vec3f(0.0));
  // Three inks, the site's cyan, violet and pink, glowing in dark water.
  let ink = d.r * vec3f(0.49, 0.81, 1.0) + d.g * vec3f(0.73, 0.6, 0.97) + d.b * vec3f(0.94, 0.62, 0.87);
  let water = vec3f(0.032, 0.036, 0.062) + fbm(i.pos.xy * 0.004 + 3.0) * vec3f(0.02, 0.02, 0.035);
  var col = water + ink * 1.9;
  col = col / (1.0 + col * 0.32);
  let vig = 1.0 - 0.35 * dot(i.uv - 0.5, i.uv - 0.5);
  return vec4f(col * vig + (hash21(i.pos.xy) - 0.5) * 0.012, 1.0);
}`,[G.format]);
  const smp=G.sampler(),uVel=G.ubo(32),uDye=G.ubo(32);
  const bgAdvVel=[0,1].map(i=>G.bind(advect,[vel.t[i],vel.t[i],smp,uVel]));
  const bgAdvDye=[0,1].map(v=>[0,1].map(d=>G.bind(advect,[vel.t[v],dye.t[d],smp,uDye])));
  const bgDiv=[0,1].map(i=>G.bind(diverge,[vel.t[i]]));
  const bgJac=[0,1].map(i=>G.bind(jacobi,[prs.t[i],div]));
  const bgPrj=[0,1].map(p=>[0,1].map(v=>G.bind(project,[prs.t[p],vel.t[v]])));
  const bgShow=[0,1].map(i=>G.bind(show,[dye.t[i],smp]));
  const pig=[[1,0,0],[0,1,0],[0,0,1]],A=new Float32Array(32),names=['Cyan','Violet','Pink'];
  let pcol=1,wasDown=false,clear=false;
  const piece=ctx.stage.closest('.gpu-piece'),inkButton=piece?.querySelector('[data-ink]'),clearButton=piece?.querySelector('[data-clear]');
  const label=()=>{if(inkButton)inkButton.querySelector('span').textContent=names[pcol];};
  inkButton?.addEventListener('click',()=>{pcol=(pcol+1)%3;label();ctx.poke();});
  clearButton?.addEventListener('click',()=>{clear=true;ctx.poke();});
  label();
  return {
   frame(t,dt,enc){
    const p=ctx.pointer,asp=ctx.aspect;
    if(p.down&&!wasDown){pcol=(pcol+1)%3;label();}
    wasDown=p.down;
    if(clear){[...dye.t,...vel.t,...prs.t].forEach(tex=>G.clear(enc,tex));clear=false;}
    const sp=[];
    for(let k=0;k<2;k++){
     const a=t*(.33+k*.11)+k*3.3,r=.27+.07*Math.sin(t*.5+k);
     const x=.5+Math.cos(a)*r/asp*1.5,y=.5+Math.sin(a*1.3)*r;
     const dx=-Math.sin(a)*(.33+k*.11)*r/asp*1.5,dy=Math.cos(a*1.3)*1.3*(.33+k*.11)*r;
     sp.push({x,y,fx:dx*VW*5,fy:dy*VH*5,col:pig[(k+Math.floor(t/9))%3],amt:.45});
    }
    const spd=Math.hypot(p.dx,p.dy);
    sp.push({x:p.x,y:p.y,fx:p.active?p.dx/dt*VW*.6:0,fy:p.active?p.dy/dt*VH*.6:0,col:pig[pcol],amt:p.active?Math.min(spd*60,1.4):0});
    const fill=(mode,diss,rad)=>{A.set([t,dt,asp,0,diss,mode,0,0]);sp.forEach((s,k)=>A.set([s.x,s.y,s.fx*dt*6,s.fy*dt*6,s.col[0]*s.amt*dt*7,s.col[1]*s.amt*dt*7,s.col[2]*s.amt*dt*7,rad],8+k*8));};
    fill(1,.992,.0016);G.write(uVel,A);
    fill(0,.9965,.0011);G.write(uDye,A);
    G.draw(enc,advect,bgAdvVel[vel.i],vel.write.createView());vel.swap();
    G.draw(enc,diverge,bgDiv[vel.i],div.createView());
    for(let k=0;k<22;k++){G.draw(enc,jacobi,bgJac[prs.i],prs.write.createView());prs.swap();}
    G.draw(enc,project,bgPrj[prs.i][vel.i],vel.write.createView());vel.swap();
    G.draw(enc,advect,bgAdvDye[vel.i][dye.i],dye.write.createView());dye.swap();
    G.draw(enc,show,bgShow[dye.i],ctx.view());
   },
  };
 });
})();
