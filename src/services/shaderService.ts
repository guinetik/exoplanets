/**
 * Shader Service
 * Loads GLSL shaders from public/shaders/ at runtime
 * Supports #include directives for shared utility code
 *
 * Usage:
 *   await shaderService.loadShaders();
 *   const frag = shaderService.get('earthSurfaceFrag');
 *
 * Include syntax in shaders:
 *   #include "v2/common/noise.glsl"
 */

import { createLogger } from '@guinetik/logger';

const logger = createLogger({ prefix: 'ShaderService' });

// Regex to match #include "path" or #include <path>
const INCLUDE_REGEX = /#include\s+["<]([^">]+)[">]/g;

// Maximum include depth to prevent infinite recursion
const MAX_INCLUDE_DEPTH = 10;

interface ShaderManifestEntry {
  name: string;
  path: string;
  utility?: boolean; // If true, this is a utility file that can be included
}

interface ShaderManifest {
  shaders: ShaderManifestEntry[];
}

class ShaderService {
  private shaders: Map<string, string> = new Map();
  private rawShaders: Map<string, string> = new Map(); // Unprocessed shader content
  private utilityShaders: Map<string, string> = new Map(); // Path -> content for utilities
  private loaded: boolean = false;
  private loadingPromise: Promise<void> | null = null; // Prevent concurrent loads

  /**
   * Load all shaders defined in the manifest
   * Uses a promise lock to prevent duplicate loading from concurrent calls
   */
  async loadShaders(): Promise<void> {
    // Already loaded
    if (this.loaded) return;
    
    // Already loading - wait for the existing load to complete
    if (this.loadingPromise) {
      return this.loadingPromise;
    }
    
    // Start loading and store the promise
    this.loadingPromise = this.doLoadShaders();
    return this.loadingPromise;
  }

  /**
   * Internal method that performs the actual shader loading
   */
  private async doLoadShaders(): Promise<void> {

    try {
      // Fetch manifest (use absolute path to work from any route, with cache-busting)
      const manifestResponse = await fetch(`/shaders/manifest.json?t=${Date.now()}`);
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load shader manifest: ${manifestResponse.status}`);
      }
      const manifest: ShaderManifest = await manifestResponse.json();

      // Separate utility shaders from regular shaders
      const utilities = manifest.shaders.filter((e) => e.utility);
      const regular = manifest.shaders.filter((e) => !e.utility);

      // Load utility shaders first (they may be included by others)
      await this.loadUtilityShaders(utilities);

      // Load regular shaders
      await this.loadRegularShaders(regular);

      this.loaded = true;

      const utilCount = this.utilityShaders.size;
      const shaderCount = this.shaders.size;
      logger.info(`Loaded ${shaderCount} shaders, ${utilCount} utility files`);
    } catch (error) {
      // Reset loading state so it can be retried
      this.loadingPromise = null;
      logger.error('Shader loading failed:', error);
      throw error;
    }
  }

  /**
   * Load utility shaders that can be included by other shaders
   * @param utilities - Array of utility shader manifest entries
   */
  private async loadUtilityShaders(utilities: ShaderManifestEntry[]): Promise<void> {
    // Add cache-busting to prevent stale shader files
    const cacheBuster = `?t=${Date.now()}`;
    const loadPromises = utilities.map(async (entry) => {
      // Normalize path for consistent lookups (Windows compatibility)
      const normalizedPath = entry.path.replace(/\\/g, '/');
      const response = await fetch(`/shaders/${normalizedPath}${cacheBuster}`);
      if (!response.ok) {
        throw new Error(`Failed to load utility shader ${normalizedPath}: ${response.status}`);
      }
      const content = await response.text();
      // Store by normalized path for #include resolution
      this.utilityShaders.set(normalizedPath, content);
      logger.debug(`Loaded utility: ${normalizedPath}`);
    });

    await Promise.all(loadPromises);
  }

  /**
   * Load regular shaders and resolve their includes
   * @param shaders - Array of shader manifest entries
   */
  private async loadRegularShaders(shaders: ShaderManifestEntry[]): Promise<void> {
    // Add cache-busting to prevent stale shader files
    const cacheBuster = `?t=${Date.now()}`;
    const loadPromises = shaders.map(async (entry) => {
      const response = await fetch(`/shaders/${entry.path}${cacheBuster}`);
      if (!response.ok) {
        throw new Error(`Failed to load shader ${entry.name}: ${response.status}`);
      }
      const content = await response.text();

      // Store raw content
      this.rawShaders.set(entry.name, content);

      // Resolve includes with include guards (track already-included files)
      const includedFiles = new Set<string>();
      const resolved = this.resolveIncludes(content, entry.path, 0, includedFiles);
      this.shaders.set(entry.name, resolved);
    });

    await Promise.all(loadPromises);
  }

  /**
   * Recursively resolve #include directives in shader content
   * Uses include guards to prevent duplicate definitions
   * 
   * @param content - Shader source code
   * @param currentPath - Path of the current shader (for relative includes)
   * @param depth - Current recursion depth
   * @param includedFiles - Set of already-included file paths (include guard)
   * @returns Shader content with includes resolved
   */
  private resolveIncludes(
    content: string, 
    currentPath: string, 
    depth: number,
    includedFiles: Set<string>
  ): string {
    if (depth > MAX_INCLUDE_DEPTH) {
      logger.error(`Max include depth exceeded in ${currentPath}`);
      throw new Error(`Max include depth (${MAX_INCLUDE_DEPTH}) exceeded. Check for circular includes.`);
    }

    // Find and replace all #include directives
    const resolved = content.replace(INCLUDE_REGEX, (match, includePath: string) => {
      // Normalize path separators (Windows compatibility)
      const normalizedPath = includePath.replace(/\\/g, '/');
      
      // Include guard: skip if already included
      if (includedFiles.has(normalizedPath)) {
        return `// === SKIPPED (already included): ${normalizedPath} ===`;
      }

      // Mark as included
      includedFiles.add(normalizedPath);

      // Look up the utility shader by path (use normalized path)
      const utilityContent = this.utilityShaders.get(normalizedPath);

      if (!utilityContent) {
        logger.error(`Include not found: ${includePath} (referenced in ${currentPath})`);
        throw new Error(`Include not found: ${includePath}. Make sure it's in the manifest with utility: true`);
      }

      // Recursively resolve includes in the utility file (passing the same includedFiles set)
      const resolvedUtility = this.resolveIncludes(utilityContent, includePath, depth + 1, includedFiles);

      // Add a comment marker for debugging
      return `// === BEGIN INCLUDE: ${includePath} ===\n${resolvedUtility}\n// === END INCLUDE: ${includePath} ===`;
    });

    return resolved;
  }

  /**
   * Get a shader by name (with includes already resolved)
   * @param name - Shader name as defined in manifest
   * @returns Processed shader source code
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
   * Get raw shader content without include resolution
   * Useful for debugging or when you need the original source
   * @param name - Shader name as defined in manifest
   * @returns Raw shader source code
   */
  getRaw(name: string): string {
    if (!this.loaded) {
      throw new Error('Shaders not loaded. Call loadShaders() first.');
    }

    const shader = this.rawShaders.get(name);
    if (!shader) {
      throw new Error(`Shader not found: ${name}`);
    }

    return shader;
  }

  /**
   * Get a utility shader by path
   * @param path - Utility shader path (e.g., "v2/common/noise.glsl")
   * @returns Utility shader source code
   */
  getUtility(path: string): string {
    if (!this.loaded) {
      throw new Error('Shaders not loaded. Call loadShaders() first.');
    }

    const shader = this.utilityShaders.get(path);
    if (!shader) {
      throw new Error(`Utility shader not found: ${path}`);
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

  /**
   * Get all loaded utility shader paths
   */
  getAvailableUtilities(): string[] {
    return Array.from(this.utilityShaders.keys());
  }

}

export const shaderService = new ShaderService();
