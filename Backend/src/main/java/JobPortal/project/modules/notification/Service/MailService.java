package JobPortal.project.modules.notification.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String mailUsername;

    @Async("koraAsyncExecutor")
    public void sendEmail(String to, String subject, String body) {
        log.info("Sending email via {} → to={}, subject={}", mailUsername, to, subject);
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            
            String htmlContent = buildHtmlTemplate(subject, body);
            helper.setText(htmlContent, true);
            
            mailSender.send(mimeMessage);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Email delivery failed for {}: {}", to, e.getMessage());
        }
    }

    private String buildHtmlTemplate(String title, String message) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "  <title>KORA Notification</title>\n" +
                "  <style>\n" +
                "    body {\n" +
                "      font-family: 'Poppins', 'Segoe UI', Helvetica, Arial, sans-serif;\n" +
                "      background-color: #F3F4F6;\n" +
                "      margin: 0;\n" +
                "      padding: 0;\n" +
                "      -webkit-font-smoothing: antialiased;\n" +
                "    }\n" +
                "    .email-container {\n" +
                "      max-width: 600px;\n" +
                "      margin: 40px auto;\n" +
                "      background-color: #ffffff;\n" +
                "      border-radius: 16px;\n" +
                "      overflow: hidden;\n" +
                "      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);\n" +
                "      border: 1px solid #E5E7EB;\n" +
                "    }\n" +
                "    .email-header {\n" +
                "      background: linear-gradient(135deg, #1A5C2E 0%, #0D3D1F 100%);\n" +
                "      padding: 32px 24px;\n" +
                "      text-align: center;\n" +
                "      border-bottom: 3px solid #F97316;\n" +
                "    }\n" +
                "    .email-logo-text {\n" +
                "      color: #ffffff;\n" +
                "      font-size: 28px;\n" +
                "      font-weight: 800;\n" +
                "      letter-spacing: -0.5px;\n" +
                "      margin: 0;\n" +
                "    }\n" +
                "    .email-logo-tagline {\n" +
                "      color: rgba(255, 255, 255, 0.8);\n" +
                "      font-size: 10px;\n" +
                "      font-weight: 600;\n" +
                "      letter-spacing: 2px;\n" +
                "      margin: 4px 0 0;\n" +
                "      text-transform: uppercase;\n" +
                "    }\n" +
                "    .email-body {\n" +
                "      padding: 40px 32px;\n" +
                "      color: #111827;\n" +
                "      line-height: 1.6;\n" +
                "    }\n" +
                "    .email-title {\n" +
                "      font-size: 20px;\n" +
                "      font-weight: 700;\n" +
                "      color: #1A5C2E;\n" +
                "      margin-top: 0;\n" +
                "      margin-bottom: 20px;\n" +
                "    }\n" +
                "    .email-text {\n" +
                "      font-size: 15px;\n" +
                "      color: #374151;\n" +
                "      margin-bottom: 30px;\n" +
                "    }\n" +
                "    .email-btn-wrap {\n" +
                "      text-align: center;\n" +
                "      margin: 35px 0;\n" +
                "    }\n" +
                "    .email-btn {\n" +
                "      background-color: #F97316;\n" +
                "      color: #ffffff !important;\n" +
                "      text-decoration: none;\n" +
                "      padding: 12px 30px;\n" +
                "      border-radius: 8px;\n" +
                "      font-size: 15px;\n" +
                "      font-weight: 700;\n" +
                "      display: inline-block;\n" +
                "      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);\n" +
                "    }\n" +
                "    .email-footer {\n" +
                "      background-color: #F9FAFB;\n" +
                "      padding: 24px;\n" +
                "      text-align: center;\n" +
                "      font-size: 12px;\n" +
                "      color: #6B7280;\n" +
                "      border-top: 1px solid #E5E7EB;\n" +
                "    }\n" +
                "    .email-footer a {\n" +
                "      color: #1A5C2E;\n" +
                "      text-decoration: none;\n" +
                "      font-weight: 600;\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"email-container\">\n" +
                "    <div class=\"email-header\">\n" +
                "      <div class=\"email-logo-text\">KORA</div>\n" +
                "      <div class=\"email-logo-tagline\">Unlock Your Career</div>\n" +
                "    </div>\n" +
                "    <div class=\"email-body\">\n" +
                "      <h2 class=\"email-title\">" + title + "</h2>\n" +
                "      <p class=\"email-text\">" + message + "</p>\n" +
                "      <div class=\"email-btn-wrap\">\n" +
                "        <a href=\"https://job-portal-project-bay.vercel.app\" class=\"email-btn\">Accéder à Kora</a>\n" +
                "      </div>\n" +
                "    </div>\n" +
                "    <div class=\"email-footer\">\n" +
                "      <p>© 2026 Kora. Tous droits réservés.</p>\n" +
                "      <p>Fait avec ♥ pour l'Afrique · <a href=\"https://job-portal-project-bay.vercel.app\">Visiter le site</a></p>\n" +
                "    </div>\n" +
                "    <div style=\"height: 5px; background: linear-gradient(90deg, #1A5C2E, #F97316);\"></div>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
