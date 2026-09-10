import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ForumCategory from '@/models/ForumCategory';
import ForumThread from '@/models/ForumThread';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  
  try {
    const categories = await ForumCategory.find({}).sort({ order: 1 }).lean();
    
    // Get thread counts for each category
    const categoriesWithStats = await Promise.all(categories.map(async (cat) => {
      const threadCount = await ForumThread.countDocuments({ category: cat._id });
      return { ...cat, threadCount };
    }));

    return NextResponse.json({ categories: categoriesWithStats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
