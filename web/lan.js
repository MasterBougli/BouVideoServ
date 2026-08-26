const lanStatus = document.getElementById("lanStatus");
const lanHost = document.getElementById("lanHost");
const lanOrigin = document.getElementById("lanOrigin");
const copyLanOrigin = document.getElementById("copyLanOrigin");
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
function setLanStatus(summary, engine) {
  if (!lanStatus) {
    return;
  }

  const host = window.location.hostname || summary.listenAddress.split(":")[0] || "127.0.0.1";
  const stateLabel = engine.running ? "moteur actif" : "moteur en attente";
  lanStatus.textContent = `Adresse vue: ${host}, ${stateLabel}`;
  lanStatus.dataset.state = engine.running ? "running" : "offline";
}

// renderHostCard affiche l'adresse locale a partager.
function renderHostCard(summary) {
  const host = window.location.hostname || summary.listenAddress.split(":")[0] || "127.0.0.1";
  const port = summary.listenAddress.split(":")[1] || "8080";
  const origin = window.location.origin && window.location.origin !== "null"
    ? window.location.origin
    : `http://${host}:${port}`;

  if (lanHost) {
    lanHost.textContent = `Hote detecte: ${host}`;
  }

  if (lanOrigin) {
    lanOrigin.textContent = origin;
  }

  return { host, origin, port };
}

// renderLinks construit les liens LAN principaux et les URLs camera.
function renderLinks(origin, plan) {
  if (!lanLinks) {
    return;
  }

  const items = [
    {
      label: "Interface web",
      value: `${origin}/`,
      note: "Page de configuration principale.",
    },
    {
      label: "Tableau de bord",
      value: `${origin}/dashboard.html`,
      note: "Mosaïque légère des flux.",
    },
    {
      label: "Connexion camera",
      value: `${origin}/camera.html`,
      note: "URLs RTMP prêtes a copier dans OBS.",
    },
  ];

  for (const camera of plan.cameras.slice(0, 3)) {
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
function renderSteps(summary, plan) {
  if (!lanSteps) {
    return;
  }

  const steps = [
    `Ouvre ${window.location.origin || "la page LAN"} depuis un appareil du reseau local.`,
    `Copie l'adresse web pour ouvrir l'interface sur ${summary.listenAddress}.`,
    `Choisis une camera dans la liste et colle son URL RTMP dans OBS.`,
    `Utilise la cle de flux correspondante pour demarrer la diffusion.`,
    `Garde cette page ouverte pour retrouver rapidement les liens principaux.`,
  ];

  lanSteps.innerHTML = "";

  steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    lanSteps.appendChild(li);
  });

  if (plan.cameras.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Aucune camera configuree pour le moment.";
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
  const [summaryResponse, engineResponse, planResponse] = await Promise.all([
    fetch("/api/config-summary"),
    fetch("/api/engine"),
    fetch("/api/camera-plan"),
  ]);

  const summary = await summaryResponse.json();
  const engine = await engineResponse.json();
  const plan = await planResponse.json();
  const { origin } = renderHostCard(summary);

  setLanStatus(summary, engine);
  renderLinks(origin, plan);
  renderSteps(summary, plan);
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
