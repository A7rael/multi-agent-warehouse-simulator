import { Robot, Task, SimulationMetrics, ConflictEvent } from '../types';

export function calculateFleetMetrics(
  robots: Robot[],
  tasks: Task[],
  conflicts: ConflictEvent[],
  allocationTimeMs: number,
  planningTimeMs: number,
  totalExpandedStates: number,
  baselineMakespan: number | null = null,
  baselineDistance: number | null = null
): SimulationMetrics {
  const vertexConflicts = conflicts.filter(c => c.type === 'vertex').length;
  const edgeSwapConflicts = conflicts.filter(c => c.type === 'edge_swap').length;

  const affectedPairs = new Set<string>();
  conflicts.forEach(c => {
    affectedPairs.add([c.robotA, c.robotB].sort().join(':'));
  });

  const conflictSteps = conflicts.map(c => c.t).sort((a, b) => a - b);
  const firstConflictStep = conflictSteps.length > 0 ? conflictSteps[0] : null;

  // Calculate distance by robot (count only 'move' actions, ignore 'wait')
  let totalDistance = 0;
  const distanceByRobot: Record<string, number> = {};

  for (const robot of robots) {
    const moveSteps = robot.trajectory.filter(p => p.action === 'move').length;
    distanceByRobot[robot.id] = moveSteps;
    totalDistance += moveSteps;
  }

  // Calculate delivery makespan: time step of the last delivery waypoint across all robots
  let makespan = 0;
  let completedTasksCount = 0;

  for (const robot of robots) {
    let robotLastDeliveryStep = 0;
    for (const pt of robot.trajectory) {
      if (pt.waypointType === 'delivery') {
        completedTasksCount++;
        if (pt.t > robotLastDeliveryStep) {
          robotLastDeliveryStep = pt.t;
        }
      }
    }
    if (robotLastDeliveryStep > makespan) {
      makespan = robotLastDeliveryStep;
    }
  }

  const totalTasksCount = tasks.length;
  const failedDeliveriesCount = Math.max(0, totalTasksCount - completedTasksCount);

  // Calculate percentage improvements
  let makespanImprovementPercent: number | null = null;
  if (baselineMakespan !== null && baselineMakespan > 0 && makespan > 0) {
    makespanImprovementPercent = parseFloat(
      (((baselineMakespan - makespan) / baselineMakespan) * 100).toFixed(1)
    );
  }

  let distanceImprovementPercent: number | null = null;
  if (baselineDistance !== null && baselineDistance > 0 && totalDistance > 0) {
    distanceImprovementPercent = parseFloat(
      (((baselineDistance - totalDistance) / baselineDistance) * 100).toFixed(1)
    );
  }

  const meanDistancePerTask =
    completedTasksCount > 0
      ? parseFloat((totalDistance / completedTasksCount).toFixed(1))
      : 0;

  return {
    totalConflicts: conflicts.length,
    vertexConflicts,
    edgeSwapConflicts,
    affectedRobotPairs: affectedPairs.size,
    firstConflictStep,
    makespan,
    baselineMakespan,
    makespanImprovementPercent,
    totalDistance,
    baselineDistance,
    distanceImprovementPercent,
    meanDistancePerTask,
    distanceByRobot,
    pathPlanningTimeMs: parseFloat(planningTimeMs.toFixed(2)),
    taskAllocationTimeMs: parseFloat(allocationTimeMs.toFixed(2)),
    coordinationTimeMs: parseFloat(planningTimeMs.toFixed(2)), // Included in planning
    totalTimeMs: parseFloat((allocationTimeMs + planningTimeMs).toFixed(2)),
    totalExpandedStates,
    completedTasksCount,
    totalTasksCount,
    failedDeliveriesCount,
  };
}
