package JobPortal.project;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

@Slf4j
@SpringBootApplication
public class JobPortalApplication {

	public static void main(String[] args) {

		ConfigurableApplicationContext context =
				SpringApplication.run(JobPortalApplication.class, args);

		String port = context.getEnvironment().getProperty("server.port", "808");

		log.info("""
               \s
                ╔══════════════════════════════════════════════════════════╗
                ║           ✅  KORA Job Portal — Started         \s
                ╠══════════════════════════════════════════════════════════╣
                ║  Port    : {}
                ║  Local   : http://localhost:{}/
                ║  Swagger : http://localhost:{}/swagger-ui/index.html
                ╚══════════════════════════════════════════════════════════╝
               \s""", port, port, port);
	}
}