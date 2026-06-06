package parser

import (
	"fmt"
	"log-agent/internal/api_ocr_log/domain"
)

// LogParser defines the behavior all format-specific parsers must implement.
type LogParser interface {
	Parse(rawLine string) (*domain.ApiLog, error)
}

// ParserFactory returns the correct parsing engine based on the parser name in services.json.
func ParserFactory(parserType string) (LogParser, error) {
	switch parserType {
	case "nginx":
		return NewNginxParser(), nil
	case "json":
		return NewJSONParser(), nil
	case "csharp":
		return NewCSharpParser(), nil
	case "python":
		return NewPythonParser(), nil
	case "doc":
		return NewDocParser(), nil
	default:
		return nil, fmt.Errorf("unknown parser type %q — supported: nginx, json, csharp, python, doc", parserType)
	}
}
