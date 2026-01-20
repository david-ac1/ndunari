import whoAwareDb from '@/lib/data/who-aware-database.json';
import nafdacRegistry from '@/lib/data/nafdac-registry.json';
import amrStats from '@/lib/data/nigeria-amr-stats.json';

export interface WHODrugData {
    category: 'ACCESS' | 'WATCH' | 'RESERVE' | 'UNKNOWN';
    genericName: string;
    class: string;
    indications: string[];
    warnings?: string[];
    notes?: string;
}

export interface NAFDACData {
    registrationNumber: string;
    approvedManufacturers: string[];
    commonBrands: string[];
    status: string;
    warnings?: string[];
    note?: string;
}

export interface AMRData {
    drug: string;
    organism: string;
    resistanceRate: string;
    context: string;
    notes: string;
}

/**
 * Look up drug in WHO AWaRe database
 */
export function lookupWHOAWaRe(drugName: string): WHODrugData | null {
    const normalized = drugName.toLowerCase().trim();

    // Direct lookup
    if (whoAwareDb.antibiotics[normalized as keyof typeof whoAwareDb.antibiotics]) {
        return whoAwareDb.antibiotics[normalized as keyof typeof whoAwareDb.antibiotics] as WHODrugData;
    }

    // Try to find partial match (e.g., "amoxil" → "amoxicillin")
    for (const [key, value] of Object.entries(whoAwareDb.antibiotics)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value as WHODrugData;
        }
    }

    return null;
}

/**
 * Look up drug in NAFDAC registry
 */
export function lookupNAFDAC(drugName: string): NAFDACData | null {
    const normalized = drugName.toLowerCase().trim();

    if (nafdacRegistry.drugs[normalized as keyof typeof nafdacRegistry.drugs]) {
        return nafdacRegistry.drugs[normalized as keyof typeof nafdacRegistry.drugs] as NAFDACData;
    }

    // Try partial match
    for (const [key, value] of Object.entries(nafdacRegistry.drugs)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value as NAFDACData;
        }
    }

    return null;
}

/**
 * Get AMR resistance data for drug
 */
export function lookupAMRData(drugName: string): AMRData | null {
    const normalized = drugName.toLowerCase().trim();

    if (amrStats.resistanceRates[normalized as keyof typeof amrStats.resistanceRates]) {
        return amrStats.resistanceRates[normalized as keyof typeof amrStats.resistanceRates] as AMRData;
    }

    return null;
}

/**
 * Get treatment recommendations for condition
 */
export function getRecommendationsForCondition(condition: string) {
    const normalized = condition.toLowerCase();

    // Simple keyword matching
    if (normalized.includes('uti') || normalized.includes('urinary')) {
        return amrStats.recommendations.uti;
    }
    if (normalized.includes('pneumonia') || normalized.includes('chest')) {
        return amrStats.recommendations.cap;
    }
    if (normalized.includes('skin') || normalized.includes('wound')) {
        return amrStats.recommendations.skin;
    }

    return null;
}

/**
 * Comprehensive drug lookup - combines all data sources
 */
export function comprehensiveDrugLookup(drugName: string, indication?: string) {
    const who = lookupWHOAWaRe(drugName);
    const nafdac = lookupNAFDAC(drugName);
    const amr = lookupAMRData(drugName);
    const clinicalRec = indication ? getRecommendationsForCondition(indication) : null;

    return {
        who,
        nafdac,
        amr,
        clinicalRecommendation: clinicalRec,
        dataAvailable: !!(who || nafdac || amr),
    };
}
