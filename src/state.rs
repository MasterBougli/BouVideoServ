use crate::config::Config;
use crate::mediamtx::MediaTmxManager;
use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use serde::Serialize;
use serde_json::json;
use std::io;
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
