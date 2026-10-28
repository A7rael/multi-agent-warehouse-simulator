export interface Cell {
  r: number;
  c: number;
}

export type WarehouseEnvironment = 'standard' | 'open' | 'congested' | 'dense';

export type CoordinationSolver = 
  | 'coordinated_csp' 
  | 'independent_bfs' 
  | 'independent_astar';

export type TaskAllocationMethod = 
  | 'nearest_robot' 
  | 'hill_climbing';

export interface Task {
  id: string;
  name: string;
  pickup: Cell;
  delivery: Cell;
  assignedRobotId: string | null;
  orderIndex?: number;
  completed?: boolean;
  completedAtStep?: number;
}

export interface TimePoint {
  t: number;
  r: number;
  c: number;
  action: 'move' | 'wait';
  waypointType?: 'start' | 'pickup' | 'delivery' | 'none';
  taskId?: string;
}

export interface SearchEdge {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  robotId: string;
  isAlternativeBranch?: boolean;
}

export interface RobotPlanningDiagnostics {
  robotId: string;
  algorithm: string;
  expandedNodesCount: number;
  generatedNodesCount: number; // discovered nodes count
  exploredEdgesCount: number;
  pathLength: number;
  searchEdgesSampled: SearchEdge[];
  alternativeBranchesSampled: SearchEdge[];
  expandedNodesSampled: Cell[];
  discoveredNodesSampled: Cell[];
  frontierNodesSampled: Cell[];
  searchStatus: 'optimal' | 'success' | 'failed' | 'not_run';
  searchLogs: string[];
  computationTimeMs: number;
}

export interface Robot {
  id: string;
  name: string;
  index: number;
  color: string;
  start: Cell;
  currentCell: Cell;
  assignedTaskIds: string[];
  trajectory: TimePoint[];
  currentTaskIndex: number;
  diagnostics: RobotPlanningDiagnostics;
}

export interface ConflictEvent {
  id: string;
  t: number;
  type: 'vertex' | 'edge_swap';
  robotA: string;
  robotB: string;
  cellA: Cell;
  cellB?: Cell; // for edge swap, cell where robot B was
  description: string;
}

export interface SimulationMetrics {
  totalConflicts: number;
  vertexConflicts: number;
  edgeSwapConflicts: number;
  affectedRobotPairs: number;
  firstConflictStep: number | null;
  makespan: number; // time of last delivery
  baselineMakespan: number | null;
  makespanImprovementPercent: number | null;
  totalDistance: number; // sum of 'move' actions only (no waits)
  baselineDistance: number | null;
  distanceImprovementPercent: number | null;
  meanDistancePerTask: number;
  distanceByRobot: Record<string, number>;
  pathPlanningTimeMs: number;
  taskAllocationTimeMs: number;
  coordinationTimeMs: number;
  totalTimeMs: number;
  totalExpandedStates: number;
  completedTasksCount: number;
  totalTasksCount: number;
  failedDeliveriesCount: number;
}

export interface AllocationDiagnostics {
  method: TaskAllocationMethod;
  initialObjective: number;
  finalObjective: number;
  acceptedImprovements: number;
  tasksPerRobot: Record<string, number>;
  workloadDistribution: { robotId: string; taskCount: number; estimatedCost: number }[];
  timeMs: number;
  iterations: number;
}

export interface WarehouseConfig {
  rows: number;
  cols: number;
  environment: WarehouseEnvironment;
  robotCount: number;
  taskCount: number;
  seed: number;
  staticObstacles: string[]; // "r,c"
  dynamicObstacles: string[]; // "r,c"
  robots: Robot[];
  tasks: Task[];
}

export interface PlanningResult {
  id: string;
  status: 'idle' | 'planning' | 'success' | 'partial' | 'failed';
  failureReason?: string;
  robots: Robot[];
  tasks: Task[];
  metrics: SimulationMetrics;
  allocationDiagnostics: AllocationDiagnostics;
  conflicts: ConflictEvent[];
  coordinationSolver: CoordinationSolver;
  allocationMethod: TaskAllocationMethod;
  timestamp: number;
}

export interface ComparisonRunResult {
  solver: CoordinationSolver;
  allocation: TaskAllocationMethod;
  label: string;
  completedTasks: number;
  totalTasks: number;
  conflicts: number;
  vertexConflicts: number;
  edgeSwapConflicts: number;
  makespan: number;
  totalDistance: number;
  expandedStates: number;
  allocationTimeMs: number;
  planningTimeMs: number;
  totalTimeMs: number;
  isFeasible: boolean;
}

export type GuidedDemoStage = 1 | 2 | 3 | 4;

export interface SearchEfficiencyResult {
  algorithm: 'BFS' | 'A*';
  expandedNodes: number;
  discoveredNodes: number;
  exploredEdges: number;
  pathLength: number;
  searchTimeMs: number;
}

export interface TaskAllocationDemoResult {
  method: 'Nearest Robot' | 'Hill Climbing';
  estimatedMakespan: number;
  simulatedMakespan: number;
  totalDistance: number;
  objectiveJ: number;
  acceptedImprovements: number;
  allocationTimeMs: number;
}

export interface CoordinationDemoResult {
  strategy: string;
  totalConflicts: number;
  vertexConflicts: number;
  edgeSwapConflicts: number;
  completedTasks: number;
  makespan: number;
  totalDistance: number;
  computationTimeMs: number;
  isFeasible: boolean;
  firstConflictStep: number | null;
  involvedRobots: string[];
}
