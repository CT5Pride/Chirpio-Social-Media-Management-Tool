import { NextRequest, NextResponse } from 'next/server';
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
    const { content, platforms, scheduled_time } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Platforms array is required' },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Invalid platforms: ${invalidPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse scheduled_time if provided
    let scheduledTime = null;
    if (scheduled_time) {
      scheduledTime = new Date(scheduled_time);
      if (isNaN(scheduledTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled_time format' },
          { status: 400 }
        );
      }
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        organisation_id: orgMembership.organisation_id,
        user_id: user.id,
        content: content,
        platforms: platforms,
        status: 'scheduled',
        scheduled_time: scheduledTime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      post: {
        id: post.id,
        content: post.content,
        platforms: post.platforms,
        status: post.status,
        scheduled_time: post.scheduled_time,
        created_at: post.created_at,
      }
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 