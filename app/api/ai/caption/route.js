import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { askGemini } from '@/lib/gemini';

export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { item, type } = await request.json();

    if (!item) {
      return NextResponse.json({ error: 'Item data is required' }, { status: 400 });
    }

    const systemPrompt = `
      You are a fitness influencer writing a highly engaging social media caption for a post on a fitness app called TemprFit.
      The user is sharing a ${type}.
      Here is the raw data for the ${type}:
      ${JSON.stringify(item, null, 2)}
      
      Write a short, engaging, energetic caption (1-3 sentences maximum).
      Include a couple of relevant emojis.
      Sound authentic and motivating. Do not use hashtags.
      Output ONLY the caption text.
    `;

    const caption = await askGemini({
      systemPrompt,
      userMessage: `Generate a caption for my ${type} named "${item.name}".`,
    });

    return NextResponse.json({ caption: caption.trim() });
  } catch (error) {
    console.error('AI Caption Error:', error);
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
  }
}
