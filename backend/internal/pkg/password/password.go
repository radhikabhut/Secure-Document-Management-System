package password

import (
	"errors"
	"regexp"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

var (
	uppercasePattern = regexp.MustCompile(`[A-Z]`)
	lowercasePattern = regexp.MustCompile(`[a-z]`)
	numberPattern    = regexp.MustCompile(`[0-9]`)
	specialPattern   = regexp.MustCompile(`[^A-Za-z0-9]`)
)

func Hash(plain string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func Compare(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

func ValidateStrong(plain string) error {
	if utf8.RuneCountInString(plain) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if len(plain) > 72 {
		return errors.New("password must be at most 72 bytes")
	}
	if !uppercasePattern.MatchString(plain) {
		return errors.New("password must contain an uppercase letter")
	}
	if !lowercasePattern.MatchString(plain) {
		return errors.New("password must contain a lowercase letter")
	}
	if !numberPattern.MatchString(plain) {
		return errors.New("password must contain a number")
	}
	if !specialPattern.MatchString(plain) {
		return errors.New("password must contain a special character")
	}
	return nil
}
