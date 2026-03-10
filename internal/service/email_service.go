package service

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

// EmailService sends transactional emails via SMTP.
// If SMTP_HOST is not set, all sends are silently skipped (dev-friendly).
type EmailService struct {
	host string
	port string
	user string
	pass string
	from string
}

func NewEmailService() *EmailService {
	return &EmailService{
		host: os.Getenv("SMTP_HOST"),
		port: os.Getenv("SMTP_PORT"),
		user: os.Getenv("SMTP_USER"),
		pass: os.Getenv("SMTP_PASS"),
		from: os.Getenv("SMTP_FROM"),
	}
}

func (s *EmailService) enabled() bool {
	return s.host != ""
}

func (s *EmailService) send(to, subject, htmlBody string) error {
	if !s.enabled() {
		log.Printf("[EmailService] SMTP not configured — skipping email to %s: %s", to, subject)
		return nil
	}

	port := s.port
	if port == "" {
		port = "587"
	}
	from := s.from
	if from == "" {
		from = s.user
	}

	headers := map[string]string{
		"From":         from,
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/html; charset=UTF-8",
	}
	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(k + ": " + v + "\r\n")
	}
	msg.WriteString("\r\n" + htmlBody)

	addr := s.host + ":" + port
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)

	// Try STARTTLS first; fall back to plain if TLS is not available
	tlsConf := &tls.Config{ServerName: s.host}
	conn, err := tls.Dial("tcp", addr, tlsConf)
	if err != nil {
		// Try plain SMTP with STARTTLS
		if err2 := smtp.SendMail(addr, auth, from, []string{to}, []byte(msg.String())); err2 != nil {
			return fmt.Errorf("smtp send: %w", err2)
		}
		return nil
	}
	defer conn.Close()

	c, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return fmt.Errorf("smtp client: %w", err)
	}
	defer c.Quit()
	if err := c.Auth(auth); err != nil {
		return fmt.Errorf("smtp auth: %w", err)
	}
	if err := c.Mail(from); err != nil {
		return err
	}
	if err := c.Rcpt(to); err != nil {
		return err
	}
	wc, err := c.Data()
	if err != nil {
		return err
	}
	defer wc.Close()
	_, err = wc.Write([]byte(msg.String()))
	return err
}

// SendCourseInvitation notifies a student they've been invited to a course.
func (s *EmailService) SendCourseInvitation(toEmail, studentName, courseName, teacherName string) {
	subject := fmt.Sprintf("You're invited to: %s", courseName)
	body := fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#111">
<h2>Hi %s 👋</h2>
<p>You have been invited to join the course <strong>%s</strong> by <strong>%s</strong>.</p>
<p>Log in to your account to accept or decline this invitation.</p>
<hr><p style="color:#999;font-size:12px">SchoolTJ Platform</p>
</body></html>`, studentName, courseName, teacherName)

	go func() {
		if err := s.send(toEmail, subject, body); err != nil {
			log.Printf("[EmailService] course invitation to %s failed: %v", toEmail, err)
		}
	}()
}

// SendPaymentConfirmation notifies a student their payment was received.
func (s *EmailService) SendPaymentConfirmation(toEmail, studentName, courseName string, amount float64) {
	subject := fmt.Sprintf("Payment confirmed — %s", courseName)
	body := fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#111">
<h2>Payment Received ✅</h2>
<p>Hi <strong>%s</strong>,</p>
<p>Your payment of <strong>TJS %.2f</strong> for <strong>%s</strong> has been confirmed.</p>
<p>Thank you for your payment!</p>
<hr><p style="color:#999;font-size:12px">SchoolTJ Platform</p>
</body></html>`, studentName, amount, courseName)

	go func() {
		if err := s.send(toEmail, subject, body); err != nil {
			log.Printf("[EmailService] payment confirmation to %s failed: %v", toEmail, err)
		}
	}()
}

// SendAssignmentReminder reminds a student of an upcoming assignment deadline.
func (s *EmailService) SendAssignmentReminder(toEmail, studentName, assignmentTitle, courseName, dueDate string) {
	subject := fmt.Sprintf("Assignment due soon: %s", assignmentTitle)
	body := fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#111">
<h2>⏰ Assignment Reminder</h2>
<p>Hi <strong>%s</strong>,</p>
<p>Your assignment <strong>"%s"</strong> in <strong>%s</strong> is due on <strong>%s</strong>.</p>
<p>Make sure to submit it on time!</p>
<hr><p style="color:#999;font-size:12px">SchoolTJ Platform</p>
</body></html>`, studentName, assignmentTitle, courseName, dueDate)

	go func() {
		if err := s.send(toEmail, subject, body); err != nil {
			log.Printf("[EmailService] assignment reminder to %s failed: %v", toEmail, err)
		}
	}()
}

// SendNewMessageNotification tells a user they have a new message.
func (s *EmailService) SendNewMessageNotification(toEmail, recipientName, senderName string) {
	subject := fmt.Sprintf("New message from %s", senderName)
	body := fmt.Sprintf(`
<html><body style="font-family:sans-serif;color:#111">
<h2>💬 New Message</h2>
<p>Hi <strong>%s</strong>,</p>
<p>You have a new message from <strong>%s</strong>.</p>
<p>Log in to read and reply.</p>
<hr><p style="color:#999;font-size:12px">SchoolTJ Platform</p>
</body></html>`, recipientName, senderName)

	go func() {
		if err := s.send(toEmail, subject, body); err != nil {
			log.Printf("[EmailService] message notification to %s failed: %v", toEmail, err)
		}
	}()
}
