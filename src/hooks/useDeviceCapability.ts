/**
 * Device Capability Detection Hook
 *
 * Detects device performance tier and recommends quality settings.
 * Uses heuristics like mobile detection, GPU info, and core count.
 */

import { useMemo } from 'react';

export type QualityLevel = 'low' | 'medium' | 'high';

interface DeviceCapability {
  /** Recommended quality level based on device */
  quality: QualityLevel;
  /** Is this a mobile device */
  isMobile: boolean;
  /** Is this a low-end device */
  isLowEnd: boolean;
  /** Device pixel ratio */
  pixelRatio: number;
  /** Number of logical CPU cores */
  cores: number;
  /** GPU vendor if available */
  gpuVendor: string | null;
  /** GPU renderer if available */
  gpuRenderer: string | null;
}

/**
 * Detect if device is mobile
 */
function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

/**
 * Get GPU info from WebGL context
 */
function getGPUInfo(): { vendor: string | null; renderer: string | null } {
  if (typeof document === 'undefined') {
    return { vendor: null, renderer: null };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      return { vendor: null, renderer: null };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return { vendor: null, renderer: null };
    }

    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    };
  } catch {
    return { vendor: null, renderer: null };
  }
}

/**
 * Check if GPU is known to be low-end
 */
function isLowEndGPU(renderer: string | null): boolean {
  if (!renderer) return false;

  const lowEndPatterns = [
    /intel.*hd graphics/i,
    /intel.*uhd graphics/i,
    /intel.*iris/i,
    /mali-4/i,
    /mali-t6/i,
    /adreno.*3/i,
    /adreno.*4/i,
    /powervr/i,
    /apple gpu/i,  // Older iOS devices
    /swiftshader/i, // Software renderer
    /llvmpipe/i,    // Software renderer
  ];

  return lowEndPatterns.some(pattern => pattern.test(renderer));
}

/**
 * Check if GPU is known to be high-end
 */
function isHighEndGPU(renderer: string | null): boolean {
  if (!renderer) return false;

  const highEndPatterns = [
    /nvidia.*rtx/i,
    /nvidia.*gtx.*10[6-9]/i,
    /nvidia.*gtx.*16/i,
    /nvidia.*gtx.*20/i,
    /nvidia.*gtx.*30/i,
    /nvidia.*gtx.*40/i,
    /radeon.*rx.*5[6-9]/i,
    /radeon.*rx.*6/i,
    /radeon.*rx.*7/i,
    /apple.*m[1-3]/i,
    /adreno.*6[3-9]/i,
    /adreno.*7/i,
  ];

  return highEndPatterns.some(pattern => pattern.test(renderer));
}

/**
 * Determine quality level based on device characteristics
 */
function determineQuality(
  isMobile: boolean,
  cores: number,
  pixelRatio: number,
  gpuRenderer: string | null
): QualityLevel {
  // Check for explicitly low-end GPU
  if (isLowEndGPU(gpuRenderer)) {
    return 'low';
  }

  // Check for explicitly high-end GPU
  if (isHighEndGPU(gpuRenderer) && !isMobile) {
    return 'high';
  }

  // Mobile devices
  if (isMobile) {
    // High-end mobile (many cores, high DPI)
    if (cores >= 8 && pixelRatio >= 3) {
      return 'medium';
    }
    return 'low';
  }

  // Desktop heuristics
  if (cores >= 8) {
    return 'high';
  } else if (cores >= 4) {
    return 'medium';
  }

  return 'low';
}

/**
 * Hook to detect device capabilities and recommend quality settings
 *
 * @returns DeviceCapability object with quality recommendation
 *
 * @example
 * const { quality, isMobile } = useDeviceCapability();
 * <NebulaBackground quality={quality} />
 */
export function useDeviceCapability(): DeviceCapability {
  return useMemo(() => {
    const isMobile = detectMobile();
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const { vendor: gpuVendor, renderer: gpuRenderer } = getGPUInfo();

    const quality = determineQuality(isMobile, cores, pixelRatio, gpuRenderer);
    const isLowEnd = quality === 'low';

    return {
      quality,
      isMobile,
      isLowEnd,
      pixelRatio,
      cores,
      gpuVendor,
      gpuRenderer,
    };
  }, []);
}

export default useDeviceCapability;
