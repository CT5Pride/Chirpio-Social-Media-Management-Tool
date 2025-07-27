# Chirpio - Social Media Management Suite for Non-Profits

A **free**, **simple**, and **secure** platform for verified charities to manage their social media presence across platforms like Facebook, Twitter, Instagram, and LinkedIn.

## 🎯 MVP Features

- ✅ **Secure authentication and organisation approval**
- ✅ **Facebook OAuth integration** with proper token storage
- ✅ **AI-powered post suggestions** using OpenAI
- ✅ **Post creation and scheduling** with platform targeting
- ✅ **Strong RLS-based access control** in Supabase

## 🏗️ Architecture

- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js API Routes
- **Database**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4
- **OAuth**: Facebook Graph API

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Facebook OAuth Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### 2. Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Create tables
CREATE TABLE organisations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organisation_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organisation_id, user_id)
);

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

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT DEFAULT 'draft',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE post_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own social accounts" ON social_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts" ON social_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts" ON social_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts" ON social_accounts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view posts from their organisation" ON posts
  FOR SELECT USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts for their organisation" ON posts
  FOR INSERT WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts from their organisation" ON posts
  FOR UPDATE USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete posts from their organisation" ON posts
  FOR DELETE USING (
    organisation_id IN (
      SELECT organisation_id FROM organisation_members WHERE user_id = auth.uid()
    )
  );
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

## 🧪 API Testing

### 1. Facebook OAuth Callback Test

```bash
# Simulate Facebook OAuth callback (replace with actual code)
curl -X GET "http://localhost:3000/api/oauth/facebook/callback?code=test_auth_code" \
  -H "Cookie: sb-access-token=your_session_token"
```

### 2. AI Suggestions Test

```bash
# Test AI post suggestions
curl -X POST "http://localhost:3000/api/ai-suggest" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=your_session_token" \
  -d '{
    "content": "Help us raise funds for our local food bank this holiday season"
  }'
```

### 3. Post Creation Test

```bash
# Test post creation
curl -X POST "http://localhost:3000/api/post/create" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=your_session_token" \
  -d '{
    "content": "Join us this Saturday for our community cleanup event! 🌱",
    "platforms": ["facebook", "twitter"],
    "scheduled_time": "2024-01-15T10:00:00Z"
  }'
```

### 4. Facebook Disconnect Test

```bash
# Test Facebook disconnection
curl -X DELETE "http://localhost:3000/api/oauth/facebook/disconnect" \
  -H "Cookie: sb-access-token=your_session_token"
```

## 📋 API Endpoints

### Authentication Required Endpoints

All endpoints require a valid Supabase session cookie (`sb-access-token`).

#### `GET /api/oauth/facebook/callback`
Handles Facebook OAuth callback and stores access token.

**Query Parameters:**
- `code` (required): Facebook authorization code
- `error` (optional): OAuth error if any

**Response:** Redirects to `/dashboard` with success/error status

#### `POST /api/ai-suggest`
Generates AI-powered post suggestions using OpenAI.

**Request Body:**
```json
{
  "content": "Your post content here"
}
```

**Response:**
```json
{
  "suggestion": "AI-generated suggestion with hashtags and improvements",
  "organisation_id": "uuid"
}
```

#### `POST /api/post/create`
Creates a new scheduled post for the user's organisation.

**Request Body:**
```json
{
  "content": "Post content",
  "platforms": ["facebook", "twitter", "instagram", "linkedin"],
  "scheduled_time": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "id": "uuid",
    "content": "Post content",
    "platforms": ["facebook", "twitter"],
    "status": "scheduled",
    "scheduled_time": "2024-01-15T10:00:00Z",
    "created_at": "2024-01-10T12:00:00Z"
  }
}
```

#### `DELETE /api/oauth/facebook/disconnect`
Removes Facebook account connection.

**Response:**
```json
{
  "success": true
}
```

## 🔒 Security Features

- **Row Level Security (RLS)**: All database operations are protected by RLS policies
- **Organisation Verification**: Only verified organisations can use AI suggestions and create posts
- **User Isolation**: Users can only access data from their own organisation
- **Session Validation**: All endpoints validate Supabase session tokens
- **Environment Variables**: All sensitive data stored in environment variables

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Make sure to update the Facebook redirect URI for production:
```
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=https://your-domain.vercel.app/api/oauth/facebook/callback
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure Supabase session is valid
2. **Organisation Not Verified**: Check organisation verification status in database
3. **Facebook OAuth Errors**: Verify Facebook app configuration and redirect URI
4. **RLS Policy Errors**: Ensure user has proper organisation membership

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, email support@chirpio.org or create an issue in this repository.
