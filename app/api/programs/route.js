import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import TrainerProgram from '@/models/TrainerProgram';
import User from '@/models/User';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const category = searchParams.get('category');
    const trainingMode = searchParams.get('trainingMode');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const filter = { isActive: true };
    if (trainerId) filter.trainer = trainerId;
    if (category) filter.category = category;
    if (trainingMode) filter.trainingMode = trainingMode;

    await connectDB();

    const programs = await TrainerProgram.find(filter)
      .populate('trainer', 'username avatarUrl trainerInfo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await TrainerProgram.countDocuments(filter);

    return NextResponse.json({
      programs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden: Only trainers can create programs' }, { status: 403 });
    }

    const {
      title, category, description, price,
      sessionsPerWeek, totalSessions, freeSessions,
      trainingMode, language, country, mediaGallery
    } = await request.json();

    if (!title || !description || !price || !sessionsPerWeek || !totalSessions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Verify the user is still a trainer in the DB and is approved
    const user = await User.findById(payload.userId);
    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ error: 'Invalid trainer profile' }, { status: 400 });
    }
    
    // We optionally require approval before creating programs, but let's allow draft creation.
    // However, maybe only approved trainers can make them active.
    const isActive = user.trainerInfo?.isApproved ? true : false;

    const program = await TrainerProgram.create({
      trainer: payload.userId,
      title,
      category,
      description,
      price: Number(price),
      sessionsPerWeek: Number(sessionsPerWeek),
      totalSessions: Number(totalSessions),
      freeSessions: Number(freeSessions || 0),
      trainingMode,
      language,
      country,
      mediaGallery: mediaGallery || [],
      isActive
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}
