package config

import "testing"

func TestDefaultConfig(t *testing.T) {
	cfg := Default()

	if cfg.ProjectName != "BouVideoServ" {
		t.Fatalf("unexpected project name: %q", cfg.ProjectName)
	}
	if cfg.Language != "fr" {
		t.Fatalf("unexpected language: %q", cfg.Language)
	}
	if cfg.RetentionHours != 24 {
		t.Fatalf("unexpected retention: %d", cfg.RetentionHours)
	}
	if cfg.BufferSeconds != 30 {
		t.Fatalf("unexpected buffer: %d", cfg.BufferSeconds)
	}
	if cfg.MinimumCameraCount != 3 {
		t.Fatalf("unexpected minimum camera count: %d", cfg.MinimumCameraCount)
	}
	if len(cfg.Streams) != 3 {
		t.Fatalf("unexpected stream count: %d", len(cfg.Streams))
	}
}

