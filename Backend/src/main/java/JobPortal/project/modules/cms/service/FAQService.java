package JobPortal.project.modules.cms.service;

import JobPortal.project.modules.cms.model.FAQ;
import JobPortal.project.modules.cms.repository.FAQRepository;
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
    public List<FAQ> getActiveFAQs() {
        return faqRepository.findAllByIsActive(true);
    }

    @Transactional
    public FAQ createFAQ(FAQ faq) {
        return faqRepository.save(faq);
    }

    @Transactional
    public FAQ updateFAQ(Long id, FAQ updatedFaq) {
        FAQ existingFaq = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ not found with id: " + id));
        existingFaq.setQuestion(updatedFaq.getQuestion());
        existingFaq.setAnswer(updatedFaq.getAnswer());
        existingFaq.setIsActive(updatedFaq.getIsActive());
        return faqRepository.save(existingFaq);
    }

    @Transactional
    public void deleteFAQ(Long id) {
        if (!faqRepository.existsById(id)) {
            throw new RuntimeException("FAQ not found with id: " + id);
        }
        faqRepository.deleteById(id);
    }
}
