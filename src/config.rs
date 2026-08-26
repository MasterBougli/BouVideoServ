use serde::{Deserialize, Serialize};
use std::fs;
use std::io;
use std::io::ErrorKind;
use std::path::Path;

// default_project_name fournit le nom du projet utilise par defaut.
fn default_project_name() -> String {
    "BouVideoServ".to_string()
}

// default_language fournit la langue utilisee par defaut.
fn default_language() -> String {
    "fr".to_string()
}

// default_listen_address fournit l'adresse locale par defaut.
fn default_listen_address() -> String {
    "127.0.0.1:8080".to_string()
}

// default_mode fournit le mode media utilise par defaut.
fn default_mode() -> String {
    "rtmp".to_string()
}

// default_retention_hours fournit la duree de conservation par defaut.
fn default_retention_hours() -> u32 {
    24
}

// default_buffer_seconds fournit la taille du cache par defaut.
fn default_buffer_seconds() -> u32 {
    30
}

// default_minimum_camera_count fournit le nombre minimum de cameras par defaut.
fn default_minimum_camera_count() -> u32 {
    3
}

// default_donation_url fournit le lien de don par defaut.
fn default_donation_url() -> String {
    "https://streamlabs.com/bouglitv".to_string()
}

// default_recording_directory fournit le dossier d'enregistrement par defaut.
fn default_recording_directory() -> String {
    "data/recordings".to_string()
}

// default_cache_directory fournit le dossier de cache par defaut.
fn default_cache_directory() -> String {
    "data/cache".to_string()
}

// default_enabled indique si un flux est actif par defaut.
fn default_enabled() -> bool {
    true
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Config {
    pub project_name: String,
    pub language: String,
    pub listen_address: String,
    pub mode: String,
    pub retention_hours: u32,
    pub buffer_seconds: u32,
    pub minimum_camera_count: u32,
    pub donation_url: String,
    pub recording_directory: String,
    pub cache_directory: String,
    pub streams: Vec<Stream>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(default, rename_all = "camelCase")]
pub struct Stream {
    pub name: String,
    pub source_url: String,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

impl Default for Config {
    // default construit la configuration V1 de base.
    fn default() -> Self {
        Self {
            project_name: default_project_name(),
            language: default_language(),
            listen_address: default_listen_address(),
            mode: default_mode(),
            retention_hours: default_retention_hours(),
            buffer_seconds: default_buffer_seconds(),
            minimum_camera_count: default_minimum_camera_count(),
            donation_url: default_donation_url(),
            recording_directory: default_recording_directory(),
            cache_directory: default_cache_directory(),
            streams: vec![
                Stream {
                    name: "Camera 1".to_string(),
                    source_url: String::new(),
                    enabled: true,
                },
                Stream {
                    name: "Camera 2".to_string(),
                    source_url: String::new(),
                    enabled: true,
                },
                Stream {
                    name: "Camera 3".to_string(),
                    source_url: String::new(),
                    enabled: true,
                },
            ],
        }
    }
}

impl Default for Stream {
    // default construit une definition de flux vide mais active.
    fn default() -> Self {
        Self {
            name: String::new(),
            source_url: String::new(),
            enabled: default_enabled(),
        }
    }
}

impl Config {
    // apply_defaults complete les champs vides avec les valeurs V1.
    pub fn apply_defaults(&mut self) {
        if self.project_name.is_empty() {
            self.project_name = default_project_name();
        }
        if self.language.is_empty() {
            self.language = default_language();
        }
        if self.listen_address.is_empty() {
            self.listen_address = default_listen_address();
        }
        if self.mode.is_empty() {
            self.mode = default_mode();
        }
        if self.retention_hours == 0 {
            self.retention_hours = default_retention_hours();
        }
        if self.buffer_seconds == 0 {
            self.buffer_seconds = default_buffer_seconds();
        }
        if self.minimum_camera_count == 0 {
            self.minimum_camera_count = default_minimum_camera_count();
        }
        if self.donation_url.is_empty() {
            self.donation_url = default_donation_url();
        }
        if self.recording_directory.is_empty() {
            self.recording_directory = default_recording_directory();
        }
        if self.cache_directory.is_empty() {
            self.cache_directory = default_cache_directory();
        }
        if self.streams.is_empty() {
            self.streams = Config::default().streams;
        }
    }

    // load lit une configuration JSON depuis le disque.
    pub fn load(path: impl AsRef<Path>) -> io::Result<Self> {
        let raw = fs::read_to_string(path)?;
        let mut config: Self = serde_json::from_str(&raw)
            .map_err(|error| io::Error::new(ErrorKind::InvalidData, error))?;
        config.apply_defaults();
        Ok(config)
    }

    // save ecrit une configuration JSON sur le disque.
    pub fn save(path: impl AsRef<Path>, config: &Self) -> io::Result<()> {
        let mut config = config.clone();
        config.apply_defaults();

        if let Some(parent) = path.as_ref().parent() {
            fs::create_dir_all(parent)?;
        }

        let raw = serde_json::to_string_pretty(&config)
            .map_err(|error| io::Error::new(ErrorKind::InvalidData, error))?;
        fs::write(path, format!("{raw}\n"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // default_config_matches_v1_expectations verifie les valeurs de base du
    // projet.
    #[test]
    fn default_config_matches_v1_expectations() {
        let config = Config::default();

        assert_eq!(config.project_name, "BouVideoServ");
        assert_eq!(config.language, "fr");
        assert_eq!(config.retention_hours, 24);
        assert_eq!(config.buffer_seconds, 30);
        assert_eq!(config.minimum_camera_count, 3);
        assert_eq!(config.streams.len(), 3);
    }
}
