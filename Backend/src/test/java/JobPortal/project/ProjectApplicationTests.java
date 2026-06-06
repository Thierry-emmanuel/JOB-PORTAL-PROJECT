package JobPortal.project;

import JobPortal.project.modules.notification.Service.MailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.mail.username=emmanueltsafack2005@gmail.com",
    "spring.mail.password=ofoaxklbzatkbgwp"
})
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
        // Wait longer for the async executor to complete SMTP transmission
        Thread.sleep(12000);
    }
}
