/* The contact page's brief form. Without this script the page still offers the email link.
 * With it, the form fills an email draft in the visitor's own email app. When the studio's server is set up
 * to receive briefs, a Send button appears and the brief is posted there instead. Nothing is stored in the browser. */
(()=>{'use strict';
 const form=document.querySelector('#contact-form');if(!form)return;
 const send=document.querySelector('#contact-send'),draft=document.querySelector('#contact-draft'),note=document.querySelector('#contact-note'),result=document.querySelector('#contact-result');
 const config=document.querySelector('meta[name="capra-agent-endpoint"]')?.content||'';
 const endpoint=config||(location.hostname==='127.0.0.1'||location.hostname==='localhost'?'/api/agent':'');
 const f=form.elements;let leads=false;

 // A link such as contact.html?for=fund arrives with the right use already chosen.
 const uses={listing:'A listing',fund:'A fund or a portfolio',project:'A planned project'};
 const wanted=uses[new URLSearchParams(location.search).get('for')];
 if(wanted)f.kind.value=wanted;

 function brief(){
  const parcel=f.parcel.value.trim();
  const goal=`[${f.kind.value}] ${f.goal.value.trim()}${parcel?`\nParcel or address: ${parcel}`:''}`;
  return {name:f.name.value.trim(),email:f.email.value.trim(),company:f.company.value.trim(),goal,budget:f.budget.value,timeline:f.timeline.value.trim(),consent:f.consent.checked};
 }
 function mailto(){
  const d=brief();
  const body=`Name: ${d.name}\nEmail: ${d.email}\nBusiness: ${d.company}\n\nProject / goal:\n${d.goal}\n\nBudget: ${d.budget}\nTiming: ${d.timeline}\n\nI agree to be contacted about this project.`;
  return 'mailto:info@caprastudios.co?subject='+encodeURIComponent('Land marketing film brief')+'&body='+encodeURIComponent(body);
 }
 draft.addEventListener('click',e=>{if(!form.reportValidity()){e.preventDefault();return;}draft.href=mailto();});

 (async()=>{
  if(!endpoint)return;
  try{const r=await fetch(endpoint+'/status',{signal:AbortSignal.timeout(5000),credentials:'omit'});if(!r.ok)return;leads=(await r.json()).leads===true;}catch{return;}
  if(!leads)return;
  send.hidden=false;draft.classList.remove('button');draft.classList.add('text-link');draft.textContent='Or open an email draft ↗';
  note.textContent='Your brief is sent only when you press Send. It goes to Kris and nowhere else.';
 })();

 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  if(!leads){location.href=mailto();return;}
  send.disabled=true;result.classList.remove('error');result.textContent='Sending your brief…';
  try{
   const r=await fetch(endpoint+'/lead',{method:'POST',credentials:'omit',headers:{'content-type':'application/json'},body:JSON.stringify(brief()),signal:AbortSignal.timeout(15000)});
   const data=await r.json();if(!r.ok)throw Error(data.error||'The brief could not be sent.');
   result.textContent=data.message||'Sent. Kris will reply by email.';form.reset();
  }catch(err){result.classList.add('error');result.textContent='We could not confirm it arrived. Try again, or use the email draft. '+(err.name==='TimeoutError'?'':err.message);}
  finally{send.disabled=false;}
 });
})();
