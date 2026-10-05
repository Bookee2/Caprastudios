/* Capra pond: five glowing koi are the only lights; they steer around the stones and the unicorn
 * mark, which cast the shadows.
 * Radiance cascades over a jump-flood distance field, raw WebGPU, no libraries.
 * Without WebGPU (or with JavaScript off) the static mark stays in place. */
(()=>{'use strict';
const canvas=document.querySelector('#pond'),still=document.querySelector('#still'),stage=document.querySelector('#stage'),controls=document.querySelector('#controls'),hint=document.querySelector('#hint'),pause=document.querySelector('#pause'),pulse=document.querySelector('#pulse'),status=document.querySelector('#status');
if(!canvas||!stage)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),phone=matchMedia('(max-width:700px)').matches;
// Four stones as (x, y, radius) in stage units, clear of the mark and with room for a koi to pass the edge.
const stones=[[.17,.25,.05],[.21,.8,.066],[.82,.2,.06],[.84,.76,.046]];
// The approved vector mark (assets/brand/mark.svg, viewBox 400×540).
const mark=['M96 511C155 449 172 406 130 364C105 341 57 323 33 293C6 259 19 202 44 161C71 116 122 91 177 83L205 106C155 110 122 128 100 158C67 201 60 244 85 271C108 295 154 307 194 334C251 372 260 411 216 453C184 483 136 500 96 511Z','M96 511C160 491 214 456 225 416C233 388 219 358 194 334C244 367 261 405 232 438C202 474 152 498 96 511Z','M221 110L364 20L247 145L229 127Z','M198 80C196 107 205 125 228 143L286 191C316 215 321 237 305 255C294 267 277 269 265 258C290 263 302 242 279 223C262 210 237 207 217 200C188 190 165 173 162 151C180 172 208 183 235 186C251 190 266 196 279 205L222 148C197 126 180 106 174 85Z','M174 85C159 61 168 43 184 48C207 52 224 76 222 99L204 120C194 103 202 85 190 68C184 58 178 65 174 85Z'];
// Each koi's light, per palette: Black light, Koi, Solar, Arctic; and how hard each makes the paint fluoresce.
const fluoresce=[1,.22,.22,.22];
const palettes=[
 [[.36,.08,1],[.5,.14,1],[.26,.1,.95],[.6,.2,1],[.42,.05,.9]],
 [[1,.36,.1],[1,.95,.85],[1,.7,.2],[.2,.85,.9],[1,.25,.3]],
 [[1,.85,.4],[1,.45,.3],[.94,.22,.55],[1,.6,.1],[1,.93,.8]],
 [[.68,.98,1],[.1,.84,.81],[.32,.49,1],[.85,1,1],[.6,.45,1]]
];
let device,format,gctx,raf=0,last=0,time=0,paused=false,visible=true,lost=false,live=false,palette=1,burst=-20,lamp=0,lampOn=false,lx=.5,ly=.5,W=0,H=0,res=null;
// Under black light the pond wears its Black light palette; in daylight, Koi. Flipping the lamp resets it.
function lightPalette(){palette=document.documentElement.classList.contains('bl')?0:1;document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.palette)===palette)));}
lightPalette();addEventListener('capra:light',()=>{lightPalette();if(live&&koi)draw();});
const stop=()=>{cancelAnimationFrame(raf);raf=0;last=0;};
function fallback(message){lost=true;stop();canvas.hidden=true;still.hidden=false;controls.hidden=true;stage.classList.remove('pond-live');hint.textContent=message;}

const VS=/* wgsl */`
struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f }
@vertex fn vs(@builtin(vertex_index) i: u32) -> VO {
    var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    var o: VO;
    o.pos = vec4f(p[i], 0.0, 1.0);
    o.uv = p[i] * vec2f(0.5, -0.5) + 0.5;
    return o;
}
struct U { a: vec4f, b: vec4f, c: vec4f, d: vec4f }
`;
const NOISE=/* wgsl */`
fn hash21(p: vec2f) -> f32 {
    var q = fract(p * vec2f(123.34, 456.21));
    q += dot(q, q + 45.32);
    return fract(q.x * q.y);
}
fn vnoise(p: vec2f) -> f32 {
    let i = floor(p); let f = fract(p);
    let w = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2f(1.0, 0.0)), w.x),
               mix(hash21(i + vec2f(0.0, 1.0)), hash21(i + vec2f(1.0, 1.0)), w.x), w.y);
}
fn fbm(p0: vec2f) -> f32 {
    var p = p0; var a = 0.5; var s = 0.0;
    for (var i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2f(17.0, 9.0); a *= 0.5; }
    return s;
}
`;
// Shared by the simulation and the final pass, so the koi are drawn from the same maths at any size.
// a = (time, flare, aspect, sim width), b = (lantern x, y, strength, sim height), fish = (x, y, heading).
const KOI=/* wgsl */`
struct S { a: vec4f, b: vec4f, cols: array<vec4f, 5>, fish: array<vec4f, 5> }
fn fishD(p: vec2f, c: vec2f, dir: vec2f, len: f32, wig: f32) -> f32 {
    // a tapered capsule from head to tail, with the tail swinging
    let side = vec2f(-dir.y, dir.x);
    let a = c + dir * len * 0.5; let b = c - dir * len * 0.5 + side * wig;
    let pa = p - a; let ba = b - a;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - mix(len * 0.2, len * 0.05, h);
}
// nearest koi: x = signed distance, y = which one
fn koi(p: vec2f) -> vec2f {
    var best = vec2f(1e3, 0.0);
    for (var k = 0; k < 5; k++) {
        let f = f32(k);
        let len = 0.085 + 0.02 * fract(f * 0.53);
        let d = fishD(p, u.fish[k].xy, u.fish[k].zw, len, sin(u.a.x * 5.0 + f * 2.0) * len * 0.25);
        if (d < best.x) { best = vec2f(d, f); }
    }
    return best;
}
fn glow(k: f32) -> vec3f { return u.cols[i32(k)].rgb * 5.0 * (1.0 + u.a.y); }
const LANTERN = vec3f(0.75, 0.9, 1.0) * 6.0;
`;
const SCENE=/* wgsl */`
@group(0) @binding(0) var mask: texture_2d<f32>;
@group(0) @binding(1) var<uniform> u: S;
@fragment fn fs(i: VO) -> @location(0) vec4f {
    let p = vec2f(i.uv.x * u.a.z, i.uv.y);
    var em = vec3f(0.0); var solid = 0.0;
    // the mark and four stones block light and give none
    if (textureLoad(mask, vec2i(i.pos.xy), 0).r > 0.5) { solid = 1.0; }
    // five koi carry the light
    let k = koi(p);
    if (k.x < 0.0) { em = glow(k.y); solid = 1.0; }
    // and a lantern follows the pointer
    if (u.b.z > 0.01 && distance(p, vec2f(u.b.x * u.a.z, u.b.y)) < 0.022) { em = LANTERN * u.b.z; solid = 1.0; }
    return vec4f(em, solid);
}`;
const SEED=/* wgsl */`
@group(0) @binding(0) var scene: texture_2d<f32>;
@fragment fn fs(i: VO) -> @location(0) vec4f {
    let p = vec2i(i.pos.xy);
    return select(vec4f(-1e4), vec4f(vec2f(p), 0.0, 0.0), textureLoad(scene, p, 0).a > 0.5);
}`;
const FLOOD=/* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var<uniform> u: U;
@fragment fn fs(i: VO) -> @location(0) vec4f {
    let p = vec2i(i.pos.xy); let pf = vec2f(p);
    let s = vec2i(textureDimensions(src)); let st = i32(u.a.x);
    var best = vec4f(-1e4); var bd = 1e20;
    for (var y = -1; y <= 1; y++) { for (var x = -1; x <= 1; x++) {
        let q = p + vec2i(x, y) * st;
        if (q.x < 0 || q.y < 0 || q.x >= s.x || q.y >= s.y) { continue; }
        let c = textureLoad(src, q, 0);
        if (c.x > -1e3) { let d = dot(c.xy - pf, c.xy - pf); if (d < bd) { bd = d; best = c; } }
    } }
    return best;
}`;
const DIST=/* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@fragment fn fs(i: VO) -> @location(0) vec4f {
    let p = vec2i(i.pos.xy);
    let c = textureLoad(src, p, 0);
    return vec4f(select(1e3, distance(c.xy, vec2f(p)), c.x > -1e3), 0.0, 0.0, 1.0);
}`;
/* One cascade: each texel is one ray of one probe. Tiles across the texture are directions;
   inside a tile, position. A ray that hits nothing borrows the answer from the cascade above. */
const CASCADE=/* wgsl */`
@group(0) @binding(0) var scene: texture_2d<f32>;
@group(0) @binding(1) var dist: texture_2d<f32>;
@group(0) @binding(2) var upper: texture_2d<f32>;
@group(0) @binding(3) var smp: sampler;
@group(0) @binding(4) var<uniform> u: U;
@fragment fn fs(i: VO) -> @location(0) vec4f {
    let res = u.b.xy; let d = u.a.x; let tile = res / d;
    let px = floor(i.pos.xy);
    let tl = floor(px / tile); let pc = px - tl * tile;
    let r = tl.x + tl.y * d;
    let ang = (r + 0.5) / (d * d) * 6.2831853;
    let dir = vec2f(cos(ang), sin(ang));
    let origin = (pc + 0.5) * d;
    var tt = u.a.y; var rad = vec4f(0.0);
    for (var k = 0; k < 28; k++) {
        let p = origin + dir * tt;
        if (p.x < 0.0 || p.y < 0.0 || p.x >= res.x || p.y >= res.y) { break; }
        let ds = textureSampleLevel(dist, smp, p / res, 0.0).r;
        if (ds < 0.8) { rad = vec4f(textureSampleLevel(scene, smp, p / res, 0.0).rgb, 1.0); break; }
        tt += ds;
        if (tt >= u.a.z) { break; }
    }
    if (rad.a < 0.5 && u.a.w < 0.5) {
        let d2 = d * 2.0; let tile2 = res / d2;
        let pp = clamp(origin / d2, vec2f(0.5), tile2 - 0.5);
        var acc = vec3f(0.0);
        for (var j = 0; j < 4; j++) {
            let k2 = r * 4.0 + f32(j);
            let t2 = vec2f(k2 % d2, floor(k2 / d2));
            acc += textureSampleLevel(upper, smp, (t2 * tile2 + pp) / res, 0.0).rgb;
        }
        rad = vec4f(acc * 0.25, 0.0);
    }
    return rad;
}`;
const SHOW=/* wgsl */`
@group(0) @binding(0) var c0: texture_2d<f32>;
@group(0) @binding(1) var mask: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
@group(0) @binding(3) var<uniform> u: S;
@fragment fn fs(i: VO) -> @location(0) vec4f {
    let res = vec2f(u.a.w, u.b.w); let tile = res / 2.0;
    let pp = clamp(i.uv * tile, vec2f(0.5), tile - 0.5);
    var fl = vec3f(0.0);
    for (var j = 0; j < 4; j++) {
        fl += textureSampleLevel(c0, smp, (vec2f(f32(j % 2), f32(j / 2)) * tile + pp) / res, 0.0).rgb;
    }
    fl *= 0.25;
    let m = textureSampleLevel(mask, smp, i.uv, 0.0);
    // pond floor: pebbles that only exist where light reaches them
    let q = vec2f(i.uv.x * u.a.z, i.uv.y);
    let peb = 0.7 + 0.5 * (fbm(q * 34.0) - 0.5) + 0.25 * (fbm(q * 9.0 + 4.0) - 0.5);
    // one ring of taps around the pixel serves the slabs' bevel and the paint's soft overspray
    var slope = vec2f(0.0); var cover = 0.0; var mist = 0.0;
    for (var j = 0; j < 8; j++) {
        let a = f32(j) * 0.7853982; let dir = vec2f(cos(a), sin(a));
        let v = textureSampleLevel(mask, smp, i.uv + dir * vec2f(0.009 / u.a.z, 0.009), 0.0);
        slope += dir * v.r; cover += v.r; mist += v.b;
    }
    cover *= 0.125; mist *= 0.125;
    // Graffiti on the floor: a fat dark outline, then the fill in a neon fade, laid on a touch unevenly.
    let fog = fbm(q * 23.0 + 7.0);
    let fill = smoothstep(0.62, 0.85, m.b) * (0.84 + 0.16 * fog);
    let line = smoothstep(0.2, 0.42, m.b) * (1.0 - smoothstep(0.62, 0.85, m.b));
    let across = clamp((i.uv.x - 0.19) / 0.56, 0.0, 1.0); let down = clamp((q.y - 0.04) / 0.13, 0.0, 1.0);
    let neon = mix(mix(vec3f(0.55, 1.0, 0.1), vec3f(0.05, 1.0, 0.85), across), mix(vec3f(1.0, 0.95, 0.1), vec3f(1.0, 0.15, 0.75), across), down);
    var bed = vec3f(0.3, 0.38, 0.4) * peb;
    bed = mix(mix(bed, vec3f(0.015), line * 0.92), neon * 0.8, fill);
    // 2D light falls off slowly; weighting by brightness makes each pool of light read
    let lum = dot(fl, vec3f(0.3, 0.5, 0.2));
    var col = bed * fl * (0.6 + 3.2 * lum) + vec3f(0.01, 0.013, 0.022);
    // The paint is glow-in-the-dark: a faint charge of its own always, and under black light
    // (cols[0].a) it fluoresces in its own colour wherever the lamps reach, with a soft bloom.
    let charge = 0.1 + u.cols[0].a * (0.35 + min((fl.r + fl.g + fl.b) * 1.6, 2.4));
    col += neon * charge * (fill + 0.3 * mist * (1.0 - line));
    // Stones and the mark are cast slabs standing proud of the floor: a bevelled edge from the
    // blurred mask, a poured-concrete surface, and light from each koi falling across the top.
    let px = fwidth(q.y);
    let solid = smoothstep(0.35, 0.65, m.r);
    // the floor darkens where a slab stands over it
    col *= 1.0 - 0.55 * cover * (1.0 - solid);
    if (solid > 0.001) {
        let e = 0.003;
        let n0 = fbm(q * 46.0);
        let bump = vec2f(fbm((q + vec2f(e, 0.0)) * 46.0) - n0, fbm((q + vec2f(0.0, e)) * 46.0) - n0) / e;
        let nrm = normalize(vec3f(-slope * 0.9 - bump * 0.02, 1.0));
        // trowel marks, grain, and the small air holes concrete keeps
        let grain = 0.8 + 0.5 * (fbm(q * 7.0 + 31.0) - 0.5) + 0.45 * (n0 - 0.5) + 0.2 * (fbm(q * 210.0) - 0.5);
        let pits = smoothstep(0.7, 0.78, vnoise(q * 130.0)) * 0.4;
        // the mark is pigmented with the site's accent (#7aa2f7); the stones stay raw and dark
        let albedo = mix(vec3f(0.1, 0.11, 0.13), vec3f(0.17, 0.34, 0.95), smoothstep(0.35, 0.65, m.g)) * grain * (1.0 - pits);
        var light = vec3f(0.3);
        for (var k = 0; k < 5; k++) {
            let d = u.fish[k].xy - q;
            let c = u.cols[k].rgb * (1.0 + u.a.y);
            // mostly white, so the pigment reads true under any koi
            light += mix(vec3f(dot(c, vec3f(0.3, 0.5, 0.2))), c, 0.4) * max(dot(nrm, normalize(vec3f(d, 0.1))), 0.0) * 1.5 / (1.0 + dot(d, d) * 14.0);
        }
        let d = vec2f(u.b.x * u.a.z, u.b.y) - q;
        light += vec3f(0.75, 0.9, 1.0) * u.b.z * max(dot(nrm, normalize(vec3f(d, 0.1))), 0.0) * 1.8 / (1.0 + dot(d, d) * 14.0);
        col = mix(col, albedo * light * 1.3, solid);
    }
    // koi and lantern show their own light; their edges come from their own distance, not the grid
    let dark = vec3f(0.02, 0.024, 0.034) + fl * 0.1;
    let k = koi(q);
    col = mix(col, dark + glow(k.y) * 0.5, smoothstep(px, -px, k.x));
    let ld = distance(q, vec2f(u.b.x * u.a.z, u.b.y)) - 0.022;
    col = mix(col, dark + LANTERN * u.b.z * 0.5, smoothstep(px, -px, ld) * step(0.01, u.b.z));
    col = col / (1.0 + col * 0.5);
    return vec4f(pow(col, vec3f(0.4545)), 1.0);
}`;

const NC=phone?4:5;
let pipes,smp,uScene;
const sceneData=new Float32Array(48);
const tex=(w,h,fmt='rgba16float')=>device.createTexture({size:[w,h],format:fmt,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
const ubo=(data,floats=16)=>{const b=device.createBuffer({size:floats*4,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});if(data)device.queue.writeBuffer(b,0,new Float32Array(data));return b;};
const bind=(pipe,entries)=>device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:entries.map((r,i)=>({binding:i,resource:r instanceof GPUBuffer?{buffer:r}:r instanceof GPUTexture?r.createView():r}))});
function pipeline(label,code,target){const module=device.createShaderModule({code:VS+code,label});return device.createRenderPipeline({label,layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format:target}]}});}
function pass(enc,pipe,group,view){const p=enc.beginRenderPass({colorAttachments:[{view,loadOp:'clear',storeOp:'store',clearValue:[0,0,0,0]}]});p.setPipeline(pipe);p.setBindGroup(0,group);p.draw(3);p.end();}

/* The studio's name as a graffiti tag on the floor above the mark, in the blue channel only so it
   blocks nothing: full blue is the fill, half blue the fat outline round it. Drips hang from the
   lowest ink in a few columns, found on a small scratch canvas, and splatter lands around it. */
const WORD='Capra Studios',FACE='"Sedgwick Ave Display","Red Hat Display",cursive';
function tag(x,w,h){
 let size=h*.15;x.font=`${size}px ${FACE}`;size*=Math.min(1,w*.56/x.measureText(WORD).width);x.font=`${size}px ${FACE}`;
 const tw=x.measureText(WORD).width,sw=420,k=sw/(tw*1.1),sh=Math.ceil(size*2*k),sc=document.createElement('canvas');sc.width=sw;sc.height=sh;
 const sx=sc.getContext('2d',{willReadFrequently:true});sx.font=`${size*k}px ${FACE}`;sx.textAlign='center';sx.textBaseline='middle';sx.fillText(WORD,sw/2,sh/2);
 const ink=sx.getImageData(0,0,sw,sh).data,drips=[];
 [.07,.2,.31,.46,.58,.73,.88].forEach((f,i)=>{const c=Math.round(sw*(.05+.9*f));for(let y=sh-1;y>=0;y--)if(ink[(y*sw+c)*4+3]>128){drips.push([(c-sw/2)/k,(y-sh/2)/k-size*.04,size*(.22+.5*((i*.618+.3)%1))]);break;}});
 const dots=Array.from({length:16},(_,i)=>{const a=(i*.618+.11)%1,b=(i*.381+.47)%1;return [(a-.5)*tw*1.12,(b<.5?-1:1)*size*(.42+.5*Math.abs(b-.5)),size*(.018+.035*((i*.29)%1))];});
 x.save();x.translate(w*.47,h*.12);x.rotate(-.04);x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineCap='round';
 for(const [color,grow] of [['rgb(0,0,128)',size*.07],['#00f',0]]){
  x.strokeStyle=x.fillStyle=color;
  if(grow){x.lineWidth=grow*2;x.strokeText(WORD,0,0);}else x.fillText(WORD,0,0);
  x.lineWidth=size*.055+grow*2;for(const [dx,dy,len] of drips){x.beginPath();x.moveTo(dx,dy);x.lineTo(dx,dy+len);x.stroke();}
  for(const [dx,dy,r] of dots){x.beginPath();x.arc(dx,dy,r+grow*.6,0,Math.PI*2);x.fill();}
 }
 x.restore();
}
// Occluders painted at any size: red marks every solid, green only the mark, blue the floor paint.
function occluders(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});
 x.fillStyle='#000';x.fillRect(0,0,w,h);
 tag(x,w,h);
 x.fillStyle='#f00';for(const [sx,sy,r] of stones){x.beginPath();x.arc(sx*w,sy*h,r*h,0,Math.PI*2);x.fill();}
 const s=Math.min(h*.68/540,w*.62/400);x.translate(w/2-191.5*s,h/2-265.5*s);x.scale(s,s);x.fillStyle='#ff0';for(const d of mark)x.fill(new Path2D(d));
 return c;}
function upload(c){const t=tex(c.width,c.height,'rgba8unorm');device.queue.copyExternalImageToTexture({source:c},{texture:t},[c.width,c.height]);return t;}

/* The koi swim on the CPU so they can steer: a coarse signed distance field of the same occluders
   (plus the pond's edge) tells each one how close the nearest solid is and which way is clear. */
let asp=1,field=null,koi=null,swim=0;
function makeField(){
 const gh=160,gw=Math.max(8,Math.round(gh*asp)),data=occluders(gw,gh).getContext('2d').getImageData(0,0,gw,gh).data,n=gw*gh;
 const out=new Float32Array(n),inn=new Float32Array(n);
 for(let i=0;i<n;i++){const solid=data[i*4]>127;out[i]=solid?0:1e6;inn[i]=solid?1e6:0;}
 for(const d of [out,inn]){
  const relax=(i,x,y,dx,dy,c)=>{const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<gw&&yy<gh){const v=d[yy*gw+xx]+c;if(v<d[i])d[i]=v;}};
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x;relax(i,x,y,-1,0,1);relax(i,x,y,0,-1,1);relax(i,x,y,-1,-1,1.414);relax(i,x,y,1,-1,1.414);}
  for(let y=gh-1;y>=0;y--)for(let x=gw-1;x>=0;x--){const i=y*gw+x;relax(i,x,y,1,0,1);relax(i,x,y,0,1,1);relax(i,x,y,1,1,1.414);relax(i,x,y,-1,1,1.414);}
 }
 for(let i=0;i<n;i++)out[i]=(out[i]-inn[i])/gh;
 field={gw,gh,d:out};
}
// Distance from (x, y) to the nearest stone or the mark, in stage heights.
function solidD(x,y){
 const {gw,gh,d}=field,fx=Math.max(0,Math.min(gw-1.001,x/asp*gw-.5)),fy=Math.max(0,Math.min(gh-1.001,y*gh-.5)),ix=fx|0,iy=fy|0,tx=fx-ix,ty=fy-iy,i=iy*gw+ix;
 return (d[i]*(1-tx)+d[i+1]*tx)*(1-ty)+(d[i+gw]*(1-tx)+d[i+gw+1]*tx)*ty;
}
// The same, counting the pond's edge as solid.
const clearance=(x,y)=>Math.min(solidD(x,y),x,asp-x,y,1-y);
function away(x,y){const e=.012,gx=clearance(x+e,y)-clearance(x-e,y),gy=clearance(x,y+e)-clearance(x,y-e),l=Math.hypot(gx,gy)||1;return [gx/l,gy/l];}
function placeKoi(){
 koi=[];let th=.6;
 for(let k=0;k<5;k++){let x,y,tries=0;do{th+=.83;const r=.3+.05*(tries%4);x=asp/2+Math.cos(th)*r*Math.min(asp,1.2);y=.5+Math.sin(th)*r;}while(clearance(x,y)<.1&&++tries<60);
  koi.push({x,y,px:x,py:y,clock:0,escape:0,a:th+Math.PI/2,side:k%2?1:-1,speed:.085+.012*k});}
 for(let i=0;i<500;i++)swimStep(1/30);
}
// Every hazard within reach pushes with a weight that grows as it nears. Summing them gives one
// direction to open water, so a koi in a corner turns out of it instead of trading one wall for the other.
const REACH=.17;
function swimStep(dt){
 swim+=dt;
 koi.forEach((f,k)=>{
  let dx=Math.cos(f.a),dy=Math.sin(f.a),ax=0,ay=0,near=0;
  const push=(d,nx,ny)=>{if(d>=REACH)return;const w=(1-Math.max(d,0)/REACH)**2;ax+=nx*w;ay+=ny*w;if(w>near)near=w;};
  // feel the water at the body and a little ahead
  for(const o of [0,.1]){const px=f.x+dx*o,py=f.y+dy*o,e=.012;
   let gx=solidD(px+e,py)-solidD(px-e,py),gy=solidD(px,py+e)-solidD(px,py-e);const l=Math.hypot(gx,gy)||1;
   push(solidD(px,py),gx/l,gy/l);push(px,1,0);push(asp-px,-1,0);push(py,0,1);push(1-py,0,-1);}
  for(const o of koi)if(o!==f){const vx=f.x-o.x,vy=f.y-o.y,l=Math.hypot(vx,vy)||1e-3;push(l-.07,vx/l,vy/l);}
  // a slow wander; kept gentle, or at this pace a koi would circle on the spot
  let turn=.2*Math.sin(swim*.53+k*2.1)+.14*Math.sin(swim*.29+k*5.3);
  // Aim between straight on and the way to open water, so hazards on both sides cancel and a
  // koi holds its line down a channel. Square on to a hazard, it breaks to its own side.
  if(near>0){const l=Math.hypot(ax,ay)||1,sq=(dx*ax+dy*ay)/l<-.8?f.side*near*1.5:0,ex=dx+ax*2.2-dy*sq,ey=dy+ay*2.2+dx*sq;
   turn+=Math.atan2(dx*ey-dy*ex,dx*ex+dy*ey)*4;}
  // Wedged somewhere with no way through: turn hard to that side for a moment and swim out.
  if((f.clock+=dt)>1.5){if(Math.hypot(f.x-f.px,f.y-f.py)<.03)f.escape=1.2;f.clock=0;f.px=f.x;f.py=f.y;}
  if(f.escape>0){f.escape-=dt;turn=f.side*3;}
  f.a+=Math.max(-3.5,Math.min(3.5,turn))*dt;dx=Math.cos(f.a);dy=Math.sin(f.a);
  const v=f.speed*(1-.5*near)*dt;f.x+=dx*v;f.y+=dy*v;
  // never inside a solid: head, body and tail each keep their own margin
  for(const [o,m] of [[.05,.03],[0,.035],[-.05,.03]]){const px=f.x+dx*o,py=f.y+dy*o,c=clearance(px,py);if(c<m){const n=away(px,py);f.x+=n[0]*(m-c);f.y+=n[1]*(m-c);}}
 });
}

// Everything that depends on size. Cascade tiles need both simulation sides divisible by 32;
// the final pass reads the occluders at the canvas's own size so every edge stays clean.
function build(w,h){
 if(res)for(const t of res.textures)t.destroy();
 W=w;H=h;const before=asp;asp=W/H;makeField();
 if(koi)for(const f of koi)f.x*=asp/before;else placeKoi();
 const limit=Math.min(4096,device.limits.maxTextureDimension2D),fit=Math.min(1,limit/Math.max(canvas.width,canvas.height));
 const mask=upload(occluders(W,H)),fine=upload(occluders(Math.round(canvas.width*fit),Math.round(canvas.height*fit)));
 const scene=tex(W,H),seeds=[tex(W,H),tex(W,H)],dist=tex(W,H),casc=Array.from({length:NC},()=>tex(W,H));
 const steps=[];for(let st=1<<Math.floor(Math.log2(Math.max(W,H)/2));st>=1;st>>=1)steps.push(st);
 // interval lengths grow four times per cascade so the top one reaches across the frame
 const L0=Math.hypot(W,H)*3/(4**NC-1);
 res={textures:[mask,fine,scene,...seeds,dist,...casc],scene,seeds,dist,casc,size:canvas.width+'x'+canvas.height,
  bScene:bind(pipes.scene,[mask,uScene]),bSeed:bind(pipes.seed,[scene]),
  bFlood:steps.map(st=>{const b=ubo([st]);return seeds.map(t=>bind(pipes.flood,[t,b]));}),
  bDist:seeds.map(t=>bind(pipes.dist,[t])),
  bCasc:casc.map((t,k)=>bind(pipes.cascade,[scene,dist,casc[k===NC-1?k-1:k+1],smp,ubo([2**(k+1),L0*(4**k-1)/3,L0*(4**(k+1)-1)/3,k===NC-1?1:0,W,H])])),
  bShow:bind(pipes.show,[casc[0],fine,smp,uScene])};
}
function draw(){if(lost||!res)return;
 const age=time-burst,flare=age>=0&&age<4?Math.exp(-age*1.6)*1.6:0;
 sceneData.set([time,flare,asp,W,lx,ly,lamp,H]);palettes[palette].forEach((c,k)=>sceneData.set(c,8+k*4));sceneData[11]=fluoresce[palette];
 koi.forEach((f,k)=>sceneData.set([f.x,f.y,Math.cos(f.a),Math.sin(f.a)],28+k*4));
 device.queue.writeBuffer(uScene,0,sceneData);
 const enc=device.createCommandEncoder();let i=0;
 pass(enc,pipes.scene,res.bScene,res.scene.createView());
 pass(enc,pipes.seed,res.bSeed,res.seeds[1-i].createView());i=1-i;
 for(const groups of res.bFlood){pass(enc,pipes.flood,groups[i],res.seeds[1-i].createView());i=1-i;}
 pass(enc,pipes.dist,res.bDist[i],res.dist.createView());
 for(let k=NC-1;k>=0;k--)pass(enc,pipes.cascade,res.bCasc[k],res.casc[k].createView());
 pass(enc,pipes.show,res.bShow,gctx.getCurrentTexture().createView());
 device.queue.submit([enc.finish()]);
}
// The koi are placed on the first resize with a visible stage, so there is nothing to step until then.
function tick(ts){raf=0;if(lost||paused||reduced.matches||!visible||document.hidden||!koi){last=0;return;}const dt=last?Math.min((ts-last)/1000,.05):0;last=ts;time+=dt;swimStep(dt);lamp+=((lampOn&&clearance(lx*asp,ly)>.03?1:0)-lamp)*Math.min(dt*6,1);draw();raf=requestAnimationFrame(tick);}
function wake(){if(!raf&&live&&!lost&&!paused&&!reduced.matches&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
// Desktop draws the final pass on a 4K-class canvas (long side 2160 px or the display's own density,
// whichever is larger); the light itself is solved on a 1024-wide grid, which is all its soft shapes need.
function resize(){if(lost||!live)return;const r=stage.getBoundingClientRect();if(r.width<2||r.height<2)return;
 const dpr=devicePixelRatio||1,long=Math.max(r.width,r.height),scale=phone?Math.min(dpr,2):Math.min(Math.max(dpr,2160/long),3840/long);
 canvas.width=Math.round(r.width*scale);canvas.height=Math.round(r.height*scale);
 const w=phone?640:1024,h=Math.max(256,Math.min(1024,Math.round(w*r.height/r.width/32)*32));if(w!==W||h!==H||res.size!==canvas.width+'x'+canvas.height)build(w,h);draw();wake();}
function preference(){stop();pause.hidden=reduced.matches;pulse.hidden=reduced.matches;lampOn=false;lamp=0;hint.textContent=reduced.matches?'Reduced motion · still water':matchMedia('(pointer:coarse)').matches?'Tap the pond to send light.':'Move the lantern.';status.textContent=reduced.matches?'Reduced motion: select a palette for a still composition.':'Select a palette to change the light.';draw();wake();}

async function start(){
 if(!navigator.gpu){hint.textContent='Static signature · WebGPU unavailable';return;}
 let adapter=null;try{adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});}catch{}
 if(!adapter){hint.textContent='Static signature · WebGPU unavailable';return;}
 device=await adapter.requestDevice();format=navigator.gpu.getPreferredCanvasFormat();
 device.lost.then(info=>{if(info.reason!=='destroyed')fallback('Static signature · reload to restore motion');});
 // the tag is set in a graffiti handstyle face; a fallback face is fine if it is slow
 try{await Promise.race([document.fonts.load('40px "Sedgwick Ave Display"'),new Promise(r=>setTimeout(r,1500))]);}catch{}
 device.pushErrorScope('validation');
 gctx=canvas.getContext('webgpu');gctx.configure({device,format,alphaMode:'opaque'});
 pipes={scene:pipeline('pond-scene',KOI+SCENE,'rgba16float'),seed:pipeline('pond-seed',SEED,'rgba16float'),flood:pipeline('pond-flood',FLOOD,'rgba16float'),dist:pipeline('pond-dist',DIST,'rgba16float'),cascade:pipeline('pond-cascade',CASCADE,'rgba16float'),show:pipeline('pond-show',NOISE+KOI+SHOW,format)};
 smp=device.createSampler({magFilter:'linear',minFilter:'linear',addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge'});
 uScene=ubo(null,48);
 live=true;canvas.hidden=false;still.hidden=true;controls.hidden=false;stage.classList.add('pond-live');resize();
 const error=await device.popErrorScope();if(error)throw Error(error.message);
 for(const button of document.querySelectorAll('[data-palette]'))button.addEventListener('click',()=>{palette=Number(button.dataset.palette);document.querySelectorAll('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));status.textContent=`${button.textContent.trim()} lighting${reduced.matches||paused?' · still composition':''}.`;if(!raf)draw();});
 pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';pause.setAttribute('aria-pressed',String(paused));pulse.disabled=paused;if(paused)stop();else wake();status.textContent=paused?'Motion paused. You can still explore the palettes.':'Motion resumed.';});
 pulse.addEventListener('click',()=>{if(paused||reduced.matches)return;burst=time;status.textContent='The koi flare and light the whole pond.';wake();});
 const move=e=>{if(paused||reduced.matches)return;const r=canvas.getBoundingClientRect();lx=(e.clientX-r.left)/r.width;ly=(e.clientY-r.top)/r.height;lampOn=true;};
 canvas.addEventListener('pointermove',move);
 canvas.addEventListener('pointerdown',e=>{move(e);if(!paused&&!reduced.matches){burst=time;wake();}});
 for(const type of ['pointerleave','pointercancel'])canvas.addEventListener(type,()=>{lampOn=false;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else wake();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else stop();}).observe(stage);
 new ResizeObserver(resize).observe(stage);reduced.addEventListener('change',preference);
 preference();
}
start().catch(e=>{fallback('The static signature is available.');console.error('Capra pond:',e);});
})();
