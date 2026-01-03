// src/engine/core/GeometryManager.ts
import * as THREE from 'three';

class GeometryManagerImpl {
  private geometries = new Map<string, THREE.BufferGeometry>();
  private materials = new Map<string, THREE.Material>();

  /**
   * Get or create a geometry.
   * @param key Unique identifier for the geometry
   * @param factory Function that returns the geometry if it doesn't exist
   */
  getGeometry<T extends THREE.BufferGeometry>(key: string, factory: () => T): T {
    if (!this.geometries.has(key)) {
      this.geometries.set(key, factory());
    }
    return this.geometries.get(key) as T;
  }

  /**
   * Get or create a material.
   * @param key Unique identifier for the material
   * @param factory Function that returns the material if it doesn't exist
   */
  getMaterial<T extends THREE.Material>(key: string, factory: () => T): T {
    if (!this.materials.has(key)) {
      this.materials.set(key, factory());
    }
    return this.materials.get(key) as T;
  }

  /**
   * Dispose all resources to free GPU memory.
   * Call this when exiting the game session.
   */
  dispose() {
    this.geometries.forEach((geo) => geo.dispose());
    this.materials.forEach((mat) => mat.dispose());
    
    this.geometries.clear();
    this.materials.clear();
    
    // Corrected for Vite
    if (import.meta.env.DEV) {
      console.log('♻️ GeometryManager: All resources disposed.');
    }
  }
}

export const GeometryManager = new GeometryManagerImpl();