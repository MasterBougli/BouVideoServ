package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	ProjectName          string   `json:"projectName"`
	Language             string   `json:"language"`
	ListenAddress        string   `json:"listenAddress"`
	Mode                 string   `json:"mode"`
	RetentionHours       int      `json:"retentionHours"`
	BufferSeconds        int      `json:"bufferSeconds"`
	MinimumCameraCount   int      `json:"minimumCameraCount"`
	DonationURL          string   `json:"donationUrl"`
	RecordingDirectory   string   `json:"recordingDirectory"`
	CacheDirectory       string   `json:"cacheDirectory"`
	Streams              []Stream `json:"streams"`
}

type Stream struct {
	Name     string `json:"name"`
	SourceURL string `json:"sourceUrl"`
	Enabled   bool   `json:"enabled"`
}

// Default construit la configuration de base attendue pour la V1.
func Default() Config {
	return Config{
		ProjectName:        "BouVideoServ",
		Language:           "fr",
		ListenAddress:      "127.0.0.1:8080",
		Mode:               "rtmp",
		RetentionHours:     24,
		BufferSeconds:      30,
		MinimumCameraCount: 3,
		DonationURL:        "https://streamlabs.com/bouglitv",
		RecordingDirectory: "data/recordings",
		CacheDirectory:     "data/cache",
		Streams: []Stream{
			{Name: "Camera 1", SourceURL: "", Enabled: true},
			{Name: "Camera 2", SourceURL: "", Enabled: true},
			{Name: "Camera 3", SourceURL: "", Enabled: true},
		},
	}
}

// ApplyDefaults complete les champs manquants avec les valeurs V1.
func (c *Config) ApplyDefaults() {
	if c.ProjectName == "" {
		c.ProjectName = "BouVideoServ"
	}
	if c.Language == "" {
		c.Language = "fr"
	}
	if c.ListenAddress == "" {
		c.ListenAddress = "127.0.0.1:8080"
	}
	if c.Mode == "" {
		c.Mode = "rtmp"
	}
	if c.RetentionHours == 0 {
		c.RetentionHours = 24
	}
	if c.BufferSeconds == 0 {
		c.BufferSeconds = 30
	}
	if c.MinimumCameraCount == 0 {
		c.MinimumCameraCount = 3
	}
	if c.DonationURL == "" {
		c.DonationURL = "https://streamlabs.com/bouglitv"
	}
	if c.RecordingDirectory == "" {
		c.RecordingDirectory = "data/recordings"
	}
	if c.CacheDirectory == "" {
		c.CacheDirectory = "data/cache"
	}
	if len(c.Streams) == 0 {
		c.Streams = Default().Streams
	}
}

// Load lit la configuration JSON depuis le disque et applique les valeurs par
// defaut si besoin.
func Load(path string) (Config, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return Config{}, err
	}

	var cfg Config
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return Config{}, err
	}

	cfg.ApplyDefaults()
	return cfg, nil
}

// Save ecrit la configuration JSON sur le disque.
func Save(path string, cfg Config) error {
	cfg.ApplyDefaults()

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	raw, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, append(raw, '\n'), 0o644)
}
