import {
  Robot,
  Task,
  CoordinationSolver,
  TaskAllocationMethod,
  PlanningResult,
  Cell
} from '../types';
import { cellToKey } from '../algorithms/gridUtils';
import { allocateNearestRobot, allocateHillClimbing, GridDistanceOracle } from '../algorithms/taskAllocation';
import { planMultiAgentFleet } from '../algorithms/prioritizedPlanner';
import { verifyTrajectories } from '../algorithms/collisionVerifier';
import { calculateFleetMetrics } from '../algorithms/metrics';

export interface PlanFleetOptions {
  robots: Robot[];
  tasks: Task[];
  staticObstacles: Set<string>;
  dynamicObstacles: Set<string>;
  rows: number;
  cols: number;
  solver: CoordinationSolver;
  allocationMethod: TaskAllocationMethod;
  baselineMakespan?: number | null;
  baselineDistance?: number | null;
}

export function executeFleetPlanning(options: PlanFleetOptions): PlanningResult {
  const {
    robots,
    tasks,
    staticObstacles,
    dynamicObstacles,
    rows,
    cols,
    solver,
    allocationMethod,
    baselineMakespan,
    baselineDistance,
  } = options;

  const isObstacle = (c: Cell): boolean => {
    const key = cellToKey(c);
    return staticObstacles.has(key) || dynamicObstacles.has(key);
  };

  // 1. Task Allocation
  const oracle = new GridDistanceOracle(rows, cols, isObstacle);
  const allocationStart = performance.now();

  const allocResult =
    allocationMethod === 'hill_climbing'
      ? allocateHillClimbing(robots, tasks, rows, cols, isObstacle, oracle)
      : allocateNearestRobot(robots, tasks, rows, cols, isObstacle, oracle);

  const allocationTimeMs = performance.now() - allocationStart;

  // 2. Multi-Agent Fleet Planning
  const planningStart = performance.now();
  const fleetPlan = planMultiAgentFleet(
    robots,
    tasks,
    allocResult.allocations,
    solver,
    rows,
    cols,
    isObstacle
  );
  const planningTimeMs = performance.now() - planningStart;

  // 3. Independent Trajectory Verification
  const verification = verifyTrajectories(fleetPlan.robots);

  // 4. Calculate Comprehensive Metrics
  const metrics = calculateFleetMetrics(
    fleetPlan.robots,
    tasks,
    verification.conflicts,
    allocationTimeMs,
    planningTimeMs,
    fleetPlan.totalExpandedStates,
    baselineMakespan ?? null,
    baselineDistance ?? null
  );

  // Determine overall status
  let status: 'success' | 'partial' | 'failed' = 'success';
  let failureReason: string | undefined = undefined;

  if (!fleetPlan.success) {
    status = 'failed';
    failureReason = fleetPlan.failureReason || 'Fleet planning failed under current constraints.';
  } else if (metrics.failedDeliveriesCount > 0) {
    status = 'partial';
    failureReason = `${metrics.failedDeliveriesCount} task delivery waypoint(s) could not be completed.`;
  }

  // Update task assignedRobotId and completed flags
  const updatedTasks: Task[] = tasks.map(t => {
    let assignedRobotId: string | null = null;
    for (const [rid, tids] of allocResult.allocations.entries()) {
      if (tids.includes(t.id)) {
        assignedRobotId = rid;
        break;
      }
    }
    return {
      ...t,
      assignedRobotId,
    };
  });

  return {
    id: `plan_${Date.now()}`,
    status,
    failureReason,
    robots: fleetPlan.robots,
    tasks: updatedTasks,
    metrics,
    allocationDiagnostics: allocResult.diagnostics,
    conflicts: verification.conflicts,
    coordinationSolver: solver,
    allocationMethod,
    timestamp: Date.now(),
  };
}
