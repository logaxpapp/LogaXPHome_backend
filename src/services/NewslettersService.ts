import Newsletter, { INewsletter } from '../models/Newsletter';

class NewslettersService {
  static async createNewsletter(subject: string, content: string, image?: string): Promise<INewsletter> {
    return Newsletter.create({ subject, content, image });
  }

  static async getAllNewsletters(): Promise<INewsletter[]> {
    return Newsletter.find().sort({ createdAt: -1 });
  }

  static async getNewsletterById(id: string): Promise<INewsletter | null> {
    return Newsletter.findById(id);
  }

  static async updateNewsletter(id: string, updates: Partial<INewsletter>): Promise<INewsletter | null> {
    return Newsletter.findByIdAndUpdate(id, updates, { new: true });
  }

  static async deleteNewsletter(id: string): Promise<void> {
    await Newsletter.findByIdAndDelete(id);
  }
  
}

export default NewslettersService;
