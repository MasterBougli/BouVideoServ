const cameraStatus = document.getElementById("cameraStatus");
const cameraCards = document.getElementById("cameraCards");
const cameraSteps = document.getElementById("cameraSteps");

// setCameraStatus met a jour le bandeau principal de l'ecran camera.
function setCameraStatus(summary, engine, plan) {
  if (!cameraStatus) {
    return;
  }

  const engineLabel = engine.running ? "moteur actif" : "moteur en attente";
  cameraStatus.textContent = `${plan.minimumCameraCount} cameras preparees, ${summary.bufferSeconds}s de cache, ${engineLabel}`;
  cameraStatus.dataset.state = engine.running ? "running" : "offline";
}

// createCameraCard fabrique la carte d'une camera avec son lien RTMP.
function createCameraCard(camera) {
  const article = document.createElement("article");
  article.className = `camera-card${camera.enabled ? "" : " is-muted"}`;
  article.innerHTML = `
    <p class="eyebrow eyebrow--small">Camera ${camera.index}</p>
    <h3>${camera.name}</h3>
    <p class="camera-meta">${camera.hint}</p>
    <div class="camera-code">
      <code>${camera.rtmpUrl}</code>
      <button type="button" class="copy-button" data-copy-url="${camera.rtmpUrl}">Copier l'URL</button>
    </div>
    <p class="camera-meta">Cle: <code>${camera.streamKey}</code></p>
  `;
  return article;
}

// createStepItem transforme une instruction en liste visible.
function createStepItem(text) {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
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

// handleCardClick gere la copie des URLs RTMP des cameras.
async function handleCardClick(event) {
  const button = event.target.closest("[data-copy-url]");
  if (!button) {
    return;
  }

  const value = button.dataset.copyUrl;
  if (!value) {
    return;
  }

  const previousLabel = button.textContent;
  try {
    button.disabled = true;
    await copyToClipboard(value);
    button.textContent = "Copiée";
    if (cameraStatus) {
      cameraStatus.textContent = "URL camera copiee.";
    }
  } catch (error) {
    console.error(error);
    button.textContent = "Erreur";
    if (cameraStatus) {
      cameraStatus.textContent = "Impossible de copier l'URL.";
      cameraStatus.dataset.state = "error";
    }
  } finally {
    setTimeout(() => {
      button.textContent = previousLabel;
      button.disabled = false;
    }, 1200);
  }
}

// loadCameraPlan recupere la configuration et remplit l'ecran camera.
async function loadCameraPlan() {
  const [summaryResponse, engineResponse, planResponse] = await Promise.all([
    fetch("/api/config-summary"),
    fetch("/api/engine"),
    fetch("/api/camera-plan"),
  ]);

  const summary = await summaryResponse.json();
  const engine = await engineResponse.json();
  const plan = await planResponse.json();

  setCameraStatus(summary, engine, plan);

  if (cameraCards) {
    cameraCards.innerHTML = "";
    for (const camera of plan.cameras) {
      cameraCards.appendChild(createCameraCard(camera));
    }
    cameraCards.addEventListener("click", handleCardClick);
  }

  if (cameraSteps) {
    cameraSteps.innerHTML = "";
    const steps = [
      "Ouvre OBS ou ton encodeur RTMP.",
      "Copie l'URL de la camera souhaitee.",
      "Colle cette URL dans le champ serveur.",
      "Utilise la cle de flux affichee pour le stream key.",
      "Lance l'envoi et verifie le tableau de bord.",
    ];

    for (const step of steps) {
      cameraSteps.appendChild(createStepItem(step));
    }
  }
}

// handleCameraLoadError signale un probleme de chargement de la page camera.
function handleCameraLoadError(error) {
  console.error(error);
  if (cameraStatus) {
    cameraStatus.textContent = "Impossible de charger les cameras.";
    cameraStatus.dataset.state = "error";
  }
}

loadCameraPlan().catch(handleCameraLoadError);
