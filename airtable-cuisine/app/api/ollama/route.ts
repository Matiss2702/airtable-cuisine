import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'mistral', options = {} } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const ollamaHost = process.env.OLLAMA_HOST || 'http://ollama:11434';

    const ollamaRes = await fetch(`${ollamaHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, options, stream: false }),
    });

    if (!ollamaRes.ok) {
      const text = await ollamaRes.text();
      console.error('Ollama API Error:', text);
      return NextResponse.json({ error: text }, { status: 500 });
    }

    const data = await ollamaRes.json();

    return NextResponse.json({
      message: {
        content: data.response || 'Pas de contenu renvoyé par Ollama',
      },
    });
  } catch (error) {
    console.error('Error in Ollama API route:', error);
    return NextResponse.json({ error: 'Erreur interne serveur' }, { status: 500 });
  }
}
