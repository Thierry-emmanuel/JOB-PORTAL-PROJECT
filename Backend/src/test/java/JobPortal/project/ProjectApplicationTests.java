package JobPortal.project;

import JobPortal.project.modules.notification.Service.MailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ProjectApplicationTests {

    @Autowired
    private MailService mailService;

    @Test
    void contextLoads() {
    }

    @Test
    void testMailSending() throws InterruptedException {
        mailService.sendEmail(
            "pouth917@gmail.com",
            "Test Kora Email Optimisé",
            "Ceci est un message de test envoyé depuis les tests d'intégration Kora pour valider le nouveau template HTML."
        );
        // Wait briefly for the async executor to process the email task
        Thread.sleep(3000);
    }
}
