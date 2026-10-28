import {
  Robot,
  Task,
  CoordinationSolver,
  TimePoint,
  RobotPlanningDiagnostics,
  SearchEdge,
  Cell
} from '../types';
import { areCellsEqual, cellToKey } from './gridUtils';
import { findPathBFS } from './bfs';
import { findPathAStar } from './astar';
import {
  findSpaceTimePath,
  ReservationTable,
  createReservationKey,
  createEdgeReservationKey
} from './spaceTimeSearch';

export interface MultiAgentPlanningResult {
  robots: Robot[];
  success: boolean;
  failureReason?: string;
  totalExpandedStates: number;
  totalTimeMs: number;
}

export function planMultiAgentFleet(
  robotsInput: Robot[],
  tasks: Task[],
  allocations: Map<string, string[]>,
  solver: CoordinationSolver,
  rows: number,
  cols: number,
  isObstacle: (cell: Cell) => boolean
): MultiAgentPlanningResult {
  const startTime = performance.now();

  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  // Deep clone robots to avoid mutating input during retries
  const robots: Robot[] = robotsInput.map(r => ({
    ...r,
    assignedTaskIds: allocations.get(r.id) || [],
    trajectory: [],
    currentTaskIndex: 0,
    diagnostics: {
      robotId: r.id,
      algorithm: solver,
      expandedNodesCount: 0,
      generatedNodesCount: 0,
      exploredEdgesCount: 0,
      pathLength: 0,
      searchEdgesSampled: [],
      alternativeBranchesSampled: [],
      expandedNodesSampled: [],
      discoveredNodesSampled: [],
      frontierNodesSampled: [],
      searchStatus: 'not_run',
      searchLogs: [],
      computationTimeMs: 0,
    },
  }));

  let totalExpanded = 0;

  // 1. Independent Modes: BFS or A*
  if (solver === 'independent_bfs' || solver === 'independent_astar') {
    const isBFS = solver === 'independent_bfs';

    for (const robot of robots) {
      const robotStartTime = performance.now();
      const assignedIds = robot.assignedTaskIds;
      const robotTasks = assignedIds.map(id => taskMap.get(id)!).filter(Boolean);

      const trajectory: TimePoint[] = [];
      let currentPos = robot.start;
      let currentTime = 0;

      // Initial point at t=0
      trajectory.push({
        t: 0,
        r: currentPos.r,
        c: currentPos.c,
        action: 'wait',
        waypointType: 'start',
      });

      let robotExpanded = 0;
      let robotGenerated = 0;
      let robotExploredEdges = 0;
      const sampledEdges: SearchEdge[] = [];
      const sampledAltBranches: SearchEdge[] = [];
      const sampledExpanded: Cell[] = [];
      const sampledDiscovered: Cell[] = [];
      const sampledFrontier: Cell[] = [];
      const logs: string[] = [];

      let robotSuccess = true;

      for (let taskIdx = 0; taskIdx < robotTasks.length; taskIdx++) {
        const task = robotTasks[taskIdx];

        // Segment A: currentPos -> task.pickup
        const legA = isBFS
          ? findPathBFS(currentPos, task.pickup, rows, cols, isObstacle, robot.id)
          : findPathAStar(currentPos, task.pickup, rows, cols, isObstacle, robot.id);

        robotExpanded += legA.expandedCount;
        robotGenerated += legA.generatedCount;
        sampledEdges.push(...legA.searchEdgesSampled.slice(0, 50));
        sampledExpanded.push(...legA.expandedNodesSampled.slice(0, 30));
        sampledFrontier.push(...legA.frontierNodesSampled.slice(0, 20));
        logs.push(...legA.searchLogs);

        if (!legA.found) {
          robotSuccess = false;
          logs.push(`[${robot.id}] Could not find spatial path to Pickup (${task.pickup.r},${task.pickup.c}) of ${task.name}`);
          break;
        }

        // Add legA to trajectory (skip index 0 as it equals currentPos)
        for (let i = 1; i < legA.path.length; i++) {
          currentTime++;
          const cell = legA.path[i];
          const isPickup = i === legA.path.length - 1;
          trajectory.push({
            t: currentTime,
            r: cell.r,
            c: cell.c,
            action: 'move',
            waypointType: isPickup ? 'pickup' : 'none',
            taskId: isPickup ? task.id : undefined,
          });
        }
        currentPos = task.pickup;

        // Segment B: task.pickup -> task.delivery
        const legB = isBFS
          ? findPathBFS(currentPos, task.delivery, rows, cols, isObstacle, robot.id)
          : findPathAStar(currentPos, task.delivery, rows, cols, isObstacle, robot.id);

        robotExpanded += legB.expandedCount;
        robotGenerated += legB.generatedCount;
        sampledEdges.push(...legB.searchEdgesSampled.slice(0, 50));
        sampledExpanded.push(...legB.expandedNodesSampled.slice(0, 30));
        sampledFrontier.push(...legB.frontierNodesSampled.slice(0, 20));
        logs.push(...legB.searchLogs);

        if (!legB.found) {
          robotSuccess = false;
          logs.push(`[${robot.id}] Could not find spatial path to Delivery (${task.delivery.r},${task.delivery.c}) of ${task.name}`);
          break;
        }

        for (let i = 1; i < legB.path.length; i++) {
          currentTime++;
          const cell = legB.path[i];
          const isDelivery = i === legB.path.length - 1;
          trajectory.push({
            t: currentTime,
            r: cell.r,
            c: cell.c,
            action: 'move',
            waypointType: isDelivery ? 'delivery' : 'none',
            taskId: isDelivery ? task.id : undefined,
          });
        }
        currentPos = task.delivery;
      }

      totalExpanded += robotExpanded;
      const robotEndTime = performance.now();

      robot.trajectory = trajectory;
      robot.diagnostics = {
        robotId: robot.id,
        algorithm: isBFS ? 'Independent: BFS' : 'Independent: A*',
        expandedNodesCount: robotExpanded,
        generatedNodesCount: robotGenerated,
        exploredEdgesCount: robotExploredEdges,
        pathLength: trajectory.length,
        searchEdgesSampled: sampledEdges.slice(0, 250),
        alternativeBranchesSampled: sampledAltBranches.slice(0, 200),
        expandedNodesSampled: sampledExpanded.slice(0, 150),
        discoveredNodesSampled: sampledDiscovered.slice(0, 150),
        frontierNodesSampled: sampledFrontier.slice(0, 100),
        searchStatus: robotSuccess ? 'optimal' : 'failed',
        searchLogs: logs,
        computationTimeMs: parseFloat((robotEndTime - robotStartTime).toFixed(2)),
      };
    }

    return {
      robots,
      success: true,
      totalExpandedStates: totalExpanded,
      totalTimeMs: performance.now() - startTime,
    };
  }

  // 2. Coordinated Mode: Space-Time CSP (Prioritized planning with bounded backtracking / priority retries)
  // Define priority orderings to try
  const priorityStrategies: (() => number[])[] = [
    // Priority 1: Descending workload (number of assigned tasks, then estimated distance)
    () => {
      const indices = robots.map((_, i) => i);
      return indices.sort((a, b) => {
        const countDiff = robots[b].assignedTaskIds.length - robots[a].assignedTaskIds.length;
        if (countDiff !== 0) return countDiff;
        return a - b;
      });
    },
    // Priority 2: Natural index order (0, 1, 2, ...)
    () => robots.map((_, i) => i),
    // Priority 3: Reversed natural order
    () => robots.map((_, i) => i).reverse(),
    // Priority 4: Alternating order
    () => {
      const evens = robots.map((_, i) => i).filter(i => i % 2 === 0);
      const odds = robots.map((_, i) => i).filter(i => i % 2 !== 0);
      return [...evens, ...odds];
    },
    // Priority 5: Shortest tasks first
    () => {
      const indices = robots.map((_, i) => i);
      return indices.sort((a, b) => robots[a].assignedTaskIds.length - robots[b].assignedTaskIds.length);
    },
  ];

  let bestRobotsResult: Robot[] | null = null;
  let planningSucceeded = false;
  let finalFailureReason: string | undefined;

  for (let attempt = 0; attempt < priorityStrategies.length; attempt++) {
    const priorityIndices = priorityStrategies[attempt]();
    const reservations: ReservationTable = {
      vertexReservations: new Set<string>(),
      edgeReservations: new Set<string>(),
      permanentReservations: new Map<string, number>(),
    };

    // For other robots in the fleet, their start positions are occupied at t=0.
    // We add reservations for previously committed robots' trajectories.
    // Unplanned robots' starts at t=0 are added, excluding the current robot.
    for (const r of robots) {
      // We will dynamically add other robots' starts when planning each robot
    }

    let attemptSuccess = true;
    let attemptExpanded = 0;

    // Reset trajectories for this attempt
    const attemptRobots: Robot[] = robots.map(r => ({
      ...r,
      trajectory: [],
      diagnostics: { ...r.diagnostics },
    }));

    for (const robotIdx of priorityIndices) {
      const robot = attemptRobots[robotIdx];
      const robotStartTime = performance.now();
      const assignedIds = robot.assignedTaskIds;
      const robotTasks = assignedIds.map(id => taskMap.get(id)!).filter(Boolean);

      const trajectory: TimePoint[] = [];
      let currentPos = robot.start;
      let currentTime = 0;

      // Start at t=0
      trajectory.push({
        t: 0,
        r: currentPos.r,
        c: currentPos.c,
        action: 'wait',
        waypointType: 'start',
      });

      let robotExpanded = 0;
      let robotGenerated = 0;
      let robotExploredEdges = 0;
      const sampledEdges: SearchEdge[] = [];
      const sampledAltBranches: SearchEdge[] = [];
      const sampledExpanded: Cell[] = [];
      const sampledDiscovered: Cell[] = [];
      const sampledFrontier: Cell[] = [];
      const logs: string[] = [];

      let robotPlanSuccess = true;

      for (let taskIdx = 0; taskIdx < robotTasks.length; taskIdx++) {
        const task = robotTasks[taskIdx];

        // Leg A: currentPos -> task.pickup in space-time
        const legA = findSpaceTimePath(
          currentPos,
          currentTime,
          task.pickup,
          rows,
          cols,
          isObstacle,
          reservations,
          robot.id
        );

        robotExpanded += legA.expandedCount;
        robotGenerated += legA.generatedCount;
        sampledEdges.push(...legA.searchEdgesSampled.slice(0, 50));
        sampledExpanded.push(...legA.expandedNodesSampled.slice(0, 30));
        sampledFrontier.push(...legA.frontierNodesSampled.slice(0, 20));
        logs.push(...legA.searchLogs);

        if (!legA.found) {
          robotPlanSuccess = false;
          attemptSuccess = false;
          finalFailureReason = `Space-time planning conflict: Robot ${robot.id} could not reach pickup for ${task.name} under current reservations.`;
          break;
        }

        // Incorporate legA trajectory (skip first point as it's at currentPos)
        for (let i = 1; i < legA.trajectory.length; i++) {
          const pt = legA.trajectory[i];
          const isPickup = i === legA.trajectory.length - 1;
          trajectory.push({
            ...pt,
            waypointType: isPickup ? 'pickup' : 'none',
            taskId: isPickup ? task.id : undefined,
          });
        }
        currentPos = task.pickup;
        currentTime = trajectory[trajectory.length - 1].t;

        // Leg B: task.pickup -> task.delivery in space-time
        const legB = findSpaceTimePath(
          currentPos,
          currentTime,
          task.delivery,
          rows,
          cols,
          isObstacle,
          reservations,
          robot.id
        );

        robotExpanded += legB.expandedCount;
        robotGenerated += legB.generatedCount;
        sampledEdges.push(...legB.searchEdgesSampled.slice(0, 50));
        sampledExpanded.push(...legB.expandedNodesSampled.slice(0, 30));
        sampledFrontier.push(...legB.frontierNodesSampled.slice(0, 20));
        logs.push(...legB.searchLogs);

        if (!legB.found) {
          robotPlanSuccess = false;
          attemptSuccess = false;
          finalFailureReason = `Space-time planning conflict: Robot ${robot.id} could not reach delivery for ${task.name} under current reservations.`;
          break;
        }

        for (let i = 1; i < legB.trajectory.length; i++) {
          const pt = legB.trajectory[i];
          const isDelivery = i === legB.trajectory.length - 1;
          trajectory.push({
            ...pt,
            waypointType: isDelivery ? 'delivery' : 'none',
            taskId: isDelivery ? task.id : undefined,
          });
        }
        currentPos = task.delivery;
        currentTime = trajectory[trajectory.length - 1].t;
      }

      attemptExpanded += robotExpanded;
      const robotEndTime = performance.now();

      robot.trajectory = trajectory;
      robot.diagnostics = {
        robotId: robot.id,
        algorithm: 'Coordinated: Space-Time CSP',
        expandedNodesCount: robotExpanded,
        generatedNodesCount: robotGenerated,
        exploredEdgesCount: sampledEdges.length,
        pathLength: trajectory.length,
        searchEdgesSampled: sampledEdges.slice(0, 250),
        alternativeBranchesSampled: [],
        expandedNodesSampled: sampledExpanded.slice(0, 150),
        discoveredNodesSampled: sampledExpanded.slice(0, 150),
        frontierNodesSampled: sampledFrontier.slice(0, 100),
        searchStatus: robotPlanSuccess ? 'optimal' : 'failed',
        searchLogs: logs,
        computationTimeMs: parseFloat((robotEndTime - robotStartTime).toFixed(2)),
      };

      if (!attemptSuccess) {
        break; // Retry with next priority ordering
      }

      // Commit this robot's reservations
      for (let i = 0; i < trajectory.length; i++) {
        const pt = trajectory[i];
        reservations.vertexReservations.add(createReservationKey(pt.r, pt.c, pt.t));

        if (i > 0) {
          const prevPt = trajectory[i - 1];
          if (pt.action === 'move') {
            reservations.edgeReservations.add(
              createEdgeReservationKey(prevPt.r, prevPt.c, pt.r, pt.c, pt.t)
            );
          }
        }
      }
    }

    totalExpanded += attemptExpanded;

    if (attemptSuccess) {
      planningSucceeded = true;
      bestRobotsResult = attemptRobots;
      break; // Success!
    } else {
      bestRobotsResult = attemptRobots;
    }
  }

  return {
    robots: bestRobotsResult || robots,
    success: planningSucceeded,
    failureReason: planningSucceeded ? undefined : (finalFailureReason || 'Exhausted prioritized planning retries.'),
    totalExpandedStates: totalExpanded,
    totalTimeMs: performance.now() - startTime,
  };
}
