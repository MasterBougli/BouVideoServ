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
	configPath  string
	current     config.Config
}

func NewState(configPath string) (*State, error) {
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
	}, nil
}

func (s *State) Handler(webDir string) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir(webDir)))
	mux.HandleFunc("/api/config", s.handleConfig)
	mux.HandleFunc("/api/health", s.handleHealth)
	return mux
}

func (s *State) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
	})
}

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
		s.mu.Unlock()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "cannot save config")
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func (s *State) ConfigDir() string {
	return filepath.Dir(s.configPath)
}

func (s *State) ListenAddress() string {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.current.ListenAddress == "" {
		return "127.0.0.1:8080"
	}
	return s.current.ListenAddress
}
