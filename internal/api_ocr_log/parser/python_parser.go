package parser

import (
	"fmt"
	"log-agent/internal/api_ocr_log/domain"
	"strings"
	"time"
)

type PythonParser struct{}

func NewPythonParser() *PythonParser { return &PythonParser{} }

func (p *PythonParser) Parse(rawLine string) (*domain.ApiLog, error) {
	// Let's assume standard pipe-separated fallback strings
	parts := strings.Split(rawLine, " | ")
	if len(parts) < 5 {
		return nil, fmt.Errorf("invalid python log trace layout")
	}

	t, _ := time.Parse("2006-01-02 15:04:05", parts[0])
	return &domain.ApiLog{
		Time:       t,
		IP:         parts[2],
		Method:     parts[3],
		Path:       parts[4],
		Status:     200, // Default fallback if text log lacks it
		RawPayload: rawLine,
	}, nil
}
