const form = document.getElementById("configForm");
const status = document.getElementById("status");
const openDashboard = document.getElementById("openDashboard");
const openCameraSetup = document.getElementById("openCameraSetup");
const openLanProfile = document.getElementById("openLanProfile");
const openAbout = document.getElementById("openAbout");
const saveButton = document.getElementById("saveConfig");
const addCameraStream = document.getElementById("addCameraStream");
const streamEditor = document.getElementById("streamEditor");
const engineStatus = document.getElementById("engineStatus");
const rtmpSources = document.getElementById("rtmpSources");
const summaryCards = document.getElementById("summaryCards");
const cameraPreview = document.getElementById("cameraPreview");

let minimumStreamCards = 3;

// escapeHtml protege les valeurs affichees dans les cartes dynamiques.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// trimLine retire les espaces superflus autour d'une ligne.
function trimLine(line) {
  return line.trim();
}

// isFilledLine indique si une ligne contient vraiment du texte.
function isFilledLine(line) {
  return Boolean(line);
}

// parseStreamLine transforme une ligne texte en definition de flux.
function parseStreamLine(line) {
  const [name, sourceUrl = ""] = line.split("|");
  return {
    name: name.trim(),
    sourceUrl: sourceUrl.trim(),
    enabled: true,
  };
}

// formatStreamLine convertit un flux en ligne editable.
function formatStreamLine(stream) {
  return `${stream.name} | ${stream.sourceUrl ?? ""}`;
}

// setStatus met a jour le message visible dans l'interface.
function setStatus(message) {
  status.textContent = message;
}

// setEngineStatus affiche l'etat du moteur RTMP dans le panneau de config.
function setEngineStatus(engine) {
  if (!engineStatus) {
    return;
  }

  if (engine.running) {
    engineStatus.textContent = `Moteur RTMP actif${engine.binaryPath ? `: ${engine.binaryPath}` : ""}`;
    engineStatus.dataset.state = "running";
    return;
  }

  engineStatus.textContent = engine.message || "Moteur RTMP indisponible";
  engineStatus.dataset.state = "offline";
}

// formatSummaryValue renvoie une valeur lisible pour une carte de resume.
function formatSummaryValue(summary, engine, type) {
  switch (type) {
    case "engine":
      return engine.running ? "Actif" : "En attente";
    case "cameras":
      return `${summary.activeStreams}/${summary.configuredStreams}`;
    case "buffer":
      return `${summary.bufferSeconds}s`;
    case "retention":
      return `${summary.retentionHours}h`;
    default:
      return "BouVideoServ";
  }
}

// renderSummaryCards affiche les indicateurs principaux de configuration.
function renderSummaryCards(summary, engine) {
  if (!summaryCards) {
    return;
  }

  const cards = [
    {
      label: "Moteur",
      value: formatSummaryValue(summary, engine, "engine"),
      note: engine.message || "Etat courant du moteur MediaMTX",
    },
    {
      label: "Cameras",
      value: formatSummaryValue(summary, engine, "cameras"),
      note: `${summary.minimumCameraCount} minimum configure`,
    },
    {
      label: "Buffer",
      value: formatSummaryValue(summary, engine, "buffer"),
      note: "Cache local pour la V1",
    },
    {
      label: "Conservation",
      value: formatSummaryValue(summary, engine, "retention"),
      note: `Enregistrement: ${summary.recordingDirectory}`,
    },
  ];

  summaryCards.innerHTML = "";
  for (const card of cards) {
    const article = document.createElement("article");
    article.className = "summary-card";
    article.innerHTML = `
      <span class="label">${escapeHtml(card.label)}</span>
      <span class="value">${escapeHtml(card.value)}</span>
      <p class="note">${escapeHtml(card.note)}</p>
    `;
    summaryCards.appendChild(article);
  }
}

// updateStreamCardState rafraichit le titre et le statut visuel d'une carte camera.
function updateStreamCardState(card, index) {
  const title = card.querySelector("[data-stream-title]");
  const state = card.querySelector("[data-stream-state]");
  const nameInput = card.querySelector('[data-field="name"]');
  const sourceInput = card.querySelector('[data-field="sourceUrl"]');
  const enabledInput = card.querySelector('[data-field="enabled"]');

  if (!title || !state || !nameInput || !sourceInput || !enabledInput) {
    return;
  }

  const label = nameInput.value.trim() || `Camera ${index}`;
  const sourceUrl = sourceInput.value.trim();
  const enabled = enabledInput.checked;

  title.textContent = label;

  if (!enabled) {
    card.dataset.state = "disabled";
    state.textContent = "Desactivee";
    return;
  }

  if (sourceUrl) {
    card.dataset.state = "ready";
    state.textContent = "Pret";
    return;
  }

  card.dataset.state = "pending";
  state.textContent = "A configurer";
}

// syncStreamEditorActions ajuste les actions visibles selon le nombre de cartes.
function syncStreamEditorActions() {
  if (!streamEditor) {
    return;
  }

  const cards = [...streamEditor.querySelectorAll(".stream-card")];
  const canRemove = cards.length > minimumStreamCards;

  cards.forEach((card, index) => {
    card.dataset.index = String(index + 1);
    const removeButton = card.querySelector("[data-remove-stream]");
    if (removeButton) {
      removeButton.disabled = !canRemove;
    }
    updateStreamCardState(card, index + 1);
  });
}

// createStreamCard fabrique une carte editable pour une camera ou un encodeur.
function createStreamCard(stream, index) {
  const article = document.createElement("article");
  article.className = "stream-card";
  article.innerHTML = `
    <div class="stream-card__header">
      <div>
        <p class="eyebrow eyebrow--small">Camera ${index}</p>
        <h3 data-stream-title>${escapeHtml(stream.name || `Camera ${index}`)}</h3>
      </div>
      <span class="stream-state" data-stream-state></span>
    </div>
    <div class="stream-card__grid">
      <label>
        Nom
        <input data-field="name" type="text" />
      </label>
      <label>
        Source RTMP
        <input data-field="sourceUrl" type="text" placeholder="rtmp://..." />
      </label>
    </div>
    <div class="stream-card__actions">
      <label class="stream-toggle">
        <input data-field="enabled" type="checkbox" />
        <span>Camera active</span>
      </label>
      <button type="button" class="secondary" data-remove-stream>Retirer</button>
    </div>
  `;

  const nameInput = article.querySelector('[data-field="name"]');
  const sourceInput = article.querySelector('[data-field="sourceUrl"]');
  const enabledInput = article.querySelector('[data-field="enabled"]');

  if (nameInput) {
    nameInput.value = stream.name ?? "";
  }
  if (sourceInput) {
    sourceInput.value = stream.sourceUrl ?? "";
  }
  if (enabledInput) {
    enabledInput.checked = stream.enabled !== false;
  }

  updateStreamCardState(article, index);
  return article;
}

// renderStreamEditor affiche la liste editable des cameras.
function renderStreamEditor(streams, minimumCount) {
  if (!streamEditor) {
    return;
  }

  minimumStreamCards = Math.max(3, Number(minimumCount || 0));
  const list = Array.isArray(streams) ? [...streams] : [];

  while (list.length < minimumStreamCards) {
    list.push({
      name: `Camera ${list.length + 1}`,
      sourceUrl: "",
      enabled: true,
    });
  }

  streamEditor.innerHTML = "";
  list.forEach((stream, index) => {
    streamEditor.appendChild(createStreamCard(stream, index + 1));
  });
  syncStreamEditorActions();
}

// appendStreamCard ajoute une nouvelle camera vide dans l'editeur.
function appendStreamCard() {
  if (!streamEditor) {
    return;
  }

  const nextIndex = streamEditor.children.length + 1;
  streamEditor.appendChild(
    createStreamCard(
      {
        name: `Camera ${nextIndex}`,
        sourceUrl: "",
        enabled: true,
      },
      nextIndex,
    ),
  );
  syncStreamEditorActions();
  setStatus("Nouvelle camera ajoutee.");
}

// serializeStreams transforme l'edition par carte en liste exploitable par l'API.
function serializeStreams() {
  if (!streamEditor) {
    return [];
  }

  return [...streamEditor.querySelectorAll(".stream-card")].map((card, index) => {
    const name = card.querySelector('[data-field="name"]')?.value.trim() || `Camera ${index + 1}`;
    const sourceUrl = card.querySelector('[data-field="sourceUrl"]')?.value.trim() || "";
    const enabled = card.querySelector('[data-field="enabled"]')?.checked ?? true;

    return {
      name,
      sourceUrl,
      enabled,
    };
  });
}

// renderRtmpSources affiche les URL RTMP locales proposees a l'utilisateur.
function renderRtmpSources(config) {
  if (!rtmpSources) {
    return;
  }

  const host = window.location.hostname || "127.0.0.1";
  const minimum = Math.max(Number(config.minimumCameraCount || 3), 3);

  rtmpSources.innerHTML = "";

  for (let index = 1; index <= minimum; index += 1) {
    const item = document.createElement("li");
    item.className = "source-item";
    item.innerHTML = `<code>rtmp://${escapeHtml(host)}:1935/camera${index}</code>`;
    rtmpSources.appendChild(item);
  }
}

// renderCameraPreview affiche les 3 premiers liens camera dans l'accueil.
function renderCameraPreview(plan) {
  if (!cameraPreview) {
    return;
  }

  cameraPreview.innerHTML = "";

  for (const camera of plan.cameras.slice(0, 3)) {
    const card = document.createElement("article");
    card.className = `camera-card${camera.enabled ? "" : " is-muted"}`;
    card.innerHTML = `
      <h3>${escapeHtml(camera.name)}</h3>
      <p class="camera-meta">${escapeHtml(camera.hint)}</p>
      <div class="camera-code">
        <code>${escapeHtml(camera.rtmpUrl)}</code>
        <button type="button" class="copy-button" data-copy-url="${escapeHtml(camera.rtmpUrl)}">Copier l'URL</button>
      </div>
      <p class="camera-meta">Cle de flux: <code>${escapeHtml(camera.streamKey)}</code></p>
    `;
    cameraPreview.appendChild(card);
  }
}

// copyToClipboard copie une valeur texte dans le presse-papiers.
async function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  window.prompt("Copie manuelle", value);
  return false;
}

// handleCameraPreviewClick gere la copie d'une URL camera depuis l'accueil.
async function handleCameraPreviewClick(event) {
  const button = event.target.closest("[data-copy-url]");
  if (!button) {
    return;
  }

  const value = button.dataset.copyUrl;
  if (!value) {
    return;
  }

  const originalLabel = button.textContent;
  try {
    button.disabled = true;
    await copyToClipboard(value);
    button.textContent = "Copiee";
    setStatus("URL camera copiee.");
  } catch (error) {
    console.error(error);
    button.textContent = "Erreur";
    setStatus("Impossible de copier l'URL.");
  } finally {
    setTimeout(() => {
      button.textContent = originalLabel;
      button.disabled = false;
    }, 1200);
  }
}

// handleStreamEditorInput rafraichit la carte edittee au fil de la saisie.
function handleStreamEditorInput(event) {
  const card = event.target.closest(".stream-card");
  if (!card || !streamEditor) {
    return;
  }

  const index = [...streamEditor.querySelectorAll(".stream-card")].indexOf(card) + 1;
  if (index > 0) {
    updateStreamCardState(card, index);
  }
}

// handleStreamEditorClick gere les actions sur les cartes camera.
function handleStreamEditorClick(event) {
  const removeButton = event.target.closest("[data-remove-stream]");
  if (!removeButton || !streamEditor) {
    return;
  }

  const cards = [...streamEditor.querySelectorAll(".stream-card")];
  if (cards.length <= minimumStreamCards) {
    setStatus(`Au moins ${minimumStreamCards} cartes camera restent visibles.`);
    return;
  }

  const card = removeButton.closest(".stream-card");
  if (!card) {
    return;
  }

  card.remove();
  syncStreamEditorActions();
  setStatus("Camera retiree.");
}

// loadConfig recupere l'etat serveur puis remplit le formulaire.
async function loadConfig() {
  const [configResponse, engineResponse, summaryResponse, planResponse] =
    await Promise.all([
      fetch("/api/config"),
      fetch("/api/engine"),
      fetch("/api/config-summary"),
      fetch("/api/camera-plan"),
    ]);

  const config = await configResponse.json();
  const engine = await engineResponse.json();
  const summary = await summaryResponse.json();
  const plan = await planResponse.json();

  setEngineStatus(engine);
  renderSummaryCards(summary, engine);
  renderRtmpSources(config);
  renderCameraPreview(plan);
  renderStreamEditor(config.streams ?? [], config.minimumCameraCount);

  for (const [key, value] of Object.entries(config)) {
    const input = form.elements.namedItem(key);
    if (!input || key === "streams") {
      continue;
    }
    input.value = value;
  }
}

// saveConfig envoie la configuration courante vers l'API locale.
async function saveConfig() {
  const payload = {
    projectName: form.elements.namedItem("projectName").value,
    language: form.elements.namedItem("language").value,
    listenAddress: form.elements.namedItem("listenAddress").value,
    mode: form.elements.namedItem("mode").value,
    retentionHours: Number(form.elements.namedItem("retentionHours").value),
    bufferSeconds: Number(form.elements.namedItem("bufferSeconds").value),
    minimumCameraCount: Number(form.elements.namedItem("minimumCameraCount").value),
    recordingDirectory: form.elements.namedItem("recordingDirectory").value,
    cacheDirectory: form.elements.namedItem("cacheDirectory").value,
    donationUrl: form.elements.namedItem("donationUrl").value,
    streams: serializeStreams(),
  };

  const response = await fetch("/api/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("save failed");
  }
}

// openDashboardWindow ouvre le tableau de bord dans une fenetre dediee.
function openDashboardWindow() {
  window.open("/dashboard.html", "bouvideoserv-dashboard");
}

// openCameraWindow ouvre la page dediee a la connexion camera.
function openCameraWindow() {
  window.open("/camera.html", "bouvideoserv-camera");
}

// openLanProfileWindow ouvre la page LAN dans une fenetre dediee.
function openLanProfileWindow() {
  window.open("/lan.html", "bouvideoserv-lan");
}

// openAboutWindow ouvre la page A propos dans une fenetre dediee.
function openAboutWindow() {
  window.open("/about.html", "bouvideoserv-about");
}

// handleSaveClick enregistre la configuration et affiche le resultat.
async function handleSaveClick() {
  try {
    saveButton.disabled = true;
    setStatus("Sauvegarde...");
    await saveConfig();
    setStatus("Sauvegarde ok.");
  } catch (error) {
    console.error(error);
    setStatus("Erreur de sauvegarde.");
  } finally {
    saveButton.disabled = false;
  }
}

// handleLoadError signale un probleme de chargement de la configuration.
function handleLoadError(error) {
  console.error(error);
  setStatus("Impossible de charger la configuration.");
}

if (cameraPreview) {
  cameraPreview.addEventListener("click", handleCameraPreviewClick);
}

if (streamEditor) {
  streamEditor.addEventListener("input", handleStreamEditorInput);
  streamEditor.addEventListener("click", handleStreamEditorClick);
}

openDashboard.addEventListener("click", openDashboardWindow);
openCameraSetup.addEventListener("click", openCameraWindow);
if (openLanProfile) {
  openLanProfile.addEventListener("click", openLanProfileWindow);
}
if (openAbout) {
  openAbout.addEventListener("click", openAboutWindow);
}
if (addCameraStream) {
  addCameraStream.addEventListener("click", appendStreamCard);
}
saveButton.addEventListener("click", handleSaveClick);
loadConfig().catch(handleLoadError);
