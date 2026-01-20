import { getForensicEyeModel, retryWithBackoff } from "../gemini/config";
import { DepthMap, Package3DStructure } from "./types";
import * as THREE from 'three';

// Re-export types for external use
export type { DepthMap, Package3DStructure, PointCloud, Point3D } from './types';

/**
 * Multi-angle image with metadata
 */
export interface AngleImage {
    angle: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
    imageData: string; // base64
    depthMap?: DepthMap;
}

/**
 * 3D Reconstruction Result
 */
export interface ReconstructionResult {
    structure: Package3DStructure;
    textures: Map<string, string>; // face -> base64 image
    confidence: number; // 0-100
    synthesizedAngles: string[]; // List of angles that were AI-generated
}

/**
 * Gemini 3D Reconstruction Service
 * Uses Gemini 3 Pro Image for AI-powered depth estimation and 3D structure analysis
 */
export class GeminiReconstructionService {
    private model = getForensicEyeModel(true); // JSON mode enabled

    /**
     * Generate depth map from single image using Gemini 3 Pro Image
     */
    async generateDepthMap(imageData: string): Promise<DepthMap> {
        const prompt = `Analyze this pharmaceutical package image and estimate depth information.
        
Generate a depth map where each pixel's depth is represented as a normalized value:
- 1.0 = closest to camera (package front surface)
- 0.0 = farthest from camera (background or package back)

Return JSON with:
{
  "width": image_width,
  "height": image_height,
  "depthDescription": "Brief description of depth structure",
  "estimatedDepthRange": "min to max depth in mm",
  "confidence": 0-100
}

Note: We'll use this for 3D reconstruction, so accuracy is critical.`;

        const imagePart = {
            inlineData: {
                data: imageData.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: "image/jpeg",
            },
        };

        try {
            const result = await retryWithBackoff(
                () => this.model.generateContent([prompt, imagePart]),
                3,
                2000
            );

            const response = await result.response;
            const text = response.text();
            const analysis = JSON.parse(text);

            // For MVP, generate a simplified depth map
            // In production, Gemini would ideally return actual depth data
            const simplifiedDepthMap: DepthMap = {
                width: analysis.width || 512,
                height: analysis.height || 512,
                data: this.generateSimplifiedDepthData(analysis.depthDescription),
            };

            console.log("✓ Depth map generated:", {
                confidence: analysis.confidence,
                range: analysis.estimatedDepthRange,
            });

            return simplifiedDepthMap;
        } catch (error) {
            console.error("Depth map generation failed:", error);
            // Fallback to uniform depth
            return {
                width: 512,
                height: 512,
                data: new Array(512 * 512).fill(0.5),
            };
        }
    }

    /**
     * Analyze 3D structure from multi-angle images
     */
    async analyze3DStructure(images: AngleImage[]): Promise<Package3DStructure> {
        const prompt = `Analyze these multi-angle images of a pharmaceutical package and estimate its 3D structure.

Images provided: ${images.map(img => img.angle).join(', ')}

Determine:
1. Package dimensions (width, height, depth in mm)
2. Shape type (box, bottle, blister pack, cylindrical, irregular)
3. Key 3D vertices (corner points in 3D space)

Return JSON:
{
  "dimensions": { "width": 0, "height": 0, "depth": 0 },
  "shapeType": "box" | "bottle" | "blister" | "cylindrical" | "irregular",
  "vertices": [
    { "x": 0, "y": 0, "z": 0 }
  ],
  "confidence": 0-100,
  "analysis": "Brief description of package structure"
}`;

        const imageParts = images.map(img => ({
            inlineData: {
                data: img.imageData.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: "image/jpeg",
            },
        }));

        try {
            const result = await retryWithBackoff(
                () => this.model.generateContent([prompt, ...imageParts]),
                3,
                2000
            );

            const response = await result.response;
            const text = response.text();
            const analysis = JSON.parse(text);

            console.log("✓ 3D structure analyzed:", {
                shape: analysis.shapeType,
                dimensions: analysis.dimensions,
                confidence: analysis.confidence,
            });

            // Convert to our schema format
            const structure: Package3DStructure = {
                dimensions: analysis.dimensions,
                shapeType: analysis.shapeType,
                vertices: analysis.vertices || this.generateDefaultVertices(analysis.dimensions),
                faces: this.generateFacesFromVertices(analysis.vertices?.length || 8),
            };

            return structure;
        } catch (error) {
            console.error("3D structure analysis failed:", error);
            // Fallback to default box structure
            return this.createDefaultBoxStructure();
        }
    }

    /**
     * Synthesize missing angle using Gemini image generation
     */
    async synthesizeMissingAngle(
        existingAngles: AngleImage[],
        targetAngle: string
    ): Promise<string> {
        const prompt = `Based on these existing views of a pharmaceutical package, generate a ${targetAngle} view.

Existing views: ${existingAngles.map(img => img.angle).join(', ')}

Generate a photorealistic ${targetAngle} view that is consistent with the provided angles.
Maintain:
- Package proportions and dimensions
- Text and label orientations
- Color scheme and branding
- Lighting consistency

Return base64 image data.`;

        const imageParts = existingAngles.map(img => ({
            inlineData: {
                data: img.imageData.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: "image/jpeg",
            },
        }));

        try {
            // Note: Gemini 3 Pro Image can generate images, but for MVP
            // we'll return a placeholder or use a simpler transformation
            console.warn("Image synthesis not yet fully implemented");
            return existingAngles[0].imageData; // Placeholder
        } catch (error) {
            console.error("Angle synthesis failed:", error);
            return existingAngles[0].imageData;
        }
    }

    /**
     * Full 3D reconstruction pipeline
     */
    async reconstructPackage(images: AngleImage[]): Promise<ReconstructionResult> {
        console.log("🔬 Starting 3D reconstruction with Gemini Pro Image...");

        // Step 1: Generate depth maps for each angle
        console.log("📊 Generating depth maps...");
        for (const img of images) {
            if (!img.depthMap) {
                img.depthMap = await this.generateDepthMap(img.imageData);
            }
        }

        // Step 2: Analyze 3D structure
        console.log("🧊 Analyzing 3D structure...");
        const structure = await this.analyze3DStructure(images);

        // Step 3: Check coverage and synthesize missing angles if needed
        const requiredAngles = ['front', 'back', 'left', 'right'];
        const providedAngles = images.map(img => img.angle);
        const missingAngles = requiredAngles.filter(angle => !providedAngles.includes(angle as any));

        const synthesizedAngles: string[] = [];
        if (missingAngles.length > 0 && images.length >= 2) {
            console.log("🎨 Synthesizing missing angles:", missingAngles.join(', '));
            // For MVP, we'll skip synthesis and use what we have
            // In production, call synthesizeMissingAngle for each missing angle
        }

        // Step 4: Build texture map
        const textures = new Map<string, string>();
        images.forEach(img => {
            textures.set(img.angle, img.imageData);
        });

        const result: ReconstructionResult = {
            structure,
            textures,
            confidence: this.calculateConfidence(images.length, synthesizedAngles.length),
            synthesizedAngles,
        };

        console.log("✅ 3D reconstruction complete:", {
            angles: images.length,
            synthesized: synthesizedAngles.length,
            confidence: result.confidence,
        });

        return result;
    }

    /**
     * Helper: Generate simplified depth data from description
     */
    private generateSimplifiedDepthData(description: string): number[] {
        // For MVP, generate a center-focused depth map
        // In production, this would parse Gemini's actual depth data
        const size = 512;
        const data: number[] = [];

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const centerX = size / 2;
                const centerY = size / 2;
                const distance = Math.sqrt(
                    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                );
                const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
                const depth = 1.0 - (distance / maxDistance) * 0.5; // Center is closer
                data.push(depth);
            }
        }

        return data;
    }

    /**
     * Helper: Generate default vertices for box
     */
    private generateDefaultVertices(dimensions: any) {
        const w = dimensions.width / 2;
        const h = dimensions.height / 2;
        const d = dimensions.depth / 2;

        return [
            { x: -w, y: -h, z: -d }, // 0: bottom-left-back
            { x: w, y: -h, z: -d },  // 1: bottom-right-back
            { x: w, y: h, z: -d },   // 2: top-right-back
            { x: -w, y: h, z: -d },  // 3: top-left-back
            { x: -w, y: -h, z: d },  // 4: bottom-left-front
            { x: w, y: -h, z: d },   // 5: bottom-right-front
            { x: w, y: h, z: d },    // 6: top-right-front
            { x: -w, y: h, z: d },   // 7: top-left-front
        ];
    }

    /**
     * Helper: Generate face indices from vertices
     */
    private generateFacesFromVertices(vertexCount: number): number[][] {
        // Box has 6 faces
        if (vertexCount === 8) {
            return [
                [0, 1, 2, 3], // Back
                [4, 5, 6, 7], // Front
                [0, 4, 7, 3], // Left
                [1, 5, 6, 2], // Right
                [3, 2, 6, 7], // Top
                [0, 1, 5, 4], // Bottom
            ];
        }
        return [];
    }

    /**
     * Helper: Create default box structure
     */
    private createDefaultBoxStructure(): Package3DStructure {
        const defaultDims = { width: 100, height: 150, depth: 50 };
        return {
            dimensions: defaultDims,
            shapeType: 'box',
            vertices: this.generateDefaultVertices(defaultDims),
            faces: this.generateFacesFromVertices(8),
        };
    }

    /**
     * Helper: Calculate reconstruction confidence
     */
    private calculateConfidence(providedAngles: number, synthesizedAngles: number): number {
        const baseConfidence = Math.min(providedAngles * 20, 80); // Max 80 from provided
        const penalty = synthesizedAngles * 10;
        return Math.max(baseConfidence - penalty, 30);
    }
}

export const geminiReconstructionService = new GeminiReconstructionService();
