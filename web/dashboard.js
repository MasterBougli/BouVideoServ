const tiles = document.getElementById("tiles");
const title = document.querySelector("h1");

// createTile construit une tuile visuelle pour un flux.
function createTile(name, note) {
  const article = document.createElement("article");
  article.className = "tile";
  article.innerHTML = `
    <div class="tile-preview">
      <span class="tile-badge">RTMP</span>
    </div>
    <div class="tile-body">
      <h2>${name}</h2>
      <p>${note}</p>
    </div>
  `;
  return article;
}

// loadTiles charge la configuration et remplit la vue mosaïque.
async function loadTiles() {
  const [configResponse, engineResponse] = await Promise.all([
    fetch("/api/config"),
    fetch("/api/engine"),
  ]);
  const config = await configResponse.json();
  const engine = await engineResponse.json();
  const streams = config.streams ?? [];

  if (title) {
    title.textContent = engine.running ? "Mosaïque des flux" : "Mosaïque des flux, moteur en attente";
  }

  tiles.innerHTML = "";

  for (const stream of streams) {
    tiles.appendChild(
      createTile(
        stream.name || "Flux",
        stream.sourceUrl ? "Flux configure" : "Source a definir",
      ),
    );
  }

  while (tiles.children.length < 3) {
    tiles.appendChild(createTile(`Camera ${tiles.children.length + 1}`, "Slot disponible"));
  }
}

// handleLoadTilesError affiche un message simple si la mosaique ne charge pas.
function handleLoadTilesError() {
  tiles.innerHTML = "<p class='status'>Impossible de charger les flux.</p>";
}

loadTiles().catch(handleLoadTilesError);
