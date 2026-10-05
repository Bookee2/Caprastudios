import {appendFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {model,validateMessages,answer} from './core.mjs';
export {model,validateMessages,answer};
export function validateLead(input){
 const result={};for(const [key,max] of Object.entries({name:100,email:254,company:160,goal:2000,budget:100,timeline:120})){if(typeof input[key]!=='string'||input[key].length>max)throw Error('Please check the brief fields.');result[key]=input[key].trim();}
 if(!result.name||!result.goal||!/^\S+@\S+\.\S+$/.test(result.email)||input.consent!==true)throw Error('Name, email, project details and permission to follow up are required.');return result;
}
async function body(req){let text='';for await(const chunk of req){text+=chunk.toString();if(Buffer.byteLength(text)>18000)throw Error('Request too large.');}return JSON.parse(text);}
export function createAgentHandler({apiKey=process.env.ANTHROPIC_API_KEY,leadsFile=process.env.LEADS_FILE,origins=[],fetchImpl=fetch,rateLimit=12,totalLimit=120}={}){
 const buckets=new Map();let windowStart=Date.now(),requests=0,inflight=0;
 return async function handler(req,res){
 const pathname=new URL(req.url,'http://localhost').pathname;if(!pathname.startsWith('/api/agent'))return false;
 const origin=req.headers.origin;const allowed=origin&&origins.includes(origin);
 const send=(code,data)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff','vary':'Origin',...(allowed?{'access-control-allow-origin':origin}: {})});res.end(JSON.stringify(data));};
 if(origin&&!allowed){send(403,{error:'Origin not allowed.'});return true;}
 if(req.method==='OPTIONS'){if(!allowed){send(403,{error:'Origin required.'});return true;}res.writeHead(204,{'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST','access-control-allow-headers':'content-type','vary':'Origin'});res.end();return true;}
 if(pathname==='/api/agent/status'&&req.method==='GET'){send(200,{live:Boolean(apiKey),leads:Boolean(leadsFile)});return true;}
 if(!['/api/agent/chat','/api/agent/lead'].includes(pathname)){send(404,{error:'Not found.'});return true;}
 if(req.method!=='POST'){send(405,{error:'Use POST.'});return true;}
 if(!allowed){send(403,{error:'Origin required.'});return true;}
 if(!req.headers['content-type']?.startsWith('application/json')){send(415,{error:'Send JSON.'});return true;}
 const now=Date.now();if(now-windowStart>600000){windowStart=now;requests=0;buckets.clear();}
 // Do not trust visitor-supplied X-Forwarded-For. Add a trusted-proxy adapter at deployment if needed.
 const ip=req.socket.remoteAddress||'unknown',used=buckets.get(ip)||0;
 if(used>=rateLimit||requests>=totalLimit||inflight>=3){send(429,{error:'Please try again shortly, or email info@caprastudios.co.'});return true;}
 buckets.set(ip,used+1);requests++;inflight++;
 try{let input;try{input=await body(req);}catch{send(400,{error:'Invalid or oversized request.'});return true;}
 if(!input||typeof input!=='object'||Array.isArray(input)){send(400,{error:'Send a JSON object.'});return true;}
 if(pathname.endsWith('/lead')){if(!leadsFile){send(503,{error:'Online brief submission is unavailable. Use the email draft instead.'});return true;}
 let lead;try{lead=validateLead(input);}catch(e){send(400,{error:e.message});return true;}
 const id=randomUUID();await mkdir(path.dirname(path.resolve(leadsFile)),{recursive:true,mode:0o700});await appendFile(leadsFile,JSON.stringify({id,createdAt:new Date().toISOString(),...lead,consent:true})+'\n',{mode:0o600});send(201,{id,message:'Your brief has been received. This is an inquiry, not a confirmed booking.'});return true;}
 let messages;try{messages=validateMessages(input.messages);}catch(e){send(400,{error:e.message});return true;}
 if(!apiKey){send(503,{error:'Live AI is not connected. Explore the studio guide or prepare a brief.'});return true;}
 const result=await answer(messages,{apiKey,fetchImpl});send(200,result);
 }catch{send(502,{error:'The service could not complete this request. Please try again or email info@caprastudios.co.'});}finally{inflight--;}
 return true;
 };
}
