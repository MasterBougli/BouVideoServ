package mediamtx

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"

	"bouvideoserv/internal/config"
)

var ErrBinaryNotFound = errors.New("mediamtx binary not found")

type Manager struct {
	mu       sync.Mutex
	baseDir  string
	workDir  string
	binPath  string
}

// NewManager prepare le gestionnaire MediaMTX pour le dossier racine donne.
func NewManager(baseDir string) *Manager {
	return &Manager{
		baseDir: baseDir,
		workDir: filepath.Join(baseDir, "mediamtx"),
	}
}

// Sync genere le fichier de configuration MediaMTX a partir de la config V1.
func (m *Manager) Sync(cfg config.Config) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := os.MkdirAll(m.workDir, 0o755); err != nil {
		return err
	}

	content := GenerateYAML(cfg)
	return os.WriteFile(filepath.Join(m.workDir, "mediamtx.yml"), []byte(content), 0o644)
}

// BinaryPath renvoie le chemin resolve vers le binaire MediaMTX.
func (m *Manager) BinaryPath() string {
	m.mu.Lock()
	defer m.mu.Unlock()

	return m.binPath
}

// Start lance MediaMTX dans le dossier de travail gere par l'application.
func (m *Manager) Start(ctx context.Context) error {
	bin, err := m.resolveBinary()
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(ctx, bin)
	cmd.Dir = m.workDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		return err
	}

	// waitForCommand laisse le processus tourner sans bloquer le serveur.
	go waitForCommand(cmd)

	return nil
}

// waitForCommand attend la fin du processus lance en arriere-plan.
func waitForCommand(cmd *exec.Cmd) {
	_ = cmd.Wait()
}

// resolveBinary cherche le binaire MediaMTX dans les emplacements connus.
func (m *Manager) resolveBinary() (string, error) {
	if m.binPath != "" {
		return m.binPath, nil
	}

	candidates := []string{
		os.Getenv("MEDIAMTX_BIN"),
		"mediamtx.exe",
		"mediamtx",
	}

	for _, candidate := range candidates {
		candidate = strings.TrimSpace(candidate)
		if candidate == "" {
			continue
		}

		if filepath.IsAbs(candidate) {
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				m.binPath = candidate
				return candidate, nil
			}
			continue
		}

		if resolved, err := exec.LookPath(candidate); err == nil {
			m.binPath = resolved
			return resolved, nil
		}

		localPath := filepath.Join(m.baseDir, candidate)
		if info, err := os.Stat(localPath); err == nil && !info.IsDir() {
			m.binPath = localPath
			return localPath, nil
		}
	}

	return "", ErrBinaryNotFound
}

// GenerateYAML fabrique le fichier de configuration MediaMTX pour la V1.
func GenerateYAML(cfg config.Config) string {
	retention := fmt.Sprintf("%dh", cfg.RetentionHours)

	return strings.TrimSpace(fmt.Sprintf(`
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
  recordPath: ../recordings/%%path/%%Y-%%m-%%d_%%H-%%M-%%S-%%f
  recordFormat: fmp4
  recordPartDuration: 1s
  recordSegmentDuration: 1h
  recordDeleteAfter: %s

paths:
  all_others:
    source: publisher
`, retention))
}
