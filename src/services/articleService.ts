import mongoose from'mongoose';
import Article, { IArticle } from '../models/Article';
type ArticleStatus = 'Published' | 'Draft' | 'Archived';

interface ArticleQueryOptions {
    search?: string;
    tags?: string[];
    status?: ArticleStatus | ArticleStatus[];
    authorId?: string;
    page?: number;
    limit?: number;
  }

  export const createArticle = async (articleData: Partial<IArticle>): Promise<IArticle> => {
    const article = new Article(articleData);
    return await article.save();
  };
  
  export const updateArticle = async (
    articleId: string,
    updateData: Partial<IArticle>
  ): Promise<IArticle | null> => {
    return await Article.findByIdAndUpdate(articleId, updateData, { new: true }).exec();
  };
  

export const getArticleBySlug = async (slug: string): Promise<IArticle | null> => {
  return await Article.findOne({ slug, status: 'Published' })
    .populate('author', 'name email')
    .populate('comments.user', 'name email')
    .exec();
};

export const deleteArticle = async (articleId: string): Promise<IArticle | null> => {
  return await Article.findByIdAndDelete(articleId).exec();
};

export const getRelatedArticles = async (
    articleId: string,
    tags: string[],
    limit = 3
  ): Promise<IArticle[]> => {
    return await Article.find({
      _id: { $ne: articleId },
      tags: { $in: tags },
      status: 'Published',
    })
      .sort({ views: -1 })
      .limit(limit)
      .exec();
  };


  export const getTrendingArticles = async (limit = 5): Promise<IArticle[]> => {
    return await Article.find({ status: 'Published' })
      .sort({ likes: -1 }) // Sort by likes instead of views
      .limit(limit)
      .exec();
  };

export const listArticles = async (options: ArticleQueryOptions): Promise<{
    data: IArticle[];
    total: number;
    page: number;
    pages: number;
  }> => {
    const {
      search,
      tags,
      status = 'Published',
      authorId,
      page = 1,
      limit = 10,
    } = options;
  
    const query: any = {};
  
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }
  
    if (search) {
      query.$text = { $search: search };
    }
  
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
  
    if (authorId) {
      query.author = authorId;
    }
  
    const total = await Article.countDocuments(query);
    const pages = Math.ceil(total / limit);
    const data = await Article.find(query)
      .populate('author', 'name email')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  
    return { data, total, page, pages };
  };


export const incrementArticleViews = async (slug: string): Promise<void> => {
  await Article.updateOne({ slug }, { $inc: { views: 1 } }).exec();
};

export const likeArticle = async (articleId: string,  userId:  mongoose.Types.ObjectId): Promise<void> => {
  await Article.findByIdAndUpdate(articleId, { $inc: { likes: 1 } });
};

export const getArticleById = async (id: string): Promise<IArticle | null> => {
  return await Article.findById(id)
    .populate('author', '_id name email') // Populate author with selected fields
    .exec();
};


export const addComment = async (
  articleId: string,
  userId: mongoose.Types.ObjectId,
  content: string
): Promise<IArticle | null> => {
  return await Article.findByIdAndUpdate(
    articleId,
    {
      $push: {
        comments: { user: userId, content },
      },
    },
    { new: true }
  )
    .populate('author', '_id name email')
    .populate('comments.user', 'name email')
    .exec();
};

