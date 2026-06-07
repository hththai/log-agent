package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"log-agent/internal/api_ocr_log/domain"
	"log-agent/internal/api_ocr_log/repository"
	srv "log-agent/internal/api_ocr_log/services"

	"github.com/hpcloud/tail"
	_ "github.com/lib/pq"
)

func main() {
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)

	logRepo, err := repository.NewPostgresLogRepository(connStr)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}

	configFile, err := os.ReadFile("services.json")
	if err != nil {
		log.Fatalf("failed to read services.json: %v", err)
	}

	var services []domain.LogService
	if err := json.Unmarshal(configFile, &services); err != nil {
		log.Fatalf("invalid services.json format: %v", err)
	}

	processor := srv.NewLogProcessor(logRepo)
	tailedFiles := make(map[string]bool)

	log.Println("Log Agent Engine started. Monitoring targets...")

	for {
		discoverFiles(services, tailedFiles, processor)
		time.Sleep(10 * time.Second)
	}
}

// discoverFiles scans each service pattern for new log files and spawns a worker per new file.
func discoverFiles(services []domain.LogService, tailedFiles map[string]bool, processor *srv.LogProcessor) {
	for _, svc := range services {
		files, err := filepath.Glob(svc.Pattern)
		if err != nil {
			log.Printf("[%s] invalid glob pattern %q: %v", svc.Name, svc.Pattern, err)
			continue
		}
		for _, file := range files {
			if !tailedFiles[file] {
				tailedFiles[file] = true
				go launchLogWorker(svc, file, processor)
			}
		}
	}
}

// launchLogWorker tails a single file and forwards each line to the processor.
func launchLogWorker(svc domain.LogService, filePath string, processor *srv.LogProcessor) {
	log.Printf("[Worker] tracking %s | parser=%s | table=%s", svc.Name, svc.Parser, svc.Table)

	t, err := tail.TailFile(filePath, tail.Config{Follow: true, ReOpen: true})
	if err != nil {
		log.Printf("[Worker] failed to tail %s: %v", filePath, err)
		return
	}

	for line := range t.Lines {
		processor.ProcessLine(svc, line.Text)
	}
}
