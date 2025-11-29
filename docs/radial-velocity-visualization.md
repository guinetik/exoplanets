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
