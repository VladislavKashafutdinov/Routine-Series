package auth

import (
	"fmt"
	"net/smtp"
)

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
	auth := smtp.PlainAuth("", c.SMTPUser, c.SMTPPass, c.SMTPHost)
	return smtp.SendMail(addr, auth, c.SMTPUser, []string{to}, []byte(msg))
}
