'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { OrbitControls, Text } from '@react-three/drei';
import { DigitalTwinMesh } from '@/lib/agents/spatial_ledger';
import * as THREE from 'three';

interface DigitalTwinViewerProps {
    meshData: DigitalTwinMesh;
}

function DrugBox({ meshData }: { meshData: DigitalTwinMesh }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    // Auto-rotate
    useFrame((state, delta) => {
        if (meshRef.current && !hovered) {
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <group>
            {/* The Drug Box */}
            <mesh
                ref={meshRef}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[meshData.width / 2, meshData.height / 2, meshData.depth / 2]} />
                <meshStandardMaterial
                    color="#eefaf6" // Mint leaf base
                    metalness={0.1}
                    roughness={0.8}
                />
                {/* Visualizing defects as small spheres directly attached for now */}
                {meshData.defects.map((defect, i) => (
                    <mesh key={i} position={new THREE.Vector3(...defect.position)}>
                        <sphereGeometry args={[0.3, 16, 16]} />
                        <meshBasicMaterial color="#ef4444" opacity={0.6} transparent />
                    </mesh>
                ))}
            </mesh>

            {/* Wireframe for "Analysis" look */}
            <mesh ref={meshRef}>
                <boxGeometry args={[meshData.width / 2 + 0.05, meshData.height / 2 + 0.05, meshData.depth / 2 + 0.05]} />
                <meshBasicMaterial color="#0A4D3C" wireframe transparent opacity={0.1} />
            </mesh>
        </group>
    );
}

export function DigitalTwinViewer({ meshData }: DigitalTwinViewerProps) {
    return (
        <div className="w-full h-64 bg-black/5 rounded-2xl overflow-hidden relative">
            <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    Gemini Nano • Digital Twin
                </span>
            </div>

            <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <DrugBox meshData={meshData} />
                <OrbitControls enableZoom={false} autoRotate={false} />
            </Canvas>

            {meshData.defects.length > 0 && (
                <div className="absolute bottom-3 right-3 bg-red-900/80 backdrop-blur px-3 py-2 rounded-lg border border-red-500/30">
                    <p className="text-[10px] text-white font-bold uppercase">Structural Defect Detected</p>
                </div>
            )}
        </div>
    );
}
