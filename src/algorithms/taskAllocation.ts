import { Cell, Task, Robot, AllocationDiagnostics } from '../types';
import { areCellsEqual, cellToKey } from './gridUtils';
import { findPathAStar } from './astar';

export interface AllocationResult {
  allocations: Map<string, string[]>; // robotId -> taskIds in sequence
  diagnostics: AllocationDiagnostics;
}

export class GridDistanceOracle {
  private cache = new Map<string, number>();
  private rows: number;
  private cols: number;
  private isObstacle: (cell: Cell) => boolean;

  constructor(rows: number, cols: number, isObstacle: (cell: Cell) => boolean) {
    this.rows = rows;
    this.cols = cols;
    this.isObstacle = isObstacle;
  }

  getDistance(from: Cell, to: Cell): number {
    if (areCellsEqual(from, to)) return 0;
    const key = `${cellToKey(from)}|${cellToKey(to)}`;
    const reverseKey = `${cellToKey(to)}|${cellToKey(from)}`;

    if (this.cache.has(key)) return this.cache.get(key)!;
    if (this.cache.has(reverseKey)) return this.cache.get(reverseKey)!;

    const res = findPathAStar(from, to, this.rows, this.cols, this.isObstacle, 'Oracle');
    const dist = res.found ? Math.max(0, res.path.length - 1) : 999999;
    this.cache.set(key, dist);
    this.cache.set(reverseKey, dist);
    return dist;
  }
}

// Calculate estimated route length for a single robot given its task sequence
export function calculateRobotEstimatedDistance(
  robotStart: Cell,
  taskSequence: Task[],
  oracle: GridDistanceOracle
): number {
  if (taskSequence.length === 0) return 0;

  let currentPos = robotStart;
  let totalDist = 0;

  for (const task of taskSequence) {
    // start/current -> pickup
    const toPickup = oracle.getDistance(currentPos, task.pickup);
    // pickup -> delivery
    const toDelivery = oracle.getDistance(task.pickup, task.delivery);
    totalDist += toPickup + toDelivery;
    currentPos = task.delivery;
  }

  return totalDist;
}

// Calculate the global objective J = M_hat + 0.1 * T_hat
export function calculateObjectiveJ(
  robots: Robot[],
  allocations: Map<string, string[]>,
  taskMap: Map<string, Task>,
  oracle: GridDistanceOracle
): { J: number; M_hat: number; T_hat: number; robotLengths: Record<string, number> } {
  let M_hat = 0;
  let T_hat = 0;
  const robotLengths: Record<string, number> = {};

  for (const robot of robots) {
    const assignedIds = allocations.get(robot.id) || [];
    const sequence = assignedIds.map(id => taskMap.get(id)!).filter(Boolean);
    const length = calculateRobotEstimatedDistance(robot.start, sequence, oracle);
    robotLengths[robot.id] = length;
    T_hat += length;
    if (length > M_hat) {
      M_hat = length;
    }
  }

  const J = M_hat + 0.1 * T_hat;
  return { J, M_hat, T_hat, robotLengths };
}

// 1. Nearest Robot (Greedy Baseline)
export function allocateNearestRobot(
  robots: Robot[],
  tasks: Task[],
  rows: number,
  cols: number,
  isObstacle: (cell: Cell) => boolean,
  oracle?: GridDistanceOracle
): AllocationResult {
  const startTime = performance.now();
  const distOracle = oracle || new GridDistanceOracle(rows, cols, isObstacle);

  const allocations = new Map<string, string[]>();
  for (const robot of robots) {
    allocations.set(robot.id, []);
  }

  // Track each robot's current endpoint
  const robotEndpoints = new Map<string, Cell>();
  for (const robot of robots) {
    robotEndpoints.set(robot.id, robot.start);
  }

  // Process tasks in defined index order
  for (const task of tasks) {
    let bestRobotId: string = robots[0].id;
    let minDistance = Infinity;

    for (const robot of robots) {
      const endpoint = robotEndpoints.get(robot.id)!;
      const dist = distOracle.getDistance(endpoint, task.pickup);

      if (dist < minDistance) {
        minDistance = dist;
        bestRobotId = robot.id;
      }
    }

    // Assign task to best robot
    allocations.get(bestRobotId)!.push(task.id);
    // Update robot's endpoint to the delivery cell
    robotEndpoints.set(bestRobotId, task.delivery);
  }

  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  const { J, M_hat, T_hat, robotLengths } = calculateObjectiveJ(robots, allocations, taskMap, distOracle);
  const endTime = performance.now();

  const tasksPerRobot: Record<string, number> = {};
  const workloadDistribution = robots.map(r => {
    const count = (allocations.get(r.id) || []).length;
    tasksPerRobot[r.id] = count;
    return {
      robotId: r.id,
      taskCount: count,
      estimatedCost: robotLengths[r.id] || 0,
    };
  });

  return {
    allocations,
    diagnostics: {
      method: 'nearest_robot',
      initialObjective: parseFloat(J.toFixed(2)),
      finalObjective: parseFloat(J.toFixed(2)),
      acceptedImprovements: 0,
      tasksPerRobot,
      workloadDistribution,
      timeMs: parseFloat((endTime - startTime).toFixed(2)),
      iterations: 0,
    },
  };
}

// 2. Hill Climbing (Neighborhood Search: Relocate + Swap, J = M + 0.1 * T)
export function allocateHillClimbing(
  robots: Robot[],
  tasks: Task[],
  rows: number,
  cols: number,
  isObstacle: (cell: Cell) => boolean,
  oracle?: GridDistanceOracle,
  maxIterations: number = 200
): AllocationResult {
  const startTime = performance.now();
  const distOracle = oracle || new GridDistanceOracle(rows, cols, isObstacle);

  // 1. Start from Nearest Robot greedy baseline
  const baseline = allocateNearestRobot(robots, tasks, rows, cols, isObstacle, distOracle);
  let currentAllocations = new Map<string, string[]>();
  for (const [rid, tids] of baseline.allocations.entries()) {
    currentAllocations.set(rid, [...tids]);
  }

  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  let currentEval = calculateObjectiveJ(robots, currentAllocations, taskMap, distOracle);
  const initialObjective = currentEval.J;
  let acceptedImprovements = 0;
  let iterations = 0;

  // Clone allocation helper
  function cloneAllocations(alloc: Map<string, string[]>): Map<string, string[]> {
    const next = new Map<string, string[]>();
    for (const [k, v] of alloc.entries()) {
      next.set(k, [...v]);
    }
    return next;
  }

  // Iterate steepest descent
  while (iterations < maxIterations) {
    iterations++;
    let bestMoveAllocations: Map<string, string[]> | null = null;
    let bestMoveJ = currentEval.J;

    // A. Generate RELOCATE moves:
    // Move task i from robot A to robot B at position pos
    for (const robotA of robots) {
      const tasksA = currentAllocations.get(robotA.id) || [];
      if (tasksA.length === 0) continue;

      for (let idxA = 0; idxA < tasksA.length; idxA++) {
        const taskId = tasksA[idxA];

        for (const robotB of robots) {
          if (robotA.id === robotB.id) {
            // Also consider reordering within the same robot
            for (let targetPos = 0; targetPos <= tasksA.length; targetPos++) {
              if (targetPos === idxA || targetPos === idxA + 1) continue;
              const cand = cloneAllocations(currentAllocations);
              const list = cand.get(robotA.id)!;
              list.splice(idxA, 1);
              list.splice(targetPos > idxA ? targetPos - 1 : targetPos, 0, taskId);

              const candEval = calculateObjectiveJ(robots, cand, taskMap, distOracle);
              if (candEval.J < bestMoveJ - 1e-4) {
                bestMoveJ = candEval.J;
                bestMoveAllocations = cand;
              }
            }
          } else {
            // Move from robotA to robotB
            const tasksB = currentAllocations.get(robotB.id) || [];
            for (let targetPos = 0; targetPos <= tasksB.length; targetPos++) {
              const cand = cloneAllocations(currentAllocations);
              cand.get(robotA.id)!.splice(idxA, 1);
              cand.get(robotB.id)!.splice(targetPos, 0, taskId);

              const candEval = calculateObjectiveJ(robots, cand, taskMap, distOracle);
              if (candEval.J < bestMoveJ - 1e-4) {
                bestMoveJ = candEval.J;
                bestMoveAllocations = cand;
              }
            }
          }
        }
      }
    }

    // B. Generate SWAP moves:
    // Swap task i on robot A with task j on robot B
    for (let i = 0; i < robots.length; i++) {
      const rA = robots[i];
      const tasksA = currentAllocations.get(rA.id) || [];
      if (tasksA.length === 0) continue;

      for (let j = i + 1; j < robots.length; j++) {
        const rB = robots[j];
        const tasksB = currentAllocations.get(rB.id) || [];
        if (tasksB.length === 0) continue;

        for (let idxA = 0; idxA < tasksA.length; idxA++) {
          for (let idxB = 0; idxB < tasksB.length; idxB++) {
            const cand = cloneAllocations(currentAllocations);
            const listA = cand.get(rA.id)!;
            const listB = cand.get(rB.id)!;

            const tA = listA[idxA];
            const tB = listB[idxB];
            listA[idxA] = tB;
            listB[idxB] = tA;

            const candEval = calculateObjectiveJ(robots, cand, taskMap, distOracle);
            if (candEval.J < bestMoveJ - 1e-4) {
              bestMoveJ = candEval.J;
              bestMoveAllocations = cand;
            }
          }
        }
      }
    }

    // Check if an improving move was found
    if (bestMoveAllocations && bestMoveJ < currentEval.J - 1e-4) {
      currentAllocations = bestMoveAllocations;
      currentEval = calculateObjectiveJ(robots, currentAllocations, taskMap, distOracle);
      acceptedImprovements++;
    } else {
      // Local optimum reached!
      break;
    }
  }

  const endTime = performance.now();

  const tasksPerRobot: Record<string, number> = {};
  const workloadDistribution = robots.map(r => {
    const count = (currentAllocations.get(r.id) || []).length;
    tasksPerRobot[r.id] = count;
    return {
      robotId: r.id,
      taskCount: count,
      estimatedCost: currentEval.robotLengths[r.id] || 0,
    };
  });

  return {
    allocations: currentAllocations,
    diagnostics: {
      method: 'hill_climbing',
      initialObjective: parseFloat(initialObjective.toFixed(2)),
      finalObjective: parseFloat(currentEval.J.toFixed(2)),
      acceptedImprovements,
      tasksPerRobot,
      workloadDistribution,
      timeMs: parseFloat((endTime - startTime).toFixed(2)),
      iterations,
    },
  };
}
