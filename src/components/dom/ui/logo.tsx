// src/components/dom/ui/Logo.tsx
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// --- 3D COMPONENT ---
const LogoCrystal = () => {
  const groupRef = useRef<THREE.Group>(null);
  const lightsRef = useRef<THREE.Group>(null);
  
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null); 
  const ring2Ref = useRef<THREE.Mesh>(null); 
  const ring3Ref = useRef<THREE.Mesh>(null); 

  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(1.2, 1), []); // Detail 1 for smoother lighting
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.8, 0.06, 8, 48), []);

  useFrame((state) => {
    if (!groupRef.current || !lightsRef.current) return;
    const t = state.clock.getElapsedTime();
    const mouse = state.mouse;

    // 1. ROTATE LIGHTS (The Color Shift Logic)
    // The lights orbit the center, causing the "Blue" and "Red" sides to move
    lightsRef.current.rotation.y = t * 0.8;
    lightsRef.current.rotation.z = Math.sin(t * 0.5) * 0.5;

    // 2. CRYSTAL ANIMATION
    if(coreRef.current) {
        coreRef.current.rotation.y = -t * 0.2; // Counter-rotate core
        coreRef.current.rotation.x = t * 0.1;
    }
    
    // Rings Animation
    if(ring1Ref.current) {
        ring1Ref.current.rotation.x = t * 0.8;
        ring1Ref.current.rotation.y = t * 0.2;
    }
    if(ring2Ref.current) {
        ring2Ref.current.rotation.x = -t * 0.3;
        ring2Ref.current.rotation.y = -t * 0.7;
    }
    if(ring3Ref.current) {
        ring3Ref.current.rotation.z = t * 0.4;
        ring3Ref.current.rotation.x = Math.sin(t * 0.5) * 0.3;
    }

    // 3. PARALLAX
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouse.y * 0.4, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouse.x * 0.4, 0.1);
  });

  return (
    <group>
        
      {/* --- DUAL LIGHT RIG (Rotating) --- */}
      <group ref={lightsRef}>
          {/* Blue Army */}
          <pointLight position={[-8, 0, 0]} intensity={20} color="#0088ff" distance={15} scale={200} />
          {/* Red Army */}
          <pointLight position={[8, 0, 0]} intensity={20} color="#ff0055" distance={15} scale={200} />
      </group>

      <group ref={groupRef}>
        {/* --- CORE (The Battlefield) --- */}
        <mesh ref={coreRef} geometry={coreGeo}>
            {/* 
                High roughness = Diffuse light blending. 
                White color = Reflects the colored lights exactly.
            */}
            <meshStandardMaterial 
                color="#cccccc" 
                roughness={0.4} 
                metalness={0.8} 
            />
        </mesh>
        
        {/* Wireframe Overlay */}
        <mesh geometry={coreGeo} scale={1.02}>
            <meshBasicMaterial color="white" wireframe transparent opacity={0.1} />
        </mesh>

        {/* --- RINGS --- */}
        <mesh ref={ring1Ref} geometry={ringGeo} scale={0.7}>
            <meshBasicMaterial color="#00f3ff" transparent opacity={0.6} toneMapped={false} />
        </mesh>

        <mesh ref={ring2Ref} geometry={ringGeo} scale={0.9}>
            <meshBasicMaterial color="#ff0055" transparent opacity={0.6} toneMapped={false} />
        </mesh>

        <mesh ref={ring3Ref} geometry={ringGeo} scale={1.1}>
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} toneMapped={false} />
        </mesh>
      </group>

    </group>
  );
};

// --- MAIN COMPONENT ---
export const Logo = ({ scale = 1.0 }: { scale?: number }) => {
  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ transform: `scale(${scale})` }}>
      
      {/* 3D LAYER */}
      <div className="absolute inset-0 w-80 h-80 -translate-x-1/2 left-1/2 -top-20 z-0 pointer-events-none">
        <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 6], fov: 45 }}>
            <LogoCrystal />
        </Canvas>
      </div>

      {/* TEXT LAYER */}
      <div className="relative z-10 text-center"> 
        <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,1)]">
          QUANTUM
        </h1>
        
        <div className="text-xl md:text-2xl font-bold tracking-[0.6em] mt-[-5px] bg-black/40 backdrop-blur-md px-4 rounded border border-white/10 shadow-lg">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500 drop-shadow-md">
            BREACH
          </span>
        </div>
      </div>

      {/* LINE */}
      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-6 w-32"
      />
      
    </div>
  );
};