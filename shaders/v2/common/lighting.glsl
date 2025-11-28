/**
 * Shared Lighting Functions for V2 Shaders
 * 
 * Provides:
 * - Fresnel / rim lighting
 * - Limb darkening (realistic edge falloff)
 * - Specular highlights
 * - Atmospheric scattering approximation
 * - Star lighting calculations
 */

// =============================================================================
// LIGHTING CONSTANTS
// =============================================================================

// --- Fresnel ---
const float FRESNEL_BIAS = 0.0;                             // Minimum reflectivity
const float FRESNEL_SCALE = 1.0;                            // Reflectivity range
const float FRESNEL_POWER = 5.0;                            // Default Fresnel exponent (Schlick approximation)

// --- Limb Darkening ---
// Coefficients for realistic stellar/planetary limb darkening
// Based on Claret (2000) solar limb darkening model
const float LIMB_COEFF_LINEAR = 0.6;                        // Linear limb darkening coefficient
const float LIMB_COEFF_QUAD = 0.0;                          // Quadratic coefficient (set to 0 for linear model)
// Note: LIMB_MIN_BRIGHTNESS is defined per-shader to allow custom values

// --- Specular ---
const float SPECULAR_POWER_DEFAULT = 32.0;                  // Default shininess
const float SPECULAR_INTENSITY_DEFAULT = 0.5;               // Default specular intensity

// --- Atmospheric Scattering ---
// Rayleigh scattering coefficients (wavelength-dependent)
const vec3 RAYLEIGH_COEFFS = vec3(0.0025, 0.0060, 0.0150);  // RGB scattering strengths
const float ATMOSPHERE_DENSITY_SCALE = 8.0;                 // Scale height factor
const float ATMOSPHERE_FALLOFF = 2.5;                       // Edge falloff power

// --- View Direction ---
// Default camera view direction (looking at object from +Z)
const vec3 DEFAULT_VIEW_DIR = vec3(0.0, 0.0, 1.0);

// =============================================================================
// FRESNEL / RIM LIGHTING
// =============================================================================

/**
 * Schlick's Fresnel approximation
 * Models increased reflectivity at grazing angles
 * 
 * @param viewDir - Normalized view direction
 * @param normal - Surface normal
 * @return Fresnel factor (0 = facing, 1 = grazing)
 */
float fresnel(vec3 viewDir, vec3 normal) {
    float dotVN = max(dot(viewDir, normal), 0.0);
    return FRESNEL_BIAS + FRESNEL_SCALE * pow(1.0 - dotVN, FRESNEL_POWER);
}

/**
 * Fresnel with customizable power
 * 
 * @param viewDir - Normalized view direction
 * @param normal - Surface normal
 * @param power - Exponent (higher = sharper edge)
 * @return Fresnel factor
 */
float fresnelCustom(vec3 viewDir, vec3 normal, float power) {
    float dotVN = max(dot(viewDir, normal), 0.0);
    return pow(1.0 - dotVN, power);
}

/**
 * Rim lighting effect
 * Highlights edges of objects for dramatic effect
 * 
 * @param normal - Surface normal
 * @param rimColor - Color of the rim light
 * @param power - Rim tightness (higher = thinner rim)
 * @param intensity - Rim brightness
 * @return RGB rim light contribution
 */
vec3 rimLight(vec3 normal, vec3 rimColor, float power, float intensity) {
    float rim = fresnelCustom(DEFAULT_VIEW_DIR, normal, power);
    return rimColor * rim * intensity;
}

// =============================================================================
// LIMB DARKENING
// =============================================================================

/**
 * Linear limb darkening model
 * Models how stars and planets appear darker at edges
 * 
 * @param normal - Surface normal
 * @param viewDir - View direction
 * @return Darkening factor (0-1, 1 = center, lower = edge)
 */
float limbDarkeningLinear(vec3 normal, vec3 viewDir) {
    float mu = max(dot(normal, viewDir), 0.0);  // Cosine of angle from center
    return 1.0 - LIMB_COEFF_LINEAR * (1.0 - mu);
}

/**
 * Quadratic limb darkening model (more accurate)
 * 
 * @param normal - Surface normal
 * @param viewDir - View direction
 * @param u - Linear coefficient
 * @param v - Quadratic coefficient
 * @return Darkening factor
 */
float limbDarkeningQuad(vec3 normal, vec3 viewDir, float u, float v) {
    float mu = max(dot(normal, viewDir), 0.0);
    float muSqrt = sqrt(mu);
    return 1.0 - u * (1.0 - mu) - v * (1.0 - muSqrt);
}

/**
 * Stylized limb darkening with smoothstep
 * Provides artistic control over the falloff curve
 * 
 * @param normal - Surface normal
 * @param edgeLow - Where darkening starts (0 = center, 1 = edge)
 * @param edgeHigh - Where full darkness is reached
 * @param minBrightness - Minimum brightness at limb
 * @return Brightness factor
 */
float limbDarkeningStylized(vec3 normal, float edgeLow, float edgeHigh, float minBrightness) {
    float facing = dot(normal, DEFAULT_VIEW_DIR);
    float bright = smoothstep(edgeLow, edgeHigh, facing);
    return minBrightness + bright * (1.0 - minBrightness);
}

// =============================================================================
// SPECULAR HIGHLIGHTS
// =============================================================================

/**
 * Blinn-Phong specular highlight
 * 
 * @param normal - Surface normal
 * @param viewDir - View direction
 * @param lightDir - Light direction
 * @param shininess - Specular power (higher = tighter highlight)
 * @return Specular intensity
 */
float specularBlinn(vec3 normal, vec3 viewDir, vec3 lightDir, float shininess) {
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = max(dot(normal, halfDir), 0.0);
    return pow(spec, shininess);
}

/**
 * Phong specular highlight
 * 
 * @param normal - Surface normal
 * @param viewDir - View direction
 * @param lightDir - Light direction
 * @param shininess - Specular power
 * @return Specular intensity
 */
float specularPhong(vec3 normal, vec3 viewDir, vec3 lightDir, float shininess) {
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = max(dot(viewDir, reflectDir), 0.0);
    return pow(spec, shininess);
}

// =============================================================================
// ATMOSPHERIC EFFECTS
// =============================================================================

/**
 * Simple atmospheric haze based on view angle
 * Creates glowing edge effect for planets with atmospheres
 * 
 * @param normal - Surface normal
 * @param atmosphereStrength - 0 = no atmosphere, 1 = thick
 * @param hazeColor - Color of atmospheric haze
 * @return RGB haze contribution
 */
vec3 atmosphericHaze(vec3 normal, float atmosphereStrength, vec3 hazeColor) {
    float edgeFactor = 1.0 - abs(dot(normal, DEFAULT_VIEW_DIR));
    float haze = pow(edgeFactor, ATMOSPHERE_FALLOFF) * atmosphereStrength;
    return hazeColor * haze;
}

/**
 * Rayleigh-like scattering approximation
 * Blue light scatters more than red
 * 
 * @param normal - Surface normal
 * @param lightDir - Direction to light source
 * @param atmosphereStrength - Atmosphere thickness (0-1)
 * @return RGB scattering color
 */
vec3 rayleighScatter(vec3 normal, vec3 lightDir, float atmosphereStrength) {
    float edgeFactor = 1.0 - abs(dot(normal, DEFAULT_VIEW_DIR));
    float sunAngle = max(dot(normal, lightDir), 0.0);
    
    // Blue scatters more at edges, especially when lit
    vec3 scatter = RAYLEIGH_COEFFS * pow(edgeFactor, 2.0) * sunAngle;
    return scatter * atmosphereStrength * ATMOSPHERE_DENSITY_SCALE;
}

/**
 * Sunset/sunrise coloring at terminator
 * 
 * @param normal - Surface normal
 * @param lightDir - Direction to light source
 * @param atmosphereStrength - Atmosphere thickness
 * @return RGB sunset contribution
 */
vec3 terminatorGlow(vec3 normal, vec3 lightDir, float atmosphereStrength) {
    float sunAngle = dot(normal, lightDir);
    // Sunset occurs in a narrow band around terminator
    float sunsetZone = smoothstep(-0.15, 0.0, sunAngle) * smoothstep(0.15, 0.0, sunAngle);
    float edgeFactor = 1.0 - abs(dot(normal, DEFAULT_VIEW_DIR));
    
    // Orange/red color at terminator
    vec3 sunsetColor = vec3(1.0, 0.4, 0.1);
    return sunsetColor * sunsetZone * edgeFactor * atmosphereStrength * 2.0;
}

// =============================================================================
// DIFFUSE LIGHTING
// =============================================================================

/**
 * Lambertian diffuse lighting
 * 
 * @param normal - Surface normal
 * @param lightDir - Direction to light
 * @return Diffuse factor (0-1)
 */
float diffuseLambert(vec3 normal, vec3 lightDir) {
    return max(dot(normal, lightDir), 0.0);
}

/**
 * Half-Lambert diffuse (softer shadows)
 * Wraps lighting around object more
 * 
 * @param normal - Surface normal
 * @param lightDir - Direction to light
 * @return Diffuse factor (0.25-1)
 */
float diffuseHalfLambert(vec3 normal, vec3 lightDir) {
    float d = dot(normal, lightDir);
    return d * 0.5 + 0.5;  // Remap -1,1 to 0,1
}

/**
 * Wrapped diffuse lighting
 * Allows light to wrap around object by specified amount
 * 
 * @param normal - Surface normal
 * @param lightDir - Direction to light
 * @param wrap - Wrap amount (0 = standard, 1 = full wrap)
 * @return Diffuse factor
 */
float diffuseWrap(vec3 normal, vec3 lightDir, float wrap) {
    float d = dot(normal, lightDir);
    return max((d + wrap) / (1.0 + wrap), 0.0);
}

// =============================================================================
// COMPOSITE LIGHTING
// =============================================================================

/**
 * Complete surface lighting calculation
 * Combines diffuse, specular, rim, and limb darkening
 * 
 * @param normal - Surface normal
 * @param lightDir - Direction to primary light
 * @param baseColor - Surface albedo
 * @param lightColor - Light color
 * @param shininess - Specular power
 * @param ambientStrength - Ambient light level
 * @return Lit surface color
 */
vec3 surfaceLighting(
    vec3 normal,
    vec3 lightDir,
    vec3 baseColor,
    vec3 lightColor,
    float shininess,
    float ambientStrength
) {
    // Diffuse
    float diff = diffuseLambert(normal, lightDir);
    vec3 diffuse = baseColor * lightColor * diff;
    
    // Specular
    float spec = specularBlinn(normal, DEFAULT_VIEW_DIR, lightDir, shininess);
    vec3 specular = lightColor * spec * SPECULAR_INTENSITY_DEFAULT;
    
    // Ambient
    vec3 ambient = baseColor * ambientStrength;
    
    // Limb darkening
    float limb = limbDarkeningLinear(normal, DEFAULT_VIEW_DIR);
    
    return (ambient + diffuse + specular) * limb;
}

/**
 * Planet surface lighting with atmosphere
 * 
 * @param normal - Surface normal
 * @param lightDir - Direction to star
 * @param baseColor - Surface color
 * @param lightColor - Star color
 * @param atmosphereStrength - Atmosphere thickness (0-1)
 * @param atmosphereColor - Atmosphere tint color
 * @return Final lit color with atmospheric effects
 */
vec3 planetLighting(
    vec3 normal,
    vec3 lightDir,
    vec3 baseColor,
    vec3 lightColor,
    float atmosphereStrength,
    vec3 atmosphereColor
) {
    // Base surface lighting
    vec3 lit = surfaceLighting(normal, lightDir, baseColor, lightColor, SPECULAR_POWER_DEFAULT, 0.05);
    
    // Add atmospheric effects
    vec3 haze = atmosphericHaze(normal, atmosphereStrength, atmosphereColor);
    vec3 scatter = rayleighScatter(normal, lightDir, atmosphereStrength);
    vec3 sunset = terminatorGlow(normal, lightDir, atmosphereStrength);
    
    return lit + haze + scatter + sunset;
}

