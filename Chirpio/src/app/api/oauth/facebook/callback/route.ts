import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Facebook OAuth error:', error);
      return NextResponse.redirect(new URL('/dashboard/confirmation?error=oauth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/confirmation?error=no_code', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v17.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/dashboard/confirmation?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    if (!access_token) {
      return NextResponse.redirect(new URL('/dashboard/confirmation?error=no_access_token', request.url));
    }

    // Get user profile info
    const profileResponse = await fetch(`https://graph.facebook.com/me?access_token=${access_token}`);
    const profileData = await profileResponse.json();

    // Get the current user from the session using cookies
    const cookieStore = await cookies();
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    // Get the session from cookies
    const sessionToken = cookieStore.get('sb-access-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/dashboard?error=not_authenticated', request.url));
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(sessionToken);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.redirect(new URL('/dashboard/confirmation?error=not_authenticated', request.url));
    }

    const userId = user.id;

    // Store the access token in Supabase
    const { error: insertError } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: userId,
        platform: 'facebook',
        access_token: access_token,
        profile_data: profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      });

    if (insertError) {
      console.error('Error storing access token:', insertError);
      return NextResponse.redirect(new URL('/dashboard/confirmation?error=storage_failed', request.url));
    }

    return NextResponse.redirect(new URL('/dashboard/confirmation?success=facebook_connected', request.url));

  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard/confirmation?error=callback_failed', request.url));
  }
} 