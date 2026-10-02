/* One film, three printers: the Capra unicorn film run live through a 1-bit ordered dither, a two-ink halftone
   and ASCII from a glyph atlas. Motion off shows the finished frame from the poster instead of the film. */
(()=>{'use strict';
 const G=window.CapraGPU;
 G.define('print',async ctx=>{
  const SW=ctx.phone?480:960,SH=ctx.phone?270:540;
  const film=Object.assign(document.createElement('video'),{muted:true,loop:true,playsInline:true,preload:'auto',src:'assets/motion/capra-unicorn-1080p.mp4'});
  film.setAttribute('aria-hidden','true');
  const poster=await G.image('assets/motion/capra-unicorn-poster.jpg');
  const frameCanvas=document.createElement('canvas');frameCanvas.width=SW;frameCanvas.height=SH;
  const frame2d=frameCanvas.getContext('2d'),sceneT=G.tex(SW,SH,'rgba8unorm');
  const glyphs=' .:-=+*#%@';
  await document.fonts?.load('500 40px "Red Hat Mono"').catch(()=>{});
  const atlas=G.canvasTex(32*glyphs.length,48,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='500 40px "Red Hat Mono", ui-monospace, Menlo, monospace';x.textAlign='center';x.textBaseline='middle';[...glyphs].forEach((g,k)=>x.fillText(g,k*32+16,25));});
  const post=G.fs('print-post',/* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var atlas: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
@group(0) @binding(3) var<uniform> u: U;
fn b2(a: vec2f) -> f32 { let f = floor(a); return fract(f.x / 2.0 + f.y * f.y * 0.75); }
fn b4(a: vec2f) -> f32 { return b2(0.5 * a) * 0.25 + b2(a); }
fn b8(a: vec2f) -> f32 { return b4(0.5 * a) * 0.25 + b2(a); }
fn S(uv: vec2f) -> vec3f { return textureSampleLevel(src, smp, uv, 0.0).rgb; }
fn lum(c: vec3f) -> f32 { return clamp(pow(dot(c, vec3f(0.3, 0.55, 0.25)), 0.8) * 1.35, 0.0, 1.0); }
// A second ink reads how blue-violet the film is, so the two screens separate the ribbon's two faces.
fn violet(c: vec3f) -> f32 { return clamp((c.b - c.g * 0.6) * 2.2, 0.0, 1.0); }
fn dots(px: vec2f, res: vec2f, ang: f32, cell: f32, ch: i32) -> f32 {
  let ca = cos(ang); let sa = sin(ang);
  let r = vec2f(px.x * ca - px.y * sa, px.x * sa + px.y * ca) / cell;
  let c = (floor(r) + 0.5) * cell;
  let back = vec2f(c.x * ca + c.y * sa, -c.x * sa + c.y * ca);
  let s = S(back / res);
  let v = select(violet(s), lum(s), ch == 0);
  let rad = sqrt(clamp(v, 0.0, 1.0)) * 0.72;
  return smoothstep(rad + 0.08, rad - 0.08, length(fract(r) - 0.5));
}
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let res = u.b.xy; let px = i.pos.xy; let k = u.b.z;
  let mode = i32(u.c.x);
  var col = vec3f(0.0);
  if (mode == 0) {
    col = S(i.uv);
  } else if (mode == 1) {
    let cell = 3.0 * k; let c = floor(px / cell);
    let v = lum(S((c + 0.5) * cell / res));
    col = mix(vec3f(0.082, 0.078, 0.11), vec3f(0.71, 1.0, 0.23), step(b8(c) * 0.98 + 0.01, v));
  } else if (mode == 2) {
    let paper = vec3f(0.953, 0.945, 0.918);
    let a = dots(px, res, 0.26, 7.0 * k, 0);
    let b = dots(px + vec2f(1.5 * k, 0.0), res, 1.31, 7.0 * k, 1);
    col = paper * mix(vec3f(1.0), vec3f(0.10, 0.62, 0.66), a * 0.92) * mix(vec3f(1.0), vec3f(0.94, 0.22, 0.55), b * 0.85);
  } else {
    let cell = vec2f(9.0, 14.0) * k; let c = floor(px / cell);
    let v = lum(S((c + 0.5) * cell / res));
    let gi = min(floor(pow(v, 0.8) * 10.0), 9.0); let f = fract(px / cell);
    let g = textureSampleLevel(atlas, smp, vec2f((gi + f.x) / 10.0, f.y), 0.0).r;
    col = vec3f(0.045, 0.045, 0.075) + mix(vec3f(0.71, 1.0, 0.23), vec3f(1.0, 0.82, 0.25), v) * g * (0.45 + 0.75 * v);
  }
  return vec4f(col, 1.0);
}`,[G.format]);
  const ub=G.ubo(),U=new Float32Array(16),bg=G.bind(post,[sceneT,atlas,G.sampler(),ub]);
  const piece=ctx.stage.closest('.gpu-piece'),chips=[...(piece?.querySelectorAll('[data-print]')||[])];
  let mode=1,auto=true,clock=0;
  const set=m=>{mode=m;chips.forEach(c=>c.setAttribute('aria-pressed',String(Number(c.dataset.print)===m)));ctx.poke();};
  chips.forEach(c=>c.addEventListener('click',()=>{auto=false;set(Number(c.dataset.print));}));
  set(1);
  // The film plays only while the piece draws; the poster stands in under calm or before the first frame.
  const live=()=>!window.CapraMotion.calm&&film.readyState>=2;
  const cover=(src,w,h)=>{const s=Math.max(SW/w,SH/h);frame2d.drawImage(src,(SW-w*s)/2,(SH-h*s)/2,w*s,h*s);};
  return {
   idle(){film.pause();},
   frame(t,dt,enc){
    const calm=window.CapraMotion.calm;
    if(calm){if(!film.paused)film.pause();}else if(film.paused)film.play().catch(()=>{});
    clock+=dt;if(auto&&!calm&&clock>3.6){clock=0;set(mode%3+1);}
    if(live())cover(film,film.videoWidth,film.videoHeight);else cover(poster,poster.naturalWidth,poster.naturalHeight);
    G.device.queue.copyExternalImageToTexture({source:frameCanvas},{texture:sceneT},[SW,SH]);
    const k=Math.max(1,ctx.w/ctx.canvas.clientWidth);
    U.set([t,0,0,0,ctx.w,ctx.h,k,0,mode,0,0,0]);G.write(ub,U);
    G.draw(enc,post,bg,ctx.view());
   },
  };
 });
})();
