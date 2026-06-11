package auth

import (
	"errors"
	"fmt"
	"time"

	"docuvault-be/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	TokenType string    `json:"token_type,omitempty"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken string
	ExpiresAt   time.Time
}

type JWTManager struct {
	secret     []byte
	expiration time.Duration
	issuer     string
}

func NewJWTManager(cfg config.JWTConfig, issuer string) *JWTManager {
	return &JWTManager{
		secret:     []byte(cfg.Secret),
		expiration: cfg.Expiration(),
		issuer:     issuer,
	}
}

func (m *JWTManager) Generate(userID uuid.UUID, email, role string, now time.Time) (*TokenPair, error) {
	expiresAt := now.Add(m.expiration)
	claims := Claims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    m.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return nil, fmt.Errorf("sign jwt: %w", err)
	}

	return &TokenPair{AccessToken: signed, ExpiresAt: expiresAt}, nil
}

func (m *JWTManager) GenerateResetToken(userID uuid.UUID, email string, now time.Time) (string, error) {
	// Reset token valid for 1 hour
	expiresAt := now.Add(1 * time.Hour)
	claims := Claims{
		UserID:    userID,
		Email:     email,
		TokenType: "reset",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    m.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *JWTManager) Validate(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected jwt signing method: %s", token.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse jwt: %w", err)
	}
	if !token.Valid {
		return nil, errors.New("invalid jwt token")
	}

	return claims, nil
}
