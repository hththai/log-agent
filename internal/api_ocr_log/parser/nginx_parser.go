package parser

import (
	"fmt"
	"log-agent/internal/api_ocr_log/domain"
	"regexp"
	"strconv"
	"time"
)

// NginxParser parses the nginx combined access log format:
// $remote_addr - $remote_user [$time_local] "$request" $status $bytes "$referer" "$http_user_agent"
type NginxParser struct{}

func NewNginxParser() *NginxParser { return &NginxParser{} }

var nginxRegex = regexp.MustCompile(
	`^(\S+)\s+-\s+\S+\s+\[([^\]]+)\]\s+"(\S+)\s+(\S+)\s+\S+"\s+(\d+)\s+\d+(?:\s+"[^"]*"\s+"([^"]*)")?`,
)

func (p *NginxParser) Parse(rawLine string) (*domain.ApiLog, error) {
	m := nginxRegex.FindStringSubmatch(rawLine)
	if m == nil {
		return nil, fmt.Errorf("line does not match nginx combined format")
	}

	t, _ := time.Parse("02/Jan/2006:15:04:05 -0700", m[2])
	status, _ := strconv.Atoi(m[5])

	return &domain.ApiLog{
		Time:       t,
		IP:         m[1],
		Method:     m[3],
		Path:       m[4],
		Status:     status,
		UA:         m[6],
		RawPayload: rawLine,
	}, nil
}
