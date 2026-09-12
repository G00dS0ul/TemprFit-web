import { NextResponse } from 'next/server';
import { askGemini } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { query, context } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const systemPrompt = `
You are a highly aware, natural-sounding AI Personal Trainer talking directly into your client's ear while they are sweating and working out. 
You must speak naturally, like a real human trainer standing right next to them. 
Avoid repetitive catchphrases like "Boom!" or sounding like a generic robot. 
Add energy and motivation, but keep it conversational and grounded. 
When they ask you questions, give them short, punchy, aggressive (but positive) motivation before answering.
Acknowledge the specific exercise they are currently doing from the Workout Context. 

CRITICAL TIMING RULES:
If the user tells you they have exactly 5 seconds left on a timer, you MUST literally say the countdown: "5... 4... 3... 2... 1... Go!"

Keep your answers VERY short (1-3 sentences max) because it will be read aloud by a Text-to-Speech engine. 
Do not use emojis, markdown formatting, or bullet points. Use plain conversational English. 

Workout Context:
${JSON.stringify(context, null, 2)}
`;

    const responseText = await askGemini({
      systemPrompt,
      history: [],
      userMessage: query
    });
    
    // Fallback cleanup to ensure TTS friendliness
    const cleanText = responseText.replace(/[*_#`~]/g, '');

    return NextResponse.json({ reply: cleanText });
  } catch (error) {
    console.error('Voice Coach API Error:', error);
    return NextResponse.json({ error: 'Failed to process voice query' }, { status: 500 });
  }
}
