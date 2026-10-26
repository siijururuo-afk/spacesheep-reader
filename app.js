/* Buildless, offline-readable archive. No external scripts or analytics. */
(() => {
  'use strict';
  const data=window.ARCHIVE, $=s=>document.querySelector(s);
  if(!data){$('#messages').textContent='记录文件加载失败，请确认 data.js 与本页面位于同一目录。';return;}
  const days=[...new Set(data.messages.map(m=>m.date))], names=['日','一','二','三','四','五','六'];
  let mode='zh',size=14,query='',mediaOnly=false;
  const readStore=(k,f)=>{try{return localStorage.getItem(k)||f}catch{return f}};
  const save=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
  mode=readStore('spacesheep-mode','zh');if(!['zh','ko','both'].includes(mode))mode='zh';
  size=Number(readStore('spacesheep-size-v2','14'));if(!Number.isFinite(size))size=14;size=Math.max(12,Math.min(20,size));
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  const safeUrl=s=>{try{let u=new URL(s);return ['http:','https:'].includes(u.protocol)?u:null}catch{return null}};
  const urls=s=>[...new Set((s||'').match(/https?:\/\/[^\s<>"\u201c\u201d]+/g)||[])].map(s=>s.replace(/[),.，。]+$/,'')).filter(s=>safeUrl(s));
  function text(n,s){
    const rx=/https?:\/\/[^\s<>"\u201c\u201d]+/g;let pos=0,match;
    while((match=rx.exec(s||''))){n.append(document.createTextNode(s.slice(pos,match.index)));const a=el('a','',match[0]);a.href=match[0];a.target='_blank';a.rel='noopener noreferrer';n.append(a);pos=rx.lastIndex;}
    n.append(document.createTextNode((s||'').slice(pos)));
  }
  function quote(s){const q=el('blockquote','quote');q.append(el('span','quote-label','引用的消息'));text(q,s);return q}
  function body(s){const b=el('p','body');text(b,s);return b}
  function original(m){const d=el('details','original'),summary=el('summary','','查看韩文原文'),content=el('div','original-content');d.append(summary,content);if(m.quote)content.append(quote(m.quote));if(m.text)content.append(body(m.text));d.open=mode==='both';return d}
  function media(m,container){
    if(m.images.length){const grid=el('div','media-grid');for(const img of m.images){const b=el('button','image-button'),i=el('img');i.src=img.local||img.url;i.alt=`第 ${m.seq} 条消息的图片`;i.loading='lazy';i.decoding='async';i.addEventListener('error',()=>{i.hidden=true;b.append(el('span','image-fallback','图片暂时无法显示，点击打开原图 ↗'))},{once:true});b.append(i);b.addEventListener('click',()=>{const box=$('#lightbox'),full=box.querySelector('img'),a=box.querySelector('a');full.src=i.src;full.alt=i.alt;a.href=img.url;box.showModal()});grid.append(b)}container.append(grid)}
    for(const u of urls([m.text,m.quote].join('\n'))){const parsed=safeUrl(u);if(!parsed)continue;const a=el('a','link-card');a.href=u;a.target='_blank';a.rel='noopener noreferrer';const info=el('div');info.append(el('strong','',parsed.hostname.replace(/^www\./,'')),el('small','',u));a.append(el('span','link-icon','↗'),info,el('span','','↗'));container.append(a);
      let yt;if(['youtube.com','www.youtube.com','m.youtube.com'].includes(parsed.hostname))yt=parsed.searchParams.get('v');if(parsed.hostname==='youtu.be')yt=parsed.pathname.slice(1);if(yt&&/^[\w-]{11}$/.test(yt)){const frame=el('iframe','video');frame.src=`https://www.youtube-nocookie.com/embed/${yt}`;frame.title='聊天消息中的 YouTube 视频';frame.loading='lazy';frame.allowFullscreen=true;container.append(frame)}
      if(/\.(png|jpe?g|webp|gif)(?:$|\?)/i.test(parsed.pathname)){const i=el('img');i.src=u;i.alt='链接中的图片';i.loading='lazy';i.style.maxWidth='100%';container.append(i)}
    }
  }
  function message(m){const a=el('article','message');a.id=`m${m.seq}`;a.dataset.seq=m.seq;
    a.classList.toggle('from-owner',m.isOwner);
    const meta=el('div','message-meta'),speaker=el('span',`speaker${m.isOwner?' owner':''}`,m.speaker),t=el('time','',m.time),id=el('a','message-number',`#${String(m.seq).padStart(4,'0')} ↗`);t.dateTime=m.iso;id.href=`#m${m.seq}`;id.title='这条消息的永久链接';meta.append(speaker,t,id);a.append(meta);
    const bubble=el('div','bubble');a.append(bubble);
    if(mode==='ko'){if(m.quote)bubble.append(quote(m.quote));if(m.text)bubble.append(body(m.text));}
    else{if(m.quote)bubble.append(quote(m.quoteZh));if(m.text)bubble.append(body(m.zh));if(m.text||m.quote)bubble.append(original(m));}
    media(m,bubble);return a;
  }
  function matches(m){return(!mediaOnly||m.images.length||urls(m.text+' '+m.quote).length)&&(!query||[m.text,m.zh,m.quote,m.quoteZh,m.speaker,m.date].join('\n').toLocaleLowerCase().includes(query));}
  function render(){const root=$('#messages');const filtered=data.messages.filter(matches),frag=document.createDocumentFragment();let section,date;
    for(const m of filtered){if(date!==m.date){date=m.date;section=el('section','day-section');section.dataset.day=date;const head=el('div','day-heading');head.id=`day-${date}`;head.append(el('h2','',date.replaceAll('-','.')),el('span','date-description',`星期${names[new Date(date+'T12:00:00').getDay()]}`));section.append(head);frag.append(section)}section.append(message(m))}
    root.replaceChildren(frag);root.classList.toggle('bilingual',mode==='both');$('#empty').hidden=!!filtered.length;
    $('#result').textContent=query||mediaOnly?`找到 ${filtered.length.toLocaleString()} 条消息 · 时间正序`:`全部 ${data.messages.length.toLocaleString()} 条消息 · 从旧到新`;
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    updateActive();
  }
  function updateActive(){const sections=[...document.querySelectorAll('.day-section')];let day=sections[0]?.dataset.day;for(const s of sections){if(s.getBoundingClientRect().top<=180)day=s.dataset.day;else break}document.querySelectorAll('.day-link').forEach(a=>a.classList.toggle('active',a.dataset.day===day));}
  let month;for(const date of days){if(month!==date.slice(0,7)){month=date.slice(0,7);$('#dates').append(el('p','nav-month',`${Number(date.slice(5,7))} 月 / ${date.slice(0,4)}`))}const a=el('a','day-link');a.href=`#day-${date}`;a.dataset.day=date;a.append(el('span','',`${date.slice(5,7)}.${date.slice(8)}`),el('span','weekday',`周${names[new Date(date+'T12:00:00').getDay()]}`),el('span','count',data.messages.filter(m=>m.date===date).length));a.addEventListener('click',()=>{if(query||mediaOnly){query='';mediaOnly=false;$('#search').value='';$('#media-only').checked=false;render()}});$('#dates').append(a)}
  let debounce;$('#search').addEventListener('input',e=>{clearTimeout(debounce);debounce=setTimeout(()=>{query=e.target.value.trim().toLocaleLowerCase();render()},180)});
  $('#media-only').addEventListener('change',e=>{mediaOnly=e.target.checked;render()});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{const visible=[...document.querySelectorAll('.message')].find(x=>x.getBoundingClientRect().bottom>145),seq=visible?.id,offset=visible?.getBoundingClientRect().top;mode=b.dataset.mode;save('spacesheep-mode',mode);render();if(seq){const target=document.getElementById(seq);window.scrollBy({top:target.getBoundingClientRect().top-offset,behavior:'instant'})}}));
  const applySize=()=>{document.documentElement.style.setProperty('--body-size',`${size}px`);$('#smaller').disabled=size<=12;$('#larger').disabled=size>=20;save('spacesheep-size-v2',String(size))};$('#smaller').onclick=()=>{size=Math.max(12,size-1);applySize()};$('#larger').onclick=()=>{size=Math.min(20,size+1);applySize()};
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('#search').focus()}});
  $('#close-lightbox').onclick=()=>$('#lightbox').close();$('#lightbox').addEventListener('click',e=>{if(e.target===$('#lightbox'))$('#lightbox').close()});
  const previous=readStore('spacesheep-position','');
  applySize();render();
  if(/^m\d+$/.test(previous)&&document.getElementById(previous)){$('#resume').hidden=false;$('#resume').href='#'+previous;}
  let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{updateActive();const current=[...document.querySelectorAll('.message')].find(m=>m.getBoundingClientRect().bottom>145);if(current)save('spacesheep-position',current.id)},150)},{passive:true});
  if(location.hash){requestAnimationFrame(()=>document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView())}
})();
