# Supabase Database Setup Guide

This guide will walk you through setting up the Supabase database for the AI Video Call Platform.

## 🚀 Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Choose your organization
5. Fill in project details:
   - **Name**: `ai-video-call-platform`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
6. Click **"Create new project"**

### 2. Get API Keys
Once your project is created:
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghij.supabase.co`)
   - **anon public key** 
   - **service_role secret key**

### 3. Configure Environment Variables
Update your backend `.env` file:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key-here
```

### 4. Run Database Migrations

#### Option A: Automatic Migration (Recommended)
```bash
cd backend
npm run migrate
```

#### Option B: Manual Setup
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `backend/migrations/001_initial_schema.sql`
4. Click **Run**
5. Repeat for `backend/migrations/002_seed_data.sql`

### 5. Verify Setup
```bash
cd backend
npm run dev
```

Look for this message in the console:
```
✅ Supabase client initialized successfully
```

## 📊 Database Schema Overview

The database includes the following tables:

### Core Tables
- **users** - User profiles, status, and preferences
- **walking_sessions** - Active and completed walking sessions
- **call_sessions** - AI companion video call sessions
- **safety_alerts** - Safety warnings and alerts
- **emergency_incidents** - Emergency situations and responses
- **response_teams** - Emergency response teams

### Key Features
- ✅ UUID primary keys
- ✅ Foreign key relationships
- ✅ Automatic timestamps (`created_at`, `updated_at`)
- ✅ Enum constraints for status fields
- ✅ JSONB for flexible data (locations, conversation history)
- ✅ Performance indexes
- ✅ Sample data for testing

## 🔍 Verifying Your Setup

### 1. Check Tables in Supabase Dashboard
1. Go to **Table Editor** in your Supabase dashboard
2. You should see 6 tables: `users`, `walking_sessions`, `call_sessions`, `safety_alerts`, `emergency_incidents`, `response_teams`
3. Each table should have sample data

### 2. Test API Endpoints
Start the backend and test some endpoints:

```bash
# Get all users
curl http://localhost:3001/api/users

# Get walking sessions
curl http://localhost:3001/api/safewalk/sessions

# Get emergency incidents
curl http://localhost:3001/api/emergency/incidents
```

### 3. Check Backend Logs
When starting the backend, you should see:
```
✅ Supabase client initialized successfully
```

Instead of:
```
🔄 Running in mock mode - Supabase not configured
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Supabase not configured" Message
**Problem**: Backend still using mock data
**Solutions**:
- Verify `.env` file has correct Supabase credentials
- Restart the backend server
- Check for typos in environment variable names

#### 2. "Connection Test Failed"
**Problem**: Cannot connect to Supabase
**Solutions**:
- Verify Project URL is correct (should include `https://`)
- Check that service role key is correct (not anon key)
- Ensure Supabase project is not paused

#### 3. "Relation Does Not Exist" Errors
**Problem**: Database tables not created
**Solutions**:
- Run the initial schema migration: `001_initial_schema.sql`
- Verify migration ran successfully in SQL Editor
- Check for error messages in Supabase logs

#### 4. "Permission Denied" Errors
**Problem**: Using wrong API key
**Solutions**:
- Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) for backend
- Verify key is copied correctly without extra spaces

### Reset Database
If you need to start over:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL to drop all tables:
```sql
DROP TABLE IF EXISTS call_sessions CASCADE;
DROP TABLE IF EXISTS safety_alerts CASCADE;
DROP TABLE IF EXISTS emergency_incidents CASCADE;
DROP TABLE IF EXISTS walking_sessions CASCADE;
DROP TABLE IF EXISTS response_teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
3. Re-run the migration files

## 📈 Performance Optimization

The schema includes several performance optimizations:

### Indexes
- User email and status lookups
- Session queries by user
- Alert filtering by resolution status
- Incident status filtering
- Geographic queries on location data

### JSONB Usage
- Route tracking data
- Conversation history
- Contact information
- Location coordinates

## 🔐 Security Considerations

### Current Setup (Development)
- Row Level Security (RLS) is **disabled** for development ease
- Service role key provides full database access
- All operations allowed from backend

### Production Recommendations
1. **Enable RLS**: Add row-level security policies
2. **User Authentication**: Integrate Supabase Auth
3. **API Security**: Add rate limiting and request validation
4. **Environment Security**: Secure environment variables

Example RLS policy:
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users
FOR SELECT USING (auth.uid()::text = id);
```

## 📱 Next Steps

After database setup:

1. **Frontend Integration**: Update frontend apps to use new API structure
2. **Real-time Features**: Test WebSocket connections with database persistence
3. **Authentication**: Set up user authentication system
4. **Deployment**: Deploy backend with production database
5. **Monitoring**: Add logging and error tracking

## 🆘 Need Help?

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review backend console logs for detailed error messages
3. Test database connection in Supabase Dashboard
4. Verify all environment variables are set correctly

The system is designed to gracefully fall back to mock data if Supabase is not configured, so your development can continue while troubleshooting database issues.
