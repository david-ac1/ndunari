import { createClient } from '@/utils/supabase/client';

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

export class EmdexService {
    private supabase = createClient();

    /**
     * Search for drug by name or NAFDAC number using Supabase
     */
    async searchDrug(query: string): Promise<DrugRecord[]> {
        const normalizedQuery = query.toLowerCase().trim();

        const { data, error } = await this.supabase
            .from('drugs')
            .select('*')
            .or(`drug_name.ilike.%${normalizedQuery}%,generic_name.ilike.%${normalizedQuery}%,nafdac_number.ilike.%${normalizedQuery}%`);

        if (error) {
            console.error('EmdexService search error:', error);
            return [];
        }

        return this.mapDatabaseRecord(data);
    }

    /**
     * Validate NAFDAC registration number
     */
    async validateNAFDAC(nafdacNumber: string): Promise<DrugRecord | null> {
        const { data, error } = await this.supabase
            .from('drugs')
            .select('*')
            .eq('nafdac_number', nafdacNumber)
            .single();

        if (error || !data) return null;

        return this.mapDatabaseRecord([data])[0];
    }

    /**
     * Get drugs by WHO AWaRe category
     */
    async getDrugsByCategory(
        category: "ACCESS" | "WATCH" | "RESERVE"
    ): Promise<DrugRecord[]> {
        const { data, error } = await this.supabase
            .from('drugs')
            .select('*')
            .eq('aware_category', category);

        if (error) return [];

        return this.mapDatabaseRecord(data);
    }

    /**
     * Get all drug records
     */
    async getAllDrugs(): Promise<DrugRecord[]> {
        const { data, error } = await this.supabase
            .from('drugs')
            .select('*');

        if (error) return [];

        return this.mapDatabaseRecord(data);
    }

    private mapDatabaseRecord(data: any[]): DrugRecord[] {
        if (!data) return [];
        return data.map(record => ({
            id: record.id,
            drugName: record.drug_name,
            genericName: record.generic_name,
            nafdacNumber: record.nafdac_number,
            manufacturer: record.manufacturer,
            awareCategory: record.aware_category,
            dosageForms: record.dosage_forms,
            commonDosages: record.common_dosages,
            indication: record.indication,
            warnings: record.warnings
        }));
    }

    /**
     * FUTURE: Gemini-powered web scraping for pharmaceutical data
     */
    async scrapePharmaceuticalData(url: string): Promise<DrugRecord[]> {
        throw new Error("Not implemented - requires Gemini web scraping integration");
    }
}

// Export singleton instance
export const emdexService = new EmdexService();
