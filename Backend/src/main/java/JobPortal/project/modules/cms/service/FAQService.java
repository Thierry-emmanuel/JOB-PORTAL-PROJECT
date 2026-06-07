package JobPortal.project.modules.cms.service;

import JobPortal.project.modules.cms.model.FAQ;
import JobPortal.project.modules.cms.repository.FAQRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FAQService {

    private final FAQRepository faqRepository;

    @Transactional(readOnly = true)
    public List<FAQ> getAllFAQs() {
        return faqRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "faqs", key = "'active'")
    public List<FAQ> getActiveFAQs() {
        return faqRepository.findAllByIsActive(true);
    }

    @Transactional
    @CacheEvict(value = "faqs", allEntries = true)
    public FAQ createFAQ(FAQ faq) {
        return faqRepository.save(faq);
    }

    @Transactional
    @CacheEvict(value = "faqs", allEntries = true)
    public FAQ updateFAQ(Long id, FAQ updatedFaq) {
        FAQ existingFaq = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found with id: " + id));
        existingFaq.setQuestion(updatedFaq.getQuestion());
        existingFaq.setAnswer(updatedFaq.getAnswer());
        existingFaq.setIsActive(updatedFaq.getIsActive());
        return faqRepository.save(existingFaq);
    }

    @Transactional
    @CacheEvict(value = "faqs", allEntries = true)
    public void deleteFAQ(Long id) {
        if (!faqRepository.existsById(id)) {
            throw new RuntimeException("FAQ not found with id: " + id);
        }
        faqRepository.deleteById(id);
    }
}