package validator

import (
	"strings"

	"docuvault-be/internal/pkg/password"
	"github.com/go-playground/validator/v10"
)

type Validator struct {
	engine *validator.Validate
}

func New() (*Validator, error) {
	engine := validator.New()
	if err := engine.RegisterValidation("strong_password", func(fl validator.FieldLevel) bool {
		return password.ValidateStrong(fl.Field().String()) == nil
	}); err != nil {
		return nil, err
	}
	return &Validator{engine: engine}, nil
}

func (v *Validator) Struct(value any) map[string][]string {
	if err := v.engine.Struct(value); err != nil {
		return formatValidationErrors(err)
	}
	return nil
}

func formatValidationErrors(err error) map[string][]string {
	result := make(map[string][]string)
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		result["request"] = []string{err.Error()}
		return result
	}

	for _, fieldErr := range validationErrors {
		field := toSnakeCase(fieldErr.Field())
		result[field] = append(result[field], validationMessage(fieldErr))
	}
	return result
}

func validationMessage(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email"
	case "min":
		return "must be at least " + err.Param() + " characters"
	case "max":
		return "must be at most " + err.Param() + " characters"
	case "oneof":
		return "must be one of: " + err.Param()
	case "uuid":
		return "must be a valid UUID"
	case "strong_password":
		return "must include uppercase, lowercase, number, and special character"
	default:
		return "is invalid"
	}
}

func toSnakeCase(value string) string {
	var builder strings.Builder
	for i, r := range value {
		if i > 0 && r >= 'A' && r <= 'Z' {
			builder.WriteRune('_')
		}
		builder.WriteRune(r)
	}
	return strings.ToLower(builder.String())
}
