// src/components/canvas/board/QuantumBoard.tsx
import { useRef, useLayoutEffect, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBoard, useGameStore } from '../../../store/gameStore';
import { QubitNode } from './QubitNode';
import { HolographicHUD } from '../ui/HolographicHUD'; 

// --- CONSTANTS & GEOMETRIES ---
const GRID_SIZE = 6;
const CELL_SPACING = 1.1;
const BOARD_WIDTH = GRID_SIZE * CELL_SPACING;
const OFFSET = BOARD_WIDTH / 2 - (CELL_SPACING / 2); 

// Geometries created once globally
const CHASSIS_GEO = new THREE.BoxGeometry(BOARD_WIDTH + 0.8, 0.4, BOARD_WIDTH + 0.8);
const VENT_GEO = new THREE.BoxGeometry(BOARD_WIDTH + 1.0, 0.15, BOARD_WIDTH + 1.0);
const GLASS_GEO = new THREE.BoxGeometry(BOARD_WIDTH + 0.2, 0.05, BOARD_WIDTH + 0.2);
const BOLT_GEO = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
const TRACE_GEO = new THREE.BoxGeometry(0.35, 0.01, 0.04);
const BEAM_GEO = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 12);

// Materials created once globally
const MAT_STEEL = new THREE.MeshStandardMaterial({ 
  color: "#555555", roughness: 0.4, metalness: 0.8, emissive: "#111122", emissiveIntensity: 0.2
});
const MAT_WIRE_BRIGHT = new THREE.MeshBasicMaterial({
    color: "#00f3ff", wireframe: true, transparent: true, opacity: 0.3
});
const MAT_GLOW_STRIP = new THREE.MeshBasicMaterial({ 
  color: "#00f3ff", transparent: true, opacity: 0.8 
});
const MAT_GLASS = new THREE.MeshStandardMaterial({ 
  color: "#88ccff", roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.6, side: THREE.DoubleSide
});
const MAT_CHROME = new THREE.MeshStandardMaterial({ 
  color: "#ffffff", roughness: 0.2, metalness: 0.9 
});

const COL_BLUE = new THREE.Color('#00f3ff');
const COL_RED = new THREE.Color('#ff0055');
const COL_CRITICAL = new THREE.Color('#ff0055'); 

export const QuantumBoard = () => {
  // OPTIMIZATION #8: Granular Selectors
  const board = useBoard();
  const isARMode = useGameStore(s => s.isARMode);
  const instability = useGameStore(s => s.instability);
  const currentPlayer = useGameStore(s => s.currentPlayer);

  const traceRef = useRef<THREE.InstancedMesh>(null);
  const traceMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Local material instance for beams (dynamic color)
  const [beamMat] = useState(() => new THREE.MeshBasicMaterial({
    color: "#00f3ff", transparent: true, opacity: 0.8, toneMapped: false
  }));

  const targetColorTrace = useMemo(() => new THREE.Color(), []);
  const targetColorLight = useMemo(() => new THREE.Color(), []);
  
  // OPTIMIZATION #9: Frame Throttling
  // We only update heavy visual effects every ~30ms (30fps) instead of 16ms (60fps)
  let lastUpdate = 0;

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (time - lastUpdate < 0.033) return; // Skip frame if too soon
    lastUpdate = time;

    // 1. ENTROPY LOGIC (Grid Lines & Beacons)
    const t = instability / 100;
    targetColorTrace.lerpColors(COL_BLUE, COL_CRITICAL, t);
    
    // Smooth Lerp using delta
    if (traceMatRef.current) traceMatRef.current.color.lerp(targetColorTrace, delta * 5); // Increased speed to compensate for throttle
    beamMat.color.lerp(targetColorTrace, delta * 5);

    // 2. TURN LOGIC (Center Light)
    const turnColor = currentPlayer === 'blue' ? COL_BLUE : COL_RED;
    targetColorLight.lerp(turnColor, delta * 3);
    
    if (lightRef.current) {
        lightRef.current.color.copy(targetColorLight);
        lightRef.current.intensity = 6 + Math.sin(time * 3) * 1.5;
    }
  });

  // OPTIMIZATION #2: Cleanup on Unmount
  useEffect(() => {
    return () => {
      beamMat.dispose();
      // Global mats don't need disposal here as they persist,
      // but if we created local geometries, we would dispose them here.
    };
  }, [beamMat]);

  useLayoutEffect(() => {
    if (!traceRef.current) return;
    const temp = new THREE.Object3D();
    let idx = 0;
    const toPos = (i: number) => (i * CELL_SPACING) - OFFSET;

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const posX = toPos(x);
            const posZ = toPos(z);
            if (x < GRID_SIZE - 1) {
                const midX = (posX + toPos(x + 1)) / 2;
                temp.position.set(midX, 0, posZ);
                temp.rotation.set(0, 0, 0); 
                temp.updateMatrix();
                traceRef.current.setMatrixAt(idx++, temp.matrix);
            }
            if (z < GRID_SIZE - 1) {
                const midZ = (posZ + toPos(z + 1)) / 2;
                temp.position.set(posX, 0, midZ);
                temp.rotation.set(0, Math.PI / 2, 0); 
                temp.updateMatrix();
                traceRef.current.setMatrixAt(idx++, temp.matrix);
            }
            if (z === 0) { temp.position.set(posX, 0, posZ - 0.5); temp.rotation.set(0, Math.PI/2, 0); temp.updateMatrix(); traceRef.current.setMatrixAt(idx++, temp.matrix); }
            if (z === GRID_SIZE - 1) { temp.position.set(posX, 0, posZ + 0.5); temp.rotation.set(0, Math.PI/2, 0); temp.updateMatrix(); traceRef.current.setMatrixAt(idx++, temp.matrix); }
            if (x === 0) { temp.position.set(posX - 0.5, 0, posZ); temp.rotation.set(0, 0, 0); temp.updateMatrix(); traceRef.current.setMatrixAt(idx++, temp.matrix); }
            if (x === GRID_SIZE - 1) { temp.position.set(posX + 0.5, 0, posZ); temp.rotation.set(0, 0, 0); temp.updateMatrix(); traceRef.current.setMatrixAt(idx++, temp.matrix); }
        }
    }
    traceRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      
      {/* LEVEL 1: CELLS (Centered) */}
      <group position={[-OFFSET, 0, -OFFSET]}>
        {board.map((qubit, i) => (
          <QubitNode key={qubit.id} data={qubit} index={i} />
        ))}
      </group>

      {/* LEVEL 2: THE PLATFORM */}
      <group position={[0, -0.85, 0]}>
         <pointLight ref={lightRef} position={[0, 0.5, 0]} intensity={3} color="#00f3ff" distance={10} />
         
         <mesh geometry={GLASS_GEO} material={MAT_GLASS} position={[0, 0.25, 0]} />
         
         <instancedMesh ref={traceRef} args={[TRACE_GEO, undefined, 100]} position={[0, 0.28, 0]}>
            <meshBasicMaterial ref={traceMatRef} toneMapped={false} color="#00f3ff" />
         </instancedMesh>
         
         <mesh geometry={VENT_GEO} material={MAT_GLOW_STRIP} position={[0, 0.1, 0]} scale={[0.98, 0.2, 0.98]} />
         
         <group position={[0, -0.2, 0]}>
            <mesh geometry={CHASSIS_GEO} material={MAT_STEEL} />
            <mesh geometry={CHASSIS_GEO} material={MAT_WIRE_BRIGHT} scale={1.005} />
         </group>
         
         <group position={[0, 0.1, 0]}>
            <mesh geometry={VENT_GEO} material={MAT_STEEL} />
            <mesh geometry={VENT_GEO} material={MAT_WIRE_BRIGHT} scale={1.005} />
         </group>

         <group position={[0, 0.2, 0]}>
            {[1, -1].map(x => [1, -1].map(z => (
                <group key={`${x}-${z}`} position={[x * (BOARD_WIDTH/2 + 0.3), 0, z * (BOARD_WIDTH/2 + 0.3)]}>
                    <mesh geometry={BOLT_GEO} material={MAT_CHROME} />
                    <mesh position={[x * -0.2, -0.1, z * -0.2]}>
                        <boxGeometry args={[0.06, 0.06, 0.06]} />
                        <meshBasicMaterial color="#ff0000" toneMapped={false} />
                    </mesh>
                    <mesh geometry={BEAM_GEO} material={beamMat} position={[0, 0.4, 0]} />
                </group>
            )))}
        </group>
      </group>

      {/* AR HUD */}
      {isARMode && (
        <group position={[0, 1.5, -4]}>
           <HolographicHUD />
        </group>
      )}

    </group>
  );
};