import { supabaseAdmin } from "@/lib/supabase/admin";

export async function seedDemoData() {
    console.log("Admin: Injecting National Intelligence Data...");

    const regions = ["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan", "Enugu", "North-East", "South-West"];
    const drugs = [
        { name: "Ciprofloxacin 500mg", type: "WATCH" },
        { name: "Amoxicillin-Clavulanate", type: "ACCESS" },
        { name: "Artemether-Lumefantrine", type: "ACCESS" },
        { name: "Meropenem 1g", type: "RESERVE" },
        { name: "Azithromycin 500mg", type: "WATCH" }
    ];

    // 1. Generate 50+ Scan Records
    const scans = [];
    for (let i = 0; i < 60; i++) {
        const drug = drugs[Math.floor(Math.random() * drugs.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const risk = Math.random() > 0.85 ? 'counterfeit' : Math.random() > 0.7 ? 'suspicious' : 'safe';
        const score = risk === 'safe' ? 90 + Math.random() * 10 : risk === 'suspicious' ? 65 + Math.random() * 20 : 10 + Math.random() * 40;

        scans.push({
            drug_name: drug.name,
            nafdac_number: `NAF-2023-${Math.floor(10000 + Math.random() * 90000)}`,
            batch_number: `LOT-${Math.floor(1000 + Math.random() * 9000)}-${i}`,
            authenticity_score: Math.floor(score),
            risk_level: risk,
            region: region,
            scan_mode: Math.random() > 0.5 ? 'multi' : 'single',
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    // 2. Generate 30+ Prescription Records
    const prescriptions = [];
    for (let i = 0; i < 40; i++) {
        const drug = drugs[Math.floor(Math.random() * drugs.length)];
        prescriptions.push({
            drug_name: drug.name,
            aware_category: drug.type,
            risk_level: drug.type === 'RESERVE' ? 'high' : 'low',
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    // 3. Insert into Supabase (Bypassing RLS with Admin Client)
    const { error: scanErr } = await supabaseAdmin.from('scans').insert(scans);
    const { error: presErr } = await supabaseAdmin.from('prescriptions').insert(prescriptions);

    if (scanErr || presErr) {
        console.error("Seed Error:", scanErr || presErr);
        throw new Error("Data injection failed");
    }

    return { scans: scans.length, prescriptions: prescriptions.length };
}
