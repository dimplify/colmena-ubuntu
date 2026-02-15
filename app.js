let DATA = null;
let activeTab = "colmena";
let selectedRelatoId = null;

function el(html){
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

async function load(){
  const res = await fetch("data.json");
  DATA = await res.json();
  document.getElementById("appName").textContent = DATA.app.name;
  document.getElementById("appTagline").textContent = DATA.app.tagline;
  render();
}

function setTab(tab){
  activeTab = tab;
  document.querySelectorAll(".tab").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  render();
}

function momentTitle(id){
  const m = DATA.moments.items.find(x => x.id === id);
  return m ? m.title : id;
}

function render(){
  const screen = document.getElementById("screen");
  screen.innerHTML = "";

  if(activeTab === "colmena") screen.appendChild(renderColmena());
  if(activeTab === "emociones") screen.appendChild(renderEmociones());
  if(activeTab === "momentos") screen.appendChild(renderMomentos());
  if(activeTab === "relatos") screen.appendChild(renderRelatos());

  if(selectedRelatoId) {
    const rel = DATA.relatos.find(r => r.id === selectedRelatoId);
    if(rel) document.body.appendChild(renderModal(rel));
  }
}

/* 1) Colmena */
function renderColmena(){
  const root = el(`
    <div>
      <div class="card">
        <h2>Colmena Ubuntu</h2>
        <div class="small" style="font-size:13px; line-height:1.55;">
          <b>Yo soy porque nosotras somos.</b><br><br>
          Aquí compartimos momentos reales de nuestras vidas: miedo, cambio, pérdida, amor.<br><br>
          Cada relato suma. Cada emoción deja huella.<br><br>
          La Inteligencia Artificial no sustituye nuestras voces.
          Las escucha, las conecta y transforma lo individual en sabiduría colectiva.<br><br>
          Eres anónima. Eres real. Eres parte de algo más grande.
        </div>
        <button class="btn" id="goEmotions">Ver cómo estamos hoy</button>
      </div>

      <div class="card">
        <h3>Nota (TFM)</h3>
        <div class="small">
          Esta es una demo de concepto. No es terapia ni diagnóstico. La IA se utiliza para síntesis y patrones agregados,
          con validación humana en sugerencias comunitarias.
        </div>
      </div>
    </div>
  `);

  root.querySelector("#goEmotions").onclick = () => setTab("emociones");
  return root;
}

/* 2) Emociones */
function renderEmociones(){
  const root = el(`
    <div>
      <div class="card">
        <h2>Emociones</h2>
        <div class="small" style="font-size:13px; line-height:1.55;">
          ${DATA.emotionCloud.narrative}
        </div>
        <div class="hr"></div>
        <div class="cloudWrap" id="cloud"></div>
        <div class="cloudNote">${DATA.emotionCloud.note}</div>
      </div>

      <div class="card">
        <h3>Reto sugerido</h3>
        <div class="meta"><span class="badge">${DATA.challenge.status}</span></div>
        <div class="small" style="font-size:13px; line-height:1.55;">
          ${DATA.challenge.copy}
        </div>
      </div>

      <div class="card">
        <h3>Feedback (Fase 2)</h3>
        <div class="small">Si puedes, ayúdame a validar esta “visión colectiva”. (3 min)</div>
        <button class="btn secondary" id="openSurvey">Abrir encuesta</button>
      </div>
    </div>
  `);

  const cloud = root.querySelector("#cloud");

  // Create floating blobs
  DATA.emotionCloud.items.forEach((it, idx) => {
    // size: base 46 + weight*8
    const size = Math.round(46 + it.weight * 8);
    const blob = el(`
      <div class="blob ${it.anim}" data-color="${it.style}"
           style="left:${it.pos.x}%; top:${it.pos.y}%; font-size:${Math.max(12, Math.round(size/6))}px;">
        ${it.label}
      </div>
    `);
    // Adjust padding based on size
    blob.style.padding = `${Math.round(size/4)}px ${Math.round(size/3)}px`;
    cloud.appendChild(blob);
  });

  root.querySelector("#openSurvey").onclick = () => {
    const url = DATA.links?.surveyPhase2Url;
    if(!url || url.includes("PON_AQUI")) {
      alert("Añade tu enlace en data.json → links.surveyPhase2Url");
      return;
    }
    window.open(url, "_blank");
  };

  return root;
}

/* 3) Momentos */
function renderMomentos(){
  const root = el(`
    <div>
      <div class="card">
        <h2>${DATA.moments.title}</h2>
        <div class="small">${DATA.moments.subtitle}</div>
      </div>
      <div id="list"></div>
    </div>
  `);

  const list = root.querySelector("#list");
  DATA.moments.items.forEach(m => {
    list.appendChild(el(`
      <div class="card">
        <h3>${m.title}</h3>
        <div class="small" style="font-size:13px; line-height:1.55;">
          ${m.text}
        </div>
      </div>
    `));
  });

  return root;
}

/* 4) Relatos */
function renderRelatos(){
  const root = el(`
    <div>
      <div class="card">
        <h2>Relatos</h2>
        <div class="small">
          Historias anonimizadas del piloto, reescritas por IA para proteger detalles personales.
          Al entrar en cada relato, puedes leer la versión original (tal y como se recogió en la encuesta).
        </div>
      </div>

      <div id="relList"></div>
    </div>
  `);

  const list = root.querySelector("#relList");
  DATA.relatos.forEach(r => {
    const card = el(`
      <div class="card">
        <div class="meta">
          <span class="badge">${r.nickname}</span>
          <span class="badge">${r.ageRange}</span>
          <span class="badge">${momentTitle(r.momentId)}</span>
        </div>

        <h3>${r.title}</h3>
        <div class="small" style="font-size:13px; line-height:1.55;">
          ${r.summary}
        </div>

        <button class="btn secondary" data-open="${r.id}">Leer relato completo</button>
      </div>
    `);
    card.querySelector(`[data-open="${r.id}"]`).onclick = () => {
      selectedRelatoId = r.id;
      render();
    };
    list.appendChild(card);
  });

  return root;
}

/* Modal for detail */
function renderModal(rel){
  const overlay = el(`
    <div class="modalOverlay" role="dialog" aria-modal="true"></div>
  `);

  const modal = el(`
    <div class="modal">
      <div class="modalHeader">
        <div>
          <div class="modalTitle">${rel.nickname} · ${rel.title}</div>
          <div class="modalSub">Versión original del testimonio (encuesta piloto)</div>
        </div>
        <button class="iconBtn" id="close">Cerrar</button>
      </div>
      <div class="modalBody">
        <div class="card" style="margin:0;">
          <div class="kv">
            <span class="label">Situación</span>
            ${rel.original.situation}
          </div>
          <div class="kv">
            <span class="label">Emoción predominante</span>
            ${rel.original.emotion}
          </div>
          <div class="kv">
            <span class="label">Aprendizaje</span>
            ${rel.original.learning}
          </div>
          <div class="kv">
            <span class="label">Qué habría ayudado</span>
            ${rel.original.needed}
          </div>

          <div class="actionsRow">
            <button class="action" id="reply">💬 Responder</button>
            <button class="action" id="follow">🌼 Seguir</button>
            <button class="action" id="dm">✉️ Mensaje</button>
          </div>

          <div class="toast" id="toast"></div>
        </div>
      </div>
    </div>
  `);

  function close(){
    selectedRelatoId = null;
    overlay.remove();
    modal.remove();
  }

  overlay.onclick = (e) => {
    if(e.target === overlay) close();
  };

  modal.querySelector("#close").onclick = close;

  const toast = modal.querySelector("#toast");
  modal.querySelector("#reply").onclick = () => {
    toast.textContent = "Simulación: aquí se abriría un hilo de conversación.";
  };
  modal.querySelector("#follow").onclick = () => {
    toast.textContent = "Simulación: ahora sigues a esta usuaria (solo demo).";
  };
  modal.querySelector("#dm").onclick = () => {
    toast.textContent = "Simulación: aquí se abriría un chat privado (solo demo).";
  };

  overlay.appendChild(modal);

  // ESC closes
  const onKey = (e) => {
    if(e.key === "Escape"){
      document.removeEventListener("keydown", onKey);
      close();
    }
  };
  document.addEventListener("keydown", onKey);

  return overlay;
}

/* Tab click */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if(!btn) return;
  setTab(btn.dataset.tab);
});

load();
