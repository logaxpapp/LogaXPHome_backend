// src/services/faqService.ts

import FAQ, { IFAQ } from '../models/FAQ';

class FAQService {
  async createFAQ(faqData: Partial<IFAQ>, userId: string): Promise<IFAQ> {
    const faq = new FAQ({ ...faqData, createdBy: userId });
    return faq.save();
  }

  async getFAQs(application?: string): Promise<IFAQ[]> {
    const query = application ? { application } : {};
    return FAQ.find(query).sort({ createdAt: -1 });
  }

  async updateFAQ(faqId: string, updateData: Partial<IFAQ>, userId: string): Promise<IFAQ | null> {
    return FAQ.findByIdAndUpdate(
      faqId,
      { ...updateData, updatedBy: userId },
      { new: true, runValidators: true } // Ensures validators run on update
    );
  }

  async getFAQById(faqId: string): Promise<IFAQ | null> {
    return FAQ.findById(faqId);
  }

  async deleteFAQ(faqId: string): Promise<IFAQ | null> {
    return FAQ.findByIdAndDelete(faqId);
  }
}

export default new FAQService();
