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
    // TODO: Implement actual verification
    // For now, return mock result
    console.log(`[Future] Brand verification for: ${drugName}, NAFDAC: ${nafdacNumber}`);

    return {
        brandExists: true,
        isRegistered: true,
        nafdacApproved: !!nafdacNumber,
        manufacturer: null,
        confidence: 0,
        warnings: [],
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
