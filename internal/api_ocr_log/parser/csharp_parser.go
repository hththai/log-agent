package parser

import (
	"fmt"
	"log-agent/internal/api_ocr_log/domain"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// CSharpParser parses Serilog/ASP.NET request log lines.
// Supported format: 2024-01-15T10:30:00.000+00:00 [INF] GET /path responded 200 in 45.3 ms
type CSharpParser struct{}

func NewCSharpParser() *CSharpParser { return &CSharpParser{} }

var csharpRegex = regexp.MustCompile(
	`^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)\s+\[\w+\]\s+(\w+)\s+(\S+)\s+responded\s+(\d+)\s+in\s+([\d.]+)\s+ms`,
)

func (p *CSharpParser) Parse(rawLine string) (*domain.ApiLog, error) {
	m := csharpRegex.FindStringSubmatch(rawLine)
	if m == nil {
		return nil, fmt.Errorf("line does not match csharp serilog http format")
	}

	rawTime := strings.Replace(m[1], " ", "T", 1)
	t, _ := time.Parse(time.RFC3339Nano, rawTime)

	status, _ := strconv.Atoi(m[4])
	duration, _ := strconv.ParseFloat(m[5], 64)

	return &domain.ApiLog{
		Time:       t,
		Method:     m[2],
		Path:       m[3],
		Status:     status,
		DurationMs: duration,
		RawPayload: rawLine,
	}, nil
}
