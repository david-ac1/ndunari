import { z } from "zod";

/**
 * Depth Map Schema - normalized depth values
 */
export const DepthMapSchema = z.object({
    width: z.number(),
    height: z.number(),
    data: z.array(z.number()), // Normalized 0-1, where 0=far, 1=near
    imageUrl: z.string().optional(), // Optional grayscale visualization
});

export type DepthMap = z.infer<typeof DepthMapSchema>;

/**
 * 3D Point in space
 */
export const Point3DSchema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
});

export type Point3D = z.infer<typeof Point3DSchema>;

/**
 * Point Cloud - collection of 3D points
 */
export const PointCloudSchema = z.object({
    points: z.array(Point3DSchema),
    colors: z.array(z.tuple([z.number(), z.number(), z.number()])).optional(), // RGB colors for each point
});

export type PointCloud = z.infer<typeof PointCloudSchema>;

/**
 * Package 3D Structure from Gemini analysis
 */
export const Package3DStructureSchema = z.object({
    dimensions: z.object({
        width: z.number(), // mm
        height: z.number(), // mm
        depth: z.number(), // mm
    }),
    shapeType: z.enum(['box', 'bottle', 'blister', 'cylindrical', 'irregular']),
    vertices: z.array(Point3DSchema), // Corner points
    faces: z.array(z.array(z.number())), // Vertex indices forming faces
    pointCloud: PointCloudSchema.optional(),
});

export type Package3DStructure = z.infer<typeof Package3DStructureSchema>;

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
