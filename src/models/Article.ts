import mongoose, { Document, Schema, Model } from 'mongoose';
import { IUser } from './User';

export interface IComment extends Document {
  user: mongoose.Types.ObjectId | IUser;
  content: string;
  createdAt: Date;
}

export interface IArticle extends Document {
    _id: mongoose.Types.ObjectId; // Ensure _id is correctly typed
    title: string;
    content: string;
    author: mongoose.Types.ObjectId | IUser;
    tags: string[];
    slug: string;
    status: 'Published' | 'Draft' | 'Archived';
    views: number;
    likes: number;
    image?: string;
    comments: IComment[];
    createdAt: Date;
    updatedAt: Date;
  }

const CommentSchema: Schema<IComment> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ArticleSchema: Schema<IArticle> = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, index: true }],
    image: { type: String },
    slug: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Archived'],
      default: 'Draft',
      index: true,
    },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: [CommentSchema],
  },
  { timestamps: true }
);

// Generate a unique slug before saving
ArticleSchema.pre<IArticle>('validate', async function (next) {
  if (this.isModified('title')) {
    this.slug = await generateUniqueSlug(this.title);
  }
  next();
});

// Full-text search index on title and content
ArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Article: Model<IArticle> = mongoose.model<IArticle>('Article', ArticleSchema);
export default Article;

// Helper function to generate a unique slug
async function generateUniqueSlug(title: string): Promise<string> {
  const slugBase = slugify(title);
  let slug = slugBase;
  let count = 1;

  while (await Article.exists({ slug })) {
    slug = `${slugBase}-${count}`;
    count++;
  }

  return slug;
}

// Helper function to slugify a string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
}
