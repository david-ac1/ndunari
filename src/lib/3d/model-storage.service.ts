import { geminiReconstructionService, AngleImage, ReconstructionResult } from './gemini-reconstruction.service';
import * as THREE from 'three';

export interface Model3DData {
    geometry: {
        vertices: number[]; // Flattened array of x,y,z coords
        indices: number[];  // Triangle indices
        normals: number[];  // Normal vectors
    };
    textures: Map<string, string>; // face -> base64
    boundingBox: {
        min: { x: number; y: number; z: number };
        max: { x: number; y: number; z: number };
    };
}

/**
 * Storage service for persisting 3D models
 */
export class ModelStorageService {
    private readonly STORAGE_KEY_PREFIX = 'ndunari_3d_model_';
    private readonly MAX_MODELS = 50; // Limit stored models

    /**
     * Save 3D model to IndexedDB/LocalStorage
     */
    async saveModel(scanId: string, reconstruction: ReconstructionResult): Promise<void> {
        try {
            const modelData = this.serializeModel(reconstruction);
            const key = this.STORAGE_KEY_PREFIX + scanId;

            // Store in localStorage (for simple MVP)
            // In production, use IndexedDB for larger models
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(modelData));
                console.log(`✓ 3D model saved for scan: ${scanId}`);
            }

            // Cleanup old models if limit exceeded
            await this.cleanupOldModels();
        } catch (error) {
            console.error('Failed to save 3D model:', error);
        }
    }

    /**
     * Load 3D model from storage
     */
    async loadModel(scanId: string): Promise<Model3DData | null> {
        try {
            const key = this.STORAGE_KEY_PREFIX + scanId;
            const data = localStorage.getItem(key);

            if (!data) {
                console.warn(`No 3D model found for scan: ${scanId}`);
                return null;
            }

            const modelData = JSON.parse(data);
            console.log(`✓ 3D model loaded for scan: ${scanId}`);
            return modelData;
        } catch (error) {
            console.error('Failed to load 3D model:', error);
            return null;
        }
    }

    /**
     * Delete 3D model
     */
    async deleteModel(scanId: string): Promise<void> {
        try {
            const key = this.STORAGE_KEY_PREFIX + scanId;
            localStorage.removeItem(key);
            console.log(`✓ 3D model deleted for scan: ${scanId}`);
        } catch (error) {
            console.error('Failed to delete 3D model:', error);
        }
    }

    /**
     * Export model to GLB format (future enhancement)
     */
    async exportToGLB(scanId: string): Promise<Blob | null> {
        // TODO: Implement GLB export using Three.js GLTFExporter
        console.warn('GLB export not yet implemented');
        return null;
    }

    /**
     * Serialize reconstruction result to storable format
     */
    private serializeModel(reconstruction: ReconstructionResult): Model3DData {
        const { structure, textures } = reconstruction;

        // Flatten vertices
        const vertices: number[] = [];
        structure.vertices.forEach(v => {
            vertices.push(v.x, v.y, v.z);
        });

        // Generate triangle indices from faces
        const indices: number[] = [];
        structure.faces.forEach(face => {
            if (face.length === 4) {
                // Quad to triangles
                indices.push(face[0], face[1], face[2]);
                indices.push(face[0], face[2], face[3]);
            } else if (face.length === 3) {
                indices.push(...face);
            }
        });

        // Calculate normals (simplified)
        const normals = this.calculateNormals(vertices, indices);

        // Calculate bounding box
        const boundingBox = this.calculateBoundingBox(structure.vertices);

        return {
            geometry: { vertices, indices, normals },
            textures,
            boundingBox,
        };
    }

    /**
     * Calculate vertex normals
     */
    private calculateNormals(vertices: number[], indices: number[]): number[] {
        const normals = new Array(vertices.length).fill(0);

        // Calculate face normals and accumulate
        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i] * 3;
            const i1 = indices[i + 1] * 3;
            const i2 = indices[i + 2] * 3;

            const v0 = new THREE.Vector3(vertices[i0], vertices[i0 + 1], vertices[i0 + 2]);
            const v1 = new THREE.Vector3(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
            const v2 = new THREE.Vector3(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);

            const edge1 = v1.clone().sub(v0);
            const edge2 = v2.clone().sub(v0);
            const normal = edge1.cross(edge2).normalize();

            // Add to each vertex normal
            [i0, i1, i2].forEach(idx => {
                normals[idx] += normal.x;
                normals[idx + 1] += normal.y;
                normals[idx + 2] += normal.z;
            });
        }

        // Normalize all normals
        for (let i = 0; i < normals.length; i += 3) {
            const length = Math.sqrt(
                normals[i] ** 2 + normals[i + 1] ** 2 + normals[i + 2] ** 2
            );
            if (length > 0) {
                normals[i] /= length;
                normals[i + 1] /= length;
                normals[i + 2] /= length;
            }
        }

        return normals;
    }

    /**
     * Calculate bounding box from vertices
     */
    private calculateBoundingBox(vertices: Array<{ x: number; y: number; z: number }>) {
        const min = { x: Infinity, y: Infinity, z: Infinity };
        const max = { x: -Infinity, y: -Infinity, z: -Infinity };

        vertices.forEach((v: { x: number; y: number; z: number }) => {
            min.x = Math.min(min.x, v.x);
            min.y = Math.min(min.y, v.y);
            min.z = Math.min(min.z, v.z);
            max.x = Math.max(max.x, v.x);
            max.y = Math.max(max.y, v.y);
            max.z = Math.max(max.z, v.z);
        });

        return { min, max };
    }

    /**
     * Cleanup old models to maintain storage limit
     */
    private async cleanupOldModels(): Promise<void> {
        if (typeof window === 'undefined') return;

        const keys = Object.keys(localStorage).filter(key =>
            key.startsWith(this.STORAGE_KEY_PREFIX)
        );

        if (keys.length > this.MAX_MODELS) {
            // Remove oldest models (simple FIFO)
            const toRemove = keys.slice(0, keys.length - this.MAX_MODELS);
            toRemove.forEach(key => localStorage.removeItem(key));
            console.log(`🗑️ Cleaned up ${toRemove.length} old 3D models`);
        }
    }
}

export const modelStorageService = new ModelStorageService();
