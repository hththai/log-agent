package test

import (
	"bufio"
	"math"
	"os"
	"testing"
	"time"

	"log-agent/internal/api_ocr_log/parser"
)

const (
	fmtUnexpected = "unexpected error: %v"
	fmtStatus     = "status: got %d, want %d"
	fmtDurationMs = "duration_ms: got %v, want %v"
	fmtIP         = "ip: got %q, want %q"
	fmtMethod     = "method: got %q, want %q"
	fmtPath       = "path: got %q, want %q"
	fmtLevel      = "level: got %q, want %q"
)

func TestDocParserSystemMessage(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-02-20T10:38:32Z" level=info msg="******APPLICATION STARTED*******"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	want := time.Date(2026, 2, 20, 10, 38, 32, 0, time.UTC)
	if !got.Time.Equal(want) {
		t.Errorf("time: got %v, want %v", got.Time, want)
	}
	if got.Level != "info" {
		t.Errorf(fmtLevel, got.Level, "info")
	}
	if got.Status != 0 {
		t.Errorf(fmtStatus, got.Status, 0)
	}
	if got.IP != "" {
		t.Errorf(fmtIP, got.IP, "")
	}
}

func TestDocParserHTTP200MicroSecond(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-03-08T03:19:32Z" level=info msg="200 | 297µs | 122.150.188.94 | GET /v1/auth/users/me"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	if got.Level != "info" {
		t.Errorf(fmtLevel, got.Level, "info")
	}
	if got.Status != 200 {
		t.Errorf(fmtStatus, got.Status, 200)
	}
	if got.IP != "122.150.188.94" {
		t.Errorf(fmtIP, got.IP, "122.150.188.94")
	}
	if got.Method != "GET" {
		t.Errorf(fmtMethod, got.Method, "GET")
	}
	if got.Path != "/v1/auth/users/me" {
		t.Errorf(fmtPath, got.Path, "/v1/auth/users/me")
	}
	if math.Abs(got.DurationMs-0.297) > 1e-9 {
		t.Errorf(fmtDurationMs, got.DurationMs, 0.297)
	}
}

func TestDocParserHTTP200Millisecond(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-03-08T03:19:32Z" level=info msg="200 | 9.932ms | 122.150.188.94 | GET /v1/auth/purchases"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	if got.Status != 200 {
		t.Errorf(fmtStatus, got.Status, 200)
	}
	if math.Abs(got.DurationMs-9.932) > 1e-9 {
		t.Errorf(fmtDurationMs, got.DurationMs, 9.932)
	}
}

func TestDocParserHTTP401(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-03-08T04:09:45Z" level=info msg="401 | 688µs | 122.150.188.249 | GET /v1/auth/categories"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	if got.Status != 401 {
		t.Errorf(fmtStatus, got.Status, 401)
	}
	if got.IP != "122.150.188.249" {
		t.Errorf(fmtIP, got.IP, "122.150.188.249")
	}
	if math.Abs(got.DurationMs-0.688) > 1e-9 {
		t.Errorf(fmtDurationMs, got.DurationMs, 0.688)
	}
}

func TestDocParserHTTP200Seconds(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-04-03T03:16:30Z" level=info msg="200 | 6.694577s | 110.32.43.190 | POST /v1/auth/ocr"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	if got.Status != 200 {
		t.Errorf(fmtStatus, got.Status, 200)
	}
	if got.Method != "POST" {
		t.Errorf(fmtMethod, got.Method, "POST")
	}
	if math.Abs(got.DurationMs-6694.577) > 1e-6 {
		t.Errorf(fmtDurationMs, got.DurationMs, 6694.577)
	}
}

func TestDocParserHTTP204Delete(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-04-03T03:34:36Z" level=info msg="204 | 8.793ms | 110.32.43.190 | DELETE /v1/auth/purchases/30"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	if got.Status != 204 {
		t.Errorf(fmtStatus, got.Status, 204)
	}
	if got.Method != "DELETE" {
		t.Errorf(fmtMethod, got.Method, "DELETE")
	}
	if got.Path != "/v1/auth/purchases/30" {
		t.Errorf(fmtPath, got.Path, "/v1/auth/purchases/30")
	}
}

func TestDocParserDebugMessage(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-02-20T10:39:29Z" level=debug msg="172.19.0.1 Login success"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	if got.Level != "debug" {
		t.Errorf(fmtLevel, got.Level, "debug")
	}
	if got.Status != 0 {
		t.Errorf(fmtStatus, got.Status, 0)
	}
	if got.IP != "172.19.0.1" {
		t.Errorf(fmtIP, got.IP, "172.19.0.1")
	}
}

func TestDocParserErrorWithIP(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-06-05T23:40:56Z" level=error msg="151.101.82.132 Error Login: cannot retrieve account"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}

	if got.Level != "error" {
		t.Errorf(fmtLevel, got.Level, "error")
	}
	if got.IP != "151.101.82.132" {
		t.Errorf(fmtIP, got.IP, "151.101.82.132")
	}
	if got.Status != 0 {
		t.Errorf(fmtStatus, got.Status, 0)
	}
}

func TestDocParserInvalidLine(t *testing.T) {
	p := parser.NewDocParser()
	_, err := p.Parse("not a valid log line")
	if err == nil {
		t.Error("expected error for invalid line, got nil")
	}
}

func TestDocParserRawPayload(t *testing.T) {
	p := parser.NewDocParser()
	line := `time="2026-03-08T03:19:32Z" level=info msg="200 | 9.932ms | 122.150.188.94 | GET /v1/auth/purchases"`

	got, err := p.Parse(line)
	if err != nil {
		t.Fatalf(fmtUnexpected, err)
	}
	if got.RawPayload != line {
		t.Errorf("raw_payload: got %q, want %q", got.RawPayload, line)
	}
}

// TestDocParserFile parses every line in myapp.log and verifies no unexpected errors.
func TestDocParserFile(t *testing.T) {
	f, err := os.Open("myapp.log")
	if err != nil {
		t.Skipf("myapp.log not found: %v", err)
	}
	defer f.Close()

	p := parser.NewDocParser()
	scanner := bufio.NewScanner(f)
	lineNum := 0
	parsed := 0

	for scanner.Scan() {
		lineNum++
		raw := scanner.Text()
		if raw == "" {
			continue
		}
		_, parseErr := p.Parse(raw)
		if parseErr != nil {
			t.Errorf("line %d: unexpected parse error: %v | line: %q", lineNum, parseErr, raw)
			continue
		}
		parsed++
	}

	if scanErr := scanner.Err(); scanErr != nil {
		t.Fatalf("scanner error: %v", scanErr)
	}
	t.Logf("parsed %d/%d lines from myapp.log", parsed, lineNum)
}
