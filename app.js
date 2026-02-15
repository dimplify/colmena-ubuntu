let DATA = null;
let activeTab = "feed";

function pct(n, total){
  return total === 0 ? 0 : Math.round((n/total)*1000)/10;
}

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

function emotionLabel(key){
  return DATA.emotions.find(e => e.key === key)?.label ?? key;
}

function emotionColor(key){
  return DATA.emotions.find(e => e.key === key)?.color ?? "#999";
}

function clusterTitle(id){
  return DATA.clusters.find(c => c.id === id)?.title ?? id;
}

function render(){
  const screen = document.getElementById("screen");
  screen.innerHTML = "";

  if(activeTab === "feed") screen.appendChild(renderFeed());
  if(activeTab === "collective") screen.appendChild(renderCollective());
  if(activeTab === "about") screen.appendChild(renderAbout());
}

function renderFeed(){
  const root = el(`
    <div>
      <div class="card">
        <h3>Feed (piloto)</h3>
        <div class="small">
          Publicaciones anonimizadas del piloto. En producto real, el feed sería continuo y el termómetro se calcularía sobre una ventana móvil (p.ej., ${DATA.app.windowSizeLabel}).
        </div>
        <button class="btn" id="goCollective">Ver visión colectiva</button>
      </div>
      <div id="postList"></div>
    </div>
  `);

  root.querySelector("#goCollective").onclick = () => {
    setTab("collective");
  };

  const list = root.querySelector("#postList");
  DATA.posts.forEach(p => {
    const card = el(`
      <div class="card">
        <div class="meta">
          <span class="badge">${p.ageRange}</span>
          <span class="badge">${clusterTitle(p.clusterId)}</span>
          <span class="badge" style="border-color:${emotionColor(p.emotionKey)}; color:${emotionColor(p.emotionKey)}">
            ${emotionLabel(p.emotionKey)}
          </span>
        </div>
        <div class="kv">
          <span class="label">Situación</span>
          ${p.situation}
        </div>
        <div class="kv">
          <span class="label">Aprendizaje</span>
          ${p.learning}
        </div>
        <div class="kv">
          <span class="label">Qué habría ayudado</span>
          ${p.needed}
        </div>
      </div>
    `);
    list.appendChild(card);
  });

  return root;
}

function renderCollective(){
  const total = Object.values(DATA.thermometer.counts).reduce((a,b)=>a+b,0);

  const root = el(`
    <div>
      <div class="card">
        <h3>Termómetro emocional (${DATA.app.pilotWindowSizeLabel})</h3>
        <div class="small">${DATA.thermometer.trend.label}. ${DATA.thermometer.trend.note}</div>
        <div class="hr"></div>
        <div class="bubbles" id="bubbles"></div>
      </div>

      <div class="card">
        <h3>Clusters detectados</h3>
        <div id="clusters"></div>
      </div>

      <div class="card">
        <h3>Reto sugerido (IA + validación humana)</h3>
        <div class="meta"><span class="badge">${DATA.challenge.status}</span></div>
        <div class="kv">${DATA.challenge.copy}</div>
      </div>

      <div class="card">
        <h3>Feedback (Fase 2)</h3>
        <div class="small">Ayúdame a validar si esta visión colectiva aporta valor. (3 min)</div>
        <button class="btn" id="openSurvey">Abrir encuesta</button>
      </div>
    </div>
  `);

  const bubbles = root.querySelector("#bubbles");
  DATA.emotions.forEach(e => {
    const count = DATA.thermometer.counts[e.key] ?? 0;
    const percent = pct(count, total);
    // tamaño: base 44 + percent*1.4
    const size = Math.round(44 + (percent * 1.4));
    const b = el(`
      <div class="bubble" title="${e.label}: ${percent}%"
           style="background:${e.color}; width:${size}px; height:${size}px;">
        ${percent}%
      </div>
    `);
    bubbles.appendChild(b);
  });

  const cl = root.querySelector("#clusters");
  DATA.clusters.forEach(c => {
    cl.appendChild(el(`
      <div class="card" style="margin:10px 0 0;">
        <h3 style="margin:0 0 6px 0;">${c.title}</h3>
        <div class="small">${c.short}</div>
      </div>
    `));
  });

  root.querySelector("#openSurvey").onclick = () => {
    const url = DATA.links?.surveyPhase2Url;
    if(!url || url.includes("PON_AQUI")) {
      alert("Añade tu enlace de la encuesta en data.json → links.surveyPhase2Url");
      return;
    }
    window.open(url, "_blank");
  };

  return root;
}

function renderAbout(){
  return el(`
    <div>
      <div class="card">
        <h3>¿Qué es Colmena Ubuntu?</h3>
        <div class="small">
          Un concepto de ecosistema digital donde la IA transforma experiencias individuales en inteligencia colectiva estructurada.
          No es terapia ni diagnóstico. Es una capa de comprensión y aprendizaje comunitario.
        </div>
        <div class="hr"></div>
        <div class="small">
          <b>Anonimato + verificación:</b> en el TFM se plantea como requisito de coherencia y seguridad.<br/>
          <b>IA semi-visible:</b> la usuaria ve la “visión colectiva” (clusters, síntesis, termómetro), no el modelo en sí.
        </div>
      </div>

      <div class="card">
        <h3>Transparencia</h3>
        <div class="small">
          Demo basada en el piloto (15 relatos). En producto real, la lectura emocional se calcularía sobre una ventana móvil (p.ej., últimos 100 posts) y las sugerencias estarían moderadas por humanos.
        </div>
      </div>
    </div>
  `);
}

function setTab(tab){
  activeTab = tab;
  document.querySelectorAll(".tab").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  render();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if(!btn) return;
  setTab(btn.dataset.tab);
});

load();
