# Pepper's Boids

## Project overview
This project is being developed for a college class called **Computer generated holography**. Though not a hologram in the traditional sense, a "Pepper's ghost" 
is a way to visualise three dimensions without having a real object in view. Built with **ThreeJS** to simplify the setup of rendering. This also allows recreation
with different screen sizes due to it being responsive.

### Reynolds Boids
This simulation uses an implementation of the **Reynolds Boids** flock simulation algorithm as a kind of allusion to the faculty and the computer science track.
It uses the three rules(alignment, seperation, cohesion) to guide a number of objects around a scene. The implementation will have a 3D faculty logo as the obstacle.

### Pepper's ghost
In order to create the effect of floating objects in the air a glossy pyramid with four sides will should be used to project the image. In order to create that projection
the renderer creates four viewports on each side of the "box" in which the boids fly.

## Technical Features

### 1. The Boids Engine (`boidClass.js`)
* **Alignment:** Steering toward the average heading of local flockmates.
* **Cohesion:** Steering toward the "center of mass" of local flockmates.
* **Separation:** Avoiding crowding and collisions with neighbors.
* **Edge Avoidance:** A soft-container steering force that keeps agents within the holographic volume without jarring "teleportation" wraps.

### 2. Holographic Projection (`main.js`)
* **Anamorphic Viewports:** A single WebGL context sliced into a 3x3 grid.
* **Camera Rigging:** Four orthogonal cameras (Front, Back, Left, Right) positioned around the origin $(0,0,0)$.
* **Z-Axis Symmetry:** Specialized camera rotation ($0^\circ, 90^\circ, 180^\circ, 270^\circ$) ensures that "up" in the 3D scene always points toward the apex of the physical pyramid.

### 3. Performance & Optimization
* **Object-Oriented Architecture:** Modular ES6 Class structure.
* **Integrated GPU Focus:** Optimized vertex counts and efficient render loops to maintain 60 FPS on standard hardware.
* **Stats Integration:** Real-time performance monitoring via `Stats.js`.

---

## Getting Started

### Prerequisites
* A modern web browser with WebGL support.
* A local development server (e.g., Live Server for VS Code) to handle ES6 Module imports.

### Installation
1. Clone the repository:
   ```bash
   git clone [https:

**Developed by: **Emanuel Pračić bacc.ing.techn.inf.
**Faculty: **Tehničko Veleučilište u Zagrebu(Zagreb University of Applied Sciences)
**Academic year: **2025/2026
