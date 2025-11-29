# Radial Velocity Visualization

This document outlines the functionality and implementation of the `RadialVelocitySection` component, which provides an educational and interactive visualization of the radial velocity method for detecting exoplanets.

## Component Overview

The `RadialVelocitySection` component is designed to educate users about one of the most successful methods for finding exoplanets. It achieves this by presenting a series of synchronized, interactive D3.js visualizations that demonstrate the core concepts of the radial velocity technique.

### Key Visualizations

1.  **RV Curve Chart**: A primary chart showing the sinusoidal radial velocity curve of the host star. This visualization includes markers for redshift and blueshift, a baseline for the star's systemic velocity, and an animated marker that follows the curve in real-time.

2.  **Orbital Diagram**: A top-down view of the star and planet system, illustrating the star's "wobble" as the planet orbits. This diagram includes a light cone to visualize the Doppler shift as the star moves towards or away from the observer.

3.  **1D Side View**: A simplified, edge-on view of the system that clearly shows the back-and-forth motion of the star along the observer's line of sight.

4.  **Spectral Lines**: A representation of the star's spectral lines, demonstrating how they shift towards red or blue depending on the star's movement. This provides a direct visual link to the data astronomers collect.

5.  **RV Amplitude Comparison Chart**: A bar chart that compares the radial velocity amplitude of the selected planet with its siblings in the same system. This chart is crucial for understanding which planets have the most significant gravitational influence on their star, making them easier to detect. The chart is built with mobile-first principles, ensuring readability on all screen sizes.

## Technical Implementation

-   **Frontend Framework**: The component is built using React and TypeScript.
-   **Data Visualization**: All charts and diagrams are rendered using the D3.js library, allowing for dynamic and interactive data visualizations.
-   **Styling**: The component is styled using Tailwind CSS, ensuring a consistent and responsive design. The recent mobile-friendly updates have been implemented directly within the component's logic for D3.js charts and in the global stylesheet for the legend.
-   **Internationalization**: Text content is managed via `react-i18next` to support multiple languages.

## Mobile Responsiveness

The component has been optimized for mobile devices. Key responsive features include:

-   **Wrapping Legend**: The legend for the comparison chart now wraps to multiple lines on smaller screens to prevent text overlap.
-   **Dynamic Ticks**: The number of ticks on the x-axis of the comparison chart adjusts based on the screen width to ensure labels are legible.
-   **Adjusted Margins and Font Sizes**: Chart margins and font sizes are dynamically adjusted for a better viewing experience on mobile devices.

---

## Radial Velocity Detection Method

### The Physics

Radial velocity (RV) is the component of a star's velocity directed towards or away from Earth. When a planet orbits a star, the star's gravity doesn't pull the star into the planet's orbit—instead, star and planet orbit their common center of mass (barycenter).

**Key Concept**: The star "wobbles" in response to the planet's gravity:
- When the star moves toward Earth → light is compressed (blue-shifted)
- When the star moves away from Earth → light is stretched (red-shifted)

### Historical Importance

- **First exoplanet discovered (1995)**: 51 Pegasi b, found via RV
- **Success rate**: Detected ~60% of all known exoplanets (as of 2023)
- **Advantages**: Works for any orbital configuration, gives planet mass
- **Limitations**: Requires precise spectroscopy, favors large planets and close orbits

### Measurement Process

```
1. Collect star light with spectrograph
2. Measure wavelength shift in spectral lines
3. Calculate velocity from wavelength change (Doppler formula)
4. Plot velocity over time to find periodicity
5. Determine planet orbital period and mass
```

---

## The Five Visualization Types

### 1. RV Curve Chart

**What It Shows**:
The radial velocity curve is a sinusoidal graph showing how the star's velocity toward/away from Earth changes over time as the planet orbits.

**Axes**:
- X-axis: Time (orbital phase, 0-1)
- Y-axis: Radial velocity (m/s or km/s)

**Key Features**:
- **Systemic velocity baseline**: Horizontal line at center (star's mean velocity toward Earth)
- **Redshift**: When star moves away (positive RV, right side of graph)
- **Blueshift**: When star moves toward us (negative RV, left side)
- **RV amplitude (K)**: Half the peak-to-peak velocity, indicates planet mass
- **Animated marker**: Shows current orbital phase, synchronized with other views

**Formula**:
```
RV(t) = K * sin(2π*t/P + φ) + γ

Where:
  K = RV semi-amplitude (m/s)
  t = time
  P = orbital period
  φ = phase offset
  γ = systemic velocity (barycenter motion)
```

**Example Data** (Kepler-452 system):
```
Planet b:
  Period: 384.8 days
  RV amplitude: ~1 m/s (hard to detect!)

51 Pegasi b:
  Period: 4.2 days
  RV amplitude: ~55 m/s (easy to detect!)
```

### 2. Orbital Diagram (Top-Down View)

**What It Shows**:
A bird's-eye view of the star-planet system, showing how the star "wobbles" due to the planet's gravity.

**Elements**:
- **Central star**: Small circle at system barycenter
- **Orbit circle**: Shows planet orbital path
- **Planet position**: Moves along orbit
- **Star position**: Tiny offset from center (the wobble)
- **Light cone**: Gray wedge showing direction toward observer
  - When star is toward observer: RV is negative (blueshift)
  - When star is away from observer: RV is positive (redshift)
  - When star is sideways: RV is zero

**Scale**:
- Wobble amplitude = a * m_p / M_s
  - a = semi-major axis
  - m_p = planet mass
  - M_s = star mass

**Teaching Point**: Shows why massive planets orbiting close to their stars are easiest to detect

### 3. 1D Side View (Edge-On)

**What It Shows**:
A simplified side view showing just the back-and-forth motion of the star along the line of sight.

**Elements**:
- **Observer position**: Fixed on the left
- **Star motion**: Arrow showing motion toward/away
- **Distance scale**: Shows amplitude of motion
- **Velocity indicator**: "Approaching" or "Receding" label

**Purpose**: Makes the Doppler shift concept crystal clear—this is the motion that causes the light-shift we detect

### 4. Spectral Lines Visualization

**What It Shows**:
How spectral lines (specific wavelengths emitted by the star) shift due to Doppler effect.

**Elements**:
- **At rest**: Baseline wavelength of spectral line
- **Blueshift**: Line shifts left (shorter wavelength) when star approaches
- **Redshift**: Line shifts right (longer wavelength) when star recedes

**Doppler Formula**:
```
λ_observed = λ_rest * (1 + v_radial/c)

Where:
  λ = wavelength
  v_radial = radial velocity
  c = speed of light (3×10⁸ m/s)

Example: 1 m/s velocity shift ≈ 0.003 nm shift at 500 nm
        (This is why we need precision spectrographs!)
```

**Shifted Wavelengths**:
- Hydrogen-alpha (Hα): 656.3 nm at rest
  - Approaching star: ~656.29 nm
  - Receding star: ~656.31 nm
  - Difference: ~0.02 nm for 10 m/s motion

### 5. RV Amplitude Comparison Chart

**What It Shows**:
Bar chart comparing RV amplitudes of all planets in the system, showing which planets are easiest to detect.

**Bar Heights**: RV amplitude (K) in m/s for each planet

**Ordering**: By amplitude (largest to smallest)

**Color Coding**:
- Current planet: Highlighted color
- Sibling planets: Gray or secondary color

**Data Displayed**:
- Exact RV amplitude value for each planet
- Planet name and orbital period label
- Relative detection difficulty

**Key Insight**:
```
Larger amplitude = Easier to detect

Why?
- Larger planets = stronger gravity = bigger star wobble
- Closer planets = faster orbital motion = faster velocity changes
- Older/smaller stars = same planet causes larger relative wobble

Example amplitudes:
  Hot Jupiter (5 MJ, 0.05 AU, sun): K ~ 50-100 m/s
  Earth (1 M⊕, 1 AU, sun): K ~ 0.1 m/s

This is why hot Jupiters were found first!
```

---

## Data Points That Drive Visuals

### From CSV Data

| Property | Used For |
|----------|----------|
| `orbital_period` | Determines oscillation frequency |
| `semi_major_axis` | Affects wobble amplitude |
| `planet_mass` | Determines RV amplitude |
| `host_star_mass` | Determines RV amplitude (inverse) |
| `eccentricity` | Affects curve shape (non-sinusoidal for e > 0) |

### Calculated Values

| Calculation | Formula | Purpose |
|-------------|---------|---------|
| RV Amplitude (K) | (m_p/M_s) * sqrt(G/a) / sin(i) | Y-axis range |
| Orbital Velocity | 2π*a / P | Animation speed |
| Phase | (t mod P) / P | Position on orbit |

### Animation Synchronization

All five visualizations use the same **orbital phase** variable:
- Phase = 0: Planet at right (star moving toward observer)
- Phase = 0.25: Planet at top (star moving sideways, zero RV)
- Phase = 0.5: Planet at left (star moving away)
- Phase = 0.75: Planet at bottom (star moving sideways, zero RV)

---

## Interactive Controls

### Playback Controls

- **Play/Pause**: Animate the orbit
- **Speed Control**: Slow down or speed up animation
- **Reset**: Return to phase 0

### Parameter Adjustment

Users can modify:
- **Orbital period**: Change animation speed
- **RV amplitude**: Scale the velocity curve
- **Eccentricity**: Change curve shape (if available)

### Synchronized Updates

When a parameter changes:
1. Curves recalculate mathematically
2. All five views update together
3. Animation restarts from current phase

---

## Mathematics Behind RV Detection

### Doppler Shift

**Observed frequency**:
```
f_obs = f_source * sqrt((1 + β)/(1 - β))

Where β = v_radial / c

For non-relativistic speeds (v << c):
f_obs ≈ f_source * (1 + v_radial/c)

Or in wavelength:
λ_obs = λ_source * (1 + v_radial/c)
```

### RV Semi-Amplitude (K)

**What it means**: Half the peak-to-peak velocity variation

**Formula**:
```
K = (m_p * sin(i) / M_star)^(1/3) * sqrt(G*M_star / a) / sin(i)

Or more intuitively:
K = (M_p / M_s) * sqrt(GM_s / a)

Where:
  M_p = planet mass
  M_s = star mass
  a = semi-major axis
  G = gravitational constant
  i = orbital inclination angle

Key insight: K ∝ M_planet / M_star^(2/3) / a^(-1/2)
```

**Examples**:
```
Jupiter around Sun (5.2 AU): K ~ 12 m/s
Hot Jupiter (0.05 AU): K ~ 100 m/s (easier!)
Earth around Sun (1 AU): K ~ 0.09 m/s (very hard!)
```

### Orbital Period

**Direct from data**: Oscillation period of the RV curve

**Relationship to planet distance**:
```
Kepler's 3rd Law:
P² ∝ a³

Or: a = (GM_s * P²)^(1/3) / (2π)

Where P is orbital period
```

---

## Educational Value

### Concepts Taught

1. **Indirect detection**: We don't see the planet, we see the star's motion
2. **Gravity**: Planets aren't orbited by stars; both orbit their common center
3. **Doppler effect**: Motion changes light wavelength
4. **Mass measurement**: RV tells us planet mass (most accurate method)
5. **Orbital mechanics**: Period, distance, and velocity relationships

### Real Exoplanet Context

The visualization can be applied to real systems:
- **51 Pegasi b** (first exoplanet): Easy case, clear signal
- **Kepler-452 system**: Harder case, multiple planets, lower masses
- **TRAPPIST-1 system**: Multi-planet system, resonances

---

## Component Integration

### Location in App

- Planet detail page (`/planets/:slug`)
- Part of the educational/discovery section
- Available for all planets discovered via RV method

### Triggering Display

```
if (planet.discovery_method === 'Radial Velocity') {
  show RadialVelocitySection with planet data
}
```

### Data Flow

```
Planet data from CSV
  ↓
Extract: mass, period, semi_major_axis, star mass
  ↓
Calculate: RV amplitude, orbital velocity
  ↓
Pass to RadialVelocitySection component
  ↓
Component renders five synchronized visualizations
  ↓
User interacts with playback controls
```

---

## See Also

- [Planet Catalog](feature-planet-catalog.md) - Where planets are discovered
- [CSV Structure & Fields](data-csv-structure.md) - Data sources for RV calculations
- [System Architecture Overview](architecture-system-overview.md) - Component integration
- [Component Hierarchy](architecture-component-hierarchy.md) - Where this lives in UI
