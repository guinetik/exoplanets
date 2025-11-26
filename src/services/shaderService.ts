/**
 * Shader Service
 * Loads GLSL shaders from public/shaders/ at runtime
 *
 * Usage:
 *   await shaderService.loadShaders();
 *   const frag = shaderService.get('earthSurfaceFrag');
 */

import { createLogger } from '@guinetik/logger';

const logger = createLogger({ prefix: 'ShaderService' });

interface ShaderManifestEntry {
  name: string;
  path: string;
}

interface ShaderManifest {
  shaders: ShaderManifestEntry[];
}

class ShaderService {
  private shaders: Map<string, string> = new Map();
  private loaded: boolean = false;

  /**
   * Load all shaders defined in the manifest
   */
  async loadShaders(): Promise<void> {
    if (this.loaded) return;

    try {
      // Fetch manifest
      const manifestResponse = await fetch('./shaders/manifest.json');
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load shader manifest: ${manifestResponse.status}`);
      }
      const manifest: ShaderManifest = await manifestResponse.json();

      // Fetch all shaders in parallel
      const loadPromises = manifest.shaders.map(async (entry) => {
        const response = await fetch(`./shaders/${entry.path}`);
        if (!response.ok) {
          throw new Error(`Failed to load shader ${entry.name}: ${response.status}`);
        }
        const content = await response.text();
        this.shaders.set(entry.name, content);
      });

      await Promise.all(loadPromises);
      this.loaded = true;

      logger.info(`Loaded ${this.shaders.size} shaders`);
    } catch (error) {
      logger.error('Shader loading failed:', error);
      throw error;
    }
  }

  /**
   * Get a shader by name
   */
  get(name: string): string {
    if (!this.loaded) {
      throw new Error('Shaders not loaded. Call loadShaders() first.');
    }

    const shader = this.shaders.get(name);
    if (!shader) {
      throw new Error(`Shader not found: ${name}. Available: ${Array.from(this.shaders.keys()).join(', ')}`);
    }

    return shader;
  }

  /**
   * Check if shaders are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get all loaded shader names
   */
  getAvailableShaders(): string[] {
    return Array.from(this.shaders.keys());
  }
}

export const shaderService = new ShaderService();
