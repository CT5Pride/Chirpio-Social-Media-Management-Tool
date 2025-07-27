import { NextRequest, NextResponse } from 'next/server';
import { getPostSuggestions } from '../../../../lib/openai';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('sb-access-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get user's organisation membership
    const { data: orgMembership, error: orgError } = await supabase
      .from('organisation_members')
      .select('organisation_id')
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgMembership) {
      return NextResponse.json(
        { error: 'No organisation membership found' },
        { status: 403 }
      );
    }

    // Check if organisation is verified
    const { data: organisation, error: orgVerifyError } = await supabase
      .from('organisations')
      .select('verified')
      .eq('id', orgMembership.organisation_id)
      .single();

    if (orgVerifyError || !organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 403 }
      );
    }

    if (!organisation.verified) {
      return NextResponse.json(
        { error: 'Organisation not verified' },
        { status: 403 }
      );
    }

    // Get request body
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get AI suggestion
    const suggestion = await getPostSuggestions(content);
    
    return NextResponse.json({ 
      suggestion,
      organisation_id: orgMembership.organisation_id 
    });

  } catch (error) {
    console.error('Error processing AI suggestion request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 