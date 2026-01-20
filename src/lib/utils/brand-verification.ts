/**
 * Brand Name Verification Configuration
 * 
 * TODO: Future Integration - Web Scraping/API
 * When implementing EMDEX or NAFDAC web scraping/API:
 * 1. Verify extracted drug brand names against official database
 * 2. Flag unregistered or misspelled brand names
 * 3. Cross-check manufacturer against registered entities
 * 4. Compare package design with authentic reference images
 * 
 * Potential Data Sources:
 * - NAFDAC Product Database (https://www.nafdac.gov.ng)
 * - WHO Essential Medicines List
 * - EMDEX Nigeria pharmaceutical database
 * - Manufacturer API integrations
 */

export interface BrandVerificationResult {
    brandExists: boolean;
    isRegistered: boolean;
    nafdacApproved: boolean;
    manufacturer: string | null;
    confidence: number;
    warnings: string[];
}

/**
 * Placeholder for future brand verification
 * Will be replaced with actual API/web scraping implementation
 */
export async function verifyBrandName(
    drugName: string,
    nafdacNumber?: string
): Promise<BrandVerificationResult> {
    const { emdexService } = await import('@/lib/services/emdex.service');

    // Check main drug database
    const results = await emdexService.searchDrug(drugName);

    // If NAFDAC number provided, try to match exactly
    let matchedDrug = null;
    if (nafdacNumber) {
        matchedDrug = await emdexService.validateNAFDAC(nafdacNumber);
    }

    // Fallback: Check if name matches any record if exact NAFDAC match fails
    if (!matchedDrug && results.length > 0) {
        matchedDrug = results[0];
    }

    if (matchedDrug) {
        return {
            brandExists: true,
            isRegistered: true,
            nafdacApproved: true,
            manufacturer: matchedDrug.manufacturer,
            confidence: 0.95,
            warnings: matchedDrug.warnings
        };
    }

    // 2. Second Line: AI Web Verification (Gemini Knowledge Graph)
    // "Web Scraping" proxy for NAFDAC Greenbook
    console.log(`[BrandAuth] Local DB miss for ${drugName}. Initiating AI Web Search...`);

    const { webVerificationService } = await import('@/lib/services/web-verification.service');
    const webResult = await webVerificationService.verifyOnline(drugName, nafdacNumber);

    if (webResult.isVerified) {
        return {
            brandExists: true,
            isRegistered: true,
            nafdacApproved: true,
            manufacturer: typeof webResult.details === 'string' ? "Verified via NAFDAC Registry (AI Search)" : "Unknown",
            confidence: 0.85, // Slightly lower confidence for AI search vs direct DB match
            warnings: [webResult.details]
        };
    }

    // 3. Not Found
    return {
        brandExists: false,
        isRegistered: false,
        nafdacApproved: false,
        manufacturer: null,
        confidence: 0.1,
        warnings: ["Drug not found in NAFDAC Registry or International Databases"],
    };
}

/**
 * Extract and normalize brand names for comparison
 */
export function extractBrandName(fullDrugName: string): string {
    // Remove dosage information
    const brandOnly = fullDrugName
        .replace(/\d+\s?mg/gi, '')
        .replace(/\d+\s?ml/gi, '')
        .replace(/\d+\s?mcg/gi, '')
        .replace(/tablets?/gi, '')
        .replace(/capsules?/gi, '')
        .trim();

    return brandOnly;
}
