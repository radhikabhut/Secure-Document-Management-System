package email

import (
	"context"
	"fmt"
	"strings"

	"docuvault-be/internal/config"
	"gopkg.in/gomail.v2"
)

type Message struct {
	To      string
	Subject string
	Body    string
}

type Sender interface {
	Send(ctx context.Context, message Message) error
	Enabled() bool
}

type noopSender struct{}

func NewSender(cfg config.SMTPConfig) Sender {
	if !cfg.Enabled() {
		return noopSender{}
	}
	return &smtpSender{
		host:     cfg.Host,
		port:     cfg.Port,
		username: cfg.Username,
		password: cfg.Password,
		from:     cfg.From,
	}
}

func (noopSender) Send(context.Context, Message) error {
	return nil
}

func (noopSender) Enabled() bool {
	return false
}

type smtpSender struct {
	host     string
	port     int
	username string
	password string
	from     string
}

func (s *smtpSender) Enabled() bool {
	return true
}

func (s *smtpSender) Send(ctx context.Context, message Message) error {
	if err := validate(message); err != nil {
		return err
	}
	if err := ctx.Err(); err != nil {
		return err
	}

	mail := gomail.NewMessage()
	mail.SetHeader("From", s.from)
	mail.SetHeader("To", message.To)
	mail.SetHeader("Subject", message.Subject)
	mail.SetBody("text/plain", message.Body)

	done := make(chan error, 1)
	go func() {
		done <- gomail.NewDialer(s.host, s.port, s.username, s.password).DialAndSend(mail)
	}()

	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-done:
		if err != nil {
			return fmt.Errorf("send email: %w", err)
		}
		return nil
	}
}

func validate(message Message) error {
	if strings.TrimSpace(message.To) == "" {
		return fmt.Errorf("email recipient is required")
	}
	if strings.TrimSpace(message.Subject) == "" {
		return fmt.Errorf("email subject is required")
	}
	if strings.TrimSpace(message.Body) == "" {
		return fmt.Errorf("email body is required")
	}
	return nil
}
