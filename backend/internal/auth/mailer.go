package auth

import (
	"errors"
	"fmt"
	"net/smtp"
	"os"
)

// SendGrid (Twilio) mailer — a separate implementation from the Gmail one
// in mail.go. It is used when SENDGRID_API_KEY is set. Gmail config
// (GMAIL_ADDRESS / GMAIL_APP_PASSWORD / SMTP_HOST / SMTP_PORT) stays
// untouched and irrelevant in SendGrid mode.

const sendgridHost = "smtp.sendgrid.net"
const sendgridPort = 587

// sendMail dispatches code delivery to the provider selected explicitly by
// MAIL_PROVIDER: "smtp" (mail.go), "sendgrid", or "gmailapi"
// (mail_gmailapi.go). Each provider requires its own credentials.
func (c Config) sendMail(to, code string) error {
	switch c.MailProvider {
	case "sendgrid":
		key := os.Getenv("SENDGRID_API_KEY")
		if key == "" {
			return errors.New("SENDGRID_API_KEY environment variable is required for the sendgrid provider")
		}
		return sendCodeEmailSendGrid(to, code, key, c.SMTPUser)
	case "gmailapi":
		gcfg, err := loadGmailAPIConfig()
		if err != nil {
			return err
		}
		return sendCodeEmailGmailAPI(gcfg, to, code, c.SMTPUser)
	default:
		return c.sendCodeEmail(to, code)
	}
}

// sendCodeEmailSendGrid delivers the login code via SendGrid's SMTP relay.
// The SMTP login is the literal "apikey" and the From address is the
// verified sender (the same Gmail address used for Gmail mode).
func sendCodeEmailSendGrid(to, code, apiKey, from string) error {
	msg := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: Routine Series login code\r\n"+
			"\r\n"+
			"Your login code: %s\r\n"+
			"It is valid for 10 minutes.\r\n",
		from, to, code,
	)
	addr := fmt.Sprintf("%s:%d", sendgridHost, sendgridPort)

	client, err := dialSMTP(addr, sendgridHost, sendgridPort)
	if err != nil {
		return err
	}
	defer client.Close()

	if err := client.Auth(smtp.PlainAuth("", "apikey", apiKey, sendgridHost)); err != nil {
		return fmt.Errorf("sendgrid auth: %w", err)
	}
	if err := client.Mail(from); err != nil {
		return fmt.Errorf("sendgrid mail from: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("sendgrid rcpt to: %w", err)
	}

	wc, err := client.Data()
	if err != nil {
		return fmt.Errorf("sendgrid data: %w", err)
	}
	if _, err := wc.Write([]byte(msg)); err != nil {
		return fmt.Errorf("sendgrid write: %w", err)
	}
	if err := wc.Close(); err != nil {
		return fmt.Errorf("sendgrid close data: %w", err)
	}

	if err := client.Quit(); err != nil {
		return fmt.Errorf("sendgrid quit: %w", err)
	}
	return nil
}
