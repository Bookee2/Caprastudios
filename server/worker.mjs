// Cloudflare Worker host for the Ask Capra chat. Deploy from this folder with `npx wrangler deploy`.
// Briefs are not captured here: status reports leads:false, so the dialog offers the visitor's own email draft.
import {answer,validateMessages} from './core.mjs';
export async function handle(req,env,fetchImpl=fetch){
 const pathname=new URL(req.url).pathname;
 const origins=(env.AGENT_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 const origin=req.headers.get('origin');const allowed=Boolean(origin)&&origins.includes(origin);
 const send=(code,data)=>new Response(JSON.stringify(data),{status:code,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin',...(allowed?{'access-control-allow-origin':origin}:{})}});
 if(!pathname.startsWith('/api/agent'))return send(404,{error:'Not found.'});
 if(origin&&!allowed)return send(403,{error:'Origin not allowed.'});
 if(req.method==='OPTIONS'){if(!allowed)return send(403,{error:'Origin required.'});return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST','access-control-allow-headers':'content-type','access-control-max-age':'86400','vary':'Origin'}});}
 if(pathname==='/api/agent/status'&&req.method==='GET')return send(200,{live:Boolean(env.ANTHROPIC_API_KEY),leads:false});
 if(pathname==='/api/agent/lead')return send(503,{error:'Online brief submission is unavailable. Use the email draft instead.'});
 if(pathname!=='/api/agent/chat')return send(404,{error:'Not found.'});
 if(req.method!=='POST')return send(405,{error:'Use POST.'});
 if(!allowed)return send(403,{error:'Origin required.'});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return send(415,{error:'Send JSON.'});
 // Cloudflare sets CF-Connecting-IP itself; a visitor cannot forge it.
 const ip=req.headers.get('cf-connecting-ip')||'unknown';
 for(const [limiter,key] of [[env.CHAT_LIMIT,ip],[env.TOTAL_LIMIT,'all']]){if(limiter&&!(await limiter.limit({key})).success)return send(429,{error:'Please try again shortly, or email info@caprastudios.co.'});}
 let input;try{const text=await req.text();if(text.length>18000)throw Error('Request too large.');input=JSON.parse(text);}catch{return send(400,{error:'Invalid or oversized request.'});}
 if(!input||typeof input!=='object'||Array.isArray(input))return send(400,{error:'Send a JSON object.'});
 let messages;try{messages=validateMessages(input.messages);}catch(e){return send(400,{error:e.message});}
 if(!env.ANTHROPIC_API_KEY)return send(503,{error:'Live AI is not connected. Explore the studio guide or prepare a brief.'});
 try{return send(200,await answer(messages,{apiKey:env.ANTHROPIC_API_KEY,fetchImpl}));}
 catch{return send(502,{error:'The service could not complete this request. Please try again or email info@caprastudios.co.'});}
}
export default {fetch:(req,env)=>handle(req,env)};
