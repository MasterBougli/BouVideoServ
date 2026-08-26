const form = document.getElementById("configForm");
const status = document.getElementById("status");
const openDashboard = document.getElementById("openDashboard");
const openCameraSetup = document.getElementById("openCameraSetup");
const openAbout = document.getElementById("openAbout");
const saveButton = document.getElementById("saveConfig");
const engineStatus = document.getElementById("engineStatus");
const rtmpSources = document.getElementById("rtmpSources");
const summaryCards = document.getElementById("summaryCards");
const cameraPreview = document.getElementById("cameraPreview");

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
      <span class="label">${card.label}</span>
      <span class="value">${card.value}</span>
      <p class="note">${card.note}</p>
    `;
    summaryCards.appendChild(article);
  }
}

// serializeStreams transforme le texte de saisie en liste de flux.
function serializeStreams(streamsText) {
  return streamsText
    .split("\n")
    .map(trimLine)
    .filter(isFilledLine)
    .map(parseStreamLine);
}

// renderStreams transforme la liste des flux en texte editable.
function renderStreams(streams) {
  return streams.map(formatStreamLine).join("\n");
}

// renderRtmpSources affiche les URL RTMP locales proposees a l'utilisateur.
function renderRtmpSources(config) {
  if (!rtmpSources) {
    return;
  }

  const host = window.location.hostname || "127.0.0.1";
  const minimum = Number(config.minimumCameraCount || 3);

  rtmpSources.innerHTML = "";

  for (let index = 1; index <= minimum; index += 1) {
    const item = document.createElement("li");
    item.className = "source-item";
    item.innerHTML = `<code>rtmp://${host}:1935/camera${index}</code>`;
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
      <h3>${camera.name}</h3>
      <p class="camera-meta">${camera.hint}</p>
      <div class="camera-code">
        <code>${camera.rtmpUrl}</code>
        <button type="button" class="copy-button" data-copy-url="${camera.rtmpUrl}">Copier l'URL</button>
      </div>
      <p class="camera-meta">Cle de flux: <code>${camera.streamKey}</code></p>
    `;
    cameraPreview.appendChild(card);
  }

  cameraPreview.addEventListener("click", handleCameraPreviewClick);
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

  for (const [key, value] of Object.entries(config)) {
    const input = form.elements.namedItem(key);
    if (!input || key === "streams") {
      continue;
    }
    input.value = value;
  }

  form.elements.namedItem("streams").value = renderStreams(config.streams ?? []);
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
    streams: serializeStreams(form.elements.namedItem("streams").value),
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

if (openAbout) {
  // openAboutWindow ouvre la page A propos dans une fenetre dediee.
  function openAboutWindow() {
    window.open("/about.html", "bouvideoserv-about");
  }

  openAbout.addEventListener("click", openAboutWindow);
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

openDashboard.addEventListener("click", openDashboardWindow);
openCameraSetup.addEventListener("click", openCameraWindow);
saveButton.addEventListener("click", handleSaveClick);
loadConfig().catch(handleLoadError);
