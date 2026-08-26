package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"bouvideoserv/internal/app"
	"bouvideoserv/internal/mediamtx"
)

func main() {
	baseDir := "."
	configPath := filepath.Join(baseDir, "data", "config.json")
	webDir := filepath.Join(baseDir, "web")
	mediaMgr := mediamtx.NewManager(baseDir)

	if err := os.MkdirAll(filepath.Dir(configPath), 0o755); err != nil {
		log.Fatalf("create config dir: %v", err)
	}

	state, err := app.NewState(configPath, mediaMgr.Sync)
	if err != nil {
		log.Fatalf("load state: %v", err)
	}

	if err := mediaMgr.Sync(state.Snapshot()); err != nil {
		log.Printf("media engine config sync skipped: %v", err)
	}

	if err := mediaMgr.Start(context.Background()); err != nil {
		if err == mediamtx.ErrBinaryNotFound {
			log.Printf("RTMP engine not started: install MediaMTX or set MEDIAMTX_BIN")
		} else {
			log.Printf("RTMP engine start failed: %v", err)
		}
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

