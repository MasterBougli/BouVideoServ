const tiles = document.getElementById("tiles");
const title = document.querySelector("h1");
const dashboardStatus = document.getElementById("dashboardStatus");
const dashboardSummary = document.getElementById("dashboardSummary");
const dashboardRefresh = document.getElementById("dashboardRefresh");

let refreshInProgress = false;
let refreshTimer = null;

// escapeHtml protege les libelles exposes dans la mosaïque.
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// formatRefreshTime affiche l'heure de la derniere mise a jour.
function formatRefreshTime(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

// createTile construit une tuile visuelle pour un flux.
function createTile(stream, index, engineRunning) {
  const isLive = engineRunning && stream.enabled && Boolean(stream.sourceUrl);
  const tile = document.createElement("article");
  const tileStateClass = !stream.enabled ? "tile--disabled" : isLive ? "tile--live" : "tile--idle";
  tile.className = `tile ${tileStateClass}`;
  tile.dataset.state = isLive ? "live" : stream.enabled ? "idle" : "disabled";
  tile.innerHTML = `
    <div class="tile-preview">
      <span class="tile-badge">${isLive ? "En ligne" : stream.enabled ? "Pret" : "Desactive"}</span>
      <span class="tile-index">Camera ${index}</span>
    </div>
    <div class="tile-body">
      <h2>${escapeHtml(stream.name || `Camera ${index}`)}</h2>
      <p>${escapeHtml(
        isLive
          ? "Flux visible et moteur actif."
          : stream.enabled
            ? "Flux configure, en attente d'activation."
            : "Flux desactive dans la configuration.",
      )}</p>
      <p class="tile-meta">${escapeHtml(stream.sourceUrl ? stream.sourceUrl : "Source non definie")}</p>
    </div>
  `;
  return tile;
}

// updateDashboardStatus rafraichit le bandeau d'etat du tableau de bord.
function updateDashboardStatus(summary, engine, streams, updatedAt) {
  const activeStreams = streams.filter((stream) => stream.enabled && stream.sourceUrl).length;
  const totalStreams = Math.max(summary.configuredStreams, 3);
  const streamLabel = activeStreams === 1 ? "flux pret" : "flux prets";

  if (dashboardStatus) {
    dashboardStatus.textContent = engine.running
      ? `Moteur actif - ${activeStreams}/${totalStreams} flux`
      : `Moteur en attente - ${activeStreams}/${totalStreams} flux`;
    dashboardStatus.dataset.state = engine.running ? "running" : "offline";
  }

  if (dashboardSummary) {
    const host = window.location.hostname || "127.0.0.1";
    dashboardSummary.textContent = `${activeStreams} ${streamLabel} sur ${totalStreams} cartes, acces local via ${host}.`;
  }

  if (dashboardRefresh) {
    dashboardRefresh.textContent = `Derniere mise a jour: ${formatRefreshTime(updatedAt)}. Actualisation automatique toutes les 5 secondes.`;
  }
}

// loadTiles charge la configuration et remplit la vue mosaïque.
async function loadTiles() {
  const [configResponse, engineResponse, summaryResponse] = await Promise.all([
    fetch("/api/config"),
    fetch("/api/engine"),
    fetch("/api/config-summary"),
  ]);

  const config = await configResponse.json();
  const engine = await engineResponse.json();
  const summary = await summaryResponse.json();
  const streams = config.streams ?? [];
  const tilesToRender =
    streams.length > 0
      ? streams
      : Array.from({ length: 3 }, (_, index) => ({
          name: `Camera ${index + 1}`,
          sourceUrl: "",
          enabled: true,
        }));
  const updatedAt = new Date();

  if (title) {
    title.textContent = engine.running ? "Mosaïque des flux" : "Mosaïque des flux, moteur en attente";
  }

  updateDashboardStatus(summary, engine, tilesToRender, updatedAt);

  tiles.innerHTML = "";

  tilesToRender.forEach((stream, index) => {
    tiles.appendChild(createTile(stream, index + 1, engine.running));
  });

  while (tiles.children.length < 3) {
    tiles.appendChild(
      createTile(
        {
          name: `Camera ${tiles.children.length + 1}`,
          sourceUrl: "",
          enabled: true,
        },
        tiles.children.length + 1,
        engine.running,
      ),
    );
  }
}

// refreshDashboard relance un chargement sans empiler les requetes.
async function refreshDashboard() {
  if (refreshInProgress) {
    return;
  }

  refreshInProgress = true;
  try {
    await loadTiles();
  } catch (error) {
    handleLoadTilesError(error);
  } finally {
    refreshInProgress = false;
  }
}

// startAutoRefresh enclenche l'actualisation reguliere du tableau de bord.
function startAutoRefresh() {
  if (refreshTimer) {
    return;
  }

  refreshTimer = window.setInterval(refreshDashboard, 5000);
}

// handleLoadTilesError affiche un message simple si la mosaique ne charge pas.
function handleLoadTilesError(error) {
  console.error(error);
  if (dashboardStatus) {
    dashboardStatus.textContent = "Impossible de charger le tableau de bord.";
    dashboardStatus.dataset.state = "error";
  }
  if (dashboardRefresh) {
    dashboardRefresh.textContent = "Actualisation interrompue.";
  }
  tiles.innerHTML = "<p class='status'>Impossible de charger les flux.</p>";
}

refreshDashboard()
  .then(() => {
    startAutoRefresh();
  })
  .catch(handleLoadTilesError);
