const form = document.getElementById("configForm");
const status = document.getElementById("status");
const openDashboard = document.getElementById("openDashboard");
const openAbout = document.getElementById("openAbout");
const saveButton = document.getElementById("saveConfig");
const engineStatus = document.getElementById("engineStatus");
const rtmpSources = document.getElementById("rtmpSources");

function setStatus(message) {
  status.textContent = message;
}

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

function serializeStreams(streamsText) {
  return streamsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, sourceUrl = ""] = line.split("|");
      return {
        name: name.trim(),
        sourceUrl: sourceUrl.trim(),
        enabled: true,
      };
    });
}

function renderStreams(streams) {
  return streams.map((stream) => `${stream.name} | ${stream.sourceUrl ?? ""}`).join("\n");
}

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

async function loadConfig() {
  const [configResponse, engineResponse] = await Promise.all([
    fetch("/api/config"),
    fetch("/api/engine"),
  ]);
  const config = await configResponse.json();
  const engine = await engineResponse.json();
  setEngineStatus(engine);
  renderRtmpSources(config);

  for (const [key, value] of Object.entries(config)) {
    const input = form.elements.namedItem(key);
    if (!input || key === "streams") {
      continue;
    }
    input.value = value;
  }

  form.elements.namedItem("streams").value = renderStreams(config.streams ?? []);
}

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

openDashboard.addEventListener("click", () => {
  window.open("/dashboard.html", "bouvideoserv-dashboard");
});

if (openAbout) {
  openAbout.addEventListener("click", () => {
    window.open("/about.html", "bouvideoserv-about");
  });
}

saveButton.addEventListener("click", async () => {
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
});

loadConfig().catch((error) => {
  console.error(error);
  setStatus("Impossible de charger la configuration.");
});
