import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface SceneConfig {
    canvasElement: HTMLCanvasElement;
    width: number;
    height: number;
}

export class ThreeSceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private animationId: number | null = null;

    constructor(config: SceneConfig) {
        // Initialize scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            config.width / config.height, // Aspect
            0.1, // Near
            1000 // Far
        );
        this.camera.position.set(0, 0, 5);

        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: config.canvasElement,
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(config.width, config.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Initialize controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Add directional light (simulates top-down forensic lighting)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Add secondary light for fill
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, -5, -5);
        this.scene.add(fillLight);
    }

    /**
     * Add a mesh to the scene
     */
    addMesh(mesh: THREE.Mesh) {
        this.scene.add(mesh);
    }

    /**
     * Remove a mesh from the scene
     */
    removeMesh(mesh: THREE.Mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
        } else {
            mesh.material.dispose();
        }
    }

    /**
     * Clear all meshes from scene
     */
    clearScene() {
        this.scene.children.forEach(child => {
            if (child instanceof THREE.Mesh) {
                this.removeMesh(child);
            }
        });
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.animationId !== null) return;

        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Handle canvas resize
     */
    handleResize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Reset camera to default position
     */
    resetCamera() {
        this.camera.position.set(0, 0, 5);
        this.controls.reset();
    }

    /**
     * Capture screenshot of current view
     */
    captureScreenshot(): string {
        return this.renderer.domElement.toDataURL('image/png');
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.stopAnimation();
        this.clearScene();
        this.controls.dispose();
        this.renderer.dispose();
    }

    /**
     * Get scene reference
     */
    getScene(): THREE.Scene {
        return this.scene;
    }

    /**
     * Get camera reference
     */
    getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
}
