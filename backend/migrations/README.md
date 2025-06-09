# Database Migrations

This directory contains SQL migration files for setting up the AI Video Call Platform database in Supabase.

## Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Ensure your `.env` file has the correct Supabase credentials:
   ```
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Migration Files

### 001_initial_schema.sql
Creates the complete database schema with all required tables:
- `users` - User profiles and status
- `walking_sessions` - Active and completed walking sessions
- `safety_alerts` - Safety alerts and warnings
- `emergency_incidents` - Emergency incidents and responses
- `call_sessions` - AI companion call sessions
- `response_teams` - Emergency response teams

**Features:**
- UUID primary keys with auto-generation
- Proper foreign key constraints
- Check constraints for enum-like fields
- Indexes for query performance
- Automatic `updated_at` timestamp triggers
- JSONB fields for flexible data storage

### 002_seed_data.sql
Populates the database with realistic sample data:
- 6 sample users with different statuses
- 4 response teams with specializations
- Active walking sessions
- Emergency incidents (active and resolved)
- Safety alerts
- AI companion conversation history

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `001_initial_schema.sql`
4. Click **Run** to execute
5. Repeat for `002_seed_data.sql`

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize Supabase in your project (if not done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Option 3: Direct PostgreSQL Connection
If you have the direct database URL:
```bash
psql "your-postgres-connection-string" < migrations/001_initial_schema.sql
psql "your-postgres-connection-string" < migrations/002_seed_data.sql
```

## Verifying Setup

After running the migrations, you can verify the setup:

1. **Check Tables**: In Supabase Dashboard → Table Editor, you should see all 6 tables
2. **Check Data**: Each table should have sample data populated
3. **Test Backend**: Run `npm run dev` - the backend should connect to Supabase instead of using mock data
4. **Check Logs**: Look for "✅ Supabase client initialized successfully" in console

## Row Level Security (RLS)

The current schema does not include RLS policies for development simplicity. For production deployment, consider adding appropriate RLS policies:

```sql
-- Example RLS policy for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (auth.uid()::text = id);
```

## Troubleshooting

### Common Issues:

1. **"relation does not exist" errors**: Make sure to run `001_initial_schema.sql` first
2. **Permission denied**: Ensure you're using the correct database credentials
3. **UUID extension not found**: The migration includes `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
4. **Constraint violations**: If running migrations multiple times, the seed data includes `ON CONFLICT` clauses

### Reset Database:
If you need to start fresh:
```sql
-- Drop all tables (be careful!)
DROP TABLE IF EXISTS call_sessions CASCADE;
DROP TABLE IF EXISTS safety_alerts CASCADE;
DROP TABLE IF EXISTS emergency_incidents CASCADE;
DROP TABLE IF EXISTS walking_sessions CASCADE;
DROP TABLE IF EXISTS response_teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

## Next Steps

After setting up the database:
1. Update frontend applications to work with new API structure
2. Test all CRUD operations through the backend API
3. Verify real-time functionality with WebSocket connections
4. Set up proper authentication and authorization
5. Add monitoring and logging for production use
