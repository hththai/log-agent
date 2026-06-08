package services

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
)

// CheckpointState persists the last-processed byte offset for each tailed file so that
// on restart the agent resumes from where it left off instead of re-reading from the top.
type CheckpointState struct {
	mu      sync.Mutex
	path    string
	offsets map[string]int64
}

func NewCheckpointState(path string) *CheckpointState {
	cs := &CheckpointState{
		path:    path,
		offsets: make(map[string]int64),
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		log.Printf("[Checkpoint] Failed to create state directory: %v", err)
	}
	data, err := os.ReadFile(path)
	if err == nil {
		if jsonErr := json.Unmarshal(data, &cs.offsets); jsonErr != nil {
			log.Printf("[Checkpoint] Corrupt state file %s, starting fresh: %v", path, jsonErr)
		}
	}
	return cs
}

func (cs *CheckpointState) Get(filePath string) int64 {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	return cs.offsets[filePath]
}

func (cs *CheckpointState) Save(filePath string, offset int64) {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	cs.offsets[filePath] = offset
	data, _ := json.Marshal(cs.offsets)
	if err := os.WriteFile(cs.path, data, 0644); err != nil {
		log.Printf("[Checkpoint] Failed to persist state: %v", err)
	}
}
