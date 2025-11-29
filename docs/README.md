# Exoplanets Project Wiki

Welcome to the documentation hub for the Exoplanets interactive web application. This wiki covers architecture, features, 3D visualization, APIs, and the complete data pipeline.

## Quick Navigation by Role

### 🚀 New to the Project?
Start here to understand the big picture:
1. [System Architecture Overview](architecture-system-overview.md) - Learn how everything fits together
2. [Component Hierarchy](architecture-component-hierarchy.md) - Understand the React structure
3. [Data Flow & State Management](architecture-data-flow.md) - See how data moves through the app

### 🎨 Building 3D Visuals?
If you're working with shaders and rendering:
1. [Shader System V2](visualization-shader-system-v2.md) - Comprehensive shader architecture
2. [Planetary Rings](visualization-planetary-rings.md) - Ring rendering and physics
3. [ShaderService API](api-shader-service.md) - Loading and managing shaders

### 💾 Data & Backend Work?
Working with data loading, processing, or APIs:
1. [DataService API](api-data-service.md) - Core data loading and querying
2. [Data Processing Pipeline](data-processing-pipeline.md) - Data transformation
3. [CSV Structure & Fields](data-csv-structure.md) - All 72 columns reference

### 📊 Building Features?
Adding new pages or functionality:
1. [Architecture System Overview](architecture-system-overview.md) - System design patterns
2. [Service Layer Overview](api-service-layer.md) - Available services
3. [Component Hierarchy](architecture-component-hierarchy.md) - Component organization

---

## Complete Documentation Index

### Architecture & System Design
Learn how the application is organized and functions at a high level.

- [System Architecture Overview](architecture-system-overview.md) - High-level system design, tech stack, and key architectural decisions
- [Component Hierarchy](architecture-component-hierarchy.md) - React component tree organization and responsibilities
- [Data Flow & State Management](architecture-data-flow.md) - DataContext, useData hook, filtering pipeline, caching strategy
- [Math Module Design](architecture-math-module.md) - Pure math vs domain logic separation, MATH_CONSTANTS philosophy

### API Documentation
Reference for core services and their methods.

- [DataService API](api-data-service.md) - Core data loading, querying, filtering, and caching
- [ShaderService API](api-shader-service.md) - Shader loading, resolution, and manifest system
- [Service Layer Overview](api-service-layer.md) - Overview of all singleton services

### Features & Pages
Documentation for user-facing features and what drives them.

- [Habitability Dashboard](feature-habitability-dashboard.md) - Analytics, D3 charts, and 3D spatial visualization
- [Star Catalog](feature-star-catalog.md) - Star listing, filtering, and detail pages
- [Planet Catalog](feature-planet-catalog.md) - Planet listing, filtering, and detail pages
- [Star System Overview](feature-star-system-overview.md) - 3D star system visualization and orbital display
- [Radial Velocity Visualization](feature-radial-velocity-visualization.md) - RV detection methods and visualization types
- [Vote for Earth 2.0](feature-vote-earth-2.md) - Community voting feature
- [Astronomy Picture of the Day](feature-astronomy-picture-of-day.md) - NASA APOD integration

### 3D Visualization & Rendering
Learn about shaders, Three.js integration, and how planets look the way they do.

- [Shader System V2](visualization-shader-system-v2.md) - Complete shader architecture with planet and star types
- [Planetary Rings](visualization-planetary-rings.md) - Ring probability heuristics and rendering
- [Planet Rotation & Axial Tilt](visualization-planet-rotation.md) - Rotation physics and tilt estimation
- [Star Surface Shader](visualization-star-surface-shader.md) - Star rendering and surface effects
- [Shadertoy Showcase](visualization-shadertoy-showcase.md) - Interactive shader demonstration

### Internationalization
Setting up translations and managing language keys.

- [i18n Overview](i18n-overview.md) - System architecture and best practices
- [Planets Pages i18n](i18n-planets-pages.md) - All translation keys for planets pages
- [Stars Pages i18n](i18n-stars-pages.md) - All translation keys for stars pages

### Data Pipeline
Understanding how NASA data flows into the application.

- [NASA Data Fetching](data-nasa-fetching.md) - fetch_exoplanets.py and NASA API
- [Data Processing Pipeline](data-processing-pipeline.md) - process_exoplanets.py transformations
- [CSV Structure & Fields](data-csv-structure.md) - Complete reference for all 72 columns

---

## Index by Technology

### React & State Management
- [Component Hierarchy](architecture-component-hierarchy.md)
- [Data Flow & State Management](architecture-data-flow.md)
- Feature documentation pages

### Three.js & 3D Rendering
- [Shader System V2](visualization-shader-system-v2.md)
- [Planetary Rings](visualization-planetary-rings.md)
- [ShaderService API](api-shader-service.md)
- [Star Surface Shader](visualization-star-surface-shader.md)
- [Planet Rotation & Axial Tilt](visualization-planet-rotation.md)

### D3.js & Data Visualization
- [Habitability Dashboard](feature-habitability-dashboard.md)

### NASA Data & Processing
- [NASA Data Fetching](data-nasa-fetching.md)
- [Data Processing Pipeline](data-processing-pipeline.md)
- [CSV Structure & Fields](data-csv-structure.md)
- [DataService API](api-data-service.md)

### Internationalization
- [i18n Overview](i18n-overview.md)
- [Planets Pages i18n](i18n-planets-pages.md)
- [Stars Pages i18n](i18n-stars-pages.md)

---

## Document Status

📘 **Completed** - Existing documentation, reorganized with cross-references
- visualization-shader-system-v2.md
- visualization-planetary-rings.md
- visualization-shadertoy-showcase.md
- visualization-planet-rotation.md
- visualization-star-surface-shader.md
- i18n-planets-pages.md
- i18n-stars-pages.md
- feature-star-system-overview.md
- feature-vote-earth-2.md
- feature-astronomy-picture-of-day.md

🚧 **In Progress** - Brief structural versions being created
- Architecture documentation (4 files)
- API documentation (3 files)
- Feature documentation (3 new files)
- Data pipeline documentation (3 files)
- i18n overview
- Enhanced radial velocity documentation

---

## How to Use This Wiki

1. **Find your topic** using the index above or search by role/technology
2. **Read the overview** in each document for a high-level understanding
3. **Follow cross-references** (See Also sections) to related documentation
4. **Link to specific sections** using anchors: `[Section Name](file.md#section-name)`

## Contributing to the Wiki

When adding or updating documentation:
- Use the file naming convention: `{category}-{topic}.md`
- Include a brief overview paragraph at the start
- Add a "See Also" section at the end with related topics
- Link to source code files with their paths
- Keep content focused on the "what" and "why", not implementation details
- Use consistent formatting (headers, code blocks, tables)

---

## Project Overview

**Exoplanets** is an interactive web application for exploring NASA's confirmed exoplanet database, featuring:
- 6,000+ confirmed exoplanets and 4,500+ host stars
- 3D WebGL rendering with custom shaders
- Data analysis with D3.js visualizations
- Habitability scoring system
- Interactive discovery tools

**Tech Stack**: React 18 + TypeScript + Vite + Three.js + Tailwind CSS + D3.js

For the complete project structure, see [System Architecture Overview](architecture-system-overview.md).
