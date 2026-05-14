package JobPortal.project.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Value("${spring.task.execution.pool.core-size:2}")
    private int coreSize;

    @Value("${spring.task.execution.pool.max-size:8}")
    private int maxSize;

    @Value("${spring.task.execution.pool.queue-capacity:100}")
    private int queueCapacity;

    @Bean("koraAsyncExecutor")
    public Executor koraAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(coreSize);
        executor.setMaxPoolSize(maxSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("kora-async-");
        executor.initialize();
        return executor;
    }
}



