// src/services/faqService.ts

import FAQ, { IFAQ, Application } from '../models/ApplicationFAQ';
import mongoose from 'mongoose';

class FAQService {
  async createFAQ(faqData: Partial<IFAQ>, userId: mongoose.Types.ObjectId): Promise<IFAQ> {
    const { question, answer, application } = faqData;

    // Validate required fields
    if (!question || !answer || !application) {
        throw new Error('Missing required fields: question, answer, and application.');
    }

    // Validate the application field
    if (!Object.values(Application).includes(application as Application)) {
        throw new Error(`Invalid application value: ${application}`);
    }

    const faq = new FAQ({
        question,
        answer,
        application: application as Application, // Ensure it is explicitly assigned
        createdBy: userId,
    });

    const savedFAQ = await faq.save();

    console.log('Saved FAQ:', savedFAQ); // Log after saving to confirm the field is persisted
    return savedFAQ;
}
  async getFAQs(application?: string): Promise<IFAQ[]> {
    const query = application ? { application } : {};
    return FAQ.find(query).sort({ createdAt: -1 });
  }
  async getPublishedFAQs(application: string) {
    // Explicitly type the query object to include 'application' as an optional key
    const query: { published: boolean; application?: string } = { published: true };
    
    if (application) {
      query.application = application;
    }
    
    return await FAQ.find(query).exec();
  }
  

  async updateFAQ(id: string, updateData: Partial<IFAQ>, userId: mongoose.Types.ObjectId) {
    return await FAQ.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: userId },
      { new: true, runValidators: true }
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
