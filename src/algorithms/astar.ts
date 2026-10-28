import { Cell, SearchEdge } from '../types';
import { areCellsEqual, cellToKey, keyToCell, getValidNeighbors, manhattanDistance, PriorityQueue } from './gridUtils';
import { PathSearchResult } from './bfs';

interface AStarNode {
  cell: Cell;
  g: number;
  h: number;
  f: number;
}

export function findPathAStar(
  start: Cell,
  goal: Cell,
  rows: number,
  cols: number,
  isObstacle: (cell: Cell) => boolean,
  robotId: string = 'R'
): PathSearchResult {
  const startTime = performance.now();
  const searchLogs: string[] = [];

  if (areCellsEqual(start, goal)) {
    return {
      path: [start],
      found: true,
      expandedCount: 0,
      generatedCount: 1,
      exploredEdgesCount: 0,
      expandedNodesSampled: [start],
      discoveredNodesSampled: [start],
      frontierNodesSampled: [],
      searchEdgesSampled: [],
      alternativeBranchesSampled: [],
      searchLogs: [`[A*:${robotId}] Start is equal to goal (${start.r},${start.c}). Path length: 1`],
      timeMs: 0,
    };
  }

  if (isObstacle(start) || isObstacle(goal)) {
    return {
      path: [],
      found: false,
      expandedCount: 0,
      generatedCount: 0,
      exploredEdgesCount: 0,
      expandedNodesSampled: [],
      discoveredNodesSampled: [],
      frontierNodesSampled: [],
      searchEdgesSampled: [],
      alternativeBranchesSampled: [],
      searchLogs: [`[A*:${robotId}] Start or Goal is inside obstacle! Search aborted.`],
      timeMs: performance.now() - startTime,
    };
  }

  const startKey = cellToKey(start);
  const goalKey = cellToKey(goal);

  const openSet = new PriorityQueue<AStarNode>();
  const initialH = manhattanDistance(start, goal);
  openSet.enqueue({ cell: start, g: 0, h: initialH, f: initialH }, initialH * 1000 + initialH);

  const gScore = new Map<string, number>();
  gScore.set(startKey, 0);

  const parentMap = new Map<string, string>();
  const closedSet = new Set<string>();

  let expandedCount = 0;
  let generatedCount = 1;
  const expandedList: Cell[] = [];
  const discoveredList: Cell[] = [start];
  const searchEdges: SearchEdge[] = [];

  let goalFound = false;

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;
    const currentKey = cellToKey(current.cell);

    // If we already closed this node with a better or equal cost, skip stale entry
    if (closedSet.has(currentKey)) {
      continue;
    }

    closedSet.add(currentKey);
    expandedCount++;
    expandedList.push(current.cell);

    if (currentKey === goalKey) {
      goalFound = true;
      break;
    }

    const currentG = gScore.get(currentKey) ?? current.g;
    const neighbors = getValidNeighbors(current.cell, rows, cols, isObstacle);

    for (const neighbor of neighbors) {
      const neighborKey = cellToKey(neighbor);
      if (closedSet.has(neighborKey)) {
        continue;
      }

      const tentativeG = currentG + 1;
      const prevG = gScore.get(neighborKey);

      if (prevG === undefined || tentativeG < prevG) {
        if (prevG === undefined) {
          generatedCount++;
          discoveredList.push(neighbor);
        }

        gScore.set(neighborKey, tentativeG);
        parentMap.set(neighborKey, currentKey);

        const h = manhattanDistance(neighbor, goal);
        const f = tentativeG + h;

        // Tie-breaker: prefer higher g / smaller h to reach goal faster
        const priority = f * 10000 + h;
        openSet.enqueue({ cell: neighbor, g: tentativeG, h, f }, priority);

        searchEdges.push({
          fromR: current.cell.r,
          fromC: current.cell.c,
          toR: neighbor.r,
          toC: neighbor.c,
          robotId,
        });
      }
    }
  }

  const endTime = performance.now();

  // Extract frontier nodes from remaining openSet
  const frontierSampled: Cell[] = [];
  while (!openSet.isEmpty() && frontierSampled.length < 200) {
    const node = openSet.dequeue()!;
    const key = cellToKey(node.cell);
    if (!closedSet.has(key)) {
      frontierSampled.push(node.cell);
    }
  }

  if (!goalFound) {
    searchLogs.push(
      `[A*:${robotId}] Goal unreachable from (${start.r},${start.c}) to (${goal.r},${goal.c}). Expanded: ${expandedCount}, Discovered: ${generatedCount}`
    );
    return {
      path: [],
      found: false,
      expandedCount,
      generatedCount,
      exploredEdgesCount: searchEdges.length,
      expandedNodesSampled: expandedList.slice(0, 400),
      discoveredNodesSampled: discoveredList.slice(0, 400),
      frontierNodesSampled: frontierSampled,
      searchEdgesSampled: searchEdges.slice(0, 500),
      alternativeBranchesSampled: searchEdges.slice(0, 500),
      searchLogs,
      timeMs: endTime - startTime,
    };
  }

  // Reconstruct path
  const path: Cell[] = [];
  let currKey: string | undefined = goalKey;
  while (currKey) {
    path.unshift(keyToCell(currKey));
    currKey = parentMap.get(currKey);
  }

  // Identify path edges vs alternative explored branches
  const pathEdgeKeys = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    pathEdgeKeys.add(`${path[i].r},${path[i].c}->${path[i + 1].r},${path[i + 1].c}`);
    pathEdgeKeys.add(`${path[i + 1].r},${path[i + 1].c}->${path[i].r},${path[i].c}`);
  }

  const searchEdgesAnnotated: SearchEdge[] = searchEdges.map(e => ({
    ...e,
    isAlternativeBranch: !pathEdgeKeys.has(`${e.fromR},${e.fromC}->${e.toR},${e.toC}`),
  }));

  const alternativeBranches = searchEdgesAnnotated.filter(e => e.isAlternativeBranch);

  searchLogs.push(
    `[A*:${robotId}] Optimal path found: ${path.length} steps (${path.length - 1} moves). Expanded: ${expandedCount}, Discovered: ${generatedCount}, Explored Edges: ${searchEdges.length}`
  );

  return {
    path,
    found: true,
    expandedCount,
    generatedCount,
    exploredEdgesCount: searchEdges.length,
    expandedNodesSampled: expandedList.slice(0, 400),
    discoveredNodesSampled: discoveredList.slice(0, 400),
    frontierNodesSampled: frontierSampled,
    searchEdgesSampled: searchEdgesAnnotated.slice(0, 500),
    alternativeBranchesSampled: alternativeBranches.slice(0, 400),
    searchLogs,
    timeMs: endTime - startTime,
  };
}
