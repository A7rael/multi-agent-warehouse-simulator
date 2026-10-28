import { describe, it, expect } from 'vitest';
import { generateInstance } from '../simulation/instanceGenerator';
import { executeFleetPlanning } from '../simulation/planner';
import { verifyTrajectories } from '../algorithms/collisionVerifier';

describe('End-to-End Simulation Pipeline', () => {
  it('E2E: Changes algorithms, verifies independent conflicts vs coordinated 0-conflicts, places dynamic obstacle, replans, and plays through trajectory steps', () => {
    // 1. Generate an initial scenario with 8 robots and 16 tasks (Standard Warehouse)
    const inst = generateInstance(8, 16, 'standard', 42);
    const staticObs = inst.layout.staticObstacles;
    const dynamicObs = new Set<string>();

    // 2. Run Independent: BFS + Nearest Robot
    const bfsPlan = executeFleetPlanning({
      robots: inst.robots,
      tasks: inst.tasks,
      staticObstacles: staticObs,
      dynamicObstacles: dynamicObs,
      rows: 30,
      cols: 30,
      solver: 'independent_bfs',
      allocationMethod: 'nearest_robot',
    });

    expect(bfsPlan.status).toBe('success');
    expect(bfsPlan.metrics.totalExpandedStates).toBeGreaterThan(0);
    // In uncoordinated mode with 8 robots, independent conflicts can be detected
    const bfsVerifier = verifyTrajectories(bfsPlan.robots);
    expect(bfsVerifier.totalConflicts).toBe(bfsPlan.conflicts.length);

    // 3. Switch to Coordinated: Space-Time CSP + Hill Climbing
    const cspPlan = executeFleetPlanning({
      robots: inst.robots,
      tasks: inst.tasks,
      staticObstacles: staticObs,
      dynamicObstacles: dynamicObs,
      rows: 30,
      cols: 30,
      solver: 'coordinated_csp',
      allocationMethod: 'hill_climbing',
      baselineMakespan: bfsPlan.metrics.makespan,
      baselineDistance: bfsPlan.metrics.totalDistance,
    });

    expect(cspPlan.status).toBe('success');
    // Coordinated CSP must yield 0 vertex and 0 edge-swap conflicts independently verified!
    const cspVerifier = verifyTrajectories(cspPlan.robots);
    expect(cspVerifier.isCollisionFree).toBe(true);
    expect(cspVerifier.totalConflicts).toBe(0);

    // 4. Place Dynamic Obstacle on a planned route cell
    const targetRobot = cspPlan.robots.find(r => r.trajectory.length > 5)!;
    const stepToBlock = targetRobot.trajectory[4];
    const blockedCellKey = `${stepToBlock.r},${stepToBlock.c}`;
    dynamicObs.add(blockedCellKey);

    // 5. Replan fleet with dynamic obstacle
    const replanResult = executeFleetPlanning({
      robots: inst.robots,
      tasks: inst.tasks,
      staticObstacles: staticObs,
      dynamicObstacles: dynamicObs,
      rows: 30,
      cols: 30,
      solver: 'coordinated_csp',
      allocationMethod: 'hill_climbing',
    });

    expect(replanResult.status).toBe('success');
    // Verify none of the robots pass through the blocked dynamic obstacle
    for (const r of replanResult.robots) {
      for (const pt of r.trajectory) {
        expect(`${pt.r},${pt.c}`).not.toBe(blockedCellKey);
      }
    }

    // 6. Simulate Playback across steps t = 0 to makespan
    const maxT = replanResult.metrics.makespan;
    expect(maxT).toBeGreaterThan(0);

    for (let t = 0; t <= Math.min(maxT, 15); t++) {
      for (const r of replanResult.robots) {
        const pt = r.trajectory[t] || r.trajectory[r.trajectory.length - 1];
        expect(pt.r).toBeGreaterThanOrEqual(0);
        expect(pt.r).toBeLessThan(30);
        expect(pt.c).toBeGreaterThanOrEqual(0);
        expect(pt.c).toBeLessThan(30);
      }
    }
  });
});
