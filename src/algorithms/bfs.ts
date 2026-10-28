import { Cell, SearchEdge } from '../types';
import { areCellsEqual, cellToKey, keyToCell, getValidNeighbors } from './gridUtils';

export interface PathSearchResult {
  path: Cell[];
  found: boolean;
  expandedCount: number;
  generatedCount: number; // discovered count
  exploredEdgesCount: number;
  expandedNodesSampled: Cell[];
  discoveredNodesSampled: Cell[];
  frontierNodesSampled: Cell[];
  searchEdgesSampled: SearchEdge[];
  alternativeBranchesSampled: SearchEdge[];
  searchLogs: string[];
  timeMs: number;
}

export function findPathBFS(
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
      searchLogs: [`[BFS:${robotId}] Start is equal to goal (${start.r},${start.c}). Path length: 1`],
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
      searchLogs: [`[BFS:${robotId}] Start or Goal is inside obstacle! Search aborted.`],
      timeMs: performance.now() - startTime,
    };
  }

  const startKey = cellToKey(start);
  const goalKey = cellToKey(goal);

  const queue: Cell[] = [start];
  const parentMap = new Map<string, string>();
  const visited = new Set<string>([startKey]);

  let expandedCount = 0;
  let generatedCount = 1;
  const expandedList: Cell[] = [];
  const discoveredList: Cell[] = [start];
  const searchEdges: SearchEdge[] = [];

  let goalFound = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = cellToKey(current);
    expandedCount++;
    expandedList.push(current);

    if (currentKey === goalKey) {
      goalFound = true;
      break;
    }

    const neighbors = getValidNeighbors(current, rows, cols, isObstacle);
    for (const neighbor of neighbors) {
      const neighborKey = cellToKey(neighbor);
      if (!visited.has(neighborKey)) {
        visited.add(neighborKey);
        parentMap.set(neighborKey, currentKey);
        generatedCount++;
        discoveredList.push(neighbor);
        queue.push(neighbor);

        searchEdges.push({
          fromR: current.r,
          fromC: current.c,
          toR: neighbor.r,
          toC: neighbor.c,
          robotId,
        });

        if (neighborKey === goalKey) {
          goalFound = true;
          break;
        }
      }
    }

    if (goalFound) {
      break;
    }
  }

  const endTime = performance.now();

  if (!goalFound) {
    searchLogs.push(
      `[BFS:${robotId}] Goal unreachable from (${start.r},${start.c}) to (${goal.r},${goal.c}). Expanded: ${expandedCount}, Discovered: ${generatedCount}`
    );
    return {
      path: [],
      found: false,
      expandedCount,
      generatedCount,
      exploredEdgesCount: searchEdges.length,
      expandedNodesSampled: expandedList.slice(0, 400),
      discoveredNodesSampled: discoveredList.slice(0, 400),
      frontierNodesSampled: queue.slice(0, 200),
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
    `[BFS:${robotId}] Path found: ${path.length} steps (${path.length - 1} moves). Expanded: ${expandedCount}, Discovered: ${generatedCount}, Explored Edges: ${searchEdges.length}`
  );

  return {
    path,
    found: true,
    expandedCount,
    generatedCount,
    exploredEdgesCount: searchEdges.length,
    expandedNodesSampled: expandedList.slice(0, 400),
    discoveredNodesSampled: discoveredList.slice(0, 400),
    frontierNodesSampled: queue.slice(0, 200),
    searchEdgesSampled: searchEdgesAnnotated.slice(0, 500),
    alternativeBranchesSampled: alternativeBranches.slice(0, 400),
    searchLogs,
    timeMs: endTime - startTime,
  };
}
