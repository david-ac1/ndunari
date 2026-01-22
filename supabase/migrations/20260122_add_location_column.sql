-- Add location support for Surveillance Map
-- Run this in your Supabase SQL Editor

-- 1. Enable PostGIS for geospatial features (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- 2. Add 'location' column to scans table
ALTER TABLE public.scans 
ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- 3. Ensure 'region' column exists (used for aggregation)
ALTER TABLE public.scans 
ADD COLUMN IF NOT EXISTS region text;

-- 4. Create spatial index for fast map queries
CREATE INDEX IF NOT EXISTS scans_location_idx ON public.scans USING GIST (location);

-- 5. Create index on region for faster aggregation
CREATE INDEX IF NOT EXISTS scans_region_idx ON public.scans (region);

-- 6. Comment
COMMENT ON COLUMN public.scans.location IS 'Geospatial point (lon, lat) of the scan';
COMMENT ON COLUMN public.scans.region IS 'Derived Nigerian City or Region name';
