/* Liquid metal: the ribbon unicorn as a raymarched signed-distance shape, with mercury drops that orbit and fuse.
   The mark's 2D distance field is computed here from assets/brand/mark.svg, so no baked asset ships. */
(()=>{'use strict';
 const G=window.CapraGPU;
 // Exact Euclidean distance transform (Felzenszwalb and Huttenlocher), in squared pixels.
 function edt(grid,w,h){
  const n=Math.max(w,h),f=new Float64Array(n),d=new Float64Array(n),v=new Int32Array(n),z=new Float64Array(n+1);
  const pass=len=>{let k=0;v[0]=0;z[0]=-1e20;z[1]=1e20;for(let q=1;q<len;q++){let s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);while(s<=z[k]){k--;s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);}k++;v[k]=q;z[k]=s;z[k+1]=1e20;}k=0;for(let q=0;q<len;q++){while(z[k+1]<q)k++;d[q]=(q-v[k])*(q-v[k])+f[v[k]];}};
  for(let x=0;x<w;x++){for(let y=0;y<h;y++)f[y]=grid[y*w+x];pass(h);for(let y=0;y<h;y++)grid[y*w+x]=d[y];}
  for(let y=0;y<h;y++){for(let x=0;x<w;x++)f[x]=grid[y*w+x];pass(w);for(let x=0;x<w;x++)grid[y*w+x]=d[x];}
  return grid;
 }
 const FW=512,FH=650,PAD=40;
 async function markField(){
  const img=await G.image('assets/brand/mark.svg'),c=document.createElement('canvas');c.width=FW;c.height=FH;
  const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,PAD,PAD,FW-PAD*2,FH-PAD*2);
  const a=x.getImageData(0,0,FW,FH).data,inside=new Float64Array(FW*FH),outside=new Float64Array(FW*FH);
  for(let i=0;i<FW*FH;i++){const on=a[i*4+3]>127;inside[i]=on?1e20:0;outside[i]=on?0:1e20;}
  edt(outside,FW,FH);edt(inside,FW,FH);
  // Full float precision: an 8-bit field leaves visible terraces on the bevel. Distances are in field pixels.
  const sd=new Float32Array(FW*FH);
  for(let i=0;i<FW*FH;i++)sd[i]=Math.min(PAD,Math.sqrt(outside[i]))-Math.min(PAD,Math.sqrt(inside[i]));
  // Two light box blurs round off the pixel stair-steps, so normals on the bevel stay smooth.
  const tmp=new Float32Array(FW*FH);
  for(let pass=0;pass<2;pass++){
   for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const i=y*FW+x;tmp[i]=(sd[i-(x>0)]+sd[i]+sd[i+(x<FW-1)])/3;}
   for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const i=y*FW+x;sd[i]=(tmp[i-(y>0)*FW]+tmp[i]+tmp[i+(y<FH-1)*FW])/3;}
  }
  const t=G.tex(FW,FH,'r32float',GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST);
  G.device.queue.writeTexture({texture:t},sd,{bytesPerRow:FW*4},[FW,FH]);return t;
 }
 G.define('metal',async ctx=>{
  const field=await markField(),half=[1.3*FW/FH,1.3],px=2.6/FH;
  const pipe=G.fs('metal',/* wgsl */`
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var field: texture_2d<f32>;
const BOX = vec2f(${half[0].toFixed(5)}, ${half[1].toFixed(5)});
const PX = ${px.toFixed(6)};
const RANGE = ${(PAD*px).toFixed(5)};
fn smin(a: f32, b: f32, k: f32) -> f32 { let h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
// r32float is not filterable everywhere, so the field is read with a hand-written bilinear lookup.
fn fieldAt(uv: vec2f) -> f32 {
  let size = vec2f(textureDimensions(field));
  let f = clamp(uv, vec2f(0.0), vec2f(1.0)) * size - 0.5;
  let i = vec2i(floor(f)); let w = fract(f); let m = vec2i(size) - 1;
  let a = textureLoad(field, clamp(i, vec2i(0), m), 0).r;
  let b = textureLoad(field, clamp(i + vec2i(1, 0), vec2i(0), m), 0).r;
  let c = textureLoad(field, clamp(i + vec2i(0, 1), vec2i(0), m), 0).r;
  let d = textureLoad(field, clamp(i + vec2i(1, 1), vec2i(0), m), 0).r;
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}
fn mark2(p: vec2f) -> f32 {
  let uv = vec2f(p.x / BOX.x, -p.y / BOX.y) * 0.5 + 0.5;
  let d = fieldAt(uv) * PX;
  let q = abs(p) - BOX;
  let box = length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0);
  return max(d, box + RANGE);
}
fn badge(p0: vec3f) -> f32 {
  let c = cos(u.a.w); let s = sin(u.a.w);
  let p = vec3f(c * p0.x + s * p0.z, p0.y, -s * p0.x + c * p0.z);
  let w = vec2f(mark2(p.xy) + 0.05, abs(p.z) - 0.07);
  return min(max(w.x, w.y), 0.0) + length(max(w, vec2f(0.0))) - 0.05;
}
fn drops(p: vec3f, T: f32) -> f32 {
  var d = 1e9;
  for (var i = 0; i < 5; i++) {
    let f = f32(i);
    let a = T * (0.32 + f * 0.05) + f * 1.26;
    let c = vec3f(cos(a) * (1.25 + 0.3 * sin(T * 0.27 + f)), sin(a * 1.3 + f) * 1.0, sin(a) * 0.6);
    d = smin(d, length(p - c) - (0.1 + 0.05 * sin(f * 2.7 + T * 0.6)), 0.2);
  }
  if (u.b.w > 0.0) { d = smin(d, length(p - u.b.xyz) - u.b.w, 0.3); }
  return d;
}
fn map(p: vec3f) -> f32 { return smin(badge(p), drops(p, u.a.x), 0.22); }
fn normal(p: vec3f) -> vec3f {
  let e = vec2f(1.0, -1.0) * 0.004;
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
fn march(ro: vec3f, rd: vec3f, steps: i32) -> f32 {
  // Skip rays that miss the bounding sphere entirely.
  let b = dot(ro, rd); let disc = b * b - dot(ro, ro) + 4.6;
  if (disc < 0.0) { return -1.0; }
  var t = max(-b - sqrt(disc), 0.0);
  for (var i = 0; i < steps; i++) {
    let d = map(ro + rd * t);
    if (d < 0.0015) { return t; }
    t += d * 0.85;
    if (t > 9.0) { break; }
  }
  return -1.0;
}
fn env(rd: vec3f) -> vec3f {
  var c = mix(vec3f(0.04, 0.04, 0.055), vec3f(0.27, 0.27, 0.31), smoothstep(-0.6, 0.9, rd.y));
  c += vec3f(0.92, 0.94, 1.0) * smoothstep(0.35, 0.65, rd.y) * smoothstep(0.85, 0.15, abs(rd.x + 0.15)) * 2.6;
  c += vec3f(0.9, 0.95, 1.0) * smoothstep(0.2, 0.0, abs(rd.y + 0.05)) * smoothstep(0.35, 0.85, rd.x) * 1.5;
  c += vec3f(1.0, 0.36, 0.10) * pow(max(dot(rd, normalize(vec3f(-0.9, 0.15, 0.35))), 0.0), 3.0) * 1.7;
  c += vec3f(0.71, 1.0, 0.23) * pow(max(dot(rd, normalize(vec3f(0.85, -0.35, 0.4))), 0.0), 3.0) * 1.2;
  return c;
}
@fragment fn fs(i: VO) -> @location(0) vec4f {
  let q = vec2f((i.uv.x - 0.5) * u.a.z, 0.5 - i.uv.y);
  let ro = vec3f(0.0, 0.0, 3.9);
  let rd = normalize(vec3f(q, -1.25));
  let r2 = dot(q, q);
  var col = vec3f(0.043, 0.04, 0.07) + vec3f(0.16, 0.15, 0.2) * exp(-r2 * 5.0) * 0.5;
  let t = march(ro, rd, 72);
  if (t > 0.0) {
    let p = ro + rd * t; let n = normal(p); let r = reflect(rd, n);
    let ndv = max(dot(n, -rd), 0.0); let fr = pow(1.0 - ndv, 4.0);
    let film = 0.5 + 0.5 * cos(6.2832 * (ndv * 1.3 + vec3f(0.0, 0.33, 0.67)) + u.a.x * 0.2);
    let base = mix(vec3f(0.9, 0.9, 0.92), film, 0.1);
    col = env(r) * mix(base, vec3f(1.0), fr);
    let t2 = march(p + n * 0.02, r, 36);
    if (t2 > 0.0) { let p2 = p + n * 0.02 + r * t2; col = mix(col, env(reflect(r, normal(p2))) * base * 0.75, 0.7); }
  }
  col = col / (1.0 + col * 0.55);
  return vec4f(pow(col, vec3f(0.85)), 1.0);
}`,[G.format]);
  const ub=G.ubo(),U=new Float32Array(16),bg=G.bind(pipe,[ub,field]);
  let pr=0,sway=0;
  return {
   maxDpr:1.25,
   frame(t,dt,enc){
    const p=ctx.pointer,k=(3.9-.3)/1.25;
    pr+=((p.active?.3:0)-pr)*Math.min(dt*5,1);
    sway+=((p.active?(p.x-.5)*.6:.2*Math.sin(t*.32))-sway)*Math.min(dt*2.5,1);
    U.set([t,dt,ctx.aspect,sway,(p.x-.5)*ctx.aspect*k,(.5-p.y)*k,.3,pr]);
    G.write(ub,U);G.draw(enc,pipe,bg,ctx.view());
   },
  };
 });
})();
