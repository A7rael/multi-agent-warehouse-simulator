import { Robot, Task, Cell, WarehouseEnvironment } from '../types';
import { generateWarehouseLayout, WarehouseLayout } from './warehouse';
import { createRNG, areCellsEqual, cellToKey } from '../algorithms/gridUtils';

export const ROBOT_PALETTE: string[] = [
  '#27C5F5', // Cyan
  '#37D995', // Emerald Green
  '#FFBE45', // Amber / Gold
  '#FF4567', // Coral Red
  '#9D65FF', // Electric Violet
  '#FF76C8', // Rose Pink
  '#00E5FF', // Sky Neon
  '#FF9100', // Bright Orange
  '#76FF03', // Lime Accent
  '#E040FB', // Neon Magenta
  '#64FFDA', // Mint Green
  '#FFD740', // Golden Yellow
  '#18FFFF', // Aqua Blue
  '#B388FF', // Soft Lavender
  '#FF5252', // Crimson
  '#69F0AE', // Seafoam
  '#FFAB40', // Tangerine
  '#40C4FF', // Light Cyan
  '#B2FF59', // Light Lime
  '#EA80FC', // Purple Pink
  '#00B0FF', // Deep Sky
  '#F50057', // Vivid Pink
  '#00E676', // Bright Green
  '#FF6D00', // Deep Orange
  '#C51162', // Ruby
  '#00BFA5', // Teal
  '#AA00FF', // Deep Purple
  '#6200EA', // Indigo
];

export interface GeneratedInstance {
  layout: WarehouseLayout;
  robots: Robot[];
  tasks: Task[];
  seed: number;
}

export function generateInstance(
  robotCount: number = 8,
  taskCount: number = 16,
  environment: WarehouseEnvironment = 'standard',
  seed: number = 42
): GeneratedInstance {
  const rng = createRNG(seed);
  const layout = generateWarehouseLayout(30, 30, environment, seed);

  // Pick starting positions: ALWAYS on the permanent charging station row (row 29)
  const chargingColumns: number[] = [];
  const step = Math.max(1, Math.floor(30 / (robotCount + 1)));
  for (let i = 0; i < robotCount; i++) {
    const col = Math.min(29, 1 + i * step);
    chargingColumns.push(col);
  }

  // Build robots starting at row 29
  const robots: Robot[] = [];
  const usedStarts = new Set<string>();

  for (let i = 0; i < robotCount; i++) {
    const col = chargingColumns[i] !== undefined ? chargingColumns[i] : i % 30;
    const start: Cell = { r: 29, c: col };
    usedStarts.add(cellToKey(start));

    robots.push({
      id: `R${i}`,
      name: `Robot ${i}`,
      index: i,
      color: ROBOT_PALETTE[i % ROBOT_PALETTE.length],
      start,
      currentCell: { ...start },
      assignedTaskIds: [],
      trajectory: [],
      currentTaskIndex: 0,
      diagnostics: {
        robotId: `R${i}`,
        algorithm: 'None',
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
    });
  }

  // Generate Tasks (Pickups in storage, Deliveries in staging)
  const candidatePickups = layout.storageCells.filter(c => c.r < 27);
  const candidateDeliveries = layout.borderCells.filter(c => c.r < 28 && c.r !== 29);

  const fallbackFree = layout.freeCells.filter(c => c.r < 28);
  const pPool = candidatePickups.length > 0 ? candidatePickups : fallbackFree;
  const dPool = candidateDeliveries.length > 0 ? candidateDeliveries : fallbackFree;

  const tasks: Task[] = [];
  for (let t = 0; t < taskCount; t++) {
    let pickup: Cell;
    let delivery: Cell;
    let attempts = 0;

    do {
      attempts++;
      const pIdx = Math.floor(rng() * pPool.length);
      const dIdx = Math.floor(rng() * dPool.length);
      pickup = pPool[pIdx];
      delivery = dPool[dIdx];
    } while (
      (areCellsEqual(pickup, delivery) ||
        usedStarts.has(cellToKey(pickup)) ||
        usedStarts.has(cellToKey(delivery))) &&
      attempts < 100
    );

    tasks.push({
      id: `T${t}`,
      name: `Task #${t + 1}`,
      pickup,
      delivery,
      assignedRobotId: null,
      orderIndex: t,
      completed: false,
    });
  }

  return {
    layout,
    robots,
    tasks,
    seed,
  };
}

// Dedicated deterministic scenario for Demonstration 1: BFS vs A* Search Efficiency
export function generateSearchDemoScenario(): GeneratedInstance {
  const layout = generateWarehouseLayout(30, 30, 'standard', 101);
  const start: Cell = { r: 29, c: 2 }; // Bottom charging station
  const goal: Cell = { r: 3, c: 26 };  // Top-right storage rack pod

  const robot: Robot = {
    id: 'R0',
    name: 'Robot 0',
    index: 0,
    color: '#27C5F5',
    start,
    currentCell: { ...start },
    assignedTaskIds: ['T0'],
    trajectory: [],
    currentTaskIndex: 0,
    diagnostics: {
      robotId: 'R0',
      algorithm: 'None',
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
  };

  const task: Task = {
    id: 'T0',
    name: 'Search Efficiency Benchmark',
    pickup: goal,
    delivery: { r: 27, c: 26 },
    assignedRobotId: 'R0',
    orderIndex: 0,
    completed: false,
  };

  return {
    layout,
    robots: [robot],
    tasks: [task],
    seed: 101,
  };
}

// Dedicated deterministic scenario for Demonstration 3 and 4: Collision Demonstration & Space-Time CSP
export function generateCollisionDemoScenario(): GeneratedInstance {
  const layout = generateWarehouseLayout(30, 30, 'standard', 42);

  // Clear vertical aisle col 12 from row 29 to row 8
  for (let r = 8; r <= 29; r++) {
    layout.staticObstacles.delete(`${r},12`);
  }

  // Clear vertical aisle col 18 from row 29 to row 8
  for (let r = 8; r <= 29; r++) {
    layout.staticObstacles.delete(`${r},18`);
  }

  // Clear cross-aisle at row 20 between col 12 and col 18
  for (let c = 12; c <= 18; c++) {
    layout.staticObstacles.delete(`20,${c}`);
    layout.staticObstacles.delete(`19,${c}`);
    layout.staticObstacles.delete(`21,${c}`);
  }

  // Block the direct interior rows 22..27 between cols 13 and 17 so robots must stay in aisle 12 and 18 until row 20
  for (let r = 22; r <= 27; r++) {
    for (let c = 13; c <= 17; c++) {
      layout.staticObstacles.add(`${r},${c}`);
    }
  }

  // Robot 0 starts at (29, 12) on row 29.
  // Robot 1 starts at (29, 18) on row 29.
  const start0: Cell = { r: 29, c: 12 };
  const start1: Cell = { r: 29, c: 18 };

  const robots: Robot[] = [
    {
      id: 'R0',
      name: 'Robot 0',
      index: 0,
      color: '#27C5F5', // Cyan
      start: start0,
      currentCell: { ...start0 },
      assignedTaskIds: ['T0'],
      trajectory: [],
      currentTaskIndex: 0,
      diagnostics: {
        robotId: 'R0',
        algorithm: 'None',
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
    },
    {
      id: 'R1',
      name: 'Robot 1',
      index: 1,
      color: '#FFBE45', // Amber
      start: start1,
      currentCell: { ...start1 },
      assignedTaskIds: ['T1'],
      trajectory: [],
      currentTaskIndex: 0,
      diagnostics: {
        robotId: 'R1',
        algorithm: 'None',
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
    },
  ];

  // Task 0: pickup at (22, 12) [closest to R0 (29,12)], delivery at (10, 18)
  // Task 1: pickup at (22, 18) [closest to R1 (29,18)], delivery at (10, 12)
  // R0 and R1 cross each other at (20, 15) at t=12, creating a verified vertex conflict!
  const tasks: Task[] = [
    {
      id: 'T0',
      name: 'Shared Corridor Mission Alpha',
      pickup: { r: 22, c: 12 },
      delivery: { r: 10, c: 18 },
      assignedRobotId: 'R0',
      orderIndex: 0,
      completed: false,
    },
    {
      id: 'T1',
      name: 'Shared Corridor Mission Beta',
      pickup: { r: 22, c: 18 },
      delivery: { r: 10, c: 12 },
      assignedRobotId: 'R1',
      orderIndex: 1,
      completed: false,
    },
  ];

  return {
    layout,
    robots,
    tasks,
    seed: 42,
  };
}
