# Facebook OAuth Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Facebook OAuth Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback
```

## Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add Facebook Login product to your app
4. Configure the OAuth redirect URI: `http://localhost:3000/api/oauth/facebook/callback`
5. Get your App ID and App Secret from the app settings

## Supabase Setup

1. Create a `social_accounts` table in your Supabase database:

```sql
CREATE TABLE social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own social accounts" ON social_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts" ON social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts" ON social_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts" ON social_accounts
  FOR DELETE USING (auth.uid() = user_id);
```

## Features Implemented

✅ **Connect Facebook Button**: Redirects to Facebook OAuth with proper scopes
✅ **OAuth Callback**: Handles authorization code exchange and token storage
✅ **Dashboard UI**: Shows connection status with connect/disconnect options
✅ **Secure Disconnection**: API route for safely removing Facebook connection
✅ **Error Handling**: Comprehensive error handling and user feedback
✅ **Environment Variables**: All sensitive data stored in environment variables

## API Endpoints

- `GET /api/oauth/facebook/callback` - Handles Facebook OAuth callback
- `DELETE /api/oauth/facebook/disconnect` - Disconnects Facebook account

## Usage

1. Navigate to `/dashboard`
2. Click "Connect Facebook" to start OAuth flow
3. Authorize the app on Facebook
4. You'll be redirected back to the dashboard with connection status
5. Use the "Disconnect" button to remove the connection

## Scopes Requested

- `pages_manage_posts` - Post to Facebook Pages
- `pages_read_engagement` - Read Page insights
- `pages_show_list` - Access user's Pages
- `publish_to_groups` - Post to Facebook Groups 