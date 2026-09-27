const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/user/transfer-xp/route.js';
const newContent = 
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    
    const sender = await getSessionUser();
    if (!sender) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUsername, amount } = await req.json();
    const numAmount = parseInt(amount);

    if (!targetUsername || !numAmount || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid transfer details' }, { status: 400 });
    }

    if (sender.xp < numAmount) {
      return NextResponse.json({ error: 'Insufficient XP' }, { status: 400 });
    }

    const receiver = await User.findOne({ username: new RegExp('^' + targetUsername + '$', 'i') });
    if (!receiver) {
      return NextResponse.json({ error: 'Recipient username not found' }, { status: 404 });
    }

    if (sender._id.toString() === receiver._id.toString()) {
      return NextResponse.json({ error: 'You cannot send XP to yourself' }, { status: 400 });
    }

    sender.xp -= numAmount;
    receiver.xp += numAmount;

    await sender.save();
    await receiver.save();

    return NextResponse.json({ success: true, newXp: sender.xp });
  } catch (error) {
    console.error('XP Transfer Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
;
fs.writeFileSync(path, newContent, 'utf8');
