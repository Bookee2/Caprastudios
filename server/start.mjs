// Optional standalone API host. Static pages can remain on GitHub Pages.
import {createServer} from 'node:http';
import {createAgentHandler} from './agent.mjs';
try{process.loadEnvFile();}catch(e){if(e.code!=='ENOENT')throw e;}
const origins=(process.env.AGENT_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
if(!origins.length)throw Error('Set AGENT_ALLOWED_ORIGINS to the exact website origin.');
const handler=createAgentHandler({origins});
createServer(async(req,res)=>{if(!await handler(req,res)){res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.AGENT_PORT||8787),process.env.AGENT_HOST||'127.0.0.1',()=>console.log('Capra agent endpoint started.'));
