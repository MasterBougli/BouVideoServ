package mediamtx

import (
	"strings"
	"testing"

	"bouvideoserv/internal/config"
)

func TestGenerateYAMLForV1RTMP(t *testing.T) {
	cfg := config.Default()
	cfg.RetentionHours = 24

	yaml := GenerateYAML(cfg)

	checks := []string{
		"rtmp: true",
		"rtsp: false",
		"hls: false",
		"webrtc: false",
		"srt: false",
		"moq: false",
		"record: yes",
		"recordDeleteAfter: 24h",
		"source: publisher",
	}

	for _, check := range checks {
		if !strings.Contains(yaml, check) {
			t.Fatalf("generated yaml missing %q\n%s", check, yaml)
		}
	}
}

