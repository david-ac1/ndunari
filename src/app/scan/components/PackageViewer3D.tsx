"use client";

import { useEffect, useRef, useState } from 'react';
import { ThreeSceneManager, SceneConfig } from '@/lib/3d/three-scene-manager';
import { packageMeshBuilder, FaceTexture, EvidenceBox3D } from '@/lib/3d/package-mesh-builder';
import * as THREE from 'three';
import { Download, Maximize2, RotateCcw } from 'lucide-react';

export interface PackageViewer3DProps {
    dimensions: { width: number; height: number; depth: number };
    faceTextures: FaceTexture[];
    evidenceBoxes?: EvidenceBox3D[];
    onLoad?: () => void;
}

export default function PackageViewer3D({
    dimensions,
    faceTextures,
    evidenceBoxes = [],
    onLoad,
}: PackageViewer3DProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneManagerRef = useRef<ThreeSceneManager | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEvidence, setShowEvidence] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Initialize 3D scene
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const config: SceneConfig = {
            canvasElement: canvasRef.current,
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 400,
        };

        const manager = new ThreeSceneManager(config);
        sceneManagerRef.current = manager;

        // Create and add package mesh
        const packageMesh = packageMeshBuilder.createBoxMesh(dimensions);
        manager.addMesh(packageMesh);

        // Apply textures
        packageMeshBuilder.applyTextures(packageMesh, faceTextures).then(() => {
            setIsLoading(false);
            onLoad?.();
        });

        // Add edge highlighting
        const edgeOverlay = packageMeshBuilder.createEdgeHighlight(packageMesh);
        manager.getScene().add(edgeOverlay);

        // Add evidence boxes
        evidenceBoxes.forEach((evidence) => {
            const evidenceMesh = packageMeshBuilder.createEvidenceBox(evidence);
            const label = packageMeshBuilder.createLabel(evidence.label, evidence.position);
            evidenceMesh.userData.label = label;
            manager.getScene().add(evidenceMesh);
            manager.getScene().add(label);
        });

        // Start animation
        manager.startAnimation();

        // Handle resize
        const handleResize = () => {
            if (containerRef.current && sceneManagerRef.current) {
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;
                sceneManagerRef.current.handleResize(width, height);
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            manager.dispose();
        };
    }, [dimensions, faceTextures, evidenceBoxes, onLoad]);

    // Toggle evidence visibility
    const handleToggleEvidence = () => {
        if (!sceneManagerRef.current) return;

        const scene = sceneManagerRef.current.getScene();
        scene.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
                child.visible = !showEvidence;
                if (child.userData.label) {
                    child.userData.label.visible = !showEvidence;
                }
            }
        });

        setShowEvidence(!showEvidence);
    };

    // Reset camera view
    const handleResetCamera = () => {
        sceneManagerRef.current?.resetCamera();
    };

    // Capture screenshot
    const handleCaptureScreenshot = () => {
        if (!sceneManagerRef.current) return;

        const dataUrl = sceneManagerRef.current.captureScreenshot();
        const link = document.createElement('a');
        link.download = `forensic-3d-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    };

    // Toggle fullscreen
    const handleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-background-dark rounded-2xl overflow-hidden border border-white/10"
        >
            {/* Canvas */}
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-white/70 text-sm font-mono">Reconstructing 3D Model...</p>
                    </div>
                </div>
            )}

            {/* Control Panel */}
            {!isLoading && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 glass-panel p-2 rounded-xl bg-black/60 backdrop-blur-md">
                    <button
                        onClick={handleToggleEvidence}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${showEvidence
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        {showEvidence ? 'Hide Evidence' : 'Show Evidence'}
                    </button>

                    <button
                        onClick={handleResetCamera}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors flex items-center gap-2"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span className="text-sm font-bold">Reset</span>
                    </button>

                    <button
                        onClick={handleCaptureScreenshot}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors flex items-center gap-2"
                        title="Screenshot"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleFullscreen}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                        title="Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Instructions */}
            {!isLoading && !isFullscreen && (
                <div className="absolute top-4 left-4 glass-panel p-3 rounded-xl bg-black/60 backdrop-blur-md">
                    <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest">
                        Drag to rotate • Scroll to zoom
                    </p>
                </div>
            )}
        </div>
    );
}
