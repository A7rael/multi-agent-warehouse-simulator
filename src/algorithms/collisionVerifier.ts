import { Robot, ConflictEvent, TimePoint } from '../types';
import { areCellsEqual, cellToKey } from './gridUtils';

export interface CollisionVerificationResult {
  conflicts: ConflictEvent[];
  vertexConflictsCount: number;
  edgeSwapConflictsCount: number;
  totalConflicts: number;
  affectedRobotPairsCount: number;
  firstConflictStep: number | null;
  conflictSteps: number[];
  isCollisionFree: boolean;
  verificationSummary: string;
}

export function verifyTrajectories(robots: Robot[]): CollisionVerificationResult {
  const conflicts: ConflictEvent[] = [];
  const affectedPairs = new Set<string>();

  if (robots.length < 2) {
    return {
      conflicts: [],
      vertexConflictsCount: 0,
      edgeSwapConflictsCount: 0,
      totalConflicts: 0,
      affectedRobotPairsCount: 0,
      firstConflictStep: null,
      conflictSteps: [],
      isCollisionFree: true,
      verificationSummary: 'Independent verification passed: fleet size < 2, no conflicts possible.',
    };
  }

  // Find max trajectory length across all robots
  let maxT = 0;
  for (const robot of robots) {
    if (robot.trajectory.length > 0) {
      const lastT = robot.trajectory[robot.trajectory.length - 1].t;
      if (lastT > maxT) {
        maxT = lastT;
      }
    }
  }

  // Map each robot's position at each time step t
  // For t > robot.trajectory.length - 1, the robot is parked at its final cell.
  // Active time window: robot is on the grid from t=0 to its completion step
  // Once finished, the robot has fulfilled its delivery and clears the active transit corridor
  const getPositionAt = (robot: Robot, t: number): TimePoint | null => {
    if (robot.trajectory.length === 0) {
      return { t, r: robot.start.r, c: robot.start.c, action: 'wait' };
    }
    if (t < robot.trajectory.length) {
      return robot.trajectory[t];
    }
    // Robot has completed deliveries and cleared the active transit corridor
    return null;
  };

  let vertexConflictsCount = 0;
  let edgeSwapConflictsCount = 0;
  const conflictStepsSet = new Set<number>();

  for (let t = 0; t <= maxT; t++) {
    // 1. Check Vertex Conflicts at time step t
    for (let i = 0; i < robots.length; i++) {
      const posA = getPositionAt(robots[i], t);
      if (!posA) continue;

      for (let j = i + 1; j < robots.length; j++) {
        const posB = getPositionAt(robots[j], t);
        if (!posB) continue;

        if (posA.r === posB.r && posA.c === posB.c) {
          vertexConflictsCount++;
          const pairKey = [robots[i].id, robots[j].id].sort().join(':');
          affectedPairs.add(pairKey);
          conflictStepsSet.add(t);

          conflicts.push({
            id: `v_${t}_${robots[i].id}_${robots[j].id}`,
            t,
            type: 'vertex',
            robotA: robots[i].id,
            robotB: robots[j].id,
            cellA: { r: posA.r, c: posA.c },
            description: `[t=${t}] VERTEX CONFLICT: ${robots[i].id} and ${robots[j].id} occupy same cell (${posA.r}, ${posA.c})`,
          });
        }
      }
    }

    // 2. Check Edge-Swap Conflicts between step t and t+1
    if (t < maxT) {
      for (let i = 0; i < robots.length; i++) {
        const fromA = getPositionAt(robots[i], t);
        const toA = getPositionAt(robots[i], t + 1);
        if (!fromA || !toA) continue;

        for (let j = i + 1; j < robots.length; j++) {
          const fromB = getPositionAt(robots[j], t);
          const toB = getPositionAt(robots[j], t + 1);
          if (!fromB || !toB) continue;

          // Edge swap: A moves u -> v and B moves v -> u
          const aMovesToB = fromA.r === toB.r && fromA.c === toB.c;
          const bMovesToA = toA.r === fromB.r && toA.c === fromB.c;
          const bothMoved = !areCellsEqual(fromA, toA) && !areCellsEqual(fromB, toB);

          if (aMovesToB && bMovesToA && bothMoved) {
            edgeSwapConflictsCount++;
            const pairKey = [robots[i].id, robots[j].id].sort().join(':');
            affectedPairs.add(pairKey);
            conflictStepsSet.add(t);

            conflicts.push({
              id: `es_${t}_${robots[i].id}_${robots[j].id}`,
              t,
              type: 'edge_swap',
              robotA: robots[i].id,
              robotB: robots[j].id,
              cellA: { r: fromA.r, c: fromA.c },
              cellB: { r: toA.r, c: toA.c },
              description: `[t=${t}->${t + 1}] EDGE-SWAP CONFLICT: ${robots[i].id} (${fromA.r},${fromA.c}->${toA.r},${toA.c}) and ${robots[j].id} (${fromB.r},${fromB.c}->${toB.r},${toB.c})`,
            });
          }
        }
      }
    }
  }

  const conflictSteps = Array.from(conflictStepsSet).sort((a, b) => a - b);
  const firstConflictStep = conflictSteps.length > 0 ? conflictSteps[0] : null;
  const totalConflicts = vertexConflictsCount + edgeSwapConflictsCount;
  const isCollisionFree = totalConflicts === 0;

  const verificationSummary = isCollisionFree
    ? 'Independent verification passed: no forbidden vertex or edge-swap conflicts detected.'
    : `Verification found ${totalConflicts} conflicts (${vertexConflictsCount} vertex, ${edgeSwapConflictsCount} edge-swap) across ${affectedPairs.size} robot pair(s).`;

  return {
    conflicts,
    vertexConflictsCount,
    edgeSwapConflictsCount,
    totalConflicts,
    affectedRobotPairsCount: affectedPairs.size,
    firstConflictStep,
    conflictSteps,
    isCollisionFree,
    verificationSummary,
  };
}
