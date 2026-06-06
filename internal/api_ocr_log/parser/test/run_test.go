package test

import (
	"testing"

	"log-agent/internal/api_ocr_log/parser"
)

func TestDocParser(t *testing.T) {
	t.Run("SystemMessage", TestDocParserSystemMessage)
	t.Run("HTTP200MicroSecond", TestDocParserHTTP200MicroSecond)
	t.Run("HTTP200Millisecond", TestDocParserHTTP200Millisecond)
	t.Run("HTTP401", TestDocParserHTTP401)
	t.Run("HTTP200Seconds", TestDocParserHTTP200Seconds)
	t.Run("HTTP204Delete", TestDocParserHTTP204Delete)
	t.Run("DebugMessage", TestDocParserDebugMessage)
	t.Run("ErrorWithIP", TestDocParserErrorWithIP)
	t.Run("InvalidLine", TestDocParserInvalidLine)
	t.Run("RawPayload", TestDocParserRawPayload)
	t.Run("File", TestDocParserFile)
}

func TestParserFactoryDoc(t *testing.T) {
	p, err := parser.ParserFactory("doc")
	if err != nil {
		t.Fatalf("ParserFactory(\"doc\") returned error: %v", err)
	}
	if p == nil {
		t.Fatal("ParserFactory(\"doc\") returned nil parser")
	}
}
