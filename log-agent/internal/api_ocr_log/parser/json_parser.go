package parser

import (
	"encoding/json"
	"fmt"
	"log-agent/internal/api_ocr_log/domain"
	"time"
)

// JSONParser parses structured JSON log lines.
// Expected fields: time, ip, method, path, status, duration_ms, ua, source
type JSONParser struct{}

func NewJSONParser() *JSONParser { return &JSONParser{} }

type jsonLogDTO struct {
	Time       string  `json:"time"`
	IP         string  `json:"ip"`
	Method     string  `json:"method"`
	Path       string  `json:"path"`
	Status     int     `json:"status"`
	DurationMs float64 `json:"duration_ms"`
	UA         string  `json:"ua"`
	Source     string  `json:"source"`
}

func (p *JSONParser) Parse(rawLine string) (*domain.ApiLog, error) {
	var dto jsonLogDTO
	if err := json.Unmarshal([]byte(rawLine), &dto); err != nil {
		return nil, fmt.Errorf("invalid json log: %w", err)
	}

	t, err := time.Parse(time.RFC3339, dto.Time)
	if err != nil {
		t = time.Now()
	}

	return &domain.ApiLog{
		Time:       t,
		IP:         dto.IP,
		Method:     dto.Method,
		Path:       dto.Path,
		Status:     dto.Status,
		DurationMs: dto.DurationMs,
		UA:         dto.UA,
		Source:     dto.Source,
		RawPayload: rawLine,
	}, nil
}
