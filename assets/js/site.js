/* ============================================================
   KWI CAPITAL / KUROIWA — Shared site JS
   ============================================================ */

/* ---- Nav: solidify on scroll + mobile burger ---- */
(function(){
  const nav = document.querySelector('.nav');
  if(nav){
    const onScroll = ()=>{ nav.classList.toggle('solid', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
    const burger = nav.querySelector('.burger');
    const links = nav.querySelector('.nav-links');
    if(burger && links){
      burger.addEventListener('click', ()=> links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> links.classList.remove('open')));
    }
  }
})();

/* ---- Reveal on scroll ---- */
(function(){
  const els = document.querySelectorAll('.rv');
  if(!('IntersectionObserver' in window) || !els.length){ els.forEach(e=>e.classList.add('in')); return; }
  const io = new IntersectionObserver((ents)=>{
    ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
  },{threshold:.12});
  els.forEach(e=>io.observe(e));
})();

/* ============================================================
   STUDIES DATA — merges published data/studies.json with
   locally created drafts (localStorage), newest first.
   ============================================================ */
const KWI = {
  STORE_KEY: 'kwi_studies',

  // Fallback seed so the site also renders when opened via file://
  seed: [],

  async load(){
    let published = [];
    try{
      const res = await fetch('data/studies.json', {cache:'no-store'});
      if(res.ok) published = await res.json();
    }catch(e){ published = this.seed; }
    let local = [];
    try{ local = JSON.parse(localStorage.getItem(this.STORE_KEY) || '[]'); }catch(e){}
    // merge: local overrides published on same id
    const map = new Map();
    published.forEach(s=> map.set(s.id, s));
    local.forEach(s=> map.set(s.id, s));
    const all = [...map.values()].filter(s=> s && s.title && !s._deleted);
    all.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    return all;
  },

  fmtDate(iso){
    if(!iso) return '';
    const [y,m,d] = iso.split('-');
    const months = ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];
    return `${parseInt(d,10)}. ${months[parseInt(m,10)-1]} ${y}`;
  },

  esc(s){ return (s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
};

/* ---- Render study cards into a grid + optional filters ---- */
async function renderStudies(gridSel, filtersSel, limit){
  const grid = document.querySelector(gridSel);
  if(!grid) return;
  const all = await KWI.load();
  const cats = ['Alle', ...Array.from(new Set(all.map(s=>s.category).filter(Boolean)))];
  let active = 'Alle';

  const filtersEl = filtersSel ? document.querySelector(filtersSel) : null;
  if(filtersEl){
    filtersEl.innerHTML = cats.map(c=>`<button class="chip${c==='Alle'?' active':''}" data-cat="${KWI.esc(c)}">${KWI.esc(c)}</button>`).join('');
    filtersEl.addEventListener('click', e=>{
      const b = e.target.closest('.chip'); if(!b) return;
      active = b.dataset.cat;
      filtersEl.querySelectorAll('.chip').forEach(x=>x.classList.toggle('active', x===b));
      paint();
    });
  }

  function card(s){
    return `<a class="scard rv" href="study.html?id=${encodeURIComponent(s.id)}">
      <span class="cat">${KWI.esc(s.category||'Studie')}</span>
      <div class="st-title">${KWI.esc(s.title)}</div>
      <p class="sum">${KWI.esc(s.summary||'')}</p>
      <div class="meta">
        <span>${KWI.fmtDate(s.date)}${s.readingTime? ' · '+KWI.esc(s.readingTime):''}</span>
        <span class="read">Lesen <span class="arw">→</span></span>
      </div>
    </a>`;
  }
  function paint(){
    let list = active==='Alle' ? all : all.filter(s=>s.category===active);
    if(limit) list = list.slice(0, limit);
    grid.innerHTML = list.length
      ? list.map(card).join('')
      : `<div class="empty">Noch keine Case Studies veröffentlicht. Lege im <a href="admin.html" style="color:var(--red)">Members</a> die erste an.</div>`;
    // trigger reveal
    grid.querySelectorAll('.rv').forEach((e,i)=> setTimeout(()=>e.classList.add('in'), 60*i));
  }
  paint();
}

/* ---- Render a single study on study.html ---- */
async function renderStudy(){
  const el = document.querySelector('#article'); if(!el) return;
  const id = new URLSearchParams(location.search).get('id');
  const all = await KWI.load();
  const s = all.find(x=>x.id===id);
  if(!s){ el.innerHTML = `<p class="eyebrow">404</p><h1>Studie nicht gefunden</h1><a class="backlink" href="studien.html">← Zurück zu den Studien</a>`; return; }
  document.title = `${s.title} — Kuroiwa · KWI Capital`;
  el.innerHTML = `
    <p class="eyebrow cat">${KWI.esc(s.category||'Studie')}</p>
    <h1>${KWI.esc(s.title)}</h1>
    <div class="amETA">
      <span>${KWI.fmtDate(s.date)}</span>
      ${s.author? `<span>${KWI.esc(s.author)}</span>`:''}
      ${s.readingTime? `<span>${KWI.esc(s.readingTime)}</span>`:''}
      ${s.pdf? `<a href="${KWI.esc(s.pdf)}" style="color:var(--red)">PDF ↓</a>`:''}
    </div>
    ${s.cover? `<img class="cover" src="${KWI.esc(s.cover)}" alt="">`:''}
    <div class="body">${s.body||('<p>'+KWI.esc(s.summary||'')+'</p>')}</div>
    <a class="backlink" href="studien.html">← Alle Studien</a>`;
}
