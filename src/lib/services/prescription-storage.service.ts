import { supabase, type Prescription } from '../supabase/client';

/**
 * Prescription Storage Service
 * Handles CRUD operations for prescription analyses
 */

/**
 * Save a prescription analysis to Supabase
 */
export async function savePrescription(prescriptionData: {
    drugName: string;
    indication?: string;
    awareCategory: 'ACCESS' | 'WATCH' | 'RESERVE' | 'UNKNOWN';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations?: any;
    alternatives?: any;
    warningFlags?: any;
}): Promise<{ data: Prescription | null; error: any }> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: new Error('User not authenticated') };
    }

    // Insert prescription
    const { data, error } = await supabase
        .from('prescriptions')
        .insert({
            user_id: user.id,
            drug_name: prescriptionData.drugName,
            indication: prescriptionData.indication || null,
            aware_category: prescriptionData.awareCategory,
            risk_level: prescriptionData.riskLevel,
            recommendations: prescriptionData.recommendations || null,
            alternatives: prescriptionData.alternatives || null,
            warning_flags: prescriptionData.warningFlags || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving prescription:', error);
        return { data: null, error };
    }

    return { data, error: null };
}

/**
 * Get all prescriptions for current user
 */
export async function getUserPrescriptions(limit = 50): Promise<{ data: Prescription[] | null; error: any }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching prescriptions:', error);
        return { data: null, error };
    }

    return { data, error: null };
}

/**
 * Delete a prescription
 */
export async function deletePrescription(prescriptionId: string): Promise<{ error: any }> {
    const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId);

    if (error) {
        console.error('Error deleting prescription:', error);
        return { error };
    }

    return { error: null };
}

/**
 * Get prescription statistics for user
 */
export async function getPrescriptionStats(): Promise<{
    total: number;
    access: number;
    watch: number;
    reserve: number;
}> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { total: 0, access: 0, watch: 0, reserve: 0 };
    }

    const { data } = await supabase
        .from('prescriptions')
        .select('aware_category')
        .eq('user_id', user.id);

    if (!data) {
        return { total: 0, access: 0, watch: 0, reserve: 0 };
    }

    return {
        total: data.length,
        access: data.filter(p => p.aware_category === 'ACCESS').length,
        watch: data.filter(p => p.aware_category === 'WATCH').length,
        reserve: data.filter(p => p.aware_category === 'RESERVE').length,
    };
}
