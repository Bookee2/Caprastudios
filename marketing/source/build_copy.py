from pathlib import Path
import json,csv,html
R=Path(__file__).resolve().parents[1]
C=json.loads((R/'source/campaigns.json').read_text());rows=[]
links={'Studio':'https://caprastudios.co/','Software':'https://caprastudios.co/work.html','Web':'https://caprastudios.co/motion.html','AI':'https://caprastudios.co/ai-consulting.html','Project':'https://caprastudios.co/work.html'}
for c in C:
 slug,pillar,title,body,im,accent,tag,caption=c
 url=links[pillar]
 if slug=='08-trailgoat' or slug=='12-brand-film':url='https://caprastudios.co/trailgoat.html'
 if slug=='09-purple-squirrel':url='https://caprastudios.co/purple-squirrel.html'
 clean=title.replace('\n',' ')
 variants={
 'Instagram / Facebook':caption+'\n\nExplore the work at caprastudios.co.\n\n#CapraStudios #AtlantaDesign #'+{'Studio':'CreativeStudio','Software':'ProductDesign','Web':'WebDesign','AI':'AIConsulting','Project':'DigitalDesign'}[pillar],
 'LinkedIn':caption+'\n\n'+({'AI':'The starting point is a business problem, a clear scope and a way to measure whether the system is useful.','Software':'The details matter: who uses it, what they need to decide and what should happen next.','Web':'The design and the behavior should tell the same story.','Studio':'Software, web and AI are connected parts of how we make an idea tangible.','Project':'Explore the design, the development and the decisions behind the work.'}[pillar])+'\n\n'+url,
 'X / Threads / Bluesky':clean+' '+body+'\n'+url,
 'Pinterest':clean+' '+caption+' Explore Capra Studios, an Atlanta software, web and AI studio. '+url}
 for channel,copy in variants.items():rows.append({'id':slug,'pillar':pillar,'channel':channel,'headline':clean,'copy':copy,'url':url,'asset':'social/'+slug+'/day/'+('pin.png' if channel=='Pinterest' else 'landscape.png' if channel=='LinkedIn' else 'portrait.png'),'alt_text':clean+' Capra Studios campaign. '+body+' '+('Features a still from Capra’s '+im+' work.' if im else 'Includes the Capra unicorn mark and studio colors.')})
EXTRA=[
('Studio','The next good idea','The next good idea may be a conversation away. Tell us what your business is trying to make possible. We will help shape the next step.'),
('Studio','Direct is a design decision','Working with a small team means talking directly to the people shaping the work. Questions reach the people who can answer them.'),
('Studio','A point of view','A studio identity should feel like the work it makes. Ours has room for clear type, bold color, useful software and a little after-dark experimentation.'),
('Studio','Both sides of the studio','Try the light switch on our site. The same work takes on a different atmosphere. Which side feels more like your next project?'),
('Studio','One useful starting point','A new project does not need to begin with a long feature list. Start with one problem you want to solve and the person it needs to help.'),
('Studio','Made in Atlanta','We are a small team of specialists in Atlanta. Bring us a product idea, a website that needs a new chapter or a workflow worth improving.'),
('Software','Name the next action','A useful screen makes the next action understandable. Before adding another button, ask what decision the person is here to make.'),
('Software','Design the handoff','Good software carries context from one person to the next. A handoff should not require someone to reconstruct the whole story.'),
('Software','Beyond the happy path','Missing information, errors and recovery are part of the product. We design those moments alongside the ideal flow.'),
('Software','The spreadsheet question','If a spreadsheet has become the operating system for a process, it may be time to map what the team actually needs. That map comes before the application.'),
('Software','Make the status visible','Waiting, reviewing, approved, complete: a clear state tells a team where the work is and what can happen next.'),
('Software','Built around people','Custom software is most useful when it reflects the work of the people using it. Roles, context and real decisions should shape the interface.'),
('Web','A reason to move','Before we animate something, we ask what the movement is doing. Guiding attention? Explaining a change? Giving the brand a moment?'),
('Web','The first impression','The opening of a website should establish a point of view and make the next step clear. Good-looking and useful belong in the same brief.'),
('Web','A small interaction','A small response can change how a page feels. Motion can acknowledge an action without taking over the experience.'),
('Web','Keep the story clear','A brand film needs a beginning, a change and a payoff. Even twenty seconds is enough to tell a considered story.'),
('Web','When the motion stops','A website should still make sense when motion is paused. Clear copy and a considered static composition are part of the design.'),
('Web','Depth with purpose','A 3D piece should give an idea something a flat frame cannot: form, atmosphere, perspective or a transformation worth watching.'),
('AI','Define the job','Before building an agent, finish this sentence: When a person asks for this, the system should do that. A clear job makes a better starting point.'),
('AI','Knowledge has owners','A knowledge system needs more than documents. It needs current information, access rules and people responsible for keeping it useful.'),
('AI','Retrieval before response','A RAG system retrieves relevant information and gives it to the model as context. The quality of that retrieval matters to the usefulness of the answer.'),
('AI','A helpful handoff','A support agent should know what details to collect and when a person should take over. The handoff is part of the design.'),
('AI','Permission by design','Connecting an agent to a tool is only one part of the work. Define which actions it may take, which need approval and how exceptions are handled.'),
('AI','A useful pilot','A pilot should answer a decision: is this system useful enough to expand? Agree how you will judge that before building it.'),
('AI','Use the tools you have','An AI project does not automatically mean replacing the tools already in the business. Start by reviewing what can be connected.'),
('AI','Measure the right things','Useful answers, successful handoffs, errors, time and operating cost can all matter. Choose the measures that fit the workflow.'),
('AI','A roadmap, not a shopping list','An operating roadmap connects workflows, people, knowledge and tools. A list of AI products does not do that on its own.'),
('AI','Keep the business in control','As automation expands, responsibilities should stay clear. Build monitoring, approvals and human review into the operating approach.'),
('Project','Course, pace, fuel','TrailGoat brings course planning, pace and fueling together for trail and ultra runners. Explore the product and the brand film on our site.'),
('Project','A moment in staffing','Purple Squirrel is designed around a specific handoff: a recruiter submits a candidate and a client reviews them. That focus shapes the experience.'),
('Project','Twenty seconds of transformation','Our TrailGoat brand film begins with blocks and resolves into a wordmark. Between those points, the identity gets a little life.'),
('Project','A product and its story','For TrailGoat, design, development and motion sit together. The application does the work; the film gives the identity another way to be seen.'),
('Studio','Bring the rough idea','Bring the rough idea. Bring the broken process. Bring the website you have outgrown. A useful first conversation can begin with any of them.'),
('Web','Color can do a job','Color can guide, distinguish and give a brand a voice. On Capra’s site, it changes with the light while the underlying experience stays coherent.'),
('Software','Clarity is a feature','Sometimes the most valuable feature is knowing exactly what is happening and what to do next. That is a worthwhile software brief.'),
('Studio','Let us make it tangible','What are you imagining next? Tell Capra about the thing you want to make or improve. We will help find the right way to build it.')]
for i,(pillar,title,copy) in enumerate(EXTRA):rows.append({'id':f'bonus-{i+1:02d}','pillar':pillar,'channel':'Flexible organic post','headline':title,'copy':copy+'\n\n'+links[pillar],'url':links[pillar],'asset':'profiles/avatar-lime-night.png','alt_text':'Capra Studios unicorn mark.'})
with (R/'copy/post-copy.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=rows[0].keys());w.writeheader();w.writerows(rows)
(R/'copy/post-copy.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
# 30 ordered posting slots; no scheduled publishing or implied dates.
calendar=[]
carousel=json.loads((R/'source/carousels.json').read_text())
ci=0
for slot in range(1,31):
 if slot%5==0:
  c=carousel[ci];ci+=1;calendar.append([slot,'Carousel',c[0].replace('-',' '),'Instagram + LinkedIn','carousels/'+c[0]+'/day', 'Use all six slides in numerical order. Link to the relevant service or project.'])
 else:
  c=C[(slot-1)-(slot-1)//5];theme='night' if slot%2==0 else 'day';calendar.append([slot,c[1],c[2].replace('\n',' '),'LinkedIn + Instagram','social/'+c[0]+'/'+theme,'Choose one platform variant. Use Stories to support the same idea rather than repeating every export.'])
with (R/'copy/30-post-launch-sequence.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['Slot','Pillar','Concept','Primary channels','Asset folder','Publishing note']);w.writerows(calendar)
BIOS={
 'Universal short':'Software. Web. AI. A small team of specialists in Atlanta. Imagination, made tangible. caprastudios.co',
 'Instagram / TikTok':'Imagination. Made tangible.\nSoftware. Web. AI.\nSmall team. Atlanta energy.\nExplore the work below.',
 'LinkedIn headline':'Capra Studios | Software, web, motion and practical AI | Atlanta',
 'LinkedIn about':'Capra Studios is a small team of specialists in Atlanta, led by Kris Brown. We design and build custom software, websites with motion and video graphics, and practical AI systems.\n\nOur work brings together designers, engineers, motion artists and AI builders around the needs of each project. You talk directly to the people doing the work.\n\nSoftware: custom applications built around people, processes and clear handoffs.\nWeb: websites with a point of view, interactive experiences, 3D pieces and brand films.\nAI: chat agents, RAG knowledge systems, customer service and connected business operations.\n\nExplore TrailGoat, Purple Squirrel and the studio’s motion work at caprastudios.co.\nStart a conversation: info@caprastudios.co',
 'YouTube about':'Software, websites that move, and AI that earns its keep. We are Capra Studios, a small team of specialists in Atlanta. Explore our 3D pieces, brand films, interactive experiments and the ideas behind the work.\n\nSee the studio: https://caprastudios.co/\nProjects and inquiries: info@caprastudios.co',
 'Pinterest description':'Capra Studios: software, web design, motion, 3D and practical AI in Atlanta. Explore distinctive digital work, useful design ideas and the studio’s daylight and blacklight identity.',
 'Google Business description':'Capra Studios is a small team of specialists in Atlanta. We design and build custom software, websites with motion and video graphics, and practical AI systems. Services include web applications, interactive websites, 3D brand films, chat agents, RAG knowledge systems, customer service agents and connected business workflows. Led by Kris Brown, the studio brings designers, engineers, motion artists and AI builders together around each project.',
 'Studio boilerplate':'Capra Studios is a small team of specialists in Atlanta, led by Kris Brown. The studio designs and builds software, websites with motion and video graphics, and practical AI systems. Its work includes TrailGoat and Purple Squirrel. Learn more at caprastudios.co.'}
(R/'copy/profile-bios.json').write_text(json.dumps(BIOS,ensure_ascii=False,indent=2))
EMAILS=[
('01-studio-introduction','A new look at Capra Studios','Imagination. Made tangible.','I wanted to share the new Capra Studios site with you. We are a small team of specialists in Atlanta, bringing together software, web, motion and practical AI.\n\nThere are two sides to the site: daylight and blacklight. Try the switch, explore the work, and let me know what catches your eye.','Explore the studio','https://caprastudios.co/'),
('02-software-conversation','A clearer way to get the work done','Make the complicated clear.','If there is a process in your business that depends on too many spreadsheets, messages or handoffs, I would be glad to hear about it.\n\nAt Capra, we start with the people doing the work and the decisions they need to make. Then we shape the software around that.','See our software work','https://caprastudios.co/work.html'),
('03-web-motion','A website with a point of view','Let’s make an impression.','We have been bringing design, development and motion together at Capra Studios. The new site includes interactive pieces, 3D experiments and our TrailGoat brand film.\n\nIf your website is ready for a new chapter, I would enjoy hearing what you have in mind.','Explore web and motion','https://caprastudios.co/motion.html'),
('04-ai-pilot','One useful place to start with AI','Put intelligence to work.','If AI is on your roadmap, a useful place to start is one well-defined workflow.\n\nCapra can help map the opportunity, build a focused pilot and agree how to judge the result. Our work includes chat agents, knowledge systems, customer service and connected operations.','Explore AI consulting','https://caprastudios.co/ai-consulting.html'),
('05-project-story','A product, a goat, and a short film','Built for the long run.','Here is a recent Capra project: TrailGoat, a planning tool for trail and ultra runners. It brings course, pace and fueling into one experience.\n\nWe designed it, built it and made the brand film. The film starts with a pile of blocks and ends with a wordmark, with a goat in between.','See the TrailGoat story','https://caprastudios.co/trailgoat.html'),
('06-follow-up','Your next idea','What are you imagining?','I am following up on the Capra site I shared. If there is a product, website or workflow you have been wanting to improve, I would be happy to talk it through.\n\nEven a rough idea is enough for a useful first conversation.','Start a conversation','mailto:kris@caprastudios.co')]
for name,subject,headline,body,cta,url in EMAILS:
 content=f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(subject)}</title></head><body style="margin:0;padding:24px;background:#e9e6dc;font-family:Arial,sans-serif;color:#15141c"><table role="presentation" style="max-width:620px;width:100%;margin:auto;border-collapse:collapse;background:#f3f1ea"><tr><td style="padding:32px;font-size:23px;font-weight:900;border-bottom:3px solid #15141c">capra studios</td></tr><tr><td style="padding:36px 32px 10px;font-size:42px;font-weight:900;line-height:1.05">{html.escape(headline)}</td></tr><tr><td style="padding:22px 32px;font-size:17px;line-height:1.65">Hello,<br><br>{html.escape(body).replace(chr(10)+chr(10),'<br><br>')}</td></tr><tr><td style="padding:10px 32px 32px"><a href="{url}" style="display:inline-block;background:#b6ff3b;color:#15141c;text-decoration:none;font-size:16px;font-weight:bold;padding:16px 22px">{cta} &rarr;</a></td></tr><tr><td style="padding:28px 32px;border-top:2px solid #15141c;font-size:15px;line-height:1.7"><b>Kris Brown</b><br>Capra Studios<br><a style="color:#15141c" href="mailto:kris@caprastudios.co">kris@caprastudios.co</a><br><a style="color:#15141c" href="tel:+17707573000">770-757-3000</a></td></tr></table></body></html>'''
 (R/'email'/f'{name}.html').write_text(content)
 (R/'email'/f'{name}.txt').write_text('Subject: '+subject+'\n\nHello,\n\n'+body+'\n\n'+cta+': '+url+'\n\nKris Brown\nCapra Studios\nkris@caprastudios.co\n770-757-3000')
# Inline-styled, image-free signatures remain readable when a mail client blocks remote media.
signatures={}
for variant in ['personal-daylight','personal-blacklight','personal-compact','studio']:
 night='blacklight' in variant;compact='compact' in variant;studio=variant=='studio';bg='#0e0b16' if night else '#f3f1ea';fg='#ece9ff' if night else '#15141c';accent='#b6ff3b' if night else '#7a2df5';name='Capra Studios' if studio else 'Kris Brown';email='info@caprastudios.co' if studio else 'kris@caprastudios.co'
 sig=f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:{fg};background:{bg};border-left:5px solid {accent};width:420px;max-width:100%"><tr><td style="padding:18px 22px"><div style="font-size:21px;font-weight:700;line-height:1.3">{name}</div><div style="font-size:13px;line-height:1.8;color:{accent};font-weight:700">'+('Software. Web. AI.' if studio else 'Capra Studios &nbsp; / &nbsp; Software. Web. AI.')+'</div>'
 sig+=f'<div style="font-size:14px;line-height:1.7;margin-top:8px"><a style="color:{fg};text-decoration:none" href="mailto:{email}">{email}</a>'
 if not studio:sig+=f'<br><a style="color:{fg};text-decoration:none" href="tel:+17707573000">770-757-3000</a>'
 sig+=f'<br><a style="color:{fg};font-weight:700;text-decoration:underline" href="https://caprastudios.co/">caprastudios.co</a></div>'
 if not compact:sig+=f'<div style="font-size:13px;line-height:1.6;margin-top:13px">Imagination. Made tangible.</div>'
 sig+='</td></tr></table>';signatures[variant]=sig
 (R/'email'/f'signature-{variant}.html').write_text(sig)
(R/'email/signature-personal.txt').write_text('Kris Brown | Capra Studios\nSoftware. Web. AI.\nkris@caprastudios.co | 770-757-3000\nhttps://caprastudios.co/\nImagination. Made tangible.')
(R/'email/signatures.json').write_text(json.dumps(signatures,indent=2))
print('COPY',len(rows),'caption variants across 60 concepts; 30 slots; 6 email drafts; 4 signatures')
