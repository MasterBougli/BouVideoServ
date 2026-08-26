package app

import "net/http"

func NewHandler(state *State, webDir string) http.Handler {
	return state.Handler(webDir)
}

