import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ForumCategory from '@/models/ForumCategory';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  
  const categories = [
    {
      name: 'General Discussion',
      description: 'Chat about anything fitness related.',
      icon: 'MessageSquare',
      order: 1
    },
    {
      name: 'Form Checks',
      description: 'Post videos of your lifts and get feedback from trainers.',
      icon: 'Video',
      order: 2
    },
    {
      name: 'Diet & Nutrition',
      description: 'Share recipes, meal plans, and diet tips.',
      icon: 'Apple',
      order: 3
    },
    {
      name: 'Workout Programs',
      description: 'Discuss routines, splits, and programming.',
      icon: 'Dumbbell',
      order: 4
    },
    {
      name: 'Announcements',
      description: 'Official news and updates from the admins.',
      icon: 'Bell',
      order: 5
    }
  ];

  try {
    for (const cat of categories) {
      await ForumCategory.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
    }
    return NextResponse.json({ success: true, message: 'Categories seeded successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed categories' }, { status: 500 });
  }
}
