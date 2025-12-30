/* global bootstrap */
const API={
  search:(q,p=1)=>`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=9&page=${p}&sfw`,
  top:(p=1)=>`https://api.jikan.moe/v4/top/anime?limit=9&page=${p}`,
  byLetter:(L,p=1)=>`https://api.jikan.moe/v4/anime?letter=${encodeURIComponent(L)}&order_by=score&sort=desc&limit=9&page=${p}&sfw`,
  sort:(key,dir,p=1)=>`https://api.jikan.moe/v4/anime?order_by=${key}&sort=${dir}&limit=9&page=${p}&sfw`,
};

function toStars(score){
  const s = typeof score==='number' ? Math.max(0, Math.min(10, score)) : 0;
  const filled = Math.round(s/2);
  return '★★★★★'.slice(0,filled) + '<span class="empty">' + '★★★★★'.slice(filled) + '</span>';
}
function fmtScore(score){ return (typeof score==='number') ? (score.toFixed(1).replace('.', ',')+' / 10') : '–'; }

const UI={
  grid:()=>document.getElementById('grid'),
  pager:()=>document.getElementById('pager'),
  alert:()=>document.getElementById('alert'),
  modal:()=>new bootstrap.Modal(document.getElementById('animeModal')),
  card(a){
    const jpg=a.images?.jpg?.large_image_url||a.images?.jpg?.image_url||'';
    const webp=a.images?.webp?.large_image_url||'';
    const imgTag = webp ? `<img src="${jpg}" srcset="${webp} 2x, ${jpg} 1x" class="card-img-top" alt="${a.title}" loading="lazy">` : `<img src="${jpg}" class="card-img-top" alt="${a.title}" loading="lazy">`;
    const genres=(a.genres||[]).map(g=>g.name).join(', ');
    return `<div class="col-12 col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm border-0">
        ${imgTag}
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${a.title}</h5>
          <p class="card-text small mb-2">
            <span class="accent">Score</span>:
            <span class="stars" aria-label="Bewertung ${a.score ?? '0'} von 10">${toStars(a.score)}</span>
            <span class="ms-1 score-num">(${fmtScore(a.score)})</span>
            · <span class="accent">Episoden</span>: ${a.episodes ?? '–'}
          </p>
          <button class="btn btn-primary mt-auto" data-id="${a.mal_id}">Details</button>
        </div>
        <div class="card-footer small border-0">
          <div><span class="text-muted">Genres:</span> ${genres||'–'}</div>
        </div>
      </div>
    </div>`;
  },
  render(list){
    UI.grid().innerHTML=list.map(UI.card).join('');
    UI.grid().querySelectorAll('button[data-id]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const a=UI._cache.find(x=>x.mal_id==btn.dataset.id); if(!a) return;
        document.getElementById('mTitle').textContent=a.title;
        document.getElementById('mImg').src=a.images?.jpg?.image_url||'';
        document.getElementById('mImg').alt=a.title;
        document.getElementById('mSynopsis').textContent=a.synopsis||'Keine Zusammenfassung verfügbar.';
        const genres=(a.genres||[]).map(g=>g.name).join(', ');
        document.getElementById('mMeta').innerHTML=
          `<span class="accent">Score</span>: <span class="stars">${toStars(a.score)}</span> <span class="ms-1 score-num">(${fmtScore(a.score)})</span>`+
          ` · <span class="accent">Episoden</span>: ${a.episodes ?? '–'}<br>`+
          `<span class="text-muted">Genres:</span> ${genres||'–'}`;
        UI.modal().show();
      });
    });
  },
  paginate(p,hasNext,onGo){
    const pager=UI.pager(); if(!pager) return;
    pager.innerHTML=`<li class="page-item ${p<=1?'disabled':''}"><a class="page-link" href="#">Zurück</a></li><li class="page-item disabled spacer"><span class="page-link">&nbsp;</span></li><li class="page-item ${!hasNext?'disabled':''}"><a class="page-link" href="#">Weiter</a></li>`;
    const items=pager.querySelectorAll('.page-item');
    const prevEl=items[0], nextEl=items[items.length-1];
    prevEl.addEventListener('click',e=>{e.preventDefault(); if(p>1) onGo(p-1)});
    nextEl.addEventListener('click',e=>{e.preventDefault(); if(hasNext) onGo(p+1)});
  },
  error(msg){const a=UI.alert(); if(!a) return; a.textContent=msg; a.classList.remove('d-none')},
  _cache:[]
};

const App={
  async load(url,page,keepTitle){
    try{
      UI.alert()?.classList.add('d-none');
      const res=await fetch(url); if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json=await res.json();
      UI._cache=json.data||[]; UI.render(UI._cache);
      const hasNext=json.pagination?.has_next_page??false; UI.paginate(page,hasNext,(p)=>App._onPage(p));
      if(!keepTitle) document.querySelector('h1')?.classList.remove('placeholder');
      App._current.page=page; App._current.hasNext=hasNext;
    }catch(e){ UI.error('Fehler beim Laden der Daten. Bitte erneut versuchen.') }
  },
  initIndex(){
    App._onPage=(p)=>App.load(API.top(p),p);
    App.load(API.top(1),1);
    const f=document.getElementById('searchForm');
    f?.addEventListener('submit',ev=>{
      ev.preventDefault();
      const q=document.getElementById('q').value.trim();
      if(!q){
        App._onPage=(p)=>App.load(API.top(p),p); App.load(API.top(1),1);
        const t=document.getElementById('title'); if(t) t.textContent='Anime‑Katalog';
        const s=document.getElementById('subtitle'); if(s) s.textContent='Suche oder stöbere in Top‑Titeln.';
        return;
      }
      App._onPage=(p)=>App.load(API.search(q,p),p,true);
      App.load(API.search(q,1),1,true);
      const t=document.getElementById('title'); if(t) t.textContent=`Suche: ${q}`;
      const s=document.getElementById('subtitle'); if(s) s.textContent='';
    });
  },
  initAlphabet(){
    const Ls=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    const wrap=document.getElementById('letters');
    wrap.innerHTML=Ls.map(L=>`<button class='btn btn-outline-primary btn-sm' data-letter='${L}'>${L}</button>`).join('');
    const loadL=L=>{document.querySelector('h1').textContent=`Top 9: ${L}`; App._onPage=(p)=>App.load(API.byLetter(L,p),p); App.load(API.byLetter(L,1),1)};
    wrap.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>loadL(b.dataset.letter)));
    loadL('A');
  },
  initSort(){
    const btns=document.querySelectorAll('[data-sort]');
    const apply=key=>{
      if(key==='score-desc'){ App._onPage=p=>App.load(API.top(p),p); App.load(API.top(1),1); document.querySelector('h1').textContent='Nach Score'; return; }
      if(key==='popularity-desc'){ App._onPage=p=>App.load(API.sort('popularity','desc',p),p); App.load(API.sort('popularity','desc',1),1); document.querySelector('h1').textContent='Nach Beliebtheit'; return; }
      if(key==='title-asc'){ App._onPage=p=>App.load(API.sort('title','asc',p),p); App.load(API.sort('title','asc',1),1); document.querySelector('h1').textContent='A–Z'; return; }
    };
    btns.forEach(b=>b.addEventListener('click',()=>apply(b.dataset.sort)));
    apply('title-asc');
  },
  _current:{page:1,hasNext:false},
  _onPage:(_)=>{}
};
window.App=App;