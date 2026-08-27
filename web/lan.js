const lanStatus = document.getElementById("lanStatus");
const lanHost = document.getElementById("lanHost");
const lanOrigin = document.getElementById("lanOrigin");
const lanRecommendation = document.getElementById("lanRecommendation");
const copyLanOrigin = document.getElementById("copyLanOrigin");
const lanCandidates = document.getElementById("lanCandidates");
const lanLinks = document.getElementById("lanLinks");
const lanSteps = document.getElementById("lanSteps");

// escapeHtml protege les contenus injectes dans la page LAN.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

// setLanStatus affiche un resume court de l'adresse locale detectee.
function setLanStatus(profile, engine) {
  if (!lanStatus) {
    return;
  }

  const stateLabel = engine.running ? "moteur actif" : "moteur en attente";
  lanStatus.textContent = `Adresse recommandee: ${profile.recommendedOrigin}, ${stateLabel}`;
  lanStatus.dataset.state = engine.running ? "running" : "offline";
}

// renderHostCard affiche l'adresse locale a partager.
function renderHostCard(profile) {
  if (lanHost) {
    lanHost.textContent = `Hote detecte: ${profile.detectedHost}`;
  }

  if (lanOrigin) {
    lanOrigin.textContent = profile.recommendedOrigin;
  }

  if (lanRecommendation) {
    const notes = [
      `Configuree: ${profile.configuredOrigin}`,
      `Detectee: ${profile.detectedOrigin}`,
    ];

    if (profile.recommendedOrigin === profile.configuredOrigin) {
      notes.push("L'adresse configuree est la plus fiable pour le partage.");
    } else {
      notes.push("L'adresse detectee est recommandee pour le reseau local.");
    }

    lanRecommendation.textContent = notes.join(" - ");
  }
}

// renderCandidates affiche les differentes adresses detectees.
function renderCandidates(profile) {
  if (!lanCandidates) {
    return;
  }

  lanCandidates.innerHTML = "";

  for (const candidate of profile.hostCandidates ?? []) {
    const item = document.createElement("li");
    item.className = "lan-candidate";
    item.dataset.recommended = String(Boolean(candidate.recommended));
    item.innerHTML = `
      <div class="lan-candidate__head">
        <strong>${escapeHtml(candidate.label)}</strong>
        <span class="lan-candidate__badge">${candidate.recommended ? "Recommandee" : "Alternative"}</span>
      </div>
      <code>${escapeHtml(candidate.origin)}</code>
      <p class="lan-note">${escapeHtml(candidate.note)}</p>
      <div class="lan-copy-row">
        <button type="button" class="copy-button" data-copy-value="${escapeHtml(candidate.origin)}">Copier</button>
      </div>
    `;
    lanCandidates.appendChild(item);
  }
}

// renderLinks construit les liens LAN principaux et les URLs camera.
function renderLinks(profile) {
  if (!lanLinks) {
    return;
  }

  const items = [
    {
      label: "Interface web",
      value: `${profile.recommendedOrigin}/`,
      note: "Page de configuration principale.",
    },
    {
      label: "Tableau de bord",
      value: `${profile.recommendedOrigin}/dashboard.html`,
      note: "Mosaïque légère des flux.",
    },
    {
      label: "Connexion camera",
      value: `${profile.recommendedOrigin}/camera.html`,
      note: "URLs RTMP prêtes a copier dans OBS.",
    },
    {
      label: "Profil LAN",
      value: `${profile.recommendedOrigin}/lan.html`,
      note: "Vue de partage des adresses locales.",
    },
  ];

  for (const camera of profile.cameraPlan?.cameras?.slice(0, 3) ?? []) {
    items.push({
      label: camera.name,
      value: camera.rtmpUrl,
      note: camera.hint,
    });
  }

  lanLinks.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${escapeHtml(item.label)}</strong>
      <code>${escapeHtml(item.value)}</code>
      <p class="lan-note">${escapeHtml(item.note)}</p>
      <div class="lan-copy-row">
        <button type="button" class="copy-button" data-copy-value="${escapeHtml(item.value)}">Copier</button>
      </div>
    `;
    lanLinks.appendChild(li);
  });
}

// renderSteps affiche un mini guide d'utilisation LAN.
function renderSteps(profile) {
  if (!lanSteps) {
    return;
  }

  const steps = [
    `Ouvre ${profile.recommendedOrigin} depuis un appareil du reseau local.`,
    `Si besoin, teste ensuite ${profile.configuredOrigin} pour verifier la configuration actuelle.`,
    "Copie les URLs RTMP des cameras depuis la page Connexion camera.",
    "Ajoute les cameras dans OBS ou dans un encodeur externe.",
    "Garde cette page ouverte pour retrouver rapidement les liens principaux.",
  ];

  lanSteps.innerHTML = "";

  steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    lanSteps.appendChild(li);
  });

  for (const note of profile.notes ?? []) {
    const li = document.createElement("li");
    li.textContent = note;
    lanSteps.appendChild(li);
  }
}

// handleCopyClick copie un lien LAN depuis la page.
async function handleCopyClick(event) {
  const button = event.target.closest("[data-copy-value]");
  if (!button) {
    return;
  }

  const value = button.dataset.copyValue;
  if (!value) {
    return;
  }

  const original = button.textContent;
  try {
    button.disabled = true;
    await copyToClipboard(value);
    button.textContent = "Copiee";
    if (lanStatus) {
      lanStatus.textContent = "Lien copie.";
      lanStatus.dataset.state = "running";
    }
  } catch (error) {
    console.error(error);
    button.textContent = "Erreur";
    if (lanStatus) {
      lanStatus.textContent = "Impossible de copier le lien.";
      lanStatus.dataset.state = "error";
    }
  } finally {
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 1200);
  }
}

// loadLanProfile recupere la configuration et affiche le profil LAN.
async function loadLanProfile() {
  const [profileResponse, engineResponse] = await Promise.all([
    fetch("/api/lan-profile"),
    fetch("/api/engine"),
  ]);

  const profile = await profileResponse.json();
  const engine = await engineResponse.json();

  renderHostCard(profile);
  renderCandidates(profile);
  renderLinks(profile);
  renderSteps(profile);
  setLanStatus(profile, engine);
}

// handleLanLoadError signale un probleme de chargement du profil LAN.
function handleLanLoadError(error) {
  console.error(error);
  if (lanStatus) {
    lanStatus.textContent = "Impossible de charger le profil LAN.";
    lanStatus.dataset.state = "error";
  }
}

if (lanLinks) {
  lanLinks.addEventListener("click", handleCopyClick);
}

if (lanCandidates) {
  lanCandidates.addEventListener("click", handleCopyClick);
}

if (copyLanOrigin) {
  copyLanOrigin.addEventListener("click", async () => {
    const value = lanOrigin?.textContent || window.location.origin || "";
    if (!value) {
      return;
    }

    try {
      copyLanOrigin.disabled = true;
      await copyToClipboard(value);
      copyLanOrigin.textContent = "Copiee";
    } catch (error) {
      console.error(error);
      copyLanOrigin.textContent = "Erreur";
    } finally {
      setTimeout(() => {
        copyLanOrigin.textContent = "Copier";
        copyLanOrigin.disabled = false;
      }, 1200);
    }
  });
}

loadLanProfile().catch(handleLanLoadError);
