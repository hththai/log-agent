package parser

import (
	"fmt"
	"log-agent/internal/api_ocr_log/domain"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type DocParser struct{}

func NewDocParser() *DocParser { return &DocParser{} }

// lineRegex matches logrus key=value log lines: time="..." level=... msg="..."
var lineRegex = regexp.MustCompile(`^time="([^"]+)"\s+level=(\S+)\s+msg="(.*)"$`)

// httpMsgRegex matches HTTP access entries embedded in msg: "200 | 9.932ms | 1.2.3.4 | GET /path"
var httpMsgRegex = regexp.MustCompile(`^(\d+)\s+\|\s+(.+?)\s+\|\s+(\S+)\s+\|\s+(\S+)\s+(\S+)$`)

// ipPrefixRegex matches non-HTTP messages that begin with an IP: "1.2.3.4 some message"
var ipPrefixRegex = regexp.MustCompile(`^(\d{1,3}(?:\.\d{1,3}){3})\s+`)

// durationRegex parses durations like 297µs, 9.932ms, 6.694577s
var durationRegex = regexp.MustCompile(`^(\d+\.?\d*)(µs|ms|s)$`)

func (p *DocParser) Parse(rawLine string) (*domain.ApiLog, error) {
	m := lineRegex.FindStringSubmatch(rawLine)
	if m == nil {
		return nil, fmt.Errorf("line does not match doc log format")
	}

	t, _ := time.Parse(time.RFC3339, m[1])

	entry := &domain.ApiLog{
		Time:       t,
		Level:      m[2],
		RawPayload: rawLine,
	}

	hm := httpMsgRegex.FindStringSubmatch(m[3])
	if hm != nil {
		entry.Status, _ = strconv.Atoi(hm[1])
		entry.DurationMs = parseDuration(hm[2])
		entry.IP = hm[3]
		entry.Method = hm[4]
		entry.Path = hm[5]
	} else if ip := ipPrefixRegex.FindStringSubmatch(m[3]); ip != nil {
		entry.IP = ip[1]
	}

	return entry, nil
}

func parseDuration(s string) float64 {
	s = strings.TrimSpace(s)
	m := durationRegex.FindStringSubmatch(s)
	if m == nil {
		return 0
	}
	val, _ := strconv.ParseFloat(m[1], 64)
	switch m[2] {
	case "µs":
		return val / 1000
	case "ms":
		return val
	case "s":
		return val * 1000
	}
	return 0
}
