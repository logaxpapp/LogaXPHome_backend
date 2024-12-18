// src/services/faqService.ts

import FAQ, { IFAQ, Application } from '../models/FAQ';
import mongoose from 'mongoose';

class FAQService {
  async createFAQ(faqData: Partial<IFAQ>, userId: mongoose.Types.ObjectId): Promise<IFAQ> {
    const { question, answer, application } = faqData;

    // Log the payload being processed
    console.log('FAQ Payload:', { question, answer, application });

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

    console.log('Created FAQ Document:', faq); // Log the document before saving
    const savedFAQ = await faq.save();

    console.log('Saved FAQ:', savedFAQ); // Log after saving to confirm the field is persisted
    return savedFAQ;
}
  async getFAQs(application?: string): Promise<IFAQ[]> {
    const query = application ? { application } : {};
    return FAQ.find(query).sort({ createdAt: -1 });
  }

  async updateFAQ(faqId: string, updateData: Partial<IFAQ>, userId: mongoose.Types.ObjectId): Promise<IFAQ | null> {
    const { question, answer, application } = updateData;

    // Build update object explicitly
    const updateObj: Partial<IFAQ> = {
      updatedBy: userId, // Assign updatedBy as ObjectId
    };

    if (question !== undefined) updateObj.question = question;
    if (answer !== undefined) updateObj.answer = answer;
    if (application !== undefined) updateObj.application = application;

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      faqId,
      updateObj,
      { new: true, runValidators: true }
    );

    console.log('Updated FAQ Document:', updatedFAQ); // Log after updating

    return updatedFAQ;
  }


  async getFAQById(faqId: string): Promise<IFAQ | null> {
    return FAQ.findById(faqId);
  }

  async deleteFAQ(faqId: string): Promise<IFAQ | null> {
    return FAQ.findByIdAndDelete(faqId);
  }
}

export default new FAQService();
