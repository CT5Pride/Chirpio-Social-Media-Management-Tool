import { NextRequest, NextResponse } from 'next/server';
import { getPostSuggestions } from '../../../../lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const suggestion = await getPostSuggestions(content);
    
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error processing suggestion request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 