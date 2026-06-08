package repository

import (
	"database/sql"
	"fmt"
	"log"
	"sync"

	"log-agent/internal/api_ocr_log/domain"

	"github.com/lib/pq"
)

// LogRepository defines the persistence contract.
type LogRepository interface {
	Save(table string, log *domain.ApiLog) error
}

// PostgresLogRepository writes to a single shared database, routing each service to its own table.
type PostgresLogRepository struct {
	db            *sql.DB
	createdTables map[string]bool
	mu            sync.RWMutex
}

// NewPostgresLogRepository opens and pings the database, returning an error if unreachable.
func NewPostgresLogRepository(connStr string) (*PostgresLogRepository, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	log.Println("[Repository] Connected to shared database")
	return &PostgresLogRepository{
		db:            db,
		createdTables: make(map[string]bool),
	}, nil
}

// ensureTableExists creates the log table and its index the first time a service writes to it.
func (r *PostgresLogRepository) ensureTableExists(table string) error {
	r.mu.RLock()
	ready := r.createdTables[table]
	r.mu.RUnlock()
	if ready {
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if r.createdTables[table] {
		return nil
	}

	// ip/method/path/status are nullable: non-HTTP lines (system messages, debug events)
	// have no HTTP context. raw_payload TEXT stores the original line verbatim for recovery.
	createTable := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id          SERIAL PRIMARY KEY,
			log_time    TIMESTAMP WITH TIME ZONE NOT NULL,
			level       VARCHAR(10),
			ip          INET,
			method      VARCHAR(10),
			path        TEXT,
			status      INT,
			duration_ms NUMERIC(10, 2),
			raw_payload TEXT NOT NULL,
			name_service VARCHAR(25)
		)`, pq.QuoteIdentifier(table))

	createIndex := fmt.Sprintf(
		`CREATE INDEX IF NOT EXISTS %s ON %s(log_time DESC)`,
		pq.QuoteIdentifier("idx_"+table+"_time"),
		pq.QuoteIdentifier(table),
	)

	if _, err := r.db.Exec(createTable); err != nil {
		return fmt.Errorf("failed to create table %q: %w", table, err)
	}
	if _, err := r.db.Exec(createIndex); err != nil {
		return fmt.Errorf("failed to create index for %q: %w", table, err)
	}

	r.createdTables[table] = true
	log.Printf("[Repository] Table %q is ready", table)
	return nil
}

// Save inserts a log entry into the service-specific table, creating it if needed.
func (r *PostgresLogRepository) Save(table string, logItem *domain.ApiLog) error {
	if err := r.ensureTableExists(table); err != nil {
		return err
	}

	query := fmt.Sprintf(`
		INSERT INTO %s (log_time, level, ip, method, path, status, duration_ms, raw_payload, name_service)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id`, pq.QuoteIdentifier(table))

	return r.db.QueryRow(
		query,
		logItem.Time,
		nullIfEmpty(logItem.Level),
		nullIfEmpty(logItem.IP),
		nullIfEmpty(logItem.Method),
		nullIfEmpty(logItem.Path),
		nullIfZero(logItem.Status),
		logItem.DurationMs,
		logItem.RawPayload,
		nullIfEmpty(logItem.Source),
	).Scan(&logItem.ID)
}

// nullIfEmpty returns nil for empty strings so Postgres stores NULL instead of an invalid value.
// This is critical for typed columns like INET where an empty string would cause a constraint error.
func nullIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// nullIfZero returns nil for zero so non-HTTP log lines (status=0) store NULL rather than 0.
func nullIfZero(n int) interface{} {
	if n == 0 {
		return nil
	}
	return n
}
