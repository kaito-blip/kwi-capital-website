/* ============================================================
   KUROIWA STUDIO — Back-End zum Erstellen von Studien
   Speichert lokal (localStorage). Publizieren = studies.json
   exportieren und ins Repo (Ordner /data) committen.
   ============================================================ */
const STORE_KEY = 'kwi_studies';
const PASS = 'kuroiwa';           // einfacher Zugangscode (kein echter Schutz)
let studies = [];
let editingId = null;

const $ = s => document.querySelector(s);
const el = id => document.getElementById(id);

/* ---------- Zugang (Member-Gate) ---------- */
function gate(){
  const g = el('gate');
  if(sessionStorage.getItem('kwi_ok')==='1'){ if(g) g.remove(); init(); return; }
  const form = el('gateForm'), code = el('gateCode'), err = el('gateErr');
  setTimeout(()=> code && code.focus(), 120);
  form.addEventListener('submit', e=>{
    e.preventDefault();
    if(code.value.trim() === PASS){
      sessionStorage.setItem('kwi_ok','1');
      g.classList.add('out');
      setTimeout(()=> g.remove(), 650);
      init();
    } else {
      err.classList.add('show'); g.classList.add('shake');
      code.value=''; code.focus();
      setTimeout(()=> g.classList.remove('shake'), 450);
    }
  });
}

/* ---------- Storage ---------- */
function load(){ try{ studies = JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); }catch(e){ studies=[]; } }
function persist(){ localStorage.setItem(STORE_KEY, JSON.stringify(studies)); }

function slugify(s){ return (s||'').toLowerCase()
  .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
  .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70); }

/* ---------- Formular <-> Objekt ---------- */
function readForm(){
  const title = el('f_title').value.trim();
  let id = el('f_id').value.trim() || slugify(title);
  return {
    id,
    title,
    category: el('f_cat').value.trim(),
    date: el('f_date').value,
    author: el('f_author').value.trim(),
    readingTime: el('f_read').value.trim(),
    summary: el('f_summary').value.trim(),
    cover: el('f_cover').value.trim(),
    pdf: el('f_pdf').value.trim(),
    tags: el('f_tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    body: el('f_body').value
  };
}
function fillForm(s){
  el('f_id').value = s.id||''; el('f_title').value=s.title||'';
  el('f_cat').value=s.category||''; el('f_date').value=s.date||'';
  el('f_author').value=s.author||''; el('f_read').value=s.readingTime||'';
  el('f_summary').value=s.summary||''; el('f_cover').value=s.cover||'';
  el('f_pdf').value=s.pdf||''; el('f_tags').value=(s.tags||[]).join(', ');
  el('f_body').value=s.body||'';
  preview();
}
function clearForm(){
  editingId=null;
  ['f_id','f_title','f_cat','f_author','f_read','f_summary','f_cover','f_pdf','f_tags','f_body'].forEach(i=>el(i).value='');
  el('f_date').value = todayISO();
  el('editState').textContent='Neue Studie';
  preview();
}
function todayISO(){ const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; }

/* ---------- CRUD ---------- */
function save(){
  const s = readForm();
  if(!s.title){ toast('Titel fehlt'); return; }
  if(!s.date) s.date = todayISO();
  if(!s.category) s.category='Studie';
  if(!s.readingTime) s.readingTime = estRead(s.body||s.summary);
  const idx = studies.findIndex(x=>x.id=== (editingId||s.id));
  if(idx>=0) studies[idx]=s; else studies.unshift(s);
  editingId = s.id;
  persist(); renderList(); toast('Gespeichert (lokal)');
}
function edit(id){ const s=studies.find(x=>x.id===id); if(!s)return; editingId=id; fillForm(s); el('editState').textContent='Bearbeiten: '+s.title; window.scrollTo({top:0,behavior:'smooth'}); }
function del(id){ if(!confirm('Diese Studie löschen?'))return; studies=studies.filter(x=>x.id!==id); persist(); renderList(); if(editingId===id) clearForm(); }

function estRead(html){ const words=(html||'').replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length; return Math.max(2,Math.round(words/200))+' Min.'; }

/* ---------- Liste ---------- */
function renderList(){
  const box = el('list');
  if(!studies.length){ box.innerHTML='<p class="muted">Noch keine Studien. Erstelle links deine erste.</p>'; el('count').textContent='0'; return; }
  el('count').textContent = studies.length;
  box.innerHTML = studies.map(s=>`
    <div class="row">
      <div>
        <div class="rt">${esc(s.title)}</div>
        <div class="rm">${esc(s.category||'')} · ${esc(s.date||'')}</div>
      </div>
      <div class="ract">
        <button onclick="edit('${s.id}')">Bearbeiten</button>
        <a href="study.html?id=${encodeURIComponent(s.id)}" target="_blank">Vorschau ↗</a>
        <button class="danger" onclick="del('${s.id}')">Löschen</button>
      </div>
    </div>`).join('');
}

/* ---------- Live-Vorschau ---------- */
function preview(){
  const s = readForm();
  el('pv').innerHTML = `
    <p class="pv-cat">${esc(s.category||'Kategorie')}</p>
    <h1>${esc(s.title||'Titel der Studie')}</h1>
    <div class="pv-meta">${esc(fmt(s.date))}${s.author?' · '+esc(s.author):''}${s.readingTime?' · '+esc(s.readingTime):''}</div>
    ${s.cover?`<img src="${esc(s.cover)}" style="width:100%;border-radius:2px;margin:16px 0">`:''}
    ${s.summary?`<p class="pv-sum">${esc(s.summary)}</p>`:''}
    <div class="pv-body">${s.body||''}</div>`;
}

/* ---------- Publizieren: Export / Import ---------- */
function exportJSON(){
  const clean = studies.map(({_deleted,...s})=>s);
  const blob = new Blob([JSON.stringify(clean,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='studies.json'; a.click();
  toast('studies.json heruntergeladen — in /data ablegen & committen');
}
async function importPublished(){
  try{
    const r = await fetch('data/studies.json',{cache:'no-store'});
    if(!r.ok) throw 0;
    const pub = await r.json();
    const map = new Map(studies.map(s=>[s.id,s]));
    pub.forEach(s=>{ if(!map.has(s.id)) studies.push(s); });
    persist(); renderList(); toast('Publizierte Studien geladen');
  }catch(e){ toast('data/studies.json nicht erreichbar (nur online)'); }
}
function importFile(input){
  const f=input.files[0]; if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{ try{ const arr=JSON.parse(rd.result); const map=new Map(studies.map(s=>[s.id,s])); arr.forEach(s=>map.set(s.id,s)); studies=[...map.values()]; persist(); renderList(); toast('Importiert'); }catch(e){ toast('Ungültige JSON-Datei'); } };
  rd.readAsText(f); input.value='';
}

/* ---------- Cover-Upload -> DataURL ---------- */
function coverUpload(input){
  const f=input.files[0]; if(!f)return;
  const rd=new FileReader(); rd.onload=()=>{ el('f_cover').value=rd.result; preview(); toast('Bild eingebettet'); }; rd.readAsDataURL(f); input.value='';
}

/* ---------- Editor-Toolbar ---------- */
function wrap(tag){
  const ta=el('f_body'); const {selectionStart:a,selectionEnd:b,value:v}=ta;
  const sel=v.slice(a,b)||'Text';
  let ins;
  if(tag==='ul') ins=`<ul>\n  <li>${sel}</li>\n</ul>`;
  else if(tag==='link'){ const u=prompt('Link-URL:','https://'); if(!u)return; ins=`<a href="${u}">${sel}</a>`; }
  else if(tag==='img'){ const u=prompt('Bild-URL:','https://'); if(!u)return; ins=`<img src="${u}" alt="">`; }
  else ins=`<${tag}>${sel}</${tag}>`;
  ta.value=v.slice(0,a)+ins+v.slice(b); ta.focus(); preview();
}

/* ---------- Utils ---------- */
function esc(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function fmt(iso){ if(!iso)return ''; const[y,m,d]=iso.split('-'); const M=['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.']; return `${+d}. ${M[+m-1]} ${y}`; }
let tT; function toast(m){ const t=el('toast'); t.textContent=m; t.classList.add('on'); clearTimeout(tT); tT=setTimeout(()=>t.classList.remove('on'),2600); }

/* ---------- Init ---------- */
function init(){
  load(); clearForm(); renderList();
  ['f_title','f_cat','f_date','f_author','f_read','f_summary','f_cover','f_body','f_pdf','f_tags'].forEach(i=>el(i).addEventListener('input',preview));
  el('f_title').addEventListener('input',()=>{ if(!editingId && !el('f_id').value) el('f_id').placeholder=slugify(el('f_title').value)||'auto-id'; });
}
gate();
