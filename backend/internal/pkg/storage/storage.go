// Package storage provides file storage management for uploaded documents.
// It handles file validation, secure path generation, filename sanitization,
// and SHA256 checksum computation.
package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"

	"docuvault-be/internal/config"
)

// Manager handles all file storage operations, including validation and
// path generation, using the configured storage and upload settings.
type Manager struct {
	storageCfg config.StorageConfig
	uploadCfg  config.UploadConfig
}

// NewManager creates a new storage Manager from the given storage and upload configs.
func NewManager(storageCfg config.StorageConfig, uploadCfg config.UploadConfig) *Manager {
	return &Manager{
		storageCfg: storageCfg,
		uploadCfg:  uploadCfg,
	}
}

// ValidateHeader checks that the uploaded file's size and extension are within
// the allowed limits defined by the upload configuration.
// Returns a descriptive error if validation fails.
func (m *Manager) ValidateHeader(fileHeader *multipart.FileHeader) error {
	// Validate file size
	maxBytes := m.uploadCfg.MaxSizeBytes()
	if fileHeader.Size > maxBytes {
		return fmt.Errorf("file size %d bytes exceeds maximum allowed size of %d MB",
			fileHeader.Size, m.uploadCfg.MaxSizeMB)
	}

	// Validate file extension
	ext := strings.ToLower(strings.TrimPrefix(filepath.Ext(fileHeader.Filename), "."))
	if !m.isAllowedExtension(ext) {
		return fmt.Errorf("file extension %q is not allowed; permitted extensions: %s",
			ext, strings.Join(m.uploadCfg.AllowedExtensions, ", "))
	}

	return nil
}

// BuildStoragePath generates a unique, date-partitioned file path and stored filename
// for a new upload. The path is rooted at the configured storage directory.
//
// The directory structure is:  <StoragePath>/<YYYY>/<MM>/<DD>/
// The stored filename is:      <timestamp_nanoseconds>_<sanitized_original>
//
// Returns the full stored path and the stored filename.
func (m *Manager) BuildStoragePath(t time.Time, originalFilename string) (storedPath, storedName string) {
	dateDir := filepath.Join(
		m.storageCfg.Path,
		fmt.Sprintf("%04d", t.Year()),
		fmt.Sprintf("%02d", t.Month()),
		fmt.Sprintf("%02d", t.Day()),
	)

	sanitized := SanitizeFilename(originalFilename)
	storedName = fmt.Sprintf("%d_%s", t.UnixNano(), sanitized)
	storedPath = filepath.Join(dateDir, storedName)

	return storedPath, storedName
}

// SanitizeFilename removes or replaces characters that are unsafe for use in
// file names across different operating systems and file systems.
// The function:
//   - Trims leading and trailing whitespace
//   - Replaces path separators and null bytes with underscores
//   - Collapses consecutive whitespace into a single underscore
//   - Removes any character that is not alphanumeric, a dash, underscore, dot, or space
//   - Falls back to "file" if the resulting base name (without extension) is empty
func SanitizeFilename(filename string) string {
	filename = strings.TrimSpace(filename)
	if filename == "" {
		return "file"
	}

	// Replace path separators and null bytes with underscore
	filename = strings.NewReplacer(
		"/", "_",
		"\\", "_",
		"\x00", "_",
	).Replace(filename)

	// Remove characters that are not safe for filenames
	var builder strings.Builder
	for _, r := range filename {
		if unicode.IsLetter(r) || unicode.IsDigit(r) ||
			r == '-' || r == '_' || r == '.' || r == ' ' {
			builder.WriteRune(r)
		}
	}
	cleaned := builder.String()

	// Collapse consecutive whitespace into a single underscore
	wsRegexp := regexp.MustCompile(`\s+`)
	cleaned = wsRegexp.ReplaceAllString(cleaned, "_")

	// Ensure base name (without extension) is not empty
	ext := filepath.Ext(cleaned)
	base := strings.TrimSuffix(cleaned, ext)
	if strings.TrimSpace(base) == "" {
		cleaned = "file" + ext
	}

	return cleaned
}

// SHA256 reads all bytes from r and returns the hex-encoded SHA-256 digest.
// Returns an error if the read fails.
func SHA256(r io.Reader) (string, error) {
	h := sha256.New()
	if _, err := io.Copy(h, r); err != nil {
		return "", fmt.Errorf("compute sha256: %w", err)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// isAllowedExtension reports whether ext (without a leading dot, lowercased)
// is in the configured list of allowed extensions.
func (m *Manager) isAllowedExtension(ext string) bool {
	for _, allowed := range m.uploadCfg.AllowedExtensions {
		if strings.EqualFold(allowed, ext) {
			return true
		}
	}
	return false
}
