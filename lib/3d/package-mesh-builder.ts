import * as THREE from 'three';

export interface PackageDimensions {
    width: number;
    height: number;
    depth: number;
}

export interface FaceTexture {
    face: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
    imageData: string; // base64
}

export interface EvidenceBox3D {
    position: THREE.Vector3;
    size: THREE.Vector3;
    label: string;
    riskLevel: 'safe' | 'suspicious' | 'counterfeit';
}

export class PackageMeshBuilder {
    /**
     * Create a basic box mesh for pharmaceutical package
     */
    createBoxMesh(dimensions: PackageDimensions): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(
            dimensions.width,
            dimensions.height,
            dimensions.depth
        );

        // Default material (will be replaced with textured materials)
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.8,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    /**
     * Apply textures to package faces
     */
    async applyTextures(
        mesh: THREE.Mesh,
        faceTextures: FaceTexture[]
    ): Promise<void> {
        const textureLoader = new THREE.TextureLoader();
        const materials: THREE.MeshStandardMaterial[] = [];

        // Six faces: right, left, top, bottom, front, back (Three.js order)
        const faceOrder = ['right', 'left', 'top', 'bottom', 'front', 'back'];

        for (const faceName of faceOrder) {
            const faceTexture = faceTextures.find(ft => ft.face === faceName);

            if (faceTexture) {
                const texture = await new Promise<THREE.Texture>((resolve) => {
                    textureLoader.load(faceTexture.imageData, resolve);
                });

                texture.colorSpace = THREE.SRGBColorSpace;

                materials.push(
                    new THREE.MeshStandardMaterial({
                        map: texture,
                        metalness: 0.1,
                        roughness: 0.8,
                    })
                );
            } else {
                // Fallback material if texture not provided
                materials.push(
                    new THREE.MeshStandardMaterial({
                        color: 0xaaaaaa,
                        metalness: 0.1,
                        roughness: 0.8,
                    })
                );
            }
        }

        mesh.material = materials;
    }

    /**
     * Create evidence bounding box overlay
     */
    createEvidenceBox(evidence: EvidenceBox3D): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(
            evidence.size.x,
            evidence.size.y,
            evidence.size.z
        );

        // Color based on risk level
        const colorMap = {
            safe: 0x00ff00,
            suspicious: 0xffa500,
            counterfeit: 0xff0000,
        };

        const material = new THREE.MeshBasicMaterial({
            color: colorMap[evidence.riskLevel],
            transparent: true,
            opacity: 0.3,
            wireframe: true,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(evidence.position);

        return mesh;
    }

    /**
     * Create edge highlighting for package
     */
    createEdgeHighlight(mesh: THREE.Mesh): THREE.LineSegments {
        const edges = new THREE.EdgesGeometry(mesh.geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
                color: 0x38bdf8, // Primary blue
                linewidth: 2,
            })
        );

        return line;
    }

    /**
     * Add label text to evidence box (using sprite)
     */
    createLabel(text: string, position: THREE.Vector3): THREE.Sprite {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = 512;
        canvas.height = 128;

        // Draw background
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        context.font = 'Bold 36px Inter, sans-serif';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        sprite.position.copy(position);
        sprite.scale.set(2, 0.5, 1);

        return sprite;
    }
}

export const packageMeshBuilder = new PackageMeshBuilder();
