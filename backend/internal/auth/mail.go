package auth

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"time"
)

// smtpDialTimeout bounds connection establishment to the mail relay — without
// it a blackholed outbound connection (e.g. behind a proxy) hangs the request
// until the server write timeout kills the response with no error logged.
const smtpDialTimeout = 10 * time.Second

// sendCodeEmail delivers the 6-digit login code to the given address via SMTP.
func (c Config) sendCodeEmail(to, code string) error {
	msg := fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: Routine Series login code\r\n"+
			"\r\n"+
			"Your login code: %s\r\n"+
			"It is valid for 10 minutes.\r\n",
		c.SMTPUser, to, code,
	)
	addr := fmt.Sprintf("%s:%d", c.SMTPHost, c.SMTPPort)

	client, err := dialSMTP(addr, c.SMTPHost, c.SMTPPort)
	if err != nil {
		return err
	}
	defer client.Close()

	if err := client.Auth(smtp.PlainAuth("", c.SMTPUser, c.SMTPPass, c.SMTPHost)); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err := client.Mail(c.SMTPUser); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("smtp rcpt to: %w", err)
	}

	wc, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := wc.Write([]byte(msg)); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	if err := wc.Close(); err != nil {
		return fmt.Errorf("smtp close data: %w", err)
	}

	if err := client.Quit(); err != nil {
		return fmt.Errorf("smtp quit: %w", err)
	}
	return nil
}

// dialSMTP connects to the relay: implicit SSL for port 465, plain TCP with
// STARTTLS for everything else (587). The dial itself is bounded by
// smtpDialTimeout so failures surface quickly with a loggable error.
func dialSMTP(addr, host string, port int) (*smtp.Client, error) {
	if port == 465 {
		conn, err := tls.DialWithDialer(
			&net.Dialer{Timeout: smtpDialTimeout}, "tcp", addr,
			&tls.Config{ServerName: host},
		)
		if err != nil {
			return nil, fmt.Errorf("dial smtp %s: %w", addr, err)
		}
		return smtp.NewClient(conn, host)
	}

	conn, err := net.DialTimeout("tcp", addr, smtpDialTimeout)
	if err != nil {
		return nil, fmt.Errorf("dial smtp %s: %w", addr, err)
	}
	client, err := smtp.NewClient(conn, host)
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("smtp client %s: %w", host, err)
	}
	if ok, _ := client.Extension("STARTTLS"); ok {
		if err := client.StartTLS(&tls.Config{ServerName: host}); err != nil {
			return nil, fmt.Errorf("smtp starttls: %w", err)
		}
	}
	return client, nil
}
