use crate::config::Config;
use std::env;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Mutex;

#[derive(Debug)]
pub enum MediaTmxError {
    BinaryNotFound,
    Io(io::Error),
}

impl fmt::Display for MediaTmxError {
    // fmt affiche une erreur lisible pour les journaux.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BinaryNotFound => write!(f, "mediamtx binary not found"),
            Self::Io(error) => write!(f, "{error}"),
        }
    }
}

impl std::error::Error for MediaTmxError {}

impl From<io::Error> for MediaTmxError {
    // from transforme une erreur I/O standard en erreur MediaMTX.
    fn from(value: io::Error) -> Self {
        Self::Io(value)
    }
}

pub struct MediaTmxManager {
    base_dir: PathBuf,
    work_dir: PathBuf,
    bin_path: Mutex<Option<PathBuf>>,
}

impl MediaTmxManager {
    // new prepare le gestionnaire autour du dossier racine du projet.
    pub fn new(base_dir: impl Into<PathBuf>) -> Self {
        let base_dir = base_dir.into();
        Self {
            work_dir: base_dir.join("mediamtx"),
            base_dir,
            bin_path: Mutex::new(None),
        }
    }

    // sync ecrit la configuration MediaMTX derivee de la configuration V1.
    pub fn sync(&self, config: &Config) -> io::Result<()> {
        fs::create_dir_all(&self.work_dir)?;
        let yaml = self.generate_yaml(config);
        fs::write(self.work_dir.join("mediamtx.yml"), yaml.as_bytes())
    }

    // binary_path renvoie le chemin du binaire MediaMTX resolu en cache.
    pub fn binary_path(&self) -> Option<PathBuf> {
        self.bin_path.lock().ok().and_then(|guard| guard.clone())
    }

    // start lance MediaMTX en arriere-plan dans son dossier de travail.
    pub fn start(&self) -> Result<(), MediaTmxError> {
        let binary = self.resolve_binary()?;

        let mut command = Command::new(&binary);
        command.current_dir(&self.work_dir);
        command.stdout(Stdio::inherit());
        command.stderr(Stdio::inherit());

        let mut child = command.spawn()?;
        std::thread::spawn(move || {
            let _ = child.wait();
        });

        Ok(())
    }

    // resolve_binary cherche le binaire MediaMTX dans les emplacements connus.
    fn resolve_binary(&self) -> Result<PathBuf, MediaTmxError> {
        if let Some(cached) = self.bin_path.lock().ok().and_then(|guard| guard.clone()) {
            return Ok(cached);
        }

        let candidates = [
            env::var("MEDIAMTX_BIN").ok(),
            Some("mediamtx.exe".to_string()),
            Some("mediamtx".to_string()),
        ];

        for candidate in candidates.into_iter().flatten() {
            let candidate = candidate.trim();
            if candidate.is_empty() {
                continue;
            }

            let path = PathBuf::from(candidate);
            if path.is_absolute() {
                if path.is_file() {
                    self.cache_binary(path.clone());
                    return Ok(path);
                }
                continue;
            }

            if let Some(found) = self.find_in_path(&path) {
                self.cache_binary(found.clone());
                return Ok(found);
            }

            let local_path = self.base_dir.join(&path);
            if local_path.is_file() {
                self.cache_binary(local_path.clone());
                return Ok(local_path);
            }
        }

        Err(MediaTmxError::BinaryNotFound)
    }

    // cache_binary memorise le chemin du binaire pour les prochains appels.
    fn cache_binary(&self, path: PathBuf) {
        if let Ok(mut guard) = self.bin_path.lock() {
            *guard = Some(path);
        }
    }

    // find_in_path parcourt la variable PATH pour retrouver un binaire.
    fn find_in_path(&self, candidate: &Path) -> Option<PathBuf> {
        let path_env = env::var_os("PATH")?;
        for directory in env::split_paths(&path_env) {
            let resolved = directory.join(candidate);
            if resolved.is_file() {
                return Some(resolved);
            }
        }
        None
    }

    // generate_yaml fabrique le fichier mediamtx.yml pour la V1.
    fn generate_yaml(&self, config: &Config) -> String {
        let retention = format!("{}h", config.retention_hours);

        format!(
            r#"
logLevel: info
logDestinations: [stdout]
logStructured: false

rtmp: true
rtmpAddress: :1935
rtmpEncryption: "no"

rtsp: false
hls: false
webrtc: false
srt: false
moq: false

pathDefaults:
  record: yes
  recordPath: ../recordings/%path/%Y-%m-%d_%H-%M-%S-%f
  recordFormat: fmp4
  recordPartDuration: 1s
  recordSegmentDuration: 1h
  recordDeleteAfter: {retention}

paths:
  all_others:
    source: publisher
"#
        )
        .trim()
        .to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // yaml_keeps_the_v1_rtmp_rules verifie les regles de base du YAML genere.
    #[test]
    fn yaml_keeps_the_v1_rtmp_rules() {
        let config = Config::default();
        let yaml = MediaTmxManager::new(".").generate_yaml(&config);

        assert!(yaml.contains("rtmp: true"));
        assert!(yaml.contains("rtsp: false"));
        assert!(yaml.contains("hls: false"));
        assert!(yaml.contains("webrtc: false"));
        assert!(yaml.contains("record: yes"));
        assert!(yaml.contains("recordDeleteAfter: 24h"));
        assert!(yaml.contains("source: publisher"));
    }
}
