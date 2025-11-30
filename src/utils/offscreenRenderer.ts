/**
 * Offscreen Planet Renderer
 * Renders planet shaders to a small canvas for thumbnail generation
 * Uses Three.js WebGL renderer in offscreen mode
 */

import * as THREE from 'three';
import type { Exoplanet } from '../types';
import { shaderService } from '../services/shaderService';
import {
  createPlanetUniforms,
  getV2PlanetShaderType,
  getV2ShaderFileName,
  getPlanetVertexShader,
  getStarSurfaceShaders,
  getStarCoronaShaders,
  generateSeed,
  getStarActivityLevel,
} from './planetUniforms';
import { THUMBNAIL_SIZE } from '../services/thumbnailService';

/** Singleton renderer instance (reused for efficiency) */
let renderer: THREE.WebGLRenderer | null = null;
let renderTarget: THREE.WebGLRenderTarget | null = null;

/** Queue for sequential rendering to avoid GPU conflicts */
const renderQueue: Array<() => void> = [];
let isRendering = false;

/**
 * Get or create the shared WebGL renderer
 * Using a singleton avoids creating multiple WebGL contexts
 */
function getRenderer(): THREE.WebGLRenderer {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    renderer.setPixelRatio(1); // Keep pixel ratio at 1 for consistent thumbnails
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  return renderer;
}

/**
 * Get or create the shared render target
 */
function getRenderTarget(): THREE.WebGLRenderTarget {
  if (!renderTarget) {
    renderTarget = new THREE.WebGLRenderTarget(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace,
    });
  }
  return renderTarget;
}

/**
 * Process the render queue sequentially
 */
async function processQueue(): Promise<void> {
  if (isRendering || renderQueue.length === 0) return;
  
  isRendering = true;
  
  while (renderQueue.length > 0) {
    const task = renderQueue.shift();
    if (task) {
      await new Promise<void>((resolve) => {
        task();
        // Small delay between renders to avoid overwhelming the GPU
        setTimeout(resolve, 10);
      });
    }
  }
  
  isRendering = false;
}


/**
 * Create a planet mesh with the appropriate V2 shader
 * @param planet - The planet data
 * @param isTidallyLocked - Whether the planet is tidally locked (affects shader time)
 */
function createPlanetMesh(planet: Exoplanet, isTidallyLocked: boolean): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 32, 32);

  // Get V2 shader type for better variety
  const shaderType = getV2PlanetShaderType(planet);
  const fragShaderName = getV2ShaderFileName(shaderType);
  const vertShaderName = getPlanetVertexShader('v2');

  const uniforms = createPlanetUniforms({
    planet,
    detailLevel: 'simple', // Simple for thumbnails
    starTemp: planet.st_teff ?? undefined,
  });

  // For tidally locked planets, use a fixed time to ensure consistent terminator appearance
  // For normal planets, use seed-based time for visual variety
  if (isTidallyLocked) {
    uniforms.uTime.value = 0; // Fixed time for consistent appearance
  } else {
    const seed = generateSeed(planet.pl_name);
    uniforms.uTime.value = seed * 10; // Some variation in "time" for visual variety
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: shaderService.get(vertShaderName),
    fragmentShader: shaderService.get(fragShaderName),
    uniforms,
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Create a scene with proper lighting for thumbnail rendering
 */
function createScene(planet: Exoplanet): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = null; // Transparent background

  // Check if planet is tidally locked
  const isTidallyLocked = planet.is_likely_tidally_locked === true;

  // Add the planet (pass tidally locked status for consistent shader settings)
  const planetMesh = createPlanetMesh(planet, isTidallyLocked);

  const seed = generateSeed(planet.pl_name);

  if (isTidallyLocked) {
    // For tidally locked planets, rotate to show the terminator (day/night boundary)
    // Position so we see ~60% day side and ~40% night side
    // The light comes from (3, 2, 4), so rotate Y to show the boundary
    planetMesh.rotation.y = Math.PI * 0.7; // ~126° - shows terminator clearly
    planetMesh.rotation.x = 0.15; // Slight tilt for visual interest
  } else {
    // Normal planets: slight random rotation for variety
    planetMesh.rotation.y = seed * Math.PI * 2;
    planetMesh.rotation.x = (seed - 0.5) * 0.3; // Slight tilt
  }

  scene.add(planetMesh);

  // Lighting setup (similar to PlanetScene)
  const ambientLight = new THREE.AmbientLight(0xffffff, isTidallyLocked ? 0.3 : 0.5);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
  scene.add(hemisphereLight);

  // For tidally locked planets, use a more dramatic lighting setup
  const directionalLight = new THREE.DirectionalLight(0xffffff, isTidallyLocked ? 1.2 : 1);
  directionalLight.position.set(3, 2, 4);
  scene.add(directionalLight);

  return scene;
}

/**
 * Render a planet to a Blob image
 * @param planet - The planet data to render
 * @returns Promise that resolves with the PNG blob
 */
export async function renderPlanetToBlob(planet: Exoplanet): Promise<Blob> {
  // Ensure shaders are loaded
  if (!shaderService.isLoaded()) {
    await shaderService.loadShaders();
  }
  
  return new Promise((resolve, reject) => {
    // Add to queue for sequential processing
    renderQueue.push(() => {
      try {
        const webglRenderer = getRenderer();
        const target = getRenderTarget();
        
        // Create scene and camera
        const scene = createScene(planet);
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.set(0, 0, 2.5); // Close enough to fill the thumbnail
        camera.lookAt(0, 0, 0);
        
        // Render to target
        webglRenderer.setRenderTarget(target);
        webglRenderer.render(scene, camera);
        webglRenderer.setRenderTarget(null);
        
        // Read pixels from render target
        const pixels = new Uint8Array(THUMBNAIL_SIZE * THUMBNAIL_SIZE * 4);
        webglRenderer.readRenderTargetPixels(
          target,
          0, 0,
          THUMBNAIL_SIZE, THUMBNAIL_SIZE,
          pixels
        );
        
        // Create canvas and draw the pixels (flipped vertically)
        const canvas = document.createElement('canvas');
        canvas.width = THUMBNAIL_SIZE;
        canvas.height = THUMBNAIL_SIZE;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        // Create ImageData from pixels (need to flip Y axis)
        const imageData = ctx.createImageData(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
        for (let y = 0; y < THUMBNAIL_SIZE; y++) {
          for (let x = 0; x < THUMBNAIL_SIZE; x++) {
            const srcIdx = ((THUMBNAIL_SIZE - 1 - y) * THUMBNAIL_SIZE + x) * 4;
            const dstIdx = (y * THUMBNAIL_SIZE + x) * 4;
            imageData.data[dstIdx] = pixels[srcIdx];
            imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
            imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
            imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
          }
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            // Clean up scene objects
            scene.traverse((object) => {
              if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (object.material instanceof THREE.Material) {
                  object.material.dispose();
                }
              }
            });
            
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/png',
          1.0
        );
      } catch (error) {
        reject(error);
      }
    });
    
    // Start processing queue
    processQueue();
  });
}

/**
 * Render a star to a Blob image using v2 star surface shader
 * @param starTemp - Star temperature in Kelvin
 * @param starName - Star name for seed generation
 * @param spectralType - Optional spectral type for activity level
 * @returns Promise that resolves with the PNG blob
 */
export async function renderStarToBlob(
  starTemp: number,
  starName: string,
  spectralType?: string
): Promise<Blob> {
  // Ensure shaders are loaded
  if (!shaderService.isLoaded()) {
    await shaderService.loadShaders();
  }

  return new Promise((resolve, reject) => {
    renderQueue.push(() => {
      try {
        const webglRenderer = getRenderer();
        const target = getRenderTarget();

        const scene = new THREE.Scene();
        scene.background = null;

        // Get v2 star shaders
        const surfaceShaders = getStarSurfaceShaders('v2');
        const coronaShaders = getStarCoronaShaders('v2');

        // Calculate star properties
        const color = getStarColor(starTemp);
        const seed = generateSeed(starName);
        const activityLevel = getStarActivityLevel(spectralType);
        const timeValue = seed * 10; // Use seed for consistent but varied appearance

        // Create star surface with v2 shader
        const geometry = new THREE.SphereGeometry(0.8, 64, 64);
        const surfaceUniforms = {
          uStarColor: { value: color },
          uTime: { value: timeValue },
          uTemperature: { value: starTemp },
          uSeed: { value: seed },
          uActivityLevel: { value: activityLevel },
        };

        const surfaceMaterial = new THREE.ShaderMaterial({
          vertexShader: shaderService.get(surfaceShaders.vert),
          fragmentShader: shaderService.get(surfaceShaders.frag),
          uniforms: surfaceUniforms,
        });

        const starMesh = new THREE.Mesh(geometry, surfaceMaterial);
        scene.add(starMesh);

        // Create corona layer (1.5x star radius) with additive blending
        const coronaGeometry = new THREE.SphereGeometry(1.2, 64, 64);
        const coronaUniforms = {
          uStarColor: { value: color },
          uTime: { value: timeValue },
          uIntensity: { value: 1.0 },
          uSeed: { value: seed },
          uActivityLevel: { value: activityLevel },
        };

        const coronaMaterial = new THREE.ShaderMaterial({
          vertexShader: shaderService.get(coronaShaders.vert),
          fragmentShader: shaderService.get(coronaShaders.frag),
          uniforms: coronaUniforms,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.BackSide, // Render inside of sphere for proper corona effect
        });

        const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
        scene.add(coronaMesh);

        // Camera setup - adjusted for corona visibility
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.set(0, 0, 3.0);
        camera.lookAt(0, 0, 0);

        // Render
        webglRenderer.setRenderTarget(target);
        webglRenderer.render(scene, camera);
        webglRenderer.setRenderTarget(null);

        // Read pixels
        const pixels = new Uint8Array(THUMBNAIL_SIZE * THUMBNAIL_SIZE * 4);
        webglRenderer.readRenderTargetPixels(target, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE, pixels);

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = THUMBNAIL_SIZE;
        canvas.height = THUMBNAIL_SIZE;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Create flipped ImageData
        const imageData = ctx.createImageData(THUMBNAIL_SIZE, THUMBNAIL_SIZE);
        for (let y = 0; y < THUMBNAIL_SIZE; y++) {
          for (let x = 0; x < THUMBNAIL_SIZE; x++) {
            const srcIdx = ((THUMBNAIL_SIZE - 1 - y) * THUMBNAIL_SIZE + x) * 4;
            const dstIdx = (y * THUMBNAIL_SIZE + x) * 4;
            imageData.data[dstIdx] = pixels[srcIdx];
            imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
            imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
            imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
          }
        }
        ctx.putImageData(imageData, 0, 0);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            // Clean up
            geometry.dispose();
            surfaceMaterial.dispose();
            coronaGeometry.dispose();
            coronaMaterial.dispose();

            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/png',
          1.0
        );
      } catch (error) {
        reject(error);
      }
    });

    processQueue();
  });
}

/**
 * Get star color from temperature using blackbody approximation
 * @param temperature - Star temperature in Kelvin
 * @returns THREE.Color representing the star's color
 */
function getStarColor(temperature: number): THREE.Color {
  // Simplified blackbody color calculation
  // Red dwarfs: ~2500-3500K -> orange-red
  // Sun-like: ~5000-6000K -> yellow-white
  // Hot stars: ~10000K+ -> blue-white
  
  let r: number, g: number, b: number;
  
  if (temperature < 3500) {
    // Red dwarf
    r = 1.0;
    g = 0.5 + (temperature - 2500) / 2000;
    b = 0.3;
  } else if (temperature < 5000) {
    // Orange
    r = 1.0;
    g = 0.7 + (temperature - 3500) / 3000;
    b = 0.4 + (temperature - 3500) / 3000;
  } else if (temperature < 6500) {
    // Yellow-white (Sun-like)
    r = 1.0;
    g = 0.95;
    b = 0.8 + (temperature - 5000) / 7500;
  } else if (temperature < 10000) {
    // White
    r = 0.9 + (10000 - temperature) / 35000;
    g = 0.95;
    b = 1.0;
  } else {
    // Blue-white
    r = 0.7;
    g = 0.85;
    b = 1.0;
  }
  
  return new THREE.Color(
    Math.min(1, Math.max(0, r)),
    Math.min(1, Math.max(0, g)),
    Math.min(1, Math.max(0, b))
  );
}

/**
 * Cleanup renderer resources (call when app unmounts)
 */
export function disposeRenderer(): void {
  if (renderTarget) {
    renderTarget.dispose();
    renderTarget = null;
  }
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
}

export default {
  renderPlanetToBlob,
  renderStarToBlob,
  disposeRenderer,
};

