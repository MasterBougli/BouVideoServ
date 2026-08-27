use crate::config::Config;
use crate::mediamtx::MediaTmxManager;
use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use serde::Serialize;
use serde_json::json;
use std::io;
use std::net::{IpAddr, UdpSocket};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AppState {
    config_path: PathBuf,
    current: Arc<Mutex<Config>>,
    engine: Arc<Mutex<EngineStatus>>,
    media_manager: Arc<MediaTmxManager>,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub running: bool,
    pub message: String,
    pub binary_path: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigSummary {
    pub project_name: String,
    pub language: String,
    pub listen_address: String,
    pub mode: String,
    pub retention_hours: u32,
    pub buffer_seconds: u32,
    pub minimum_camera_count: u32,
    pub configured_streams: usize,
    pub active_streams: usize,
    pub recording_directory: String,
    pub cache_directory: String,
    pub donation_url: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CameraSlot {
    pub index: u32,
    pub name: String,
    pub stream_key: String,
    pub rtmp_url: String,
    pub enabled: bool,
    pub hint: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CameraPlan {
    pub protocol: String,
    pub rtmp_port: u16,
    pub minimum_camera_count: u32,
    pub configured_streams: usize,
    pub cameras: Vec<CameraSlot>,
    pub notes: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanHostCandidate {
    pub label: String,
    pub host: String,
    pub origin: String,
    pub recommended: bool,
    pub note: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanProfile {
    pub listen_address: String,
    pub configured_host: String,
    pub configured_origin: String,
    pub detected_host: String,
    pub detected_origin: String,
    pub recommended_origin: String,
    pub camera_plan: CameraPlan,
    pub host_candidates: Vec<LanHostCandidate>,
    pub notes: Vec<String>,
}

impl AppState {
    // new charge ou cree l'etat local de l'application.
    pub fn new(
        config_path: impl Into<PathBuf>,
        media_manager: Arc<MediaTmxManager>,
    ) -> io::Result<Self> {
        let config_path = config_path.into();
        let config = load_or_create_config(&config_path)?;

        Ok(Self {
            config_path,
            current: Arc::new(Mutex::new(config)),
            engine: Arc::new(Mutex::new(EngineStatus::default())),
            media_manager,
        })
    }

    // snapshot renvoie une copie de la configuration courante.
    pub fn snapshot(&self) -> Config {
        self.current.lock().expect("config mutex poisoned").clone()
    }

    // listen_address renvoie l'adresse locale definie pour l'interface.
    pub fn listen_address(&self) -> String {
        let current = self.snapshot();
        if current.listen_address.is_empty() {
            "127.0.0.1:8080".to_string()
        } else {
            current.listen_address
        }
    }

    // config_dir renvoie le dossier contenant la configuration locale.
    pub fn config_dir(&self) -> PathBuf {
        self.config_path
            .parent()
            .unwrap_or(Path::new("."))
            .to_path_buf()
    }

    // engine_status renvoie l'etat courant du moteur media.
    pub fn engine_status(&self) -> EngineStatus {
        self.engine.lock().expect("engine mutex poisoned").clone()
    }

    // set_engine_status met a jour l'etat du moteur media partage a l'UI.
    pub fn set_engine_status(&self, status: EngineStatus) {
        *self.engine.lock().expect("engine mutex poisoned") = status;
    }

    // save_config sauvegarde la configuration puis re-synchronise MediaMTX.
    pub fn save_config(&self, mut config: Config) -> io::Result<()> {
        config.apply_defaults();
        Config::save(&self.config_path, &config)?;
        *self.current.lock().expect("config mutex poisoned") = config.clone();
        self.media_manager.sync(&config)?;
        Ok(())
    }

    // config_summary construit une vue resumee de la configuration courante.
    pub fn config_summary(&self) -> ConfigSummary {
        let current = self.snapshot();
        let active_streams = current
            .streams
            .iter()
            .filter(|stream| stream.enabled)
            .count();

        ConfigSummary {
            project_name: current.project_name,
            language: current.language,
            listen_address: current.listen_address,
            mode: current.mode,
            retention_hours: current.retention_hours,
            buffer_seconds: current.buffer_seconds,
            minimum_camera_count: current.minimum_camera_count,
            configured_streams: current.streams.len(),
            active_streams,
            recording_directory: current.recording_directory,
            cache_directory: current.cache_directory,
            donation_url: current.donation_url,
        }
    }

    // camera_plan construit les URLs RTMP et les pistes de connexion pour les
    // cameras V1.
    pub fn camera_plan(&self) -> CameraPlan {
        let current = self.snapshot();
        let camera_count = current
            .minimum_camera_count
            .max(current.streams.len() as u32)
            .max(3);
        let host = self.share_host_hint();
        let mut cameras = Vec::with_capacity(camera_count as usize);

        for index in 0..camera_count {
            let name = current
                .streams
                .get(index as usize)
                .map(|stream| stream.name.trim())
                .filter(|name| !name.is_empty())
                .map(|name| name.to_string())
                .unwrap_or_else(|| format!("Camera {}", index + 1));
            let enabled = current
                .streams
                .get(index as usize)
                .map(|stream| stream.enabled)
                .unwrap_or(true);
            let stream_key = format!("camera{}", index + 1);
            let rtmp_url = format!("rtmp://{}:1935/{}", host, stream_key);
            let hint = if enabled {
                "Pret pour OBS ou un client RTMP".to_string()
            } else {
                "Flux desactive dans la configuration".to_string()
            };

            cameras.push(CameraSlot {
                index: index + 1,
                name,
                stream_key,
                rtmp_url,
                enabled,
                hint,
            });
        }

        CameraPlan {
            protocol: "RTMP".to_string(),
            rtmp_port: 1935,
            minimum_camera_count: camera_count,
            configured_streams: current.streams.len(),
            cameras,
            notes: vec![
                "Utilise ces URLs dans OBS ou dans une camera RTMP.".to_string(),
                "Le serveur local ecoute sur le port 1935 pour l'ingestion.".to_string(),
                "La V1 reste volontairement simple et legere.".to_string(),
            ],
        }
    }

    // lan_profile construit une vue LAN plus detaillee avec les adresses
    // locales detectees et les liens utiles.
    pub fn lan_profile(&self) -> LanProfile {
        let listen_address = self.listen_address();
        let configured_host = self.configured_host_hint();
        let port = self.listen_port_hint();
        let detected_host = self
            .detect_local_host()
            .unwrap_or_else(|| configured_host.clone());
        let recommended_host = self.recommended_host(&configured_host, &detected_host);
        let configured_origin = format!("http://{}:{}", configured_host, port);
        let detected_origin = format!("http://{}:{}", detected_host, port);
        let recommended_origin = format!("http://{}:{}", recommended_host, port);
        let camera_plan = self.camera_plan();
        let mut host_candidates = Vec::new();

        self.push_host_candidate(
            &mut host_candidates,
            "Adresse configuree",
            &configured_host,
            &configured_origin,
            recommended_host == configured_host,
            "Valeur definie dans listenAddress.",
        );
        self.push_host_candidate(
            &mut host_candidates,
            "Adresse detectee",
            &detected_host,
            &detected_origin,
            recommended_host == detected_host,
            "Adresse locale la plus probable sur le reseau.",
        );
        self.push_host_candidate(
            &mut host_candidates,
            "Fallback local",
            "127.0.0.1",
            &format!("http://127.0.0.1:{}", port),
            recommended_host == "127.0.0.1",
            "Toujours disponible en local.",
        );

        let mut notes = vec![
            format!("Le serveur ecoute sur {}.", listen_address),
            "La detection reseau aide quand la machine change d'adresse LAN.".to_string(),
        ];

        if self.is_loopback_host(&configured_host) {
            notes.push(
                "La configuration actuelle reste en local; change listenAddress pour partager sur le reseau."
                    .to_string(),
            );
        }

        LanProfile {
            listen_address,
            configured_host,
            configured_origin,
            detected_host,
            detected_origin,
            recommended_origin,
            camera_plan,
            host_candidates,
            notes,
        }
    }

    fn listen_host_hint(&self) -> String {
        let current = self.snapshot();
        let address = current.listen_address.trim();
        let host = address
            .split_once(':')
            .map(|(host, _)| host)
            .unwrap_or(address);

        if host.is_empty() {
            "127.0.0.1".to_string()
        } else {
            host.to_string()
        }
    }

    fn configured_host_hint(&self) -> String {
        self.listen_host_hint()
    }

    fn listen_port_hint(&self) -> String {
        let current = self.snapshot();
        let address = current.listen_address.trim();
        address
            .rsplit_once(':')
            .map(|(_, port)| port)
            .filter(|port| !port.is_empty())
            .unwrap_or("8080")
            .to_string()
    }

    fn recommended_host(&self, configured_host: &str, detected_host: &str) -> String {
        if self.is_wildcard_host(configured_host) {
            if detected_host.is_empty() {
                "127.0.0.1".to_string()
            } else {
                detected_host.to_string()
            }
        } else {
            configured_host.to_string()
        }
    }

    fn share_host_hint(&self) -> String {
        let configured_host = self.configured_host_hint();
        let detected_host = self.detect_local_host().unwrap_or_default();
        self.recommended_host(&configured_host, &detected_host)
    }

    fn is_wildcard_host(&self, host: &str) -> bool {
        matches!(host, "" | "0.0.0.0" | "::")
    }

    fn is_loopback_host(&self, host: &str) -> bool {
        matches!(host, "127.0.0.1" | "localhost" | "::1")
    }

    fn detect_local_host(&self) -> Option<String> {
        let probes = [
            "1.1.1.1:80",
            "8.8.8.8:80",
            "192.168.1.1:80",
            "192.168.0.1:80",
            "10.0.0.1:80",
            "172.16.0.1:80",
        ];

        for probe in probes {
            let socket = match UdpSocket::bind("0.0.0.0:0") {
                Ok(socket) => socket,
                Err(_) => continue,
            };
            if socket.connect(probe).is_err() {
                continue;
            }

            if let Ok(address) = socket.local_addr() {
                match address.ip() {
                    IpAddr::V4(ip) if !ip.is_loopback() => return Some(ip.to_string()),
                    IpAddr::V6(ip) if !ip.is_loopback() => return Some(ip.to_string()),
                    _ => {}
                }
            }
        }

        None
    }

    fn push_host_candidate(
        &self,
        candidates: &mut Vec<LanHostCandidate>,
        label: &str,
        host: &str,
        origin: &str,
        recommended: bool,
        note: &str,
    ) {
        if candidates.iter().any(|candidate| candidate.host == host) {
            return;
        }

        candidates.push(LanHostCandidate {
            label: label.to_string(),
            host: host.to_string(),
            origin: origin.to_string(),
            recommended,
            note: note.to_string(),
        });
    }
}

// health_handler renvoie un etat minimal pour les verifications de base.
pub async fn health_handler() -> Json<serde_json::Value> {
    Json(json!({"status": "ok"}))
}

// get_config_handler renvoie la configuration courante.
pub async fn get_config_handler(State(state): State<Arc<AppState>>) -> Json<Config> {
    Json(state.snapshot())
}

// get_engine_handler renvoie l'etat courant du moteur MediaMTX.
pub async fn get_engine_handler(State(state): State<Arc<AppState>>) -> Json<EngineStatus> {
    Json(state.engine_status())
}

// get_config_summary_handler renvoie les informations groupees de la
// configuration courante.
pub async fn get_config_summary_handler(State(state): State<Arc<AppState>>) -> Json<ConfigSummary> {
    Json(state.config_summary())
}

// get_camera_plan_handler renvoie le plan de connexion des cameras RTMP.
pub async fn get_camera_plan_handler(State(state): State<Arc<AppState>>) -> Json<CameraPlan> {
    Json(state.camera_plan())
}

// get_lan_profile_handler renvoie les informations LAN et les adresses utiles.
pub async fn get_lan_profile_handler(State(state): State<Arc<AppState>>) -> Json<LanProfile> {
    Json(state.lan_profile())
}

// save_config_handler enregistre la configuration envoyee par l'interface.
pub async fn save_config_handler(
    State(state): State<Arc<AppState>>,
    Json(mut config): Json<Config>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    config.apply_defaults();

    state.save_config(config).map_err(|error| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("cannot save config: {error}")})),
        )
    })?;

    Ok(Json(json!({"status": "saved"})))
}

// load_or_create_config lit la configuration existante ou genere la valeur
// par defaut si le fichier n'existe pas encore.
fn load_or_create_config(path: &Path) -> io::Result<Config> {
    match Config::load(path) {
        Ok(config) => Ok(config),
        Err(error) if error.kind() == io::ErrorKind::NotFound => {
            let config = Config::default();
            Config::save(path, &config)?;
            Ok(config)
        }
        Err(error) => Err(error),
    }
}
