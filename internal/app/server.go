package app

import "net/http"

// NewHandler retourne le routeur HTTP principal de l'application.
func NewHandler(state *State, webDir string) http.Handler {
	return state.Handler(webDir)
}
