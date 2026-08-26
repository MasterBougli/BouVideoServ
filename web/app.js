const form = document.getElementById("configForm");
const status = document.getElementById("status");
const openDashboard = document.getElementById("openDashboard");
const saveButton = document.getElementById("saveConfig");

function setStatus(message) {
  status.textContent = message;
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

async function loadConfig() {
  const response = await fetch("/api/config");
  const config = await response.json();

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

