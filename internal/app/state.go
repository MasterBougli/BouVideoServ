package app

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"bouvideoserv/internal/config"
)

type State struct {
	mu         sync.Mutex
	configPath string
	current    config.Config
	syncHook   func(config.Config) error
	engine     EngineStatus
}

type EngineStatus struct {
	Running    bool   `json:"running"`
	Message    string `json:"message"`
	BinaryPath string `json:"binaryPath"`
}

// NewState charge la configuration courante ou cree la configuration par
// defaut si aucun fichier n'existe encore.
func NewState(configPath string, syncHook func(config.Config) error) (*State, error) {
	cfg, err := config.Load(configPath)
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return nil, err
		}
		cfg = config.Default()
		if err := config.Save(configPath, cfg); err != nil {
			return nil, err
		}
	}

	return &State{
		configPath: configPath,
		current:    cfg,
		syncHook:   syncHook,
	}, nil
}

// Handler construit le mux HTTP expose par l'application.
func (s *State) Handler(webDir string) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir(webDir)))
	mux.HandleFunc("/api/config", s.handleConfig)
	mux.HandleFunc("/api/engine", s.handleEngine)
	mux.HandleFunc("/api/health", s.handleHealth)
	return mux
}

// handleHealth renvoie un etat minimal pour verifier que le serveur repond.
func (s *State) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

// handleConfig lit ou met a jour la configuration locale.
func (s *State) handleConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.mu.Lock()
		cfg := s.current
		s.mu.Unlock()
		writeJSON(w, http.StatusOK, cfg)
	case http.MethodPost:
		var cfg config.Config
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			writeError(w, http.StatusBadRequest, "invalid json")
			return
		}

		cfg.ApplyDefaults()

		s.mu.Lock()
		s.current = cfg
		err := config.Save(s.configPath, s.current)
		syncHook := s.syncHook
		s.mu.Unlock()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "cannot save config")
			return
		}

		if syncHook != nil {
			if err := syncHook(cfg); err != nil {
				writeError(w, http.StatusInternalServerError, "cannot update media engine config")
				return
			}
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// handleEngine expose l'etat courant du moteur MediaMTX.
func (s *State) handleEngine(w http.ResponseWriter, _ *http.Request) {
	s.mu.Lock()
	engine := s.engine
	s.mu.Unlock()

	writeJSON(w, http.StatusOK, engine)
}

// writeJSON ecrit une reponse JSON standardisee.
func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// writeError renvoie une erreur JSON simple et uniforme.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// ConfigDir retourne le dossier qui contient la configuration.
func (s *State) ConfigDir() string {
	return filepath.Dir(s.configPath)
}

// ListenAddress renvoie l'adresse locale a utiliser pour l'interface web.
func (s *State) ListenAddress() string {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.current.ListenAddress == "" {
		return "127.0.0.1:8080"
	}
	return s.current.ListenAddress
}

// Snapshot renvoie une copie de la configuration courante.
func (s *State) Snapshot() config.Config {
	s.mu.Lock()
	defer s.mu.Unlock()

	return s.current
}

// SetEngineStatus met a jour l'etat du moteur media partage par l'interface.
func (s *State) SetEngineStatus(status EngineStatus) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.engine = status
}
