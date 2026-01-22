import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch all scans using Admin client (Bypasses RLS)
        // We only fetch minimal columns needed for aggregation
        const { data: scans, error } = await supabaseAdmin
            .from('scans')
            .select('region, risk_level, created_at');

        if (error) {
            console.error('Map Data API Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Aggregate Data by Region
        const regionalData: Record<string, any> = {};

        scans?.forEach(scan => {
            // Default to 'Unknown' if region is null/REDACTED
            const region = (scan.region && scan.region !== 'REDACTED') ? scan.region : 'Unknown';

            if (!regionalData[region]) {
                regionalData[region] = {
                    region,
                    safe: 0,
                    suspicious: 0,
                    counterfeit: 0,
                    total: 0,
                    lastDetected: scan.created_at,
                };
            }

            const stats = regionalData[region];
            stats.total++;

            if (scan.risk_level === 'safe') stats.safe++;
            else if (scan.risk_level === 'suspicious') stats.suspicious++;
            else if (scan.risk_level === 'counterfeit') stats.counterfeit++;

            // Track latest timestamp
            if (new Date(scan.created_at) > new Date(stats.lastDetected)) {
                stats.lastDetected = scan.created_at;
            }
        });

        // Convert to array and sort by volume
        const signals = Object.values(regionalData).sort((a, b) => b.total - a.total);

        return NextResponse.json(signals);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
