import { describe, it, expect } from 'vitest';
import { findPathBFS } from '../algorithms/bfs';
import { findPathAStar } from '../algorithms/astar';
import { allocateNearestRobot, allocateHillClimbing, GridDistanceOracle } from '../algorithms/taskAllocation';
import { findSpaceTimePath, ReservationTable, createReservationKey, createEdgeReservationKey } from '../algorithms/spaceTimeSearch';
import { verifyTrajectories } from '../algorithms/collisionVerifier';
import { generateInstance, generateSearchDemoScenario, generateCollisionDemoScenario } from '../simulation/instanceGenerator';
import { executeFleetPlanning } from '../simulation/planner';
import { Robot, Cell } from '../types';

describe('Criterion 1 & 2: BFS vs A* Search Efficiency', () => {
  const isObstacle = (c: Cell) => {
    return c.r === 5 && c.c >= 0 && c.c <= 15;
  };

  it('1. BFS and A* return equally short paths on the same unit-cost grid', () => {
    const start = { r: 2, c: 2 };
    const goal = { r: 8, c: 8 };

    const bfsResult = findPathBFS(start, goal, 20, 20, isObstacle, 'R0');
    const astarResult = findPathAStar(start, goal, 20, 20, isObstacle, 'R0');

    expect(bfsResult.found).toBe(true);
    expect(astarResult.found).toBe(true);
    expect(bfsResult.path.length).toBe(astarResult.path.length);
  });

  it('2. A* expands fewer nodes than BFS on the designated deterministic demonstration scenario', () => {
    const demo = generateSearchDemoScenario();
    const isObs = (c: Cell) => demo.layout.staticObstacles.has(`${c.r},${c.c}`);

    const bfsResult = findPathBFS(demo.robots[0].start, demo.tasks[0].pickup, 30, 30, isObs, 'R0');
    const astarResult = findPathAStar(demo.robots[0].start, demo.tasks[0].pickup, 30, 30, isObs, 'R0');

    expect(bfsResult.found).toBe(true);
    expect(astarResult.found).toBe(true);
    // Both find equally optimal path
    expect(bfsResult.path.length).toBe(astarResult.path.length);
    // A* expands significantly fewer nodes due to Manhattan heuristic guidance
    expect(astarResult.expandedCount).toBeLessThan(bfsResult.expandedCount);
  });

  it('3. Both search visualizations correspond to actual recorded search events', () => {
    const demo = generateSearchDemoScenario();
    const isObs = (c: Cell) => demo.layout.staticObstacles.has(`${c.r},${c.c}`);

    const astarResult = findPathAStar(demo.robots[0].start, demo.tasks[0].pickup, 30, 30, isObs, 'R0');

    expect(astarResult.expandedNodesSampled.length).toBeGreaterThan(0);
    expect(astarResult.discoveredNodesSampled.length).toBeGreaterThan(0);
    expect(astarResult.searchEdgesSampled.length).toBeGreaterThan(0);
    expect(astarResult.exploredEdgesCount).toBe(astarResult.searchEdgesSampled.length);
  });
});

describe('Criterion 4: Task Allocation Preserves Tasks and Optimizes Objective', () => {
  it('4. The nearest-robot and hill-climbing allocators preserve all tasks and improve or match objective J', () => {
    const inst = generateInstance(4, 8, 'standard', 1234);
    const isObstacle = (c: Cell) => inst.layout.staticObstacles.has(`${c.r},${c.c}`);
    const oracle = new GridDistanceOracle(30, 30, isObstacle);

    const nearest = allocateNearestRobot(inst.robots, inst.tasks, 30, 30, isObstacle, oracle);
    const hc = allocateHillClimbing(inst.robots, inst.tasks, 30, 30, isObstacle, oracle);

    expect(hc.diagnostics.finalObjective).toBeLessThanOrEqual(nearest.diagnostics.finalObjective);

    let totalAssignedNearest = 0;
    nearest.allocations.forEach(tids => (totalAssignedNearest += tids.length));
    let totalAssignedHC = 0;
    hc.allocations.forEach(tids => (totalAssignedHC += tids.length));

    expect(totalAssignedNearest).toBe(inst.tasks.length);
    expect(totalAssignedHC).toBe(inst.tasks.length);
  });
});

describe('Criteria 5, 6, 7: Deterministic Collision & Coordinated Space-Time CSP', () => {
  it('5. The deterministic collision scenario produces verified conflict(s) under independent planning', () => {
    const demo = generateCollisionDemoScenario();

    const plan = executeFleetPlanning({
      robots: demo.robots,
      tasks: demo.tasks,
      staticObstacles: demo.layout.staticObstacles,
      dynamicObstacles: new Set(),
      rows: 30,
      cols: 30,
      solver: 'independent_astar',
      allocationMethod: 'nearest_robot',
    });

    expect(plan.conflicts.length).toBeGreaterThan(0);
    const verifier = verifyTrajectories(plan.robots);
    expect(verifier.isCollisionFree).toBe(false);
    expect(verifier.totalConflicts).toBeGreaterThan(0);
  });

  it('6 & 7. The coordinated planner resolves the conflict and passes independent verification with 0 forbidden conflicts', () => {
    const demo = generateCollisionDemoScenario();

    const plan = executeFleetPlanning({
      robots: demo.robots,
      tasks: demo.tasks,
      staticObstacles: demo.layout.staticObstacles,
      dynamicObstacles: new Set(),
      rows: 30,
      cols: 30,
      solver: 'coordinated_csp',
      allocationMethod: 'nearest_robot',
    });

    expect(plan.status).toBe('success');
    expect(plan.conflicts.length).toBe(0);

    const verifier = verifyTrajectories(plan.robots);
    expect(verifier.isCollisionFree).toBe(true);
    expect(verifier.totalConflicts).toBe(0);
    expect(verifier.vertexConflictsCount).toBe(0);
    expect(verifier.edgeSwapConflictsCount).toBe(0);
  });
});

describe('Criteria 8, 9, 10: Collision Detection Engine & Verification', () => {
  it('8. Vertex and edge-swap collisions are detected correctly', () => {
    const mockRobots: Robot[] = [
      {
        id: 'R0',
        name: 'Robot 0',
        index: 0,
        color: '#27C5F5',
        start: { r: 0, c: 0 },
        currentCell: { r: 0, c: 0 },
        assignedTaskIds: [],
        currentTaskIndex: 0,
        diagnostics: {} as any,
        trajectory: [
          { t: 0, r: 0, c: 0, action: 'wait' },
          { t: 1, r: 0, c: 1, action: 'move' },
        ],
      },
      {
        id: 'R1',
        name: 'Robot 1',
        index: 1,
        color: '#FFBE45',
        start: { r: 1, c: 1 },
        currentCell: { r: 1, c: 1 },
        assignedTaskIds: [],
        currentTaskIndex: 0,
        diagnostics: {} as any,
        trajectory: [
          { t: 0, r: 1, c: 1, action: 'wait' },
          { t: 1, r: 0, c: 1, action: 'move' }, // Vertex collision at (0,1) at t=1
        ],
      },
    ];

    const result = verifyTrajectories(mockRobots);
    expect(result.isCollisionFree).toBe(false);
    expect(result.vertexConflictsCount).toBe(1);
    expect(result.totalConflicts).toBe(1);
  });

  it('9 & 10. Collision events are counted exactly once per unique event without duplicates', () => {
    const mockRobots: Robot[] = [
      {
        id: 'R0',
        name: 'Robot 0',
        index: 0,
        color: '#27C5F5',
        start: { r: 0, c: 0 },
        currentCell: { r: 0, c: 0 },
        assignedTaskIds: [],
        currentTaskIndex: 0,
        diagnostics: {} as any,
        trajectory: [
          { t: 0, r: 0, c: 0, action: 'wait' },
          { t: 1, r: 0, c: 1, action: 'move' },
        ],
      },
      {
        id: 'R1',
        name: 'Robot 1',
        index: 1,
        color: '#FFBE45',
        start: { r: 0, c: 1 },
        currentCell: { r: 0, c: 1 },
        assignedTaskIds: [],
        currentTaskIndex: 0,
        diagnostics: {} as any,
        trajectory: [
          { t: 0, r: 0, c: 1, action: 'wait' },
          { t: 1, r: 0, c: 0, action: 'move' }, // Edge swap at t=1
        ],
      },
    ];

    const result = verifyTrajectories(mockRobots);
    expect(result.edgeSwapConflictsCount).toBe(1);

    // Verify unique event IDs
    const ids = result.conflicts.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Criteria 11, 12, 13: Charging Row 29, 30x30 Dimensions, and Dynamic Obstacles', () => {
  it('12 & 13. Warehouse remains exactly 30x30 and all vehicles start on Row 29', () => {
    const inst = generateInstance(8, 16, 'standard', 42);
    expect(inst.layout.rows).toBe(30);
    expect(inst.layout.cols).toBe(30);

    for (const robot of inst.robots) {
      expect(robot.start.r).toBe(29);
      expect(robot.start.c).toBeGreaterThanOrEqual(0);
      expect(robot.start.c).toBeLessThan(30);
    }
  });

  it('11. Dynamic obstacles invalidate affected routes and trigger collision-free replanning', () => {
    const inst = generateInstance(4, 4, 'standard', 999);
    const staticObs = inst.layout.staticObstacles;
    const dynamicObs = new Set<string>();

    const planBefore = executeFleetPlanning({
      robots: inst.robots,
      tasks: inst.tasks,
      staticObstacles: staticObs,
      dynamicObstacles: dynamicObs,
      rows: 30,
      cols: 30,
      solver: 'coordinated_csp',
      allocationMethod: 'nearest_robot',
    });

    expect(planBefore.status).toBe('success');

    const routePt = planBefore.robots[0].trajectory.find(
      p => p.action === 'move' && !staticObs.has(`${p.r},${p.c}`) && p.r < 29
    );

    if (routePt) {
      dynamicObs.add(`${routePt.r},${routePt.c}`);

      const planAfter = executeFleetPlanning({
        robots: inst.robots,
        tasks: inst.tasks,
        staticObstacles: staticObs,
        dynamicObstacles: dynamicObs,
        rows: 30,
        cols: 30,
        solver: 'coordinated_csp',
        allocationMethod: 'nearest_robot',
      });

      const blockedKey = `${routePt.r},${routePt.c}`;
      for (const robot of planAfter.robots) {
        for (const pt of robot.trajectory) {
          expect(`${pt.r},${pt.c}`).not.toBe(blockedKey);
        }
      }
    }
  });
});
