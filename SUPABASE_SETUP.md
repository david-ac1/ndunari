# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in (or create account)
4. Click "New Project"
5. Fill in:
   - **Name**: `ndunari-health-shield`
   - **Database Password**: (generate a strong password - save it!)
   - **Region**: Choose closest to Nigeria (e.g., Europe West)
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Get API Keys

1. In your Supabase project, click **Settings** (⚙️ icon on left sidebar)
2. Click **API** under Project Settings
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
service_role key: eyJhbGc... (SECRET - do not commit!)
```

## Step 3: Add to .env.local

Add these lines to your `.env.local` file:

```bash
# Supabase (add after GEMINI_API_KEY)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
```

## Step 4: Run Database Migrations

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (green play button)
6. Should see "Success. No rows returned"

## Step 5: Verify Tables Created

1. Click **Table Editor** (left sidebar)
2. You should see:
   - `user_profiles`
   - `scans`
   - `prescriptions`
   - `analytics_aggregated`
   - `counterfeit_alerts`

## Step 6: Enable Anonymous Auth (Optional but Recommended)
1. Click **Authentication** → **Providers**
2. Find **Anonymous Sign-Ins**
3. Toggle **Enable Anonymous Sign-Ins** to ON
4. Click **Save**

## Step 7: Test Connection

Restart your dev server:
```bash
npm run dev
```

The app will now use Supabase for authentication and storage!

---

## Troubleshooting

**Error: "Invalid API key"**
- Check that you copied the FULL key (very long)
- Make sure no extra spaces in `.env.local`

**Error: "Failed to fetch"**
- Check Project URL is correct
- Verify project is not paused (Supabase free tier pauses after inactivity)

**Tables not created**
- Re-run the migration SQL
- Check for error messages in SQL editor

Need help? Let me know!
