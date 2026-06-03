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

	createTable := fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			id          SERIAL PRIMARY KEY,
			log_time    TIMESTAMP WITH TIME ZONE NOT NULL,
			ip          INET NOT NULL,
			method      VARCHAR(10) NOT NULL,
			path        TEXT NOT NULL,
			status      INT NOT NULL,
			duration_ms NUMERIC(10, 2),
			raw_payload JSONB NOT NULL
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
		INSERT INTO %s (log_time, ip, method, path, status, duration_ms, raw_payload)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`, pq.QuoteIdentifier(table))

	return r.db.QueryRow(
		query,
		logItem.Time,
		logItem.IP,
		logItem.Method,
		logItem.Path,
		logItem.Status,
		logItem.DurationMs,
		logItem.RawPayload,
	).Scan(&logItem.ID)
}
