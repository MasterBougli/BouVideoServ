package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"bouvideoserv/internal/app"
)

func main() {
	baseDir := "."
	configPath := filepath.Join(baseDir, "data", "config.json")
	webDir := filepath.Join(baseDir, "web")

	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		log.Fatalf("create config dir: %v", err)
	}

	state, err := app.NewState(configPath)
	if err != nil {
		log.Fatalf("load state: %v", err)
	}

	handler := app.NewHandler(state, webDir)
	server := &http.Server{
		Addr:              state.ListenAddress(),
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("BouVideoServ listening on http://%s\n", server.Addr)
	log.Fatal(server.ListenAndServe())
}
