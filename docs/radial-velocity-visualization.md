# Radial Velocity Visualization - Technical Documentation

## Overview

The Radial Velocity (RV) detection method visualization is the flagship educational feature of the Exoplanets Explorer. It provides a comprehensive, synchronized, multi-view explanation of how astronomers detect exoplanets by measuring the subtle wobble in a star's motion caused by orbiting planets.

**Inspired by**: The 51 Pegasi b discovery experiment (first exoplanet around a Sun-like star, discovered in 1995)

---

## Table of Contents

1. [The Physics: How Radial Velocity Works](#the-physics-how-radial-velocity-works)
2. [Visualization Components](#visualization-components)
3. [Synchronization & Animation](#synchronization--animation)
4. [Technical Implementation](#technical-implementation)
5. [Design Journey & Decisions](#design-journey--decisions)
6. [Data Requirements](#data-requirements)

---

## The Physics: How Radial Velocity Works

### The Wobble Effect

When a planet orbits a star, both objects actually orbit around their common **center of mass** (barycenter). While the planet makes a large orbit, the star makes a much smaller "wobble" in response.

**Key Principle**: Conservation of momentum
- If a massive planet is far from the star → larger stellar wobble
- If a light planet is close to the star → smaller stellar wobble

### The Doppler Shift

As the star wobbles, it moves slightly toward and away from Earth:
- **Moving toward us**: Light is compressed → **Blueshift** (shorter wavelengths)
- **Moving away from us**: Light is stretched → **Redshift** (longer wavelengths)

By measuring these tiny shifts in the star's spectral lines, astronomers can:
1. Detect the presence of a planet
2. Calculate the planet's orbital period
3. Estimate the planet's minimum mass
4. Determine orbital characteristics

### The Mathematics

**Radial Velocity Formula** (simplified for circular orbits):
```
RV(t) = RV_baseline + K × sin(2πt/P + φ)
```

Where:
- `RV_baseline` = Stellar radial velocity baseline (km/s)
- `K` = Semi-amplitude (m/s) - how much the star wobbles
- `P` = Orbital period (days)
- `t` = Time
- `φ` = Phase offset (depends on observation start time)

**Semi-amplitude (K) depends on**:
```
K ∝ (M_planet × sin(i)) / (M_star^(2/3) × P^(1/3))
```

Where:
- `M_planet` = Planet mass
- `M_star` = Star mass
- `i` = Orbital inclination (we only see radial component)
- `P` = Orbital period

**Detection Limits**:
- Modern spectrographs: ~1 m/s precision
- Jupiter causes Sun to wobble: ~12 m/s (easily detectable)
- Earth causes Sun to wobble: ~0.09 m/s (undetectable with current technology)

---

## Visualization Components

The RV section consists of **5 synchronized visualizations** arranged in a dashboard layout:

### 1. Radial Velocity Curve (Top, Full Width)

**Purpose**: Shows the measured stellar velocity over time

**Features**:
- Smooth sinusoidal curve representing the star's radial velocity
- Red-tinted shaded area above baseline = **Redshift** (star moving away)
- Blue-tinted shaded area below baseline = **Blueshift** (star moving toward us)
- Dashed horizontal line = **Baseline** velocity
- Animated red marker showing current position in the cycle
- Legend explaining redshift/blueshift/baseline

**Physics Represented**:
- X-axis: Time (days)
- Y-axis: Radial velocity (m/s)
- One complete sine wave = one orbital period

### 2. Real-time Data Display (Dashboard Cards)

**Purpose**: Live numerical readout of current measurements

**Three Cards**:
1. **Current RV** (cyan, highlighted) - Updates in real-time as animation runs
2. **Amplitude (K)** - Maximum wobble velocity
3. **Baseline** - Average stellar radial velocity

**Design**: Large monospace font, clear units, dashboard-style cards with borders

### 3. Orbital Motion View (Left Card)

**Purpose**: Top-down view of the star-planet system

**Features**:
- Yellow star (wobbles in small circle)
- Blue planet (orbits in large circle)
- Dashed orbital paths
- Color-coded light cone from star (blue = blueshift, red = redshift)

**Key Insight**: Shows that both objects orbit their common center of mass

**Light Cone Logic**:
- Observer looking from top of screen (down +Y axis in SVG coords)
- When planet is at BOTTOM (6 o'clock): star pulled DOWN = away from observer = RED cone
- When planet is at TOP (12 o'clock): star pulled UP = toward observer = BLUE cone
- Cone color intensity varies with velocity magnitude

**Coordinate System**:
```javascript
// Planet position (counter-clockwise orbit)
planetX = centerX + Math.cos(phase) * radius
planetY = centerY + Math.sin(phase) * radius

// Star position (wobbles in same direction - observer's frame)
starX = centerX + Math.cos(phase) * wobbleRadius
starY = centerY + Math.sin(phase) * wobbleRadius

// Note: Both use same sign (not opposite) because we're showing
// the observer's reference frame, not the center-of-mass frame
```

**Phase Mapping**:
- phase = 0 (3 o'clock): RV = 0 (crossing baseline, moving toward redshift)
- phase = π/2 (6 o'clock): RV = K (maximum redshift)
- phase = π (9 o'clock): RV = 0 (crossing baseline, moving toward blueshift)
- phase = 3π/2 (12 o'clock): RV = -K (maximum blueshift)

### 4. Side View (Below Orbital View)

**Purpose**: 1D representation of orbital motion from edge-on perspective

**Features**:
- Horizontal line representing line of sight
- Yellow star and blue planet move left-right
- Shows which side of orbit the planet is on

**Coordinate Mapping**:
```javascript
// Uses cos(phase) to match orbital X-position
starX = center + Math.cos(phase) * wobble
planetX = center + Math.cos(phase) * orbitRadius
```

**Key Design Decision**:
- Uses `cos(phase)` NOT `sin(phase)`
- This makes planet appear at CENTER when at 6 o'clock (bottom) or 12 o'clock (top)
- Planet appears at EXTREMES when at 3 o'clock (right) or 9 o'clock (left)
- **User feedback**: "it's counter-intuitive for the user that the planet is not at the center on side view when its 6 o'clock on orbital view"
- **Solution**: Side view represents edge-on perspective, so when planet is at top/bottom of orbit, it appears centered from the side

### 5. Spectral Doppler Shift (Right Card)

**Purpose**: Shows how spectral absorption lines shift due to Doppler effect

**Features**:
- Rainbow gradient spectrum (blue → cyan → green → yellow → orange → red)
- Black dashed lines = Rest wavelength positions (stationary reference)
- Black solid lines = Observed shifted lines (move left/right)
- 10 realistic spectral lines: Ca II H&K, H-δ, H-γ, H-β, Mg, Na D doublet, H-α, Ca II
- Text showing current shift direction and magnitude
- Comprehensive educational summary below

**Shift Calculation**:
```javascript
// Calculate current radial velocity
const K = planet.pl_rvamp;
const currentVelocity = K * Math.sin(currentPhase);

// Shift proportional to velocity
const maxShift = 20; // pixels
const shift = (currentVelocity / K) * maxShift;

// Apply shift to each spectral line
lineX = restX + shift;
```

**Educational Summary** (displayed below spectrum):
- **REDSHIFT**: Planet at BOTTOM → Both at RIGHT in side view → Marker at PEAK → Lines shift RIGHT
- **BLUESHIFT**: Planet at TOP → Both at LEFT in side view → Marker at VALLEY → Lines shift LEFT
- **NO SHIFT**: Planet at LEFT/RIGHT → Both at CENTER in side view → Marker crosses BASELINE → Lines align with reference

---

## Synchronization & Animation

### Single Source of Truth: `currentPhase`

All visualizations are perfectly synchronized by sharing a single state variable:

```javascript
const [currentPhase, setCurrentPhase] = useState(0);

// Animation loop
useEffect(() => {
  const animate = () => {
    setCurrentPhase((prev) => (prev + speed) % (Math.PI * 2));
    animationRef.current = requestAnimationFrame(animate);
  };
  // ...
}, [hasRvData, planet.pl_orbper]);
```

**Key**: All calculations use `Math.sin(currentPhase)` or `Math.cos(currentPhase)` directly, never index into data arrays (which caused discrete jumps in early iterations).

### Animation Speed Scaling

Different orbital periods should animate at different speeds for better UX:

```javascript
const referencePeriod = 15; // 15-day orbit = reference speed
const baseSpeed = 0.01; // radians per frame at 60fps
const speedMultiplier = referencePeriod / planet.pl_orbper;
const speed = baseSpeed * Math.min(Math.max(speedMultiplier, 0.2), 8);
```

**Result**:
- Short-period planets (e.g., 3 days): Animate faster
- Long-period planets (e.g., 365 days): Animate slower
- Clamped between 0.2x and 8x for watchability

### Phase-to-Position Mappings

| Visualization | Position Formula | Why? |
|--------------|------------------|------|
| RV Curve | `K * sin(phase)` | Velocity is sinusoidal |
| Orbital (X) | `cos(phase)` | Standard polar coords |
| Orbital (Y) | `sin(phase)` | Standard polar coords |
| Side View | `cos(phase)` | Edge-on X-projection |
| Spectral Shift | `K * sin(phase)` | Matches RV curve |

### Avoiding Common Pitfalls

**Problem 1**: Choppy marker animation
- **Cause**: Using `Math.floor(index)` to index into data array
- **Solution**: Calculate position directly from `currentPhase`

**Problem 2**: Light cone color inverted
- **Cause**: Swapped red/blue mapping
- **Solution**: When `radialComponent > 0` (moving toward observer) → blueshift

**Problem 3**: Side view out of sync
- **Cause**: Using different phase calculations for different views
- **Solution**: All views use exact same `currentPhase` value

**Problem 4**: Marker not completing full cycle
- **Cause**: Graph showed 2.5 cycles but marker only traversed 1
- **Solution**: Changed `numCycles` to 1 for 1:1 correspondence

---

## Technical Implementation

### Tech Stack

- **D3.js v7**: All visualizations
- **React Hooks**: State management and lifecycle
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling with custom @apply patterns

### File Structure

```
src/components/Planet/
├── RadialVelocitySection.tsx    # Main component (1100+ lines)
└── index.ts                      # Export

src/styles/
└── index.css                     # RV-specific styles (lines 2061-2200)

data/
├── fetch_exoplanets.py          # NASA API data fetcher
└── process_exoplanets.py        # Data processing (added RV columns)

public/data/
└── exoplanets.csv               # Runtime data (includes pl_rvamp, st_radv, st_vsin)
```

### Data Pipeline

**Added Columns** (in `process_exoplanets.py`):
```python
ESSENTIAL_COLUMNS = [
    # ... existing columns ...

    # Radial Velocity properties
    "pl_rvamp",      # RV semi-amplitude (m/s)
    "st_radv",       # Stellar radial velocity (km/s)
    "st_vsin",       # Stellar rotation velocity (km/s)
]
```

**TypeScript Interface** (in `src/types/index.ts`):
```typescript
export interface Exoplanet {
  // ... existing properties ...

  // Radial Velocity Properties
  pl_rvamp: number | null;     // RV semi-amplitude (m/s)
  st_radv: number | null;      // Stellar radial velocity (km/s)
  st_vsin: number | null;      // Stellar rotation velocity (km/s)
}
```

### Component Architecture

**Main Sections**:
1. **Helper Functions** (lines 34-70)
   - `generateRvCurve()`: Creates synthetic RV data
   - `formatVelocity()`: Formats velocity with units

2. **State & Refs** (lines 75-96)
   - Phase state for animation
   - SVG refs for D3 manipulation
   - Animation frame ref

3. **Animation Loop** (lines 105-125)
   - `requestAnimationFrame` for smooth 60fps
   - Speed scaling by orbital period

4. **D3 Visualizations** (lines 130-750)
   - Each visualization in its own `useEffect`
   - All depend on `currentPhase` for sync
   - Clean up and redraw on phase change

5. **Educational Content** (lines 900-1010)
   - Accordion sections for Doppler effect, stellar wobble, 51 Peg discovery
   - Technical details display
   - No-data educational fallback

6. **Main Render** (lines 1017-1104)
   - Layout: RV curve → Data display → 2-column grid → Comparison chart

### CSS Architecture

**Dashboard Data Display**:
```css
.rv-data-display {
  @apply grid grid-cols-3 gap-3 mb-4;
}

.rv-data-item {
  @apply bg-black/30 rounded-lg p-4 border border-white/10 text-center;
}

.rv-data-value {
  @apply text-2xl font-mono font-bold text-white/90;
}

.rv-data-value.rv-data-current {
  @apply text-cyan-400;  /* Highlight current RV */
}
```

**Visualization Cards**:
```css
.rv-orbital-views-card,
.rv-spectrum-card {
  @apply bg-black/20 rounded-lg p-5 border border-white/10;
}
```

**Responsive Grid**:
```css
.rv-visualizations-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-6;
}
```

### Performance Optimizations

1. **Single Animation Loop**: All visualizations update from one `requestAnimationFrame`
2. **Selective Re-renders**: useEffect dependencies carefully chosen
3. **Direct Phase Calculation**: No array lookups in hot path
4. **Minimal DOM Updates**: D3 `.select()` updates only necessary attributes
5. **Smooth Transitions**: CSS transitions for minimal jank

---

## Design Journey & Decisions

### Iteration 1: Initial Implementation
- ✅ Basic RV curve with D3
- ✅ Orbital diagram
- ❌ Missing spectral visualization
- ❌ No synchronization between views

### Iteration 2: Adding Spectral Lines
- ✅ Added spectral Doppler shift visualization
- ✅ Rainbow gradient spectrum
- ✅ Realistic spectral line positions (H-α, Ca K, etc.)
- ❌ Labels overlapping
- ❌ Not synchronized with other views

### Iteration 3: Synchronization Hell
**Problems**:
- Marker jumping discretely (using `Math.floor(index)`)
- Light cone color inverted (red/blue swapped)
- Side view out of phase (different calculations)
- Spectral shift using data array instead of phase

**Solutions**:
- All calculations use `Math.sin(currentPhase)` directly
- Fixed radial component calculation for light cone
- Unified phase mapping across all views
- Removed all array indexing in favor of direct computation

### Iteration 4: Layout & UX
**User Feedback**: "radial velocity since its horizontal should be at the top"

**Changes**:
- Moved RV curve to top (full width)
- Created dashboard-style data display
- Two-column grid for orbital motion + spectral shift
- Added borders and better card styling

### Iteration 5: Side View Confusion
**User Feedback**: "it's counter-intuitive that the planet is not at the center on side view when its 6 o'clock"

**Root Cause**: Using `sin(phase)` made planet at extreme position when at 6 o'clock

**Solution**: Changed to `cos(phase)` so planet appears at center when at top/bottom of orbit

**Explanation**: Side view represents edge-on perspective (perpendicular to main observer)

### Iteration 6: Star Wobble Direction
**User Feedback**: "the blue planet should be on top of the sun in side view during redshift"

**Root Cause**: Star wobbling opposite to planet (center-of-mass frame)

**Solution**: Changed star to wobble in same direction as planet (observer's reference frame)

**Code Change**:
```javascript
// BEFORE (CM frame)
starX = center - Math.sin(phase) * wobble;

// AFTER (observer frame)
starX = center + Math.sin(phase) * wobble;
```

### Iteration 7: Multiple Cycles Experiment
**Attempt**: Show 3 complete RV cycles to look like 51 Peg data

**Result**: User didn't like it - preferred clean 1:1 correspondence

**Final Decision**: Keep 1 cycle for clarity

---

## Data Requirements

### Required Planet Properties
```typescript
{
  pl_rvamp: number,      // RV semi-amplitude (m/s) - REQUIRED
  pl_orbper: number,     // Orbital period (days) - REQUIRED
  st_radv: number,       // Stellar radial velocity (km/s) - Optional (baseline)
  st_vsin: number,       // Stellar rotation (km/s) - Optional (technical details)
  pl_orbeccen: number,   // Eccentricity - Optional (technical details)
}
```

### Graceful Degradation

**If RV data missing**:
- Shows educational content explaining RV method
- Explains why this planet lacks RV data (e.g., detected by transit method)
- Provides Solar System examples (Jupiter = 12 m/s, Earth = 0.09 m/s)
- Accordion sections still available

**Example No-Data Message**:
```
This planet was discovered using [method], which doesn't provide
radial velocity measurements. However, we can still learn about
how the RV method works!
```

---

## Key Takeaways

### What Works Well
1. ✅ **Perfect synchronization** - All views share single `currentPhase`
2. ✅ **Intuitive layout** - Horizontal RV curve at top, logical flow
3. ✅ **Educational clarity** - Multiple views show same phenomenon from different angles
4. ✅ **Real-time feedback** - Dashboard display shows live calculations
5. ✅ **Visual polish** - Color-coded regions, smooth animations, professional styling

### Lessons Learned
1. 🎓 Direct phase calculation beats array indexing for smooth animation
2. 🎓 User mental models matter more than physical accuracy (observer frame vs CM frame)
3. 🎓 Sometimes simpler is better (1 cycle vs 3 cycles)
4. 🎓 Synchronization must be explicit, not assumed
5. 🎓 Side views need clear perspective definition

### Future Enhancements
- [ ] Support for eccentric orbits (not just circular)
- [ ] Multi-planet systems showing combined RV signal
- [ ] Interactive speed control slider
- [ ] Export animation as GIF
- [ ] Show actual observational data points (not just smooth curve)

---

## References

### Scientific
- Mayor & Queloz (1995) - 51 Pegasi b discovery paper
- NASA Exoplanet Archive - Data source
- Doppler Spectroscopy - Detection method

### Technical
- D3.js Documentation - https://d3js.org
- React Three Fiber (for 3D planet rendering elsewhere)
- Tailwind CSS - https://tailwindcss.com

### Educational Resources
- Exoplanet Exploration (NASA) - https://exoplanets.nasa.gov
- Alysa Obertas (@AstroAlysa) - RV visualization inspiration

---

**Document Version**: 1.0
**Last Updated**: 2025-01-28
**Author**: Claude (Anthropic) + User Collaboration
**Status**: Production Ready ✨

---

*This visualization represents weeks of iterative refinement, countless synchronization bugs fixed, and a deep dive into both the physics of exoplanet detection and the art of educational data visualization. The result is a flagship feature that helps users truly understand one of astronomy's most important planet-hunting techniques.*
