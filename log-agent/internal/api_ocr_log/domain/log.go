package domain

import "time"

// ApiLog represents the enterprise business entity for a system log
type ApiLog struct {
	ID         int64     `json:"-"`
	Time       time.Time `json:"time"`
	Level      string    `json:"level"`
	IP         string    `json:"ip"`
	Method     string    `json:"method"`
	Path       string    `json:"path"`
	Status     int       `json:"status"`
	DurationMs float64   `json:"duration_ms"`
	UA         string    `json:"ua"`
	Source     string    `json:"source"`
	RawPayload string    `json:"-"`
}

// LogService defines the configuration block for a single dynamic log path tracking task
type LogService struct {
	Name    string `json:"name"`    // e.g., "ocr_client", "ocr_api"
	Pattern string `json:"pattern"` // e.g., "/incoming-logs/api/*log*"
	Parser  string `json:"parser"`  // e.g., "nginx", "json", "python", "csharp"
	Table   string `json:"table"`   // destination table in the shared database, e.g., "logs_ocr_api"
}
