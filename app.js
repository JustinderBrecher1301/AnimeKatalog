/* global bootstrap */
const API={
  search:(q,p=1)=>`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=9&page=${p}&sfw`,
  searchCharacters:(q,p=1)=>`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&order_by=favorites&sort=desc&limit=9&page=${p}`,
  top:(p=1)=>`https://api.jikan.moe/v4/top/anime?limit=9&page=${p}`,
  byLetter:(L,p=1)=>`https://api.jikan.moe/v4/anime?letter=${encodeURIComponent(L)}&order_by=score&sort=desc&limit=9&page=${p}&sfw`,
  sort:(key,dir,p=1)=>`https://api.jikan.moe/v4/anime?order_by=${key}&sort=${dir}&limit=9&page=${p}&sfw`,
  characters:(p=1,dir='desc')=>`https://api.jikan.moe/v4/characters?order_by=favorites&sort=${dir}&limit=9&page=${p}`,
  charactersByLetter:(L,p=1,dir='desc')=>`https://api.jikan.moe/v4/characters?letter=${encodeURIComponent(L)}&order_by=favorites&sort=${dir}&limit=9&page=${p}`,
  charactersByName:(p=1,dir='asc')=>`https://api.jikan.moe/v4/characters?order_by=name&sort=${dir}&limit=9&page=${p}`,
  characterFull:(id)=>`https://api.jikan.moe/v4/characters/${id}/full`,
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
  cardAnime(a){
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
          <button class="btn btn-primary mt-auto" data-id="${a.mal_id}" data-type="anime">Details</button>
        </div>
        <div class="card-footer small border-0">
          <div><span class="text-muted">Genres:</span> ${genres||'–'}</div>
        </div>
      </div>
    </div>`;
  },
  cardCharacter(c){
    const jpg=c.images?.jpg?.image_url||'';
    const meta=[
      c._animeTitle ? `<span class="meta-label">Anime:</span> ${c._animeTitle}` : '<span class="meta-label">Anime:</span> –',
      typeof c.favorites==='number' ? `<span class="meta-label">Likes:</span> ${c.favorites.toLocaleString('de-DE')}` : null
    ].filter(Boolean).join(' · ');
    return `<div class="col-12 col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm border-0">
        <img src="${jpg}" class="card-img-top" alt="${c.name}" loading="lazy">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${c.name}</h5>
          <p class="card-text small mb-2">${meta||'–'}</p>
          <button class="btn btn-primary mt-auto" data-id="${c.mal_id}" data-type="character">Details</button>
        </div>
      </div>
    </div>`;
  },
  render(list,mode){
    const renderer=mode==='character' ? UI.cardCharacter : UI.cardAnime;
    UI.grid().innerHTML=list.map(renderer).join('');
    UI.grid().querySelectorAll('button[data-id]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const item=UI._cache.find(x=>x.mal_id==btn.dataset.id); if(!item) return;
        if(btn.dataset.type==='character'){
          document.getElementById('mTitle').textContent=item.name;
          document.getElementById('mImg').src=item.images?.jpg?.image_url||'';
          document.getElementById('mImg').alt=item.name;
          document.getElementById('mSynopsis').textContent=item.about||'Keine Beschreibung verfügbar.';
          const nicknames=(item.nicknames||[]).join(', ');
          const favorites=typeof item.favorites==='number' ? item.favorites.toLocaleString('de-DE') : '–';
          const detailItems=[
            ['Alter', item._details?.age],
            ['Geburtstag', item._details?.birthday],
            ['Nationalität', item._details?.nationality],
            ['Größe', item._details?.height],
            ['Blutgruppe', item._details?.bloodType],
          ].filter(([,value])=>value);
          const detailsHtml=detailItems.length
            ? `<ul class="detail-list">${detailItems.map(([label,value])=>`<li><span class="meta-label">${label}:</span> ${value}</li>`).join('')}</ul>`
            : '';
          document.getElementById('mMeta').innerHTML=
            `<span class="meta-label">Likes:</span> ${favorites}`+
            `${item._animeTitle ? ` · <span class="meta-label">Anime:</span> ${item._animeTitle}` : ''}`+
            `${detailsHtml ? `<br>${detailsHtml}` : ''}`+
            `${nicknames ? `<br><span class="meta-label">Spitznamen:</span> ${nicknames}` : ''}`;
        }else{
          document.getElementById('mTitle').textContent=item.title;
          document.getElementById('mImg').src=item.images?.jpg?.image_url||'';
          document.getElementById('mImg').alt=item.title;
          document.getElementById('mSynopsis').textContent=item.synopsis||'Keine Zusammenfassung verfügbar.';
          const genres=(item.genres||[]).map(g=>g.name).join(', ');
          document.getElementById('mMeta').innerHTML=
            `<span class="accent">Score</span>: <span class="stars">${toStars(item.score)}</span> <span class="ms-1 score-num">(${fmtScore(item.score)})</span>`+
            ` · <span class="accent">Episoden</span>: ${item.episodes ?? '–'}<br>`+
            `<span class="text-muted">Genres:</span> ${genres||'–'}`;
        }
        UI.modal().show();
      });
    });
  },
  paginate(p,hasNext,onGo){
    const pager=UI.pager(); if(!pager) return;
    if(p<=1 && !hasNext){ pager.innerHTML=''; return; }
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
  async load(url,page,keepTitle,mode='anime'){
    try{
      UI.alert()?.classList.add('d-none');
      const res=await fetch(url); if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json=await res.json();
      let data=json.data||[];
      if(mode==='anime' && App._current.filterMode){
        data=data.filter(item=>(item.score||0)>0 && (item.episodes||0)>0);
      }
      if(App._current.alphaFilter){
        const isLetterStart=(value)=>/^[A-Za-z]/.test(value||'');
        data=data.filter(item=>{
          const name=mode==='character' ? item.name : (item.title || item.title_english);
          return isLetterStart(name);
        });
      }
      if(mode==='character'){
        const sortMode=App._current.characterSort||'likes';
        if(sortMode==='likes'){
          const dir=App._current.characterDir||'desc';
          data=data.sort((a,b)=>{
            const diff=(b.favorites||0)-(a.favorites||0);
            return dir==='desc' ? diff : -diff;
          });
        }else if(sortMode==='name'){
          data=data.sort((a,b)=>a.name.localeCompare(b.name,'de'));
        }
        if(App._current.filterMode){
          const seen=new Set();
          data=data.filter(item=>{
            if((item.favorites||0)<=0) return false;
            if(seen.has(item.mal_id)) return false;
            seen.add(item.mal_id);
            return true;
          });
        }
        UI._cache=await App.enrichCharacters(data);
      }else{
        UI._cache=data;
      }
      UI.render(UI._cache,mode);
      const hasNext=json.pagination?.has_next_page??false; UI.paginate(page,hasNext,(p)=>App._onPage(p));
      if(!keepTitle) document.querySelector('h1')?.classList.remove('placeholder');
      App._current.page=page; App._current.hasNext=hasNext; App._current.mode=mode;
    }catch(e){ UI.error('Fehler beim Laden der Daten. Bitte erneut versuchen.') }
  },
  initIndex(){
    const searchType=document.getElementById('searchType');
    const qInput=document.getElementById('q');
    const updatePlaceholder=()=>{
      if(!qInput || !searchType) return;
      qInput.placeholder=searchType.value==='character' ? 'Charaktere suchen…' : 'Serien suchen…';
    };
    App._current.filterMode=false;
    const showAnime=()=>{
      App._onPage=(p)=>App.load(API.top(p),p);
      App.load(API.top(1),1);
      const t=document.getElementById('title'); if(t) t.textContent='Anime‑Katalog-Startseite';
      const s=document.getElementById('subtitle'); if(s) s.textContent='Durchstöbere alle Anime auf der ganzen Welt, sowie dessen Charaktere!';
      App._current.alphaFilter=false;
      if(searchType){ searchType.value='series'; updatePlaceholder(); }
    };
    const showCharacters=()=>{
      App._current.characterSort='likes';
      App._current.characterDir='desc';
      App._current.alphaFilter=false;
      App._onPage=(p)=>App.load(API.characters(p,App._current.characterDir),p,false,'character');
      App.load(API.characters(1,App._current.characterDir),1,false,'character');
      const t=document.getElementById('title'); if(t) t.textContent='Charaktere';
      const s=document.getElementById('subtitle'); if(s) s.textContent='Entdecke beliebte Charaktere aus Anime.';
      if(searchType){ searchType.value='character'; updatePlaceholder(); }
    };
    showAnime();
    const seriesBtn=document.getElementById('seriesBtn');
    seriesBtn?.addEventListener('click',showAnime);
    const charactersBtn=document.getElementById('charactersBtn');
    charactersBtn?.addEventListener('click',showCharacters);
    searchType?.addEventListener('change',updatePlaceholder);
    updatePlaceholder();
    const f=document.getElementById('searchForm');
    f?.addEventListener('submit',ev=>{
      ev.preventDefault();
      const q=document.getElementById('q').value.trim();
      const type=searchType?.value||'series';
      if(!q){
        if(type==='character'){ showCharacters(); } else { showAnime(); }
        return;
      }
      if(type==='character'){
        App._current.characterSort='likes';
        App._current.characterDir='desc';
        App._onPage=(p)=>App.load(API.searchCharacters(q,p),p,true,'character');
        App.load(API.searchCharacters(q,1),1,true,'character');
      }else{
        App._onPage=(p)=>App.load(API.search(q,p),p,true);
        App.load(API.search(q,1),1,true);
      }
      const t=document.getElementById('title'); if(t) t.textContent=`Suche: ${q}`;
      const s=document.getElementById('subtitle'); if(s) s.textContent='';
    });
  },
  initAlphabet(){
    App._current.filterMode=false;
    const Ls=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    const wrap=document.getElementById('letters');
    wrap.innerHTML=Ls.map(L=>`<button class='btn btn-outline-primary btn-sm' data-letter='${L}'>${L}</button>`).join('');
    const loadL=L=>{document.querySelector('h1').textContent=`Top 9: ${L}`; App._onPage=(p)=>App.load(API.byLetter(L,p),p); App.load(API.byLetter(L,1),1)};
    wrap.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>loadL(b.dataset.letter)));
    loadL('A');
  },
  initSort(){
    App._current.filterMode=true;
    const Ls=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    const lettersWrap=document.getElementById('letters');
    lettersWrap.innerHTML=Ls.map(L=>`<button class='btn btn-outline-primary btn-sm' data-letter='${L}'>${L}</button>`).join('');
    const modeBtns=document.querySelectorAll('[data-mode]');
    const sortBtns=document.querySelectorAll('[data-sort]');
    const title=document.getElementById('sortTitle');
    let mode='series';
    const sortState={popularity:'desc',likes:'desc'};
    const setMode=(next)=>{
      mode=next;
      modeBtns.forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===mode));
      sortBtns.forEach(btn=>{
        const isCharacter=btn.dataset.scope==='character';
        btn.classList.toggle('d-none',mode==='series' ? isCharacter : !isCharacter);
      });
      lettersWrap.querySelectorAll('button').forEach(btn=>btn.classList.remove('active'));
      if(title) title.textContent=mode==='series' ? 'Sortierung · Serien' : 'Sortierung · Charaktere';
      if(mode==='series'){
        sortState.popularity='desc';
        const button=[...sortBtns].find(btn=>btn.dataset.sort==='popularity');
        if(button) button.textContent='Beliebtheit ↓';
        App._current.alphaFilter=false;
        App._onPage=p=>App.load(API.top(p),p);
        App.load(API.top(1),1);
      }else{
        sortState.likes='desc';
        const button=[...sortBtns].find(btn=>btn.dataset.sort==='likes');
        if(button) button.textContent='Likes ↓';
        App._current.characterSort='likes';
        App._current.characterDir='desc';
        App._current.alphaFilter=false;
        App._onPage=p=>App.load(API.characters(p,'desc'),p,false,'character');
        App.load(API.characters(1,'desc'),1,false,'character');
      }
    };
    const applyLetter=L=>{
      App._current.alphaFilter=true;
      if(mode==='series'){
        App._onPage=(p)=>App.load(API.byLetter(L,p),p);
        App.load(API.byLetter(L,1),1);
      }else{
        App._current.characterSort='likes';
        App._current.characterDir=sortState.likes;
        App._onPage=(p)=>App.load(API.charactersByLetter(L,p,sortState.likes),p,false,'character');
        App.load(API.charactersByLetter(L,1,sortState.likes),1,false,'character');
      }
    };
    const applySort=key=>{
      if(mode==='series'){
        if(key==='popularity'){
          sortState.popularity=sortState.popularity==='asc' ? 'desc' : 'asc';
          const button=[...sortBtns].find(btn=>btn.dataset.sort==='popularity');
          if(button) button.textContent=`Beliebtheit ${sortState.popularity==='asc' ? '↑' : '↓'}`;
          App._current.alphaFilter=false;
          App._onPage=p=>App.load(API.sort('popularity',sortState.popularity,p),p);
          App.load(API.sort('popularity',sortState.popularity,1),1);
          return;
        }
      }else{
        if(key==='likes'){
          sortState.likes=sortState.likes==='asc' ? 'desc' : 'asc';
          const button=[...sortBtns].find(btn=>btn.dataset.sort==='likes');
          if(button) button.textContent=`Likes ${sortState.likes==='asc' ? '↑' : '↓'}`;
          App._current.characterSort='likes';
          App._current.characterDir=sortState.likes;
          App._current.alphaFilter=false;
          App._onPage=p=>App.load(API.characters(p,sortState.likes),p,false,'character');
          App.load(API.characters(1,sortState.likes),1,false,'character');
          return;
        }
      }
    };
    lettersWrap.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
      lettersWrap.querySelectorAll('button').forEach(btn=>btn.classList.remove('active'));
      b.classList.add('active');
      applyLetter(b.dataset.letter);
    }));
    sortBtns.forEach(b=>b.addEventListener('click',()=>applySort(b.dataset.sort)));
    modeBtns.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
    setMode('series');
  },
  initFavorites(){
    const form=document.getElementById('favoritesForm');
    const alert=document.getElementById('alert');
    const resetBtn=document.getElementById('favoritesReset');
    const nameInput=document.getElementById('favName');
    const ageInput=document.getElementById('favAge');
    const genreInput=document.getElementById('favGenre');
    const seriesSelect=document.getElementById('favSeries');
    const characterSelect=document.getElementById('favCharacter');
    const saved=localStorage.getItem('favoritesProfile');
    if(saved){
      const data=JSON.parse(saved);
      nameInput.value=data.name||'';
      ageInput.value=data.age||'';
      genreInput.value=data.genre||'';
    }
    const fillSelect=(el,items,placeholder)=>{
      el.innerHTML=`<option value="" disabled selected>${placeholder}</option>`+
        items.map(item=>`<option value="${item.mal_id}">${item.title || item.name}</option>`).join('');
    };
    const loadSeries=async ()=>{
      const res=await fetch(API.top(1)); const json=await res.json();
      const list=json.data||[];
      fillSelect(seriesSelect,list,'Serie wählen…');
      if(saved){
        const data=JSON.parse(saved);
        if(data.seriesId){ seriesSelect.value=String(data.seriesId); }
      }
    };
    const loadCharacters=async ()=>{
      const res=await fetch(API.characters(1,'desc')); const json=await res.json();
      const list=json.data||[];
      fillSelect(characterSelect,list,'Charakter wählen…');
      if(saved){
        const data=JSON.parse(saved);
        if(data.characterId){ characterSelect.value=String(data.characterId); }
      }
    };
    loadSeries();
    loadCharacters();
    form?.addEventListener('submit',ev=>{
      ev.preventDefault();
      const data={
        name:nameInput.value.trim(),
        age:ageInput.value.trim(),
        genre:genreInput.value.trim(),
        seriesId:seriesSelect.value,
        seriesLabel:seriesSelect.options[seriesSelect.selectedIndex]?.textContent||'',
        characterId:characterSelect.value,
        characterLabel:characterSelect.options[characterSelect.selectedIndex]?.textContent||''
      };
      localStorage.setItem('favoritesProfile',JSON.stringify(data));
      alert?.classList.remove('d-none');
      setTimeout(()=>alert?.classList.add('d-none'),2000);
    });
    resetBtn?.addEventListener('click',()=>{
      localStorage.removeItem('favoritesProfile');
      form?.reset();
      alert?.classList.add('d-none');
      loadSeries();
      loadCharacters();
    });
  },
  async enrichCharacters(list){
    const enriched=await Promise.all(list.map(async item=>{
      try{
        const res=await fetch(API.characterFull(item.mal_id));
        if(!res.ok) throw new Error('bad');
        const json=await res.json();
        const animeTitle=json.data?.animeography?.[0]?.anime?.title
          || json.data?.anime?.[0]?.anime?.title
          || json.data?.anime?.[0]?.title;
        const details={
          age: json.data?.age || '',
          birthday: json.data?.birthday || '',
          nationality: json.data?.nationality || '',
          height: json.data?.height || '',
          bloodType: json.data?.blood_type || '',
        };
        return {...item,_animeTitle:animeTitle||'',_details:details};
      }catch(e){
        return {...item,_animeTitle:'',_details:{}};
      }
    }));
    return enriched;
  },
  _current:{page:1,hasNext:false,characterSort:'likes',characterDir:'desc',alphaFilter:false},
  _onPage:(_)=>{}
};
window.App=App;