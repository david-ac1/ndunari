/**
 * Mock EMDEX Database Service
 * 
 * This service provides sample Nigerian pharmaceutical data.
 * In production, this will be replaced with:
 * 1. Real EMDEX API integration (when available)
 * 2. Gemini-powered web scraping service to extract pharmaceutical data
 * 3. Local vector database for offline access
 */

export interface DrugRecord {
    id: string;
    drugName: string;
    genericName: string;
    nafdacNumber: string;
    manufacturer: string;
    awareCategory: "ACCESS" | "WATCH" | "RESERVE" | "NOT_ANTIBIOTIC";
    dosageForms: string[];
    commonDosages: string[];
    indication: string;
    warnings: string[];
}

/**
 * Sample Nigerian pharmaceutical database
 * Based on common drugs in the Nigerian market
 */
const MOCK_DRUG_DATABASE: DrugRecord[] = [
    // ACCESS Category - First-line antibiotics
    {
        id: "1",
        drugName: "Amartem Softgel",
        genericName: "Artemether + Lumefantrine",
        nafdacNumber: "NAF-2019-12345",
        manufacturer: "Emzor Pharmaceutical",
        awareCategory: "NOT_ANTIBIOTIC", // Antimalarial
        dosageForms: ["Softgel", "Tablet"],
        commonDosages: ["80mg/480mg"],
        indication: "Uncomplicated malaria",
        warnings: [],
    },
    {
        id: "2",
        drugName: "Amoxicillin",
        genericName: "Amoxicillin",
        nafdacNumber: "NAF-2020-23456",
        manufacturer: "Various",
        awareCategory: "ACCESS",
        dosageForms: ["Capsule", "Suspension", "Tablet"],
        commonDosages: ["250mg", "500mg"],
        indication: "Bacterial infections - first-line",
        warnings: ["Check for penicillin allergy"],
    },
    {
        id: "3",
        drugName: "Ampicillin",
        genericName: "Ampicillin",
        nafdacNumber: "NAF-2018-34567",
        manufacturer: "Various",
        awareCategory: "ACCESS",
        dosageForms: ["Capsule", "Injection"],
        commonDosages: ["250mg", "500mg"],
        indication: "Respiratory and urinary tract infections",
        warnings: [],
    },

    // WATCH Category - Second-line antibiotics
    {
        id: "4",
        drugName: "Ciprofloxacin",
        genericName: "Ciprofloxacin",
        nafdacNumber: "NAF-2019-45678",
        manufacturer: "Various",
        awareCategory: "WATCH",
        dosageForms: ["Tablet", "Suspension", "IV"],
        commonDosages: ["500mg", "750mg"],
        indication: "Serious bacterial infections",
        warnings: [
            "HIGH RESISTANCE in Lagos",
            "WHO Watch category - monitor usage",
            "Not for routine use",
        ],
    },
    {
        id: "5",
        drugName: "Azithromycin",
        genericName: "Azithromycin",
        nafdacNumber: "NAF-2020-56789",
        manufacturer: "Various",
        awareCategory: "WATCH",
        dosageForms: ["Tablet", "Suspension"],
        commonDosages: ["250mg", "500mg"],
        indication: "Respiratory infections, STIs",
        warnings: [
            "WHO Watch category",
            "Prefer ACCESS alternatives when possible",
            "Rising resistance in Nigeria",
        ],
    },

    // RESERVE Category - Last resort antibiotics
    {
        id: "6",
        drugName: "Colistin",
        genericName: "Colistin",
        nafdacNumber: "NAF-2021-67890",
        manufacturer: "Hospital supply",
        awareCategory: "RESERVE",
        dosageForms: ["Injection"],
        commonDosages: ["1MU", "2MU"],
        indication: "Multidrug-resistant gram-negative infections",
        warnings: [
            "WHO RESERVE - last resort ONLY",
            "Hospital use ONLY",
            "Requires infectious disease consultation",
            "NEVER for community use",
        ],
    },
    {
        id: "7",
        drugName: "Meropenem",
        genericName: "Meropenem",
        nafdacNumber: "NAF-2020-78901",
        manufacturer: "Hospital supply",
        awareCategory: "RESERVE",
        dosageForms: ["Injection"],
        commonDosages: ["500mg", "1g"],
        indication: "Severe hospital-acquired infections",
        warnings: [
            "WHO RESERVE category",
            "Hospital setting ONLY",
            "Culture-guided use",
        ],
    },

    // Common Nigerian OTC drugs (Not antibiotics)
    {
        id: "8",
        drugName: "Paracetamol",
        genericName: "Paracetamol/Acetaminophen",
        nafdacNumber: "NAF-2018-11111",
        manufacturer: "Various",
        awareCategory: "NOT_ANTIBIOTIC",
        dosageForms: ["Tablet", "Suspension", "Suppository"],
        commonDosages: ["500mg", "1000mg"],
        indication: "Pain and fever relief",
        warnings: ["Do not exceed 4g daily - liver damage risk"],
    },
];

export class EmdexService {
    /**
     * Search for drug by name or NAFDAC number
     */
    async searchDrug(query: string): Promise<DrugRecord[]> {
        const normalizedQuery = query.toLowerCase().trim();

        return MOCK_DRUG_DATABASE.filter(
            (drug) =>
                drug.drugName.toLowerCase().includes(normalizedQuery) ||
                drug.genericName.toLowerCase().includes(normalizedQuery) ||
                drug.nafdacNumber.toLowerCase().includes(normalizedQuery)
        );
    }

    /**
     * Validate NAFDAC registration number
     */
    async validateNAFDAC(nafdacNumber: string): Promise<DrugRecord | null> {
        return (
            MOCK_DRUG_DATABASE.find((drug) => drug.nafdacNumber === nafdacNumber) ||
            null
        );
    }

    /**
     * Get drugs by WHO AWaRe category
     */
    async getDrugsByCategory(
        category: "ACCESS" | "WATCH" | "RESERVE"
    ): Promise<DrugRecord[]> {
        return MOCK_DRUG_DATABASE.filter(
            (drug) => drug.awareCategory === category
        );
    }

    /**
     * Get all drug records
     */
    async getAllDrugs(): Promise<DrugRecord[]> {
        return [...MOCK_DRUG_DATABASE];
    }

    /**
     * FUTURE: Gemini-powered web scraping for pharmaceutical data
     * This will use Gemini to intelligently scrape and structure data from:
     * - NAFDAC public registry
     * - Nigerian pharmaceutical databases
     * - WHO essential medicines list
     */
    async scrapePharmaceuticalData(url: string): Promise<DrugRecord[]> {
        // TODO: Implement Gemini-powered scraping
        // 1. Fetch webpage content
        // 2. Use Gemini to extract structured pharmaceutical data
        // 3. Validate and store in local database
        throw new Error("Not implemented - requires Gemini web scraping integration");
    }
}

// Export singleton instance
export const emdexService = new EmdexService();
