import { z } from 'zod';

/**
 * Validation Schemas for API Routes
 * Using Zod for runtime type validation to prevent injection attacks and data corruption
 */

// === Scan API Schemas ===

export const ScanRequestSchema = z.object({
    drugName: z.string().min(1, "Drug name is required").max(200, "Drug name too long"),
    nafdacNumber: z.string().max(50).optional(),
    batchNumber: z.string().max(50).optional(),
    expiryDate: z.string().max(20).optional(),
    authenticityScore: z.number().min(0).max(100),
    riskLevel: z.enum(['safe', 'suspicious', 'counterfeit']),
    findings: z.any().optional(), // JSON data
    scanMode: z.enum(['single', 'multi-angle']).optional(),
    anglesScanned: z.number().int().min(1).max(20).optional(),
    imagePreview: z.string().optional(), // Base64 string
    packageFingerprint: z.string().max(100).optional(),
    forensicAnalysis: z.any().optional(), // JSON data
    stewardshipAssessment: z.any().optional(), // JSON data
    model3D: z.any().optional(), // JSON data
});

export type ScanRequest = z.infer<typeof ScanRequestSchema>;

// === Prescription API Schemas ===

export const PrescriptionRequestSchema = z.object({
    drugName: z.string().min(1, "Drug name is required").max(200),
    indication: z.string().max(500).optional(),
    awareCategory: z.enum(['ACCESS', 'WATCH', 'RESERVE', 'UNKNOWN']),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    recommendations: z.any().optional(), // JSON data
    alternatives: z.any().optional(), // JSON data
    warningFlags: z.any().optional(), // JSON data
});

export type PrescriptionRequest = z.infer<typeof PrescriptionRequestSchema>;

// === Admin Directive Schema ===

export const DirectiveRequestSchema = z.object({
    type: z.enum(['recall', 'risk_mask', 'cluster']),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    affectedDrugs: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional(),
});

export type DirectiveRequest = z.infer<typeof DirectiveRequestSchema>;

// === Common Utilities ===

/**
 * Validates request body against schema and returns formatted error response
 */
export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format zod errors into field-level messages
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach(issue => {
        const field = issue.path.join('.');
        if (!errors[field]) {
            errors[field] = [];
        }
        errors[field].push(issue.message);
    });

    return { success: false, errors };
}
