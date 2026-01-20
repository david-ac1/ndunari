'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { DigitalTwinMesh } from '@/lib/agents/spatial_ledger';
import * as THREE from 'three';

interface DigitalTwinViewerProps {
   meshData: DigitalTwinMesh;
}

function DrugBox({ meshData }: { meshData: DigitalTwinMesh }) {
   const meshRef = useRef<THREE.Mesh>(null);
   const [hovered, setHover] = useState(false);
   const [texture, setTexture] = useState<THREE.Texture | null>(null);

   useEffect(() => {
      if (meshData.textureUri) {
         new THREE.TextureLoader().load(meshData.textureUri, (tex) => {
            setTexture(tex);
         });
      }
   }, [meshData.textureUri]);

   // Auto-rotate
   useFrame((state, delta) => {
      if (meshRef.current) {
         meshRef.current.rotation.y += delta * (hovered ? 0.1 : 0.4);
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
               color={texture ? "#ffffff" : "#eefaf6"}
               map={texture}
               metalness={0.1}
               roughness={0.5}
            />
            {/* Visualizing defects as small spheres directly attached for now */}
            {meshData.defects.map((defect, i) => (
               <mesh key={i} position={new THREE.Vector3(...defect.position)}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshBasicMaterial color="#ef4444" opacity={0.8} transparent />
               </mesh>
            ))}
         </mesh>

         {/* Wireframe for "Analysis" look */}
         <mesh ref={meshRef}>
            <boxGeometry args={[meshData.width / 2 + 0.1, meshData.height / 2 + 0.1, meshData.depth / 2 + 0.1]} />
            <meshBasicMaterial color="#00ffcc" wireframe transparent opacity={0.2} />
         </mesh>
      </group>
   );
}

export function DigitalTwinViewer({ meshData }: DigitalTwinViewerProps) {
   return (
      <div className="w-full h-64 bg-black/95 rounded-2xl overflow-hidden relative group border border-white/10">

         {/* Header: Simulation Badge */}
         <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
               Gemini Nano • 3D Preview
            </span>
         </div>

         {/* 3D Scene */}
         <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <DrugBox meshData={meshData} />
            <OrbitControls enableZoom={false} autoRotate={false} />
         </Canvas>

         {/* Footer: Waitlist Overlay */}
         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex items-end justify-between">
            <div>
               <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">
                  Nano Reconstruction Active
               </p>
               <p className="text-[9px] text-white/50 max-w-[180px] leading-tight">
                  Generated from real-time scan data. Advanced volumetric physics is currently in beta.
               </p>
            </div>

            <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-blue-100 transition-all hover:scale-105 active:scale-95">
               Join Reconstruction Waitlist
            </button>
         </div>

         {/* Defect Indicator (if any) */}
         {meshData.defects.length > 0 && (
            <div className="absolute top-12 right-3 bg-red-900/80 backdrop-blur px-3 py-2 rounded-lg border border-red-500/30 z-10">
               <p className="text-[10px] text-white font-bold uppercase animate-pulse">Structural Anomaly Detected</p>
            </div>
         )}
      </div>
   );
}
