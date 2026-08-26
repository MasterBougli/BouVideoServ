use axum::routing::{get, post};
use axum::Router;
use std::io;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::services::ServeDir;
use tracing::{error, info};
use tracing_subscriber::EnvFilter;

use bouvideoserv::mediamtx::{MediaTmxError, MediaTmxManager};
use bouvideoserv::state::{
    get_config_handler, get_engine_handler, health_handler, save_config_handler, AppState,
    EngineStatus,
};

// main lance la couche serveur Rust et les services locaux autour de MediaMTX.
#[tokio::main]
async fn main() {
    init_logging();

    if let Err(error) = run().await {
        error!("{error}");
        std::process::exit(1);
    }
}

// run initialise les repertoires, charge l'etat local et demarre le serveur HTTP.
async fn run() -> io::Result<()> {
    let base_dir = PathBuf::from(".");
    ensure_runtime_dirs(base_dir.as_path())?;

    let media_manager = Arc::new(MediaTmxManager::new(base_dir.clone()));
    let state = Arc::new(AppState::new(base_dir.join("data/config.json"), media_manager.clone())?);

    media_manager.sync(&state.snapshot())?;

    match media_manager.start() {
        Ok(()) => state.set_engine_status(EngineStatus {
            running: true,
            message: "MediaMTX started".to_string(),
            binary_path: media_manager
                .binary_path()
                .map(|path| path.to_string_lossy().to_string())
                .unwrap_or_default(),
        }),
        Err(MediaTmxError::BinaryNotFound) => {
            state.set_engine_status(EngineStatus {
                running: false,
                message: "MediaMTX absent".to_string(),
                binary_path: media_manager
                    .binary_path()
                    .map(|path| path.to_string_lossy().to_string())
                    .unwrap_or_default(),
            });
            info!("RTMP engine not started: install MediaMTX or set MEDIAMTX_BIN");
        }
        Err(error) => {
            state.set_engine_status(EngineStatus {
                running: false,
                message: "MediaMTX start failed".to_string(),
                binary_path: media_manager
                    .binary_path()
                    .map(|path| path.to_string_lossy().to_string())
                    .unwrap_or_default(),
            });
            error!("RTMP engine start failed: {error}");
        }
    }

    let web_dir = base_dir.join("web");
    let app = Router::new()
        .route("/api/health", get(health_handler))
        .route(
            "/api/config",
            get(get_config_handler).post(save_config_handler),
        )
        .route("/api/engine", get(get_engine_handler))
        .nest_service("/", ServeDir::new(web_dir).append_index_html_on_directories(true))
        .with_state(state.clone());

    let listener = TcpListener::bind(state.listen_address()).await?;
    info!(
        "BouVideoServ listening on http://{}",
        listener.local_addr()?
    );

    axum::serve(listener, app)
        .await
        .map_err(|error| io::Error::new(io::ErrorKind::Other, error))
}

// init_logging configure les logs de demarrage pour le binaire Rust.
fn init_logging() {
    let filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("bouvideoserv=info"));

    tracing_subscriber::fmt().with_env_filter(filter).init();
}

// ensure_runtime_dirs cree les dossiers locaux utilises par l'application.
fn ensure_runtime_dirs(base_dir: &std::path::Path) -> io::Result<()> {
    std::fs::create_dir_all(base_dir.join("data"))?;
    std::fs::create_dir_all(base_dir.join("data/recordings"))?;
    std::fs::create_dir_all(base_dir.join("data/cache"))?;
    Ok(())
}
