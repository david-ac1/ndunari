export interface ThoughtSignature {
    id: string;
    timestamp: string;
    reasoning_trace: string; // Opaque string to maintain reasoning context
}

export interface ScanResult {
    scanId: string;
    authenticityScore: number; // 0-100
    drugName?: string;
    batchNumber?: string;
    manufacturer?: string;
    expiryDate?: string;
    isHighRisk: boolean; // TRUE if Reserve drug or suspicious findings
    findings: string[];
    rawAnalysis?: any;
}

export interface StewardshipContext {
    scanResult: ScanResult;
    patientContext?: {
        symptoms?: string[];
        ageGroup?: string; // e.g., "Child", "Adult", "Elderly"
        location?: string; // e.g., "Lagos", "Kano" (for regional AMR patterns)
    };
}

export interface AgentResponse {
    status: 'success' | 'escalated' | 'error';
    data?: any;
    thoughtSignature?: ThoughtSignature;
    error?: string;
}
