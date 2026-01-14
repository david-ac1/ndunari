-- Migration: Create initial tables for Ndunari Health Shield
-- Version: 001
-- Description: User profiles, scans, prescriptions, analytics, and counterfeit alerts

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  health_integrity_score integer DEFAULT 0,
  total_scans integer DEFAULT 0,
  total_prescriptions_analyzed integer DEFAULT 0,
  preferred_language text DEFAULT 'english',
  share_data boolean DEFAULT true,
  profile_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Scans
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scan Data
  drug_name text NOT NULL,
  nafdac_number text,
  batch_number text,
  expiry_date text,
  
  -- Analysis Results
  authenticity_score integer NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('safe', 'suspicious', 'counterfeit')),
  findings jsonb,
  
  -- Scan Metadata
  scan_mode text CHECK (scan_mode IN ('single', 'multi')),
  angles_scanned integer,
  image_preview text,
  
  -- Location (De-identified)
  region text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Create indexes for scans
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_risk_level ON scans(risk_level);
CREATE INDEX IF NOT EXISTS idx_scans_drug_name ON scans(drug_name);
CREATE INDEX IF NOT EXISTS idx_scans_region_date ON scans(region, created_at);

-- 3. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Input
  drug_name text NOT NULL,
  indication text,
  
  -- Analysis Results
  aware_category text NOT NULL CHECK (aware_category IN ('ACCESS', 'WATCH', 'RESERVE', 'UNKNOWN')),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  recommendations jsonb,
  alternatives jsonb,
  warning_flags jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Create indexes for prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_aware_category ON prescriptions(aware_category);
CREATE INDEX IF NOT EXISTS idx_prescriptions_drug_name ON prescriptions(drug_name);

-- 4. Analytics Aggregated (Public Health Data)
CREATE TABLE IF NOT EXISTS analytics_aggregated (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Aggregation Period
  date date NOT NULL,
  region text,
  
  -- Scan Statistics
  total_scans integer DEFAULT 0,
  safe_count integer DEFAULT 0,
  suspicious_count integer DEFAULT 0,
  counterfeit_count integer DEFAULT 0,
  
  -- Drug Categories
  aware_access_count integer DEFAULT 0,
  aware_watch_count integer DEFAULT 0,
  aware_reserve_count integer DEFAULT 0,
  
  -- Most Common Drugs
  top_drugs jsonb,
  
  -- AMR Indicators
  high_resistance_flags integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (date, region)
);

CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_aggregated(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_region ON analytics_aggregated(region);

-- 5. Counterfeit Alerts
CREATE TABLE IF NOT EXISTS counterfeit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert Data (De-identified)
  drug_name text NOT NULL,
  nafdac_number text,
  batch_number text,
  region text,
  
  -- Count
  report_count integer DEFAULT 1,
  
  -- Severity
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
  
  -- Timestamps
  first_reported timestamptz DEFAULT now(),
  last_reported timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_drug_batch ON counterfeit_alerts(drug_name, batch_number);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON counterfeit_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON counterfeit_alerts(severity);

-- Row Level Security Policies

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans" ON scans
  FOR DELETE USING (auth.uid() = user_id);

-- Prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions" ON prescriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions" ON prescriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Analytics (Public Read)
ALTER TABLE analytics_aggregated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view analytics" ON analytics_aggregated
  FOR SELECT USING (true);

-- Counterfeit Alerts (Public Read)
ALTER TABLE counterfeit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view alerts" ON counterfeit_alerts
  FOR SELECT USING (true);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', 'Health Guardian')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
