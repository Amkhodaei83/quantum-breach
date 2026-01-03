// src/components/canvas/BackgroundScene.tsx
import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GeometryManager } from '../../engine/core/GeometryManager';

interface BackgroundProps {
  speed?: number; 
  autoShift?: boolean; 
}

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
const COUNT = isMobile ? 80 : 200; 

const DUMMY = new THREE.Object3D();
const COLOR_DUMMY = new THREE.Color();
const COL_GREEN = new THREE.Color('#00ff41');
const COL_BLUE = new THREE.Color('#00f3ff');
const COL_RED = new THREE.Color('#ff0055');

const COLOR_LUT = new Array(101).fill(null).map((_, i) => 
  new THREE.Color().lerpColors(COL_BLUE, COL_RED, i / 100)
);

const BackgroundScene = ({ speed = 1, autoShift = false }: BackgroundProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const currentScales = useRef(new Float32Array(COUNT).fill(0));

  const geometry = useMemo(() => 
    GeometryManager.getGeometry('bg-icosahedron', () => new THREE.IcosahedronGeometry(0.6, 0)), 
  []);

  const material = useMemo(() => 
    GeometryManager.getMaterial('bg-wireframe', () => new THREE.MeshBasicMaterial({ 
      wireframe: true, 
      transparent: true, 
      opacity: 0.4 
    })), 
  []);

  const { positions, randoms } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const rnd = new Float32Array(COUNT * 3); 

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;     
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60; 
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30; 

      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }
    return { positions: pos, randoms: rnd };
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    const colorArray = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      colorArray[i * 3] = COL_BLUE.r;
      colorArray[i * 3 + 1] = COL_BLUE.g;
      colorArray[i * 3 + 2] = COL_BLUE.b;
    }
    
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);

    DUMMY.scale.set(0, 0, 0); 
    for (let i = 0; i < COUNT; i++) {
      DUMMY.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      DUMMY.updateMatrix();
      meshRef.current.setMatrixAt(i, DUMMY.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  useFrame((state, delta) => {
    if (!meshRef.current || !meshRef.current.instanceColor) return;

    const time = state.clock.getElapsedTime();
    const safeDelta = Math.min(delta, 0.1); 

    let lutIndex = 0; 
    let activeThreshold = isMobile ? 60 : 100;

    if (autoShift) {
        const t = time * 0.2;
        const sine = Math.sin(t);
        
        if (sine > 0.3) {
            lutIndex = 0;
            activeThreshold = isMobile ? 70 : 140; 
        } else if (sine < -0.3) {
            lutIndex = 100;
            activeThreshold = isMobile ? 80 : 200; 
        } else {
            lutIndex = -1; 
            activeThreshold = isMobile ? 40 : 60;  
        }
    } else {
        const normalizedSpeed = Math.min(speed, 10);
        activeThreshold = (isMobile ? 40 : 60) + (normalizedSpeed / 10) * (isMobile ? 60 : 140);
        
        if (speed <= 2.5) { lutIndex = -1; }
        else if (speed <= 6.5) { lutIndex = 0; }
        else { lutIndex = 100; }
    }

    let needsMatrixUpdate = false;
    let needsColorUpdate = false;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      
      const isVisible = i < activeThreshold;
      const targetScale = isVisible ? (1 + Math.sin(time * 2 + i) * 0.2) : 0;
      const diff = targetScale - currentScales.current[i];
      
      if (Math.abs(diff) > 0.001) {
        currentScales.current[i] += diff * safeDelta * 3.0;
        needsMatrixUpdate = true;
      }

      if (currentScales.current[i] < 0.01) {
          if (DUMMY.scale.x !== 0) { 
            DUMMY.scale.setScalar(0);
            DUMMY.updateMatrix();
            meshRef.current.setMatrixAt(i, DUMMY.matrix);
            needsMatrixUpdate = true;
          }
          continue; 
      }

      const rndSpeed = randoms[ix] * 0.5 + 0.5;
      const t = time * ((speed * 0.1) + 0.2) * rndSpeed + (randoms[ix + 2] * Math.PI * 2);

      DUMMY.position.set(
        positions[ix] + Math.sin(t * 0.3) * 2,
        positions[ix + 1] + Math.cos(t * 0.2) * 2,
        positions[ix + 2] + Math.sin(t * 0.1) * 1
      );
      
      DUMMY.rotation.x = time * rndSpeed * 0.5;
      DUMMY.rotation.y = time * rndSpeed * 0.3;
      DUMMY.scale.setScalar(currentScales.current[i]);
      DUMMY.updateMatrix();
      meshRef.current.setMatrixAt(i, DUMMY.matrix);
      needsMatrixUpdate = true;

      if (lutIndex === -1) {
         meshRef.current.getColorAt(i, COLOR_DUMMY);
         if (Math.abs(COLOR_DUMMY.g - COL_GREEN.g) > 0.01) {
            COLOR_DUMMY.lerp(COL_GREEN, safeDelta * 2);
            meshRef.current.setColorAt(i, COLOR_DUMMY);
            needsColorUpdate = true;
         }
      } else {
         meshRef.current.getColorAt(i, COLOR_DUMMY);
         const target = COLOR_LUT[lutIndex];
         
         if (Math.abs(COLOR_DUMMY.r - target.r) > 0.01) {
            COLOR_DUMMY.lerp(target, safeDelta * 2);
            meshRef.current.setColorAt(i, COLOR_DUMMY);
            needsColorUpdate = true;
         }
      }
    }

    if (needsMatrixUpdate) meshRef.current.instanceMatrix.needsUpdate = true;
    if (needsColorUpdate) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, COUNT]} 
      renderOrder={-1}
    />
  );
};

export default BackgroundScene;