package services

import (
	"log"
	"log-agent/internal/api_ocr_log/domain"
	"log-agent/internal/api_ocr_log/parser"
	repo "log-agent/internal/api_ocr_log/repository"
)

type LogProcessor struct {
	repo repo.LogRepository
}

func NewLogProcessor(r repo.LogRepository) *LogProcessor {
	return &LogProcessor{repo: r}
}

func (uc *LogProcessor) ProcessLine(service domain.LogService, rawLine string) {
	engine, err := parser.ParserFactory(service.Parser)
	if err != nil {
		log.Printf("[%s] Config error: %v", service.Name, err)
		return
	}

	apiLog, err := engine.Parse(rawLine)
	if err != nil {
		log.Printf("[%s] Parsing error: %v", service.Name, err)
		return
	}

	apiLog.Source = service.Name

	if err := uc.repo.Save(service.Table, apiLog); err != nil {
		// Log raw_payload so the original line can be recovered and re-ingested after the fault is resolved.
		log.Printf("[%s] Database save failure on table %s: %v | raw_payload: %s", service.Name, service.Table, err, apiLog.RawPayload)
	}
}
