import { forensicEyeService } from "./forensic-eye.service";
import { stewardshipBrainService } from "./stewardship-brain.service";
import { ESCALATION_THRESHOLD, RESERVE_DRUGS } from "./config";
import type { ForensicAnalysis } from "./forensic-eye.service";
import type { StewardshipAssessment } from "./stewardship-brain.service";
import { geminiReconstructionService } from "../3d/gemini-reconstruction.service";
import { modelStorageService } from "../3d/model-storage.service";
import type { AngleImage, ReconstructionResult } from "../3d/types";

/**
 * Tiered Routing Result
 */
export interface TieredAnalysisResult {
    forensic: ForensicAnalysis;
    stewardship: StewardshipAssessment | null;
    escalated: boolean;
    costEstimate: number;
    processingTime: number;
    model3D?: ReconstructionResult; // Optional 3D model data
}

/**
 * Tiered Routing Service
 * The Innovation: Smart escalation from Flash → Thinking
 * 
 * COST IMPACT:
 * - Flash only: $0.001/scan (99% of cases)
 * - Escalated to Thinking: $0.016/scan (1% of cases)
 * - Average: $0.00114/scan (92% savings vs Thinking-only)
 * 
 * ESCALATION TRIGGERS:
 * 1. Authenticity score < 95.0 (suspicious package)
 * 2. Reserve drug detected (critical stewardship)
 * 3. NAFDAC validation failed
 */
export class TieredRoutingService {
    /**
     * Analyze drug package with intelligent escalation
     * @param imageData - Drug package image (base64 or Buffer)
     * @returns Complete analysis with cost and timing metrics
     */
    async analyzeDrugPackage(
        imageData: string | Buffer,
        mimeType: string = "image/jpeg",
        multiAngleImages?: AngleImage[], // Optional multi-angle data for 3D
        scanId?: string // Optional scan ID for model storage
    ): Promise<TieredAnalysisResult> {
        const startTime = Date.now();

        // STEP 1: Always start with Forensic Eye (Flash model)
        // Fast, cheap, handles 99% of cases
        console.log(`Starting Forensic Eye scan (Flash) for ${mimeType}...`);
        const forensic = await forensicEyeService.scanPackage(imageData, mimeType);

        // STEP 2: Determine if escalation to Stewardship Brain is needed
        const shouldEscalate = this.shouldEscalateToThinking(forensic);

        let stewardship: StewardshipAssessment | null = null;
        let costEstimate = 0.001; // Flash base cost

        if (shouldEscalate) {
            console.log("Escalating to Stewardship Brain (Thinking)...");
            const deepAnalysis = await stewardshipBrainService.deepAnalysis(
                imageData,
                forensic
            );

            stewardship = deepAnalysis.stewardship;
            costEstimate = 0.016; // Flash + Thinking cost
        }

        // STEP 3: Generate 3D model if multi-angle images provided
        let model3D: ReconstructionResult | undefined;
        if (multiAngleImages && multiAngleImages.length >= 2) {
            console.log(`🧊 Generating 3D model from ${multiAngleImages.length} angles...`);
            try {
                model3D = await geminiReconstructionService.reconstructPackage(multiAngleImages);

                // Store model if scanId provided
                if (scanId && model3D) {
                    await modelStorageService.saveModel(scanId, model3D);
                    console.log(`✓ 3D model stored for scan: ${scanId}`);
                }
            } catch (error) {
                console.error("3D reconstruction failed:", error);
                // Continue without 3D model - not a critical failure
            }
        }

        const processingTime = Date.now() - startTime;

        return {
            forensic,
            stewardship,
            escalated: shouldEscalate,
            costEstimate,
            processingTime,
            model3D,
        };
    }

    /**
     * Determine if scan should escalate to Thinking model
     * Based on GEMINI3_TECHNICAL.md specifications
     */
    private shouldEscalateToThinking(forensic: ForensicAnalysis): boolean {
        // Trigger 1: Low authenticity score (suspicious package)
        if (forensic.authenticityScore < ESCALATION_THRESHOLD) {
            console.log(
                `Escalation trigger: Low authenticity score (${forensic.authenticityScore})`
            );
            return true;
        }

        // Trigger 2: Reserve drug detected (WHO AWaRe Reserve category)
        if (this.isReserveDrug(forensic.drugName)) {
            console.log(`Escalation trigger: Reserve drug detected (${forensic.drugName})`);
            return true;
        }

        // Trigger 3: NAFDAC validation failed
        if (
            !forensic.nafdacNumber ||
            forensic.nafdacNumber === "NOT_FOUND" ||
            !forensicEyeService.validateNAFDACNumber(forensic.nafdacNumber)
        ) {
            console.log("Escalation trigger: NAFDAC validation failed");
            return true;
        }

        // Trigger 4: Counterfeit risk level
        if (forensic.riskLevel === "counterfeit") {
            console.log("Escalation trigger: Counterfeit detected");
            return true;
        }

        // Happy path: Flash is enough
        return false;
    }

    /**
     * Check if drug is in WHO Reserve category
     */
    private isReserveDrug(drugName: string): boolean {
        const normalized = drugName.toLowerCase().trim();
        return RESERVE_DRUGS.some((reserve) => normalized.includes(reserve));
    }

    /**
     * Calculate cost savings vs Pro-only approach
     * Based on GEMINI3_TECHNICAL.md cost analysis
     */
    calculateMonthlySavings(totalScans: number, escalationRate: number = 0.01) {
        const proOnlyCost = totalScans * 0.015; // $0.015 per scan
        const tieredCost =
            totalScans * (1 - escalationRate) * 0.001 + // Flash scans
            totalScans * escalationRate * 0.016; // Escalated scans

        return {
            proOnlyCost,
            tieredCost,
            savings: proOnlyCost - tieredCost,
            savingsPercentage: ((proOnlyCost - tieredCost) / proOnlyCost) * 100,
        };
    }
}

// Export singleton instance
export const tieredRoutingService = new TieredRoutingService();
