import { createClient } from '@supabase/supabase-js';

// Supabase client for browser (uses anon key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === 'development') {
        console.warn('Supabase credentials not found. Database features will be disabled.');
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});


// Database types
export interface UserProfile {
    id: string;
    display_name: string | null;
    health_integrity_score: number;
    total_scans: number;
    total_prescriptions_analyzed: number;
    preferred_language: string;
    created_at: string;
    updated_at: string;
}

export interface Scan {
    id: string;
    user_id: string;
    drug_name: string;
    nafdac_number: string | null;
    batch_number: string | null;
    expiry_date: string | null;
    authenticity_score: number;
    risk_level: 'safe' | 'suspicious' | 'counterfeit';
    findings: any;
    scan_mode: 'single' | 'multi' | null;
    angles_scanned: number | null;
    image_preview: string | null;
    region: string | null;
    created_at: string;
}

export interface Prescription {
    id: string;
    user_id: string;
    drug_name: string;
    indication: string | null;
    aware_category: 'ACCESS' | 'WATCH' | 'RESERVE' | 'UNKNOWN';
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    recommendations: any;
    alternatives: any;
    warning_flags: any;
    created_at: string;
}

export interface AnalyticsAggregated {
    id: string;
    date: string;
    region: string | null;
    total_scans: number;
    safe_count: number;
    suspicious_count: number;
    counterfeit_count: number;
    aware_access_count: number;
    aware_watch_count: number;
    aware_reserve_count: number;
    top_drugs: any;
    high_resistance_flags: number;
    created_at: string;
    updated_at: string;
}

export interface CounterfeitAlert {
    id: string;
    drug_name: string;
    nafdac_number: string | null;
    batch_number: string | null;
    region: string | null;
    report_count: number;
    severity: 'low' | 'medium' | 'high' | 'critical' | null;
    status: 'active' | 'investigating' | 'resolved';
    first_reported: string;
    last_reported: string;
}
