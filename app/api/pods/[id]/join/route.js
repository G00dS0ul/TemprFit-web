import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import Pod from '@/models/Pod';

export async function POST(req, { params }) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const podId = params.id;
    await connectDB();
    
    const pod = await Pod.findById(podId);
    if (!pod) {
      return NextResponse.json({ error: 'Pod not found' }, { status: 404 });
    }

    const isMember = pod.members.some(id => id.toString() === decoded.userId);

    if (isMember) {
      // Leave pod
      pod.members = pod.members.filter(id => id.toString() !== decoded.userId);
    } else {
      // Join pod
      pod.members.push(decoded.userId);
    }

    await pod.save();

    return NextResponse.json({ success: true, joined: !isMember, members: pod.members.length });
  } catch (error) {
    console.error('Pod join error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
