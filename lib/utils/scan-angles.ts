/**
 * Multi-Angle Scanning Configuration
 * Defines required angles and their metadata for comprehensive drug package verification
 */

export type AngleType = 'front' | 'back' | 'side1' | 'side2' | 'contents';

export interface ScanAngle {
    id: AngleType;
    label: string;
    icon: string;
    required: boolean;
    description: string;
    focusPoints: string[];
    helpText: string;
}

/**
 * Angle configuration for drug package scanning
 */
export const SCAN_ANGLES: Record<AngleType, ScanAngle> = {
    front: {
        id: 'front',
        label: 'Front',
        icon: '📦',
        required: true,
        description: 'Main label with drug name and branding',
        focusPoints: [
            'Drug name and dosage',
            'Brand logo',
            'Primary label quality',
            'Color accuracy',
        ],
        helpText: 'Capture the main label clearly with good lighting',
    },
    back: {
        id: 'back',
        label: 'Back',
        icon: '📋',
        required: true,
        description: 'Manufacturing details and batch information',
        focusPoints: [
            'Batch/Lot number',
            'Expiry/MFG date',
            'Manufacturer name',
            'Storage instructions',
        ],
        helpText: 'Ensure batch and expiry dates are clearly visible',
    },
    side1: {
        id: 'side1',
        label: 'Side 1',
        icon: '🔒',
        required: true,
        description: 'Security features and NAFDAC hologram',
        focusPoints: [
            'NAFDAC hologram',
            'Security seals',
            'Tamper-evident features',
            'Regulatory markings',
        ],
        helpText: 'Look for hologram and security features on the side',
    },
    side2: {
        id: 'side2',
        label: 'Side 2',
        icon: '📊',
        required: false,
        description: 'Barcode and additional markings',
        focusPoints: [
            'Barcode',
            'QR code',
            'Additional lot numbers',
            'Import/export marks',
        ],
        helpText: 'Capture barcode and any additional identifiers',
    },
    contents: {
        id: 'contents',
        label: 'Contents',
        icon: '💊',
        required: false,
        description: 'Pills/tablets themselves (bonus verification)',
        focusPoints: [
            'Pill color and shape',
            'Tablet markings',
            'Blister pack integrity',
            'Capsule consistency',
        ],
        helpText: 'Open package to verify actual medication appearance',
    },
};

/**
 * Get required angles only
 */
export const getRequiredAngles = (): ScanAngle[] => {
    return Object.values(SCAN_ANGLES).filter((angle) => angle.required);
};

/**
 * Get all angles
 */
export const getAllAngles = (): ScanAngle[] => {
    return Object.values(SCAN_ANGLES);
};

/**
 * Calculate confidence score based on number of angles captured
 */
export const calculateConfidenceMultiplier = (anglesCount: number): number => {
    const required = getRequiredAngles().length;

    if (anglesCount === 1) return 0.7; // Max 70% for single image
    if (anglesCount === 2) return 0.85; // Max 85% for two angles
    if (anglesCount >= required) {
        // Full verification - no penalty
        return 1.0; // Max 100%
    }

    // Proportional to required angles
    return Math.min(0.95, 0.7 + (anglesCount / required) * 0.3);
};

/**
 * Get focus points for a specific angle
 */
export const getAngleFocus = (angleType: AngleType): string => {
    return SCAN_ANGLES[angleType].focusPoints.join(', ');
};

/**
 * Scan mode types
 */
export type ScanMode = 'single' | 'multi';

/**
 * Multi-angle scan session state
 */
export interface MultiAngleScanSession {
    id: string;
    mode: ScanMode;
    startTime: number;
    capturedAngles: Map<AngleType, string>; // angleType -> base64 image
    currentAngle: AngleType | null;
    completedCount: number;
    requiredCount: number;
    totalCount: number;
}

export const createScanSession = (mode: ScanMode): MultiAngleScanSession => {
    return {
        id: Date.now().toString(),
        mode,
        startTime: Date.now(),
        capturedAngles: new Map(),
        currentAngle: mode === 'multi' ? 'front' : null,
        completedCount: 0,
        requiredCount: getRequiredAngles().length,
        totalCount: getAllAngles().length,
    };
};

/**
 * Get next uncaptured angle
 */
export const getNextAngle = (
    session: MultiAngleScanSession
): AngleType | null => {
    const allAngles = getAllAngles();

    for (const angle of allAngles) {
        if (!session.capturedAngles.has(angle.id)) {
            return angle.id;
        }
    }

    return null; // All angles captured
};

/**
 * Check if session has met minimum requirements (all required angles)
 */
export const isMinimumSessionComplete = (session: MultiAngleScanSession): boolean => {
    const requiredAngles = getRequiredAngles();
    return requiredAngles.every((angle) => session.capturedAngles.has(angle.id));
};

/**
 * Check if session has met optimal requirements (all 5 angles)
 */
export const isOptimalSessionComplete = (session: MultiAngleScanSession): boolean => {
    const allAngles = getAllAngles();
    return allAngles.every((angle) => session.capturedAngles.has(angle.id));
};

/**
 * Check if session is complete (legacy support - defaults to minimum)
 */
export const isSessionComplete = (session: MultiAngleScanSession): boolean => {
    return isMinimumSessionComplete(session);
};
