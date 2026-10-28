# Multi-Agent Warehouse Navigation & Algorithm Comparison Simulator

> **Research Demonstration:** *“Heuristic Search, Constraint-Based Coordination and Task Allocation for Multi-Agent Warehouse Navigation: A Comparative Evaluation.”*

An interactive desktop research workstation comparing multi-agent path finding (MAPF) algorithms, constraint-based coordination strategies, and task allocation methods on an authentic 30 × 30 multi-robot warehouse grid.

---

## 4-Stage Guided Demonstration Mode

Click the **"Guided Demo"** button in the header to step through the structured research demonstration:

1. **Stage 1 — Search Efficiency: BFS vs A\***
   - **Baseline:** Uninformed Breadth-First Search (BFS) exploring radially across aisles.
   - **Improvement:** Heuristic-directed A\* ($f = g + h$) with Manhattan distance guidance.
   - **Observation:** Both return identically optimal shortest paths, but A\* explores significantly fewer states.
   - **7 Search Visualization Toggles:** Discovered Nodes (light blue), Expanded Nodes (violet), Explored Edges (translucent blue-gray), Alternative Branches (dashed amber), Final Selected Path, Vehicle Trajectories & Waits, Collision Markers.

2. **Stage 2 — Task Allocation: Nearest Robot vs Hill Climbing**
   - **Baseline:** Greedy Nearest Robot assignment based on current robot endpoints.
   - **Improvement:** Steepest descent Hill Climbing optimizing $J = \hat{M} + 0.1 \times \hat{T}$ via task relocations and swaps.
   - **Observation:** Balances workload across robots, achieving significant makespan reduction while preserving total distance.

3. **Stage 3 — Robot Coordination: Collision Vulnerability under Independent Routing**
   - **Baseline:** Independent BFS / Independent A\* in a shared corridor bottleneck.
   - **Observation:** Uncoordinated agents collide at step $t=12$ in cell $(20, 15)$.
   - **Features:** Auto-pause at collision step, red conflict highlights on conflicting cells and vehicles, and time-indexed conflict logs.

4. **Stage 4 — Robot Coordination: Coordinated Space-Time CSP (Zero Collisions)**
   - **Improvement:** Coordinated Space-Time CSP using 3D state space $(r, c, t)$, vertex and edge-swap reservations, and bounded backtracking.
   - **Observation:** Robot 1 executes a coordinated wait step at the corridor entrance while Robot 0 crosses safely.
   - **Verification:** Independent trajectory verification confirms 0 vertex conflicts and 0 edge-swap conflicts (**VERIFIED — 0 Collisions**).

---

## Technical Specifications & Features

- **Row 29 Permanent Charging Station:** All vehicles start on the bottom charging row ($r=29$) with dedicated charging bay markings, and can never be overwritten by dynamic obstacles.
- **30 × 30 Warehouse Grid:** Standard layout featuring rectangular storage pod blocks, picking aisles, cross-aisles, and consolidation dispatch bays.
- **Interactive Dynamic Obstacle Tool:** Click any free corridor cell to place temporary dynamic obstacles. Routes dynamically invalidate and replan detours in real time.
- **Simulation Playback Engine:** Discrete time-step scrubbing with auto-pause at collision time steps, variable speeds ($0.25\times$ to $4\times$), and real-time conflict status pills.
- **Comparative Evaluation Matrix:** Runs all 4 algorithmic pipelines side-by-side on the identical seed and scenario.

---

## Running the Project

```bash
# Install dependencies
npm install

# Run automated Vitest test suite (11/11 tests passing)
npm test

# Run development server
npm run dev

# Build production bundle
npm run build
```
