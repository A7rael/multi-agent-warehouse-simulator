import { Cell, SearchEdge, TimePoint } from '../types';
import { areCellsEqual, cellToKey, getValidNeighbors, manhattanDistance, PriorityQueue } from './gridUtils';

export interface SpaceTimeSearchResult {
  trajectory: TimePoint[];
  found: boolean;
  expandedCount: number;
  generatedCount: number;
  expandedNodesSampled: Cell[];
  frontierNodesSampled: Cell[];
  searchEdgesSampled: SearchEdge[];
  searchLogs: string[];
  timeMs: number;
}

export interface ReservationTable {
  // Key: "r,c,t"
  vertexReservations: Set<string>;
  // Key: "fromR,fromC->toR,toC@t"
  edgeReservations: Set<string>;
  // Key: "r,c" -> permanent reservation starting from time t (e.g. parked after final task)
  permanentReservations?: Map<string, number>;
}

export function createReservationKey(r: number, c: number, t: number): string {
  return `${r},${c},${t}`;
}

export function createEdgeReservationKey(fromR: number, fromC: number, toR: number, toC: number, t: number): string {
  return `${fromR},${fromC}->${toR},${toC}@${t}`;
}

interface STNode {
  r: number;
  c: number;
  t: number;
  g: number;
  h: number;
  f: number;
}

function stateKey(r: number, c: number, t: number): string {
  return `${r},${c},${t}`;
}

export function findSpaceTimePath(
  start: Cell,
  startTimeStep: number,
  goal: Cell,
  rows: number,
  cols: number,
  isObstacle: (cell: Cell) => boolean,
  reservations: ReservationTable,
  robotId: string = 'R',
  maxTimeHorizon: number = 300,
  maxExpansions: number = 30000
): SpaceTimeSearchResult {
  const startTime = performance.now();
  const searchLogs: string[] = [];

  if (isObstacle(start) || isObstacle(goal)) {
    return {
      trajectory: [],
      found: false,
      expandedCount: 0,
      generatedCount: 0,
      expandedNodesSampled: [],
      frontierNodesSampled: [],
      searchEdgesSampled: [],
      searchLogs: [`[ST-CSP:${robotId}] Start or Goal is inside obstacle!`],
      timeMs: performance.now() - startTime,
    };
  }

  // Check if start is currently reserved at startTimeStep
  if (reservations.vertexReservations.has(createReservationKey(start.r, start.c, startTimeStep))) {
    return {
      trajectory: [],
      found: false,
      expandedCount: 0,
      generatedCount: 0,
      expandedNodesSampled: [],
      frontierNodesSampled: [],
      searchEdgesSampled: [],
      searchLogs: [`[ST-CSP:${robotId}] Starting position (${start.r},${start.c}) is reserved at t=${startTimeStep}!`],
      timeMs: performance.now() - startTime,
    };
  }

  const openSet = new PriorityQueue<STNode>();
  const initialH = manhattanDistance(start, goal);
  openSet.enqueue(
    { r: start.r, c: start.c, t: startTimeStep, g: 0, h: initialH, f: initialH },
    initialH * 1000 + initialH
  );

  const gScore = new Map<string, number>();
  gScore.set(stateKey(start.r, start.c, startTimeStep), 0);

  const parentMap = new Map<string, string>();
  const closedSet = new Set<string>();

  let expandedCount = 0;
  let generatedCount = 1;
  const expandedList: Cell[] = [];
  const searchEdges: SearchEdge[] = [];

  let goalNode: STNode | null = null;

  while (!openSet.isEmpty()) {
    if (expandedCount >= maxExpansions) {
      searchLogs.push(`[ST-CSP:${robotId}] Reached maximum expansion limit (${maxExpansions}).`);
      break;
    }

    const current = openSet.dequeue()!;
    const curKey = stateKey(current.r, current.c, current.t);

    if (closedSet.has(curKey)) {
      continue;
    }

    closedSet.add(curKey);
    expandedCount++;
    expandedList.push({ r: current.r, c: current.c });

    // Check if goal reached
    if (current.r === goal.r && current.c === goal.c) {
      goalNode = current;
      break;
    }

    if (current.t >= maxTimeHorizon) {
      continue;
    }

    const currentG = gScore.get(curKey) ?? current.g;
    const nextT = current.t + 1;

    // Generate candidate actions: 4 directions + WAIT action
    const candidateMoves: { cell: Cell; action: 'move' | 'wait' }[] = [];

    // 1. Move to 4-connected neighbors
    const neighbors = getValidNeighbors({ r: current.r, c: current.c }, rows, cols, isObstacle);
    for (const n of neighbors) {
      candidateMoves.push({ cell: n, action: 'move' });
    }

    // 2. WAIT action (staying at current cell)
    candidateMoves.push({ cell: { r: current.r, c: current.c }, action: 'wait' });

    for (const move of candidateMoves) {
      const nextCell = move.cell;
      const nextStateKey = stateKey(nextCell.r, nextCell.c, nextT);

      if (closedSet.has(nextStateKey)) {
        continue;
      }

      // Check Vertex Reservation Constraint:
      // Another robot is occupying nextCell at time nextT
      const vKey = createReservationKey(nextCell.r, nextCell.c, nextT);
      if (reservations.vertexReservations.has(vKey)) {
        continue; // Collision forbidden
      }

      // Check Edge-Swap Reservation Constraint:
      // If moving from (current.r, current.c) to (nextCell.r, nextCell.c),
      // we must NOT have another robot traversing (nextCell) -> (current) at nextT
      if (move.action === 'move') {
        const edgeConflictKey = createEdgeReservationKey(
          nextCell.r,
          nextCell.c,
          current.r,
          current.c,
          nextT
        );
        if (reservations.edgeReservations.has(edgeConflictKey)) {
          continue; // Edge-swap collision forbidden
        }
      }

      const tentativeG = currentG + 1;
      const prevG = gScore.get(nextStateKey);

      if (prevG === undefined || tentativeG < prevG) {
        gScore.set(nextStateKey, tentativeG);
        parentMap.set(nextStateKey, curKey);
        generatedCount++;

        const h = manhattanDistance(nextCell, goal);
        // Add small penalty for waiting to prefer forward progress if distance is equal
        const waitCost = move.action === 'wait' ? 0.05 : 0;
        const f = tentativeG + h + waitCost;
        const priority = f * 10000 + h;

        openSet.enqueue(
          { r: nextCell.r, c: nextCell.c, t: nextT, g: tentativeG, h, f },
          priority
        );

        if (move.action === 'move') {
          searchEdges.push({
            fromR: current.r,
            fromC: current.c,
            toR: nextCell.r,
            toC: nextCell.c,
            robotId,
          });
        }
      }
    }
  }

  const endTime = performance.now();

  // Extract frontier nodes
  const frontierSampled: Cell[] = [];
  while (!openSet.isEmpty() && frontierSampled.length < 200) {
    const node = openSet.dequeue()!;
    frontierSampled.push({ r: node.r, c: node.c });
  }

  if (!goalNode) {
    searchLogs.push(
      `[ST-CSP:${robotId}] Path planning failed: no valid trajectory under current reservations. Expanded: ${expandedCount}, Horizon: ${maxTimeHorizon}`
    );
    return {
      trajectory: [],
      found: false,
      expandedCount,
      generatedCount,
      expandedNodesSampled: expandedList.slice(0, 300),
      frontierNodesSampled: frontierSampled,
      searchEdgesSampled: searchEdges.slice(0, 400),
      searchLogs,
      timeMs: endTime - startTime,
    };
  }

  // Reconstruct space-time trajectory
  const trajectory: TimePoint[] = [];
  let currKey: string | undefined = stateKey(goalNode.r, goalNode.c, goalNode.t);

  while (currKey) {
    const parts = currKey.split(',');
    const r = parseInt(parts[0], 10);
    const c = parseInt(parts[1], 10);
    const t = parseInt(parts[2], 10);

    const parentK: string | undefined = parentMap.get(currKey);
    let action: 'move' | 'wait' = 'move';
    if (parentK) {
      const pParts = parentK.split(',');
      const pr = parseInt(pParts[0], 10);
      const pc = parseInt(pParts[1], 10);
      if (pr === r && pc === c) {
        action = 'wait';
      }
    }

    trajectory.unshift({ t, r, c, action });
    currKey = parentK;
  }

  // Set initial action
  if (trajectory.length > 0) {
    trajectory[0].action = 'wait';
  }

  const waitsCount = trajectory.filter(p => p.action === 'wait').length - 1;
  searchLogs.push(
    `[ST-CSP:${robotId}] Coordinated trajectory found! Steps: ${trajectory.length}, Waits: ${Math.max(0, waitsCount)}, Expanded: ${expandedCount}`
  );

  return {
    trajectory,
    found: true,
    expandedCount,
    generatedCount,
    expandedNodesSampled: expandedList.slice(0, 300),
    frontierNodesSampled: frontierSampled,
    searchEdgesSampled: searchEdges.slice(0, 400),
    searchLogs,
    timeMs: endTime - startTime,
  };
}
