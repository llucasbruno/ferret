// ══════════════════════════════════════════════
//  STUDIODNA.JS — Sistema de Documentos
// ══════════════════════════════════════════════

// ── State ─────────────────────────────────────
let dnaViewDocId    = null;  // doc aberto
let dnaViewFolderId = null;  // pasta aberta
let dnaViewSubId    = null;  // sub-pasta aberta
let dnaSelCat       = 'all';
let dnaSearch       = '';
let dnaAllDocs      = [];

// Modal state
let dnaEditFolderId   = null;   // null = criando
let dnaEditSubId      = null;
let dnaEditItemId     = null;
let dnaItemParentType = 'folder'; // 'folder' | 'subfolder'
let dnaItemImgB64     = null;
let dnaLinkDocId      = null;    // doc sendo vinculado
let dnaFolderReqDocId = null;    // doc p/ solicitação de pasta

let _dnaCurrentItemType = 'image';

// ── Default docs (convertidos para pasta) ────
const DNA_DOCS_DEFAULT = [
  {
    id: 'manifesto', icon: '🎯', title: 'Manifesto Estratégico',
    category: 'Estratégia', subtitle: 'Território, posicionamento e essência do estúdio',
    color: '#FF4655', isDefault: true, coverImage: null, projectId: null,
    createdById: 'system', createdByName: 'Sistema',
    folders: [{
      id: 'f_manifesto_content', name: 'Conteúdo', icon: '📝', color: '#FF4655',
      createdById: 'system', createdByName: 'Sistema', createdAt: null,
      subfolders: [],
      items: [
        { id: 'i_mc1', type: 'text', name: 'Território Criativo', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'Ferret Studio é um estúdio de motion design orientado por design, focado em transformar ideias complexas, produtos tecnológicos e identidades de marca em narrativas visuais claras, sofisticadas e impactantes.\n\nO território criativo do estúdio está na interseção entre tecnologia, design e comunicação visual. Nosso trabalho não é apenas animar gráficos — é traduzir inovação em linguagem visual compreensível e memorável.' },
        { id: 'i_mc2', type: 'text', name: 'Posicionamento', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'Ferret Studio se posiciona como um estúdio de motion design especializado em tecnologia e marcas inovadoras, atuando globalmente e colaborando com startups, agências criativas e estúdios internacionais.\n\nO foco está em motion design de alto nível estético, onde design, composição e narrativa visual são tão importantes quanto a animação.' },
        { id: 'i_mc3', type: 'text', name: 'Públicos-Alvo', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: '• Startups de tecnologia (SaaS, AI, fintech, dev tools)\n• Agências de publicidade e branding\n• Marcas digitais e empresas inovadoras\n• Estúdios criativos que buscam parceiros especializados' },
        { id: 'i_mc4', type: 'text', name: 'Tipos de Projetos', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: '• Explainer videos para produtos digitais\n• Product animations e Brand motion systems\n• Vídeos de lançamento de produto\n• Motion para campanhas digitais e UI animation' },
        { id: 'i_mc5', type: 'text', name: 'Essência do Estúdio', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'Ferret Studio acredita que motion design é mais poderoso quando nasce do design, da clareza e da intenção narrativa. O trabalho do estúdio consiste em transformar ideias complexas em movimento significativo.' }
      ]
    }]
  },
  {
    id: 'posicionamento', icon: '📐', title: 'Posicionamento & Coerência Visual',
    category: 'Estratégia', subtitle: 'Como o estúdio deve aparecer ao mercado',
    color: '#00C4B4', isDefault: true, coverImage: null, projectId: null,
    createdById: 'system', createdByName: 'Sistema',
    folders: [{
      id: 'f_pos_content', name: 'Conteúdo', icon: '📝', color: '#00C4B4',
      createdById: 'system', createdByName: 'Sistema', createdAt: null,
      subfolders: [],
      items: [
        { id: 'i_pc1', type: 'text', name: 'Posicionamento Narrativo', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'O posicionamento narrativo define a história implícita que o mercado entende sobre o estúdio. A narrativa central é a de um estúdio pequeno, ágil e altamente especializado em motion design orientado por design.' },
        { id: 'i_pc2', type: 'text', name: 'Coerência Visual', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'Coerência visual garante que todas as manifestações públicas — Instagram, LinkedIn, Behance, website e reels — pareçam parte do mesmo universo criativo. Elementos constantes: direção de arte consistente, tipografia forte e composição baseada em grids.' },
        { id: 'i_pc3', type: 'text', name: 'Curadoria e Portfólio', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'O portfólio deve refletir o território criativo definido no manifesto. Trabalhos que desviam desse território enfraquecem a percepção de especialização.' }
      ]
    }]
  },
  {
    id: 'territorio', icon: '🌐', title: 'Território Criativo',
    category: 'Estratégia', subtitle: 'Resumo oficial e discurso do estúdio',
    color: '#FFD700', isDefault: true, coverImage: null, projectId: null,
    createdById: 'system', createdByName: 'Sistema',
    folders: [{
      id: 'f_ter_content', name: 'Conteúdo', icon: '📝', color: '#FFD700',
      createdById: 'system', createdByName: 'Sistema', createdAt: null,
      subfolders: [],
      items: [
        { id: 'i_tc1', type: 'text', name: 'Definição do Território', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'Ferret Studio é um estúdio de motion design orientado por design, especializado em transformar produtos tecnológicos, ideias complexas e identidades de marca em narrativas visuais claras, sofisticadas e memoráveis.' },
        { id: 'i_tc2', type: 'text', name: 'Estilos Visuais', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'Minimal Tech Motion — design limpo, tipografia forte, UI animation.\n\nDesign-Driven Motion — formas geométricas, composição gráfica forte, tipografia cinética.\n\nPremium Brand Motion — minimalismo sofisticado, animação refinada.' },
        { id: 'i_tc3', type: 'text', name: 'Discurso do Estúdio', createdById: 'system', createdByName: 'Sistema', createdAt: null, content: 'Tagline:\nDesign-driven motion for technology and innovative brands.\n\nFerret Studio creates refined motion design for technology companies, innovative brands and creative agencies. We transform complex ideas into clear, elegant visual narratives through design-driven animation.' }
      ]
    }]
  }
];

// ── Color helper ──────────────────────────────
function _dnaCol(c) {
  if (!c) return '#00C4B4';
  const m = { 'var(--red)':'#FF4655','var(--cyan)':'#00C4B4','var(--gold)':'#FFD700','var(--green)':'#44FF99','var(--orange)':'#FF8C42' };
  return m[c] || c;
}

// ── Item type helpers ─────────────────────────
const DNA_ITEM_ICONS  = { image: '🖼', text: '📝', link: '🔗', pdf: '📄' };
const DNA_ITEM_LABELS = { image: 'Imagem', text: 'Texto', link: 'Link', pdf: 'PDF' };

// ── Unique ID ─────────────────────────────────
const _uid = () => '_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36);

// ═══════════════════════════════════════════════
//  LOAD & RENDER MAIN
// ═══════════════════════════════════════════════
async function renderStudioDNA() {
  const isMgr = meData?.access === 'manager';
  document.querySelectorAll('.mgr-only').forEach(el => el.classList.toggle('hidden', !isMgr));

  const snap   = await db.collection('studioDNA').orderBy('order', 'asc').get();
  const fsDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const fsIds  = fsDocs.map(d => d.id);
  const delIds = fsDocs.filter(d => d._deleted).map(d => d.id);
  const real   = fsDocs.filter(d => !d._deleted);
  const defs   = DNA_DOCS_DEFAULT.filter(d => !fsIds.includes(d.id) && !delIds.includes(d.id));
  dnaAllDocs   = [...defs, ...real];

  if      (dnaViewSubId)    _renderFolderView();
  else if (dnaViewFolderId) _renderFolderView();
  else if (dnaViewDocId)    _renderDocView();
  else                      _renderMain();
}

// ── Main grid ─────────────────────────────────
function _renderMain() {
  show('dna-main-wrap'); hide('dna-doc-wrap'); hide('dna-folder-wrap');
  _renderCats(); _renderGrid();
  const dl = $('dna-cat-datalist');
  if (dl) dl.innerHTML = Object.keys(_getDnaCats()).map(c => `<option value="${c}">`).join('');
}

function _getDnaCats() {
  const cats = {};
  dnaAllDocs.forEach(d => { const c = d.category || 'Geral'; cats[c] = (cats[c] || 0) + 1; });
  return cats;
}

function _renderCats() {
  const cats = _getDnaCats();
  $('dna-cats-list').innerHTML = `
    <div class="dna-cat-item ${dnaSelCat==='all'?'active':''}" onclick="dnaSetCat('all')">
      <span>TODOS</span><span class="dna-cat-count">${dnaAllDocs.length}</span>
    </div>
    ${Object.entries(cats).sort((a,b)=>a[0].localeCompare(b[0])).map(([c,n])=>`
      <div class="dna-cat-item ${dnaSelCat===c?'active':''}" onclick="dnaSetCat('${c.replace(/'/g,"&#39;")}')">
        <span>${c.toUpperCase()}</span><span class="dna-cat-count">${n}</span>
      </div>`).join('')}`;
}

function _renderGrid() {
  let docs = dnaAllDocs;
  if (dnaSelCat !== 'all') docs = docs.filter(d => (d.category||'Geral') === dnaSelCat);
  if (dnaSearch.trim()) {
    const q = dnaSearch.trim().toLowerCase();
    docs = docs.filter(d => d.title.toLowerCase().includes(q) || (d.subtitle||'').toLowerCase().includes(q) ||
      (d.folders||[]).some(f => f.name.toLowerCase().includes(q) ||
        (f.items||[]).some(i => i.name.toLowerCase().includes(q) || (i.content||'').toLowerCase().includes(q)) ||
        (f.subfolders||[]).some(sf => sf.name.toLowerCase().includes(q))));
  }
  const el = $('dna-grid');
  if (!docs.length) {
    el.innerHTML = `<div class="empty" style="grid-column:1/-1;padding:40px 20px;">
      <div class="empty-icon">${ic('file',40,'var(--dim)')}</div>
      <h3>${dnaSearch?'SEM RESULTADOS':'SEM DOCUMENTOS'}</h3>
      <p>${dnaSearch?`Nenhum resultado para "${dnaSearch}"`:'Crie o primeiro documento'}</p></div>`;
    return;
  }
  el.innerHTML = docs.map(doc => {
    const col      = _dnaCol(doc.color);
    const fCount   = (doc.folders||[]).length;
    const proj     = doc.projectId ? projects.find(p=>p.id===doc.projectId) : null;
    const updAt    = doc.updatedAt?.toDate ? doc.updatedAt.toDate() : doc.createdAt?.toDate ? doc.createdAt.toDate() : null;
    return `<div class="dna-doc-card" onclick="openDNADoc('${doc.id}')">
      ${doc.coverImage?`<div class="dna-doc-cover" style="background-image:url('${doc.coverImage}')"><div class="dna-doc-cover-fade"></div></div>`:''}
      <div class="dna-doc-card-body" style="border-top:3px solid ${col}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:8px;">
          <span style="font-size:28px;line-height:1;">${doc.iconImg ? `<img src="${doc.iconImg}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;display:block;" onerror="this.outerHTML='📄'">` : (doc.icon||'📄')}</span>
          <span class="dna-cat-badge" style="background:${col}20;color:${col};border:1px solid ${col}44;">${(doc.category||'Geral').toUpperCase()}</span>
        </div>
        <div class="dna-doc-title">${doc.title}</div>
        ${doc.subtitle?`<div class="dna-doc-sub">${doc.subtitle}</div>`:''}
        ${proj?`<div style="display:flex;align-items:center;gap:5px;font-family:var(--M);font-size:9px;margin-top:6px;"><span style="width:6px;height:6px;border-radius:50%;background:${proj.color||'var(--cyan)'};display:inline-block;flex-shrink:0;"></span><span style="color:var(--dim2);">${proj.name}</span></div>`:''}
        <div class="dna-doc-footer">
          <span>${fCount} pasta${fCount!==1?'s':''}</span>
          ${updAt?`<span>${fmtTime({toDate:()=>updAt})}</span>`:''}
          <span style="color:${col};margin-left:auto;">ABRIR →</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function dnaSetCat(cat) { dnaSelCat=cat; _renderCats(); _renderGrid(); }
function dnaSetSearch(val) { dnaSearch=val; _renderGrid(); }

// ═══════════════════════════════════════════════
//  LEVEL 1 — DOC VIEW (pastas)
// ═══════════════════════════════════════════════

// ── Projetos vinculados ao doc ────────────────
function _renderDocLinkedProjects(doc, isMgr) {
  const linked = projects.filter(p => !p.archived && (
    (doc.projectId && p.id === doc.projectId) ||
    (p.dnaDocId    && p.dnaDocId === doc.id)
  ));
  const seen = new Set(), unique = [];
  linked.forEach(p => { if (!seen.has(p.id)) { seen.add(p.id); unique.push(p); } });
  if (!unique.length) return '';

  const cards = unique.map(p => {
    const pt      = tasks.filter(t => t.projectId === p.id && !['rejected','archived'].includes(t.status));
    const done    = pt.filter(t => t.status === 'finalized').length;
    const pct     = pt.length ? Math.round((done / pt.length) * 100) : 0;
    const overdue = pt.filter(t => isOverdue(t)).length;
    const col     = p.color || 'var(--cyan)';
    return `<div class="dna-proj-card" onclick="go('projects');openProjectDetail('${p.id}')" style="border-left:3px solid ${col};">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <div style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0;box-shadow:0 0 6px ${col}88;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--R);font-size:14px;font-weight:700;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px;font-family:var(--M);font-size:9px;color:var(--dim2);flex-wrap:wrap;">
            ${p.client ? `<span>${p.client}</span><span>·</span>` : ''}
            <span style="color:${col};">${pct}% concluído</span>
            <span>·</span>
            <span>${pt.length} task${pt.length !== 1 ? 's' : ''}</span>
            ${overdue ? `<span>·</span><span style="color:var(--red);">⚠ ${overdue} em atraso</span>` : ''}
          </div>
        </div>
        <div style="flex-shrink:0;min-width:80px;">
          <div style="height:4px;background:rgba(var(--border-rgb),.1);overflow:hidden;border-radius:2px;">
            <div style="height:100%;width:${pct}%;background:${col};border-radius:2px;"></div>
          </div>
          <div style="font-family:var(--M);font-size:9px;color:var(--dim2);margin-top:3px;text-align:right;">${done}/${pt.length}</div>
        </div>
        <span style="flex-shrink:0;color:${col};font-family:var(--M);font-size:11px;opacity:.7;">→</span>
      </div>
    </div>`;
  }).join('');

  return `<div style="margin-bottom:24px;">
    <div class="sec" style="margin-bottom:10px;">
      PROJETOS VINCULADOS
      ${isMgr ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openLinkProject('${doc.id}')" style="font-size:9px;opacity:.6;margin-left:4px;">${ic('folder',9,'currentColor')} GERENCIAR</button>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">${cards}</div>
  </div>`;
}

function openDNADoc(docId) {
  dnaViewDocId=docId; dnaViewFolderId=null; dnaViewSubId=null;
  _renderDocView();
}

function _renderDocView() {
  hide('dna-main-wrap'); show('dna-doc-wrap'); hide('dna-folder-wrap');
  const doc   = dnaAllDocs.find(d=>d.id===dnaViewDocId);
  if (!doc) { closeDNAToMain(); return; }
  const isMgr = meData?.access==='manager';
  const col   = _dnaCol(doc.color);
  const proj  = doc.projectId ? projects.find(p=>p.id===doc.projectId) : null;
  const folders = doc.folders || [];

  $('dna-doc-topbar').innerHTML = `
    <div class="dna-topbar">
      <div class="dna-breadcrumb">
        <span class="dna-bc-link" onclick="closeDNAToMain()">Documentos</span>
        <span class="dna-bc-sep">›</span>
        <span class="dna-bc-cur">${doc.title}</span>
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;">
        ${isMgr?`
          <button class="btn btn-ghost btn-sm" onclick="openCreateDNAFolder()"><svg viewBox="0 0 24 24" width="11" height="11" style="stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-right:4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>+ PASTA</button>
          <button class="btn btn-ghost btn-sm" onclick="openLinkProject('${doc.id}')" style="color:var(--cyan);">${ic('folder',11,'var(--cyan)')} VINCULAR PROJETO</button>
          <button class="btn btn-info btn-sm" onclick="openEditDNADoc('${doc.id}',${!!doc.isDefault})">${ic('edit',11,'currentColor')} EDITAR</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDNADoc('${doc.id}',${!!doc.isDefault})">${ic('trash',11,'currentColor')}</button>
        `:`<button class="btn btn-ghost btn-sm" onclick="openFolderRequest('${doc.id}')">+ SOLICITAR PASTA</button>`}
      </div>
    </div>`;

  $('dna-doc-header').innerHTML = `
    ${doc.coverImage?`<div class="dna-editor-cover" style="background-image:url('${doc.coverImage}');margin-bottom:20px;"><div class="dna-editor-cover-fade"></div></div>`:''}
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;flex-wrap:wrap;">
      <span style="font-size:44px;line-height:1;">${doc.iconImg ? `<img src="${doc.iconImg}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;display:block;" onerror="this.outerHTML='📄'">` : (doc.icon||'📄')}</span>
      <div>
        <h1 style="font-family:var(--R);font-size:clamp(20px,4vw,30px);font-weight:700;letter-spacing:3px;color:var(--cream);margin:0 0 4px;">${doc.title}</h1>
        ${doc.subtitle?`<div style="font-family:var(--M);font-size:11px;color:var(--dim2);letter-spacing:1px;">${doc.subtitle}</div>`:''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
          <span class="dna-cat-badge" style="background:${col}20;color:${col};border:1px solid ${col}44;">${(doc.category||'Geral').toUpperCase()}</span>
          <span style="font-family:var(--M);font-size:9px;color:var(--dim2);">Por ${doc.createdByName||'—'}</span>
        </div>
      </div>
    </div>`;

  if (!folders.length) {
    $('dna-doc-body').innerHTML = `<div class="empty" style="padding:40px 0 20px;">
      <div class="empty-icon">${ic('folder',40,'var(--dim)')}</div>
      <h3>SEM PASTAS</h3>
      <p>${isMgr?'Clique em + PASTA para criar a primeira':'Solicite ao manager para criar pastas'}</p></div>`;
    return;
  }

  $('dna-doc-body').innerHTML = `
    ${_renderDocLinkedProjects(doc, isMgr)}
    <div class="sec">PASTAS <span style="color:var(--dim2);font-size:9px;margin-left:4px;">${folders.length}</span></div>
    <div class="dna-folders-grid">
      ${folders.map(f => {
        const fCol = _dnaCol(f.color||doc.color);
        const totalItems = (f.items||[]).length + (f.subfolders||[]).reduce((acc,sf)=>acc+(sf.items||[]).length,0);
        const subCount   = (f.subfolders||[]).length;
        return `<div class="dna-folder-card" onclick="openDNAFolder('${f.id}')" style="border-left:3px solid ${fCol}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:22px;">${f.icon||'📁'}</span>
            ${isMgr?`<div class="dna-card-acts" onclick="event.stopPropagation()">
              <button class="dna-card-btn" onclick="openEditFolder('${f.id}')" title="Editar">${ic('edit',11,'var(--dim2)')}</button>
              <button class="dna-card-btn" onclick="deleteDNAFolder('${f.id}')" title="Excluir" style="color:var(--dim);">${ic('trash',11,'currentColor')}</button>
            </div>`:''}</div>
          <div class="dna-folder-name">${f.name}</div>
          <div class="dna-folder-meta">
            ${subCount?`<span>${subCount} sub-pasta${subCount!==1?'s':''}</span><span>·</span>`:''}
            <span>${totalItems} item${totalItems!==1?'s':''}</span>
          </div>
          <div class="dna-folder-creator">Por ${f.createdByName||'—'}</div>
        </div>`;
      }).join('')}
    </div>`;
}

// ═══════════════════════════════════════════════
//  LEVEL 2+ — FOLDER VIEW (itens)
// ═══════════════════════════════════════════════
function openDNAFolder(folderId) {
  dnaViewFolderId=folderId; dnaViewSubId=null;
  _renderFolderView();
}

function openDNASubfolder(subId) {
  dnaViewSubId=subId;
  _renderFolderView();
}

function _renderFolderView() {
  hide('dna-main-wrap'); hide('dna-doc-wrap'); show('dna-folder-wrap');
  const doc = dnaAllDocs.find(d=>d.id===dnaViewDocId);
  if (!doc) { closeDNAToMain(); return; }
  const folder = (doc.folders||[]).find(f=>f.id===dnaViewFolderId);
  if (!folder) { openDNADoc(dnaViewDocId); return; }

  const isMgr  = meData?.access==='manager';
  const col    = _dnaCol(folder.color||doc.color);
  const subfolder = dnaViewSubId ? (folder.subfolders||[]).find(s=>s.id===dnaViewSubId) : null;
  const items  = subfolder ? (subfolder.items||[]) : (folder.items||[]);
  const subfolders = !dnaViewSubId ? (folder.subfolders||[]) : [];

  // ── Breadcrumb ──
  $('dna-folder-topbar').innerHTML = `
    <div class="dna-topbar">
      <div class="dna-breadcrumb">
        <span class="dna-bc-link" onclick="closeDNAToMain()">Documentos</span>
        <span class="dna-bc-sep">›</span>
        <span class="dna-bc-link" onclick="openDNADoc('${doc.id}')">${doc.title}</span>
        <span class="dna-bc-sep">›</span>
        ${subfolder?`<span class="dna-bc-link" onclick="openDNAFolder('${folder.id}')">${folder.name}</span><span class="dna-bc-sep">›</span><span class="dna-bc-cur">${subfolder.name}</span>`
                  :`<span class="dna-bc-cur">${folder.name}</span>`}
      </div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;">
        ${isMgr?`
          ${!dnaViewSubId?`<button class="btn btn-ghost btn-sm" onclick="openCreateSubfolder('${folder.id}')">${ic('folder',11,'currentColor')} + SUB-PASTA</button>`:''}
          <button class="btn btn-primary btn-sm" onclick="openCreateItem()">+ ARQUIVO</button>
        `:`<button class="btn btn-ghost btn-sm" onclick="openFolderRequest('${doc.id}')">+ SOLICITAR</button>`}
      </div>
    </div>`;

  // ── Header da pasta ──
  $('dna-folder-header').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(var(--border-rgb),.08);">
      <span style="font-size:36px;line-height:1;">${(subfolder||folder).icon||'📁'}</span>
      <div>
        <div style="font-family:var(--R);font-size:22px;font-weight:700;letter-spacing:2px;color:var(--cream);">${(subfolder||folder).name}</div>
        <div style="font-family:var(--M);font-size:9px;color:var(--dim2);margin-top:4px;">
          Por ${(subfolder||folder).createdByName||'—'}
          · ${items.length} item${items.length!==1?'s':''}
          ${!dnaViewSubId&&subfolders.length?` · ${subfolders.length} sub-pasta${subfolders.length!==1?'s':''}`:''}
        </div>
      </div>
    </div>`;

  // ── Body: sub-pastas + itens ──
  let bodyHtml = '';

  if (!dnaViewSubId && subfolders.length) {
    bodyHtml += `<div class="sec">SUB-PASTAS</div>
    <div class="dna-subfolders-row">
      ${subfolders.map(sf=>{
        const sfCol = _dnaCol(sf.color||folder.color||doc.color);
        return `<div class="dna-subfolder-chip" onclick="openDNASubfolder('${sf.id}')" style="border-color:${sfCol}44;">
          <span>${sf.icon||'📁'}</span>
          <div>
            <div style="font-family:var(--R);font-size:13px;font-weight:600;color:var(--cream);">${sf.name}</div>
            <div style="font-family:var(--M);font-size:9px;color:var(--dim2);">${(sf.items||[]).length} iten${(sf.items||[]).length!==1?'s':'s'} · Por ${sf.createdByName||'—'}</div>
          </div>
          ${isMgr?`<div class="dna-card-acts" style="margin-left:auto;" onclick="event.stopPropagation()">
            <button class="dna-card-btn" onclick="openEditSubfolder('${folder.id}','${sf.id}')" title="Editar">${ic('edit',10,'var(--dim2)')}</button>
            <button class="dna-card-btn" onclick="deleteDNASubfolder('${folder.id}','${sf.id}')" title="Excluir">${ic('trash',10,'var(--dim)')}</button>
          </div>`:''}</div>`;
      }).join('')}
    </div>`;
  }

  bodyHtml += `<div class="sec" style="margin-top:${subfolders.length?'20px':'0'};">ARQUIVOS ${items.length?`<span style="color:var(--dim2);font-size:9px;">(${items.length})</span>`:''}</div>`;

  if (!items.length) {
    bodyHtml += `<div class="empty" style="padding:30px 0 10px;">
      <div class="empty-icon">${ic('file',36,'var(--dim)')}</div>
      <h3>SEM ARQUIVOS</h3>
      <p>${isMgr?'Clique em + ARQUIVO para adicionar':'Peça ao manager para adicionar arquivos'}</p></div>`;
  } else {
    bodyHtml += `<div class="dna-items-list">
      ${items.map(item => _buildItemRow(item, folder.id, dnaViewSubId)).join('')}
    </div>`;
  }

  $('dna-folder-body').innerHTML = bodyHtml;
}

function _buildItemRow(item, folderId, subfolderId) {
  const isMgr     = meData?.access === 'manager';
  const typeIcon  = DNA_ITEM_ICONS[item.type]  || '📄';
  const typeLabel = DNA_ITEM_LABELS[item.type] || item.type;
  const crAt      = item.createdAt?.toDate ? item.createdAt.toDate() : null;
  const subParam  = subfolderId ? `,'${subfolderId}'` : ',null';
  const col = { image:'#CC88FF', text:'var(--cyan)', link:'var(--green)', pdf:'var(--red)' }[item.type] || 'var(--dim)';

  let contentHtml = '';

  if (item.type === 'image' && item.imageUrl) {
    contentHtml = `
      <div class="dna-item-img-wrap">
        <img src="${item.imageUrl}" class="dna-item-img-thumb"
          onclick="dnaExpandItem('${item.id}','${folderId}','${subfolderId||''}')"
          onerror="this.parentElement.style.display='none'">
        <div class="dna-item-img-overlay" onclick="dnaExpandItem('${item.id}','${folderId}','${subfolderId||''}')">
          ${ic('zoom-in',18,'white')} <span style="font-family:var(--M);font-size:10px;letter-spacing:1px;">AMPLIAR</span>
        </div>
      </div>`;
  } else if (item.type === 'text' && item.content) {
    const short   = item.content.replace(/\n/g, '<br>').slice(0, 240);
    const hasMore = item.content.length > 240;
    contentHtml = `
      <div class="dna-item-text-body">
        <div class="dna-item-text-content">${short}${hasMore ? '<span class="dna-text-fade">…</span>' : ''}</div>
        ${hasMore ? `<button class="dna-expand-btn" onclick="dnaExpandItem('${item.id}','${folderId}','${subfolderId||''}')">
          ${ic('maximize',11,'var(--cyan)')} LER COMPLETO
        </button>` : ''}
      </div>`;
  } else if (item.type === 'link' && item.url) {
    contentHtml = `
      <div class="dna-item-link-body">
        <a href="${item.url}" target="_blank" class="dna-item-link-chip" onclick="event.stopPropagation()">
          ${ic('link',12,'var(--green)')}
          <span class="dna-item-link-url">${item.url}</span>
          ${ic('arrow-up-right',10,'var(--green)')}
        </a>
        ${item.description ? `<div class="dna-item-link-desc">${item.description}</div>` : ''}
      </div>`;
  } else if (item.type === 'pdf' && item.url) {
    contentHtml = `
      <div class="dna-item-link-body">
        <a href="${item.url}" target="_blank" class="dna-item-link-chip dna-item-pdf-chip" onclick="event.stopPropagation()">
          ${ic('file',13,'var(--red)')}
          <span>Abrir PDF</span>
          ${ic('arrow-up-right',10,'var(--red)')}
        </a>
      </div>`;
  }

  return `<div class="dna-item-row" style="--item-col:${col}">
    <div class="dna-item-top">
      <div class="dna-item-left">
        <div class="dna-item-type-dot" style="background:${col};box-shadow:0 0 6px ${col}88;"></div>
        <div class="dna-item-info">
          <div class="dna-item-name">${item.name}</div>
          <div class="dna-item-meta">
            <span class="dna-item-type-label" style="color:${col};">${typeIcon} ${typeLabel}</span>
            <span class="dna-item-sep">·</span>
            ${ic('user',9,'var(--dim)')} <span>${item.createdByName || '—'}</span>
            <span class="dna-item-sep">·</span>
            <span>${crAt ? fmtTime({toDate:()=>crAt}) : '—'}</span>
          </div>
        </div>
      </div>
      <div class="dna-item-actions">
        ${item.type !== 'link' && item.type !== 'pdf' ? `
          <button class="dna-item-action-btn" onclick="dnaExpandItem('${item.id}','${folderId}','${subfolderId||''}')" title="Expandir">
            ${ic('maximize',11,'var(--dim2)')}
          </button>` : ''}
        ${isMgr ? `
          <button class="dna-item-action-btn" onclick="openEditItem('${item.id}','${folderId}'${subParam})" title="Editar">
            ${ic('edit',11,'var(--dim2)')}
          </button>
          <button class="dna-item-action-btn dna-item-del-btn" onclick="deleteDNAItem('${item.id}','${folderId}'${subParam})" title="Excluir">
            ${ic('trash',11,'currentColor')}
          </button>` : ''}
      </div>
    </div>
    ${contentHtml ? `<div class="dna-item-content-wrap">${contentHtml}</div>` : ''}
  </div>`;
}

function dnaExpandItem(itemId, folderId, subId) {
  const doc    = dnaAllDocs.find(d => d.id === dnaViewDocId); if (!doc) return;
  const folder = (doc.folders||[]).find(f => f.id === folderId); if (!folder) return;
  const items  = subId && subId !== '' ? ((folder.subfolders||[]).find(s => s.id === subId)?.items||[]) : (folder.items||[]);
  const item   = items.find(i => i.id === itemId); if (!item) return;

  const col = { image:'#CC88FF', text:'var(--cyan)', link:'var(--green)', pdf:'var(--red)' }[item.type] || 'var(--dim)';
  const typeIcon  = DNA_ITEM_ICONS[item.type]  || '📄';
  const typeLabel = DNA_ITEM_LABELS[item.type] || item.type;
  const crAt = item.createdAt?.toDate ? item.createdAt.toDate() : null;

  let bodyHtml = '';
  if (item.type === 'image' && item.imageUrl) {
    bodyHtml = `<img src="${item.imageUrl}" style="width:100%;max-height:70vh;object-fit:contain;display:block;border-radius:4px;" onerror="this.alt='Imagem não disponível'">`;
  } else if (item.type === 'text' && item.content) {
    bodyHtml = `<div class="dna-expand-text">${item.content.replace(/\n/g,'<br>')}</div>`;
  }

  $('dna-expand-icon').textContent  = typeIcon;
  $('dna-expand-title').textContent = item.name;
  $('dna-expand-meta').innerHTML    = `<span style="color:${col};">${typeLabel}</span> · ${ic('user',10,'var(--dim2)')} ${item.createdByName||'—'} · ${crAt?fmtTime({toDate:()=>crAt}):'—'}`;
  $('dna-expand-body').innerHTML    = bodyHtml;
  showModal('m-dna-expand');
}

// keep for backward compat
function _dnaOpenImg(itemId, folderId, subId) { dnaExpandItem(itemId, folderId, subId); }


// ── Navigation ────────────────────────────────
function closeDNAToMain() {
  dnaViewDocId=null; dnaViewFolderId=null; dnaViewSubId=null;
  renderStudioDNA();
}

// ═══════════════════════════════════════════════
//  CRUD — PASTAS
// ═══════════════════════════════════════════════
function openCreateDNAFolder() {
  dnaEditFolderId = null; dnaEditSubId = null;
  $('dna-folder-modal-title').innerHTML = 'NOVA <span style="color:var(--cyan)">PASTA</span>';
  $('dna-folder-name-inp').value=''; $('dna-folder-icon-inp').value='📁'; $('dna-folder-color-inp').value='#00C4B4';
  showModal('m-dna-folder');
}

function openEditFolder(folderId) {
  const doc    = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;
  const folder = (doc.folders||[]).find(f=>f.id===folderId); if (!folder) return;
  dnaEditFolderId = folderId; dnaEditSubId = null;
  $('dna-folder-modal-title').innerHTML = 'EDITAR <span style="color:var(--cyan)">PASTA</span>';
  $('dna-folder-name-inp').value = folder.name;
  $('dna-folder-icon-inp').value = folder.icon||'📁';
  $('dna-folder-color-inp').value = _dnaCol(folder.color||'#00C4B4');
  showModal('m-dna-folder');
}

async function saveDNAFolder() {
  const name  = $('dna-folder-name-inp').value.trim(); if (!name) { toast('Informe o nome da pasta',false); return; }
  const icon  = $('dna-folder-icon-inp').value.trim()||'📁';
  const color = $('dna-folder-color-inp').value||'#00C4B4';
  const doc   = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;

  const folders = (doc.folders||[]).map(f=>({...f,subfolders:(f.subfolders||[]).map(s=>({...s,items:(s.items||[]).map(i=>({...i}))}))}));

  if (dnaEditFolderId) {
    const fi = folders.findIndex(f=>f.id===dnaEditFolderId);
    if (fi>=0) Object.assign(folders[fi], { name, icon, color });
  } else {
    folders.push({ id:'f'+_uid(), name, icon, color, createdById:me.uid, createdByName:meData.displayName, createdAt:new Date(), items:[], subfolders:[] });
  }

  await _dnaPersist(doc.id, !!doc.isDefault, { folders });
  toast(dnaEditFolderId?'Pasta atualizada!':'Pasta criada!', true);
  closeModal('m-dna-folder');
  await renderStudioDNA();
}

async function deleteDNAFolder(folderId) {
  if (!confirm('Excluir esta pasta e todo o seu conteúdo?')) return;
  const doc = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;
  const folders = (doc.folders||[]).filter(f=>f.id!==folderId);
  await _dnaPersist(doc.id, !!doc.isDefault, { folders });
  toast('Pasta excluída'); await renderStudioDNA();
}

// ── Sub-pastas ────────────────────────────────
function openCreateSubfolder(folderId) {
  dnaEditFolderId=folderId; dnaEditSubId=null;
  $('dna-folder-modal-title').innerHTML = 'NOVA <span style="color:var(--cyan)">SUB-PASTA</span>';
  $('dna-folder-name-inp').value=''; $('dna-folder-icon-inp').value='📂'; $('dna-folder-color-inp').value='#00C4B4';
  showModal('m-dna-subfolder');
}

function openEditSubfolder(folderId, subId) {
  const doc    = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;
  const folder = (doc.folders||[]).find(f=>f.id===folderId); if (!folder) return;
  const sub    = (folder.subfolders||[]).find(s=>s.id===subId); if (!sub) return;
  dnaEditFolderId=folderId; dnaEditSubId=subId;
  $('dna-sub-modal-title').innerHTML = 'EDITAR <span style="color:var(--cyan)">SUB-PASTA</span>';
  $('dna-sub-name-inp').value=sub.name; $('dna-sub-icon-inp').value=sub.icon||'📂'; $('dna-sub-color-inp').value=_dnaCol(sub.color||'#00C4B4');
  showModal('m-dna-subfolder');
}

async function saveDNASubfolder() {
  const name  = $('dna-sub-name-inp').value.trim(); if (!name) { toast('Informe o nome',false); return; }
  const icon  = $('dna-sub-icon-inp').value.trim()||'📂';
  const color = $('dna-sub-color-inp').value||'#00C4B4';
  const doc   = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;

  const folders = (doc.folders||[]).map(f=>{
    if (f.id!==dnaEditFolderId) return f;
    const subs = (f.subfolders||[]).map(s=>({...s,items:(s.items||[]).map(i=>({...i}))}));
    if (dnaEditSubId) {
      const si = subs.findIndex(s=>s.id===dnaEditSubId);
      if (si>=0) Object.assign(subs[si], { name, icon, color });
    } else {
      subs.push({ id:'sf'+_uid(), name, icon, color, createdById:me.uid, createdByName:meData.displayName, createdAt:new Date(), items:[] });
    }
    return { ...f, subfolders:subs };
  });

  await _dnaPersist(doc.id, !!doc.isDefault, { folders });
  toast(dnaEditSubId?'Sub-pasta atualizada!':'Sub-pasta criada!', true);
  closeModal('m-dna-subfolder');
  await renderStudioDNA();
}

async function deleteDNASubfolder(folderId, subId) {
  if (!confirm('Excluir esta sub-pasta e seus itens?')) return;
  const doc = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;
  const folders = (doc.folders||[]).map(f=>{
    if (f.id!==folderId) return f;
    return { ...f, subfolders:(f.subfolders||[]).filter(s=>s.id!==subId) };
  });
  await _dnaPersist(doc.id, !!doc.isDefault, { folders });
  toast('Sub-pasta excluída'); dnaViewSubId=null; await renderStudioDNA();
}

// ═══════════════════════════════════════════════
//  CRUD — ITENS
// ═══════════════════════════════════════════════
function openCreateItem() {
  dnaEditItemId=null; dnaItemImgB64=null;
  $('dna-item-modal-title').innerHTML = 'NOVO <span style="color:var(--cyan)">ARQUIVO</span>';
  $('dna-item-save-btn').textContent = 'ADICIONAR';
  $('dna-item-name').value='';
  $('dna-item-img-url').value=''; $('dna-item-img-preview').innerHTML=''; $('dna-item-img-fname').textContent='';
  $('dna-item-content').value='';
  $('dna-item-url').value=''; $('dna-item-desc').value='';
  $('dna-item-pdf-url').value='';
  dnaSelectItemType('image', document.querySelector('[data-type="image"]'));
  showModal('m-dna-item');
}

function openEditItem(itemId, folderId, subId) {
  const doc    = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;
  const folder = (doc.folders||[]).find(f=>f.id===folderId); if (!folder) return;
  const items  = subId&&subId!=='null' ? ((folder.subfolders||[]).find(s=>s.id===subId)?.items||[]) : (folder.items||[]);
  const item   = items.find(i=>i.id===itemId); if (!item) return;
  dnaEditItemId=itemId; dnaEditFolderId=folderId; dnaEditSubId=(subId&&subId!=='null')?subId:null;
  dnaItemImgB64=null;
  $('dna-item-modal-title').innerHTML = 'EDITAR <span style="color:var(--cyan)">ARQUIVO</span>';
  $('dna-item-save-btn').textContent  = 'SALVAR';
  $('dna-item-name').value = item.name;
  // Activate type tab
  const tab = document.querySelector(`[data-type="${item.type}"]`);
  dnaSelectItemType(item.type, tab);
  if (item.type==='image')  { $('dna-item-img-url').value=item.imageUrl&&!item.imageUrl.startsWith('data:')?item.imageUrl:''; if (item.imageUrl) $('dna-item-img-preview').innerHTML=`<img src="${item.imageUrl}" style="max-height:80px;max-width:100%;object-fit:cover;border-radius:3px;" onerror="this.style.display='none'">`; }
  if (item.type==='text')   { $('dna-item-content').value=item.content||''; }
  if (item.type==='link')   { $('dna-item-url').value=item.url||''; $('dna-item-desc').value=item.description||''; }
  if (item.type==='pdf')    { $('dna-item-pdf-url').value=item.url||''; }
  showModal('m-dna-item');
}

function dnaSelectItemType(type, btn) {
  _dnaCurrentItemType = type;
  document.querySelectorAll('.dna-type-tab').forEach(t => t.classList.toggle('active', t.dataset.type===type));
  ['image','text','link','pdf'].forEach(t => { const el=$(`dna-item-${t}-fields`); if(el) el.classList.toggle('hidden',t!==type); });
}

function dnaHandleItemImg(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 8*1024*1024) { toast('Imagem muito grande (máx 8MB)',false); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1200/img.width, 1200/img.height, 1);
      const w=Math.round(img.width*scale), h=Math.round(img.height*scale);
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      dnaItemImgB64 = cv.toDataURL('image/jpeg',.82);
      $('dna-item-img-fname').textContent = file.name;
      $('dna-item-img-url').value = '';
      $('dna-item-img-preview').innerHTML = `<img src="${dnaItemImgB64}" style="max-height:80px;max-width:100%;object-fit:cover;border-radius:3px;">`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveDNAItem() {
  const name = $('dna-item-name').value.trim(); if (!name) { toast('Informe o nome',false); return; }
  const type = _dnaCurrentItemType;
  const doc  = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;

  let itemData = { name, type, createdById:me.uid, createdByName:meData.displayName, createdAt:new Date() };

  if (type==='image') {
    const url = dnaItemImgB64 || $('dna-item-img-url').value.trim();
    if (!url) { toast('Adicione uma imagem ou URL',false); return; }
    itemData.imageUrl = url;
  } else if (type==='text') {
    const c = $('dna-item-content').value; if (!c.trim()) { toast('Escreva o conteúdo',false); return; }
    itemData.content = c;
  } else if (type==='link') {
    const u = $('dna-item-url').value.trim(); if (!u) { toast('Informe a URL',false); return; }
    itemData.url = u; itemData.description = $('dna-item-desc').value.trim();
  } else if (type==='pdf') {
    const u = $('dna-item-pdf-url').value.trim(); if (!u) { toast('Informe a URL do PDF',false); return; }
    itemData.url = u;
  }

  // Deep copy folders
  const folders = JSON.parse(JSON.stringify(doc.folders||[]));
  const fi = folders.findIndex(f=>f.id===dnaViewFolderId);
  if (fi<0) { toast('Pasta não encontrada',false); return; }

  if (dnaViewSubId) {
    const si = (folders[fi].subfolders||[]).findIndex(s=>s.id===dnaViewSubId);
    if (si<0) { toast('Sub-pasta não encontrada',false); return; }
    if (!folders[fi].subfolders[si].items) folders[fi].subfolders[si].items=[];
    if (dnaEditItemId) {
      const ii = folders[fi].subfolders[si].items.findIndex(i=>i.id===dnaEditItemId);
      if (ii>=0) { const old=folders[fi].subfolders[si].items[ii]; folders[fi].subfolders[si].items[ii]={...old,...itemData}; }
    } else {
      folders[fi].subfolders[si].items.push({ id:'i'+_uid(), ...itemData });
    }
  } else {
    if (!folders[fi].items) folders[fi].items=[];
    if (dnaEditItemId) {
      const ii = folders[fi].items.findIndex(i=>i.id===dnaEditItemId);
      if (ii>=0) { const old=folders[fi].items[ii]; folders[fi].items[ii]={...old,...itemData}; }
    } else {
      folders[fi].items.push({ id:'i'+_uid(), ...itemData });
    }
  }

  await _dnaPersist(doc.id, !!doc.isDefault, { folders });
  toast(dnaEditItemId?'Arquivo atualizado!':'Arquivo adicionado!', true);
  closeModal('m-dna-item');
  dnaEditItemId=null; dnaItemImgB64=null;
  await renderStudioDNA();
}

async function deleteDNAItem(itemId, folderId, subId) {
  if (!confirm('Excluir este arquivo?')) return;
  const doc = dnaAllDocs.find(d=>d.id===dnaViewDocId); if (!doc) return;
  const folders = JSON.parse(JSON.stringify(doc.folders||[]));
  const fi = folders.findIndex(f=>f.id===folderId); if (fi<0) return;
  if (subId&&subId!=='null') {
    const si = (folders[fi].subfolders||[]).findIndex(s=>s.id===subId); if (si<0) return;
    folders[fi].subfolders[si].items = (folders[fi].subfolders[si].items||[]).filter(i=>i.id!==itemId);
  } else {
    folders[fi].items = (folders[fi].items||[]).filter(i=>i.id!==itemId);
  }
  await _dnaPersist(doc.id, !!doc.isDefault, { folders });
  toast('Arquivo excluído'); await renderStudioDNA();
}

// ═══════════════════════════════════════════════
//  CRUD — DOCUMENTOS
// ═══════════════════════════════════════════════
// ── Icon picker helpers ───────────────────────
function dnaIconTab(tab, prefix) {
  // Toggle tabs
  ['emoji','url','upload'].forEach(t => {
    const el = $(`${prefix}-icon-tab-${t}`); if (el) el.classList.toggle('hidden', t !== tab);
  });
  const picker = $(`${prefix}-icon-picker`);
  if (picker) picker.querySelectorAll('.dna-icon-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}

function dnaIconPreview(emoji, url, prefix) {
  const prev  = $(`${prefix}-icon-preview`); if (!prev) return;
  const imgEl = $(`${prefix}-icon-img`);
  if (url && url.trim()) {
    prev.innerHTML = `<img src="${url.trim()}" style="width:44px;height:44px;object-fit:contain;border-radius:4px;" onerror="this.parentElement.textContent='❌'">`;
    if (imgEl) imgEl.value = url.trim();
  } else if (emoji && emoji.trim()) {
    prev.textContent = emoji.trim() || '📄';
    if (imgEl) imgEl.value = '';
  }
}

function dnaIconUpload(input, prefix) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 4 * 1024 * 1024) { toast('Imagem muito grande (máx 4MB)', false); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const MAX = 120, scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      const b64 = cv.toDataURL('image/png');
      const prev = $(`${prefix}-icon-preview`);
      if (prev) prev.innerHTML = `<img src="${b64}" style="width:44px;height:44px;object-fit:contain;border-radius:4px;">`;
      const imgEl = $(`${prefix}-icon-img`); if (imgEl) imgEl.value = b64;
      const fname = $(`${prefix}-icon-fname`); if (fname) fname.textContent = file.name;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function _dnaGetIcon(prefix) {
  // Returns { icon, iconImg } — iconImg is URL/b64, icon is emoji
  const imgVal = $(`${prefix}-icon-img`)?.value?.trim() || '';
  const emoji  = $(`${prefix}-icon`)?.value?.trim()    || '';
  return { icon: imgVal ? '' : (emoji || '📄'), iconImg: imgVal || null };
}

function _dnaSetIconPicker(prefix, doc) {
  // Reset tabs
  dnaIconTab('emoji', prefix);
  const prev   = $(`${prefix}-icon-preview`);
  const imgInp = $(`${prefix}-icon-img`);
  const emoInp = $(`${prefix}-icon`);
  const fname  = $(`${prefix}-icon-fname`);
  if (fname) fname.textContent = '';
  if (imgInp) imgInp.value = '';

  if (doc?.iconImg) {
    // Has image icon
    if (imgInp) imgInp.value = doc.iconImg;
    if (prev) prev.innerHTML = `<img src="${doc.iconImg}" style="width:44px;height:44px;object-fit:contain;border-radius:4px;">`;
    if (emoInp) emoInp.value = '';
    // Switch to correct tab
    const isB64 = doc.iconImg.startsWith('data:');
    dnaIconTab(isB64 ? 'upload' : 'url', prefix);
    const urlInp = $(`${prefix}-icon-url`); if (urlInp && !isB64) urlInp.value = doc.iconImg;
  } else {
    const emoji = doc?.icon || '📄';
    if (emoInp) emoInp.value = emoji;
    if (prev) prev.textContent = emoji;
  }
}

function openCreateDNA() {
  $('dna-title').value=''; $('dna-cat-input').value='';
  $('dna-subtitle').value=''; $('dna-color').value='#00C4B4'; $('dna-cover').value='';
  _dnaSetIconPicker('dna', null);
  const dl=$('dna-cat-datalist'); if(dl) dl.innerHTML=Object.keys(_getDnaCats()).map(c=>`<option value="${c}">`).join('');
  showModal('m-dna-create');
}

async function saveDNADoc() {
  const title = $('dna-title').value.trim(); if (!title) { toast('Informe o título',false); return; }
  const { icon, iconImg } = _dnaGetIcon('dna');
  const data = {
    title, subtitle:$('dna-subtitle').value.trim(), icon, iconImg,
    color:$('dna-color').value||'#00C4B4', category:$('dna-cat-input').value.trim()||'Geral',
    coverImage:$('dna-cover').value.trim()||null, folders:[],
    order:Date.now(), createdById:me.uid, createdByName:meData.displayName,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  const ref = await db.collection('studioDNA').add(data);
  await log('project_create',`${meData.displayName} criou o documento "${title}"`);
  toast('Documento criado!',true); closeModal('m-dna-create');
  await renderStudioDNA(); openDNADoc(ref.id);
}

function openEditDNADoc(docId, isDefault) {
  const doc = dnaAllDocs.find(d=>d.id===docId); if (!doc) return;
  $('dna-edit-title').value=doc.title||''; $('dna-edit-subtitle').value=doc.subtitle||'';
  $('dna-edit-color').value=_dnaCol(doc.color||'#00C4B4');
  $('dna-edit-cat').value=doc.category||'Geral'; $('dna-edit-cover').value=doc.coverImage||'';
  $('dna-edit-doc-id').value=docId; $('dna-edit-is-default').value=isDefault?'1':'0';
  _dnaSetIconPicker('dna-edit', doc);
  const sel=$('dna-edit-proj-sel');
  sel.innerHTML=`<option value="">— Nenhum —</option>${projects.filter(p=>!p.archived).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}`;
  sel.value=doc.projectId||'';
  showModal('m-dna-edit');
}

async function saveEditDNADoc() {
  const docId     = $('dna-edit-doc-id').value;
  const isDefault = $('dna-edit-is-default').value==='1';
  const title     = $('dna-edit-title').value.trim(); if (!title) { toast('Informe o título',false); return; }
  const { icon, iconImg } = _dnaGetIcon('dna-edit');
  const data = {
    title, subtitle:$('dna-edit-subtitle').value.trim(), icon, iconImg,
    color:$('dna-edit-color').value||'#00C4B4', category:$('dna-edit-cat').value.trim()||'Geral',
    coverImage:$('dna-edit-cover').value.trim()||null, projectId:$('dna-edit-proj-sel').value||null,
  };
  await _dnaPersist(docId, isDefault, data);
  toast('Documento atualizado!',true); closeModal('m-dna-edit');
  await renderStudioDNA();
}


async function deleteDNADoc(id, isDefault) {
  if (!confirm('Excluir este documento e todas as suas pastas?')) return;
  const doc = dnaAllDocs.find(d=>d.id===id);
  if (isDefault) await db.collection('studioDNA').doc(id).set({ _deleted:true, order:9999 });
  else await db.collection('studioDNA').doc(id).delete();
  await log('task_delete',`${meData.displayName} removeu o documento "${doc?.title}"`);
  toast('Documento removido.',true); closeDNAToMain();
}

// ── Link project ──────────────────────────────
function openLinkProject(docId) {
  dnaLinkDocId=docId;
  const doc = dnaAllDocs.find(d=>d.id===docId);
  const sel = $('dna-link-proj-sel');
  sel.innerHTML=`<option value="">— Nenhum —</option>${projects.filter(p=>!p.archived).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}`;
  sel.value=doc?.projectId||'';
  showModal('m-dna-link-proj');
}

async function saveLinkProject() {
  const projId = $('dna-link-proj-sel').value||null;
  const doc    = dnaAllDocs.find(d=>d.id===dnaLinkDocId); if (!doc) return;
  await _dnaPersist(dnaLinkDocId, !!doc.isDefault, { projectId:projId });
  if (projId) await db.collection('projects').doc(projId).update({ dnaDocId:dnaLinkDocId });
  toast('Vínculo salvo!',true); closeModal('m-dna-link-proj');
  await renderStudioDNA();
}

// ── Folder request (membros) ──────────────────
function openFolderRequest(docId) {
  dnaFolderReqDocId=docId;
  $('dna-req-folder-name').value='';
  $('dna-req-folder-reason').value='';
  showModal('m-dna-folder-req');
}

async function saveFolderRequest() {
  const name   = $('dna-req-folder-name').value.trim(); if (!name) { toast('Informe o nome da pasta',false); return; }
  const reason = $('dna-req-folder-reason').value.trim();
  const doc    = dnaAllDocs.find(d=>d.id===dnaFolderReqDocId); if (!doc) return;
  await db.collection('dnaFolderRequests').add({
    docId:dnaFolderReqDocId, docTitle:doc.title,
    folderName:name, reason:reason||'—',
    requestedById:me.uid, requestedByName:meData.displayName,
    status:'pending', createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  for (const mgr of users.filter(u=>u.access==='manager'))
    await saveNotif(mgr.uid,'patch_note',`Solicitação de pasta: "${name}"`,{ fromName:meData.displayName, reason:`Em "${doc.title}"${reason?` — ${reason}`:''}` });
  toast('Solicitação enviada!',true); closeModal('m-dna-folder-req');
  await updBadge();
}

async function approveFolderRequest(reqId) {
  const snap = await db.collection('dnaFolderRequests').doc(reqId).get();
  const r    = snap.data(); if (!r) return;
  const doc  = dnaAllDocs.find(d=>d.id===r.docId);
  if (!doc)  { toast('Documento não encontrado',false); return; }
  const folders = JSON.parse(JSON.stringify(doc.folders||[]));
  folders.push({ id:'f'+_uid(), name:r.folderName, icon:'📁', color:'#00C4B4', createdById:r.requestedById, createdByName:r.requestedByName, createdAt:new Date(), items:[], subfolders:[] });
  await _dnaPersist(r.docId, !!doc?.isDefault, { folders });
  await db.collection('dnaFolderRequests').doc(reqId).update({ status:'approved' });
  await saveNotif(r.requestedById,'task_approved',r.folderName,{ fromName:meData.displayName, reason:`Pasta criada em "${r.docTitle}"` });
  toast('Pasta criada!',true); await refresh(); renderCurView(); updBadge();
}

async function rejectFolderRequest(reqId) {
  const snap = await db.collection('dnaFolderRequests').doc(reqId).get();
  const r    = snap.data(); if (!r) return;
  await db.collection('dnaFolderRequests').doc(reqId).update({ status:'rejected' });
  await saveNotif(r.requestedById,'rejection',r.folderName,{ fromName:meData.displayName, reason:`Solicitação de pasta em "${r.docTitle}" foi rejeitada` });
  toast('Solicitação rejeitada.'); renderCurView(); updBadge();
}

// ── Persist helper ────────────────────────────
async function _dnaPersist(docId, isDefault, data) {
  const payload = { ...data, updatedAt:firebase.firestore.FieldValue.serverTimestamp() };
  if (isDefault) await db.collection('studioDNA').doc(docId).set({ ...payload, _deleted:false }, { merge:true });
  else           await db.collection('studioDNA').doc(docId).update(payload);
  const idx = dnaAllDocs.findIndex(d=>d.id===docId);
  if (idx>=0) Object.assign(dnaAllDocs[idx], data);
}