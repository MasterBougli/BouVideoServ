const tiles = document.getElementById("tiles");

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

async function loadTiles() {
  const response = await fetch("/api/config");
  const config = await response.json();
  const streams = config.streams ?? [];

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

loadTiles().catch(() => {
  tiles.innerHTML = "<p class='status'>Impossible de charger les flux.</p>";
});

