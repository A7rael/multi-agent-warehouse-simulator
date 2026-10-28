import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CoordinationSolver,
  TaskAllocationMethod,
  WarehouseEnvironment,
  PlanningResult,
  Cell,
  ComparisonRunResult,
  GuidedDemoStage,
  SearchEfficiencyResult,
  TaskAllocationDemoResult,
  CoordinationDemoResult,
} from '../types';
import { cellToKey } from '../algorithms/gridUtils';
import {
  generateInstance,
  GeneratedInstance,
  generateSearchDemoScenario,
  generateCollisionDemoScenario,
} from '../simulation/instanceGenerator';
import { executeFleetPlanning } from '../simulation/planner';
import { findPathBFS } from '../algorithms/bfs';
import { findPathAStar } from '../algorithms/astar';
import { allocateNearestRobot, allocateHillClimbing, GridDistanceOracle } from '../algorithms/taskAllocation';
import { verifyTrajectories } from '../algorithms/collisionVerifier';

export function useSimulation() {
  // Core Configuration
  const [robotCount, setRobotCount] = useState<number>(8);
  const [taskCount, setTaskCount] = useState<number>(16);
  const [environment, setEnvironment] = useState<WarehouseEnvironment>('standard');
  const [seed, setSeed] = useState<number>(42);

  // Algorithms
  const [solver, setSolver] = useState<CoordinationSolver>('coordinated_csp');
  const [allocationMethod, setAllocationMethod] = useState<TaskAllocationMethod>('hill_climbing');

  // Dynamic Obstacles
  const [dynamicObstacles, setDynamicObstacles] = useState<Set<string>>(new Set());
  const [obstacleModeActive, setObstacleModeActive] = useState<boolean>(false);
  const [obstacleMessage, setObstacleMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 7 Independent Visualization Overlays (Section 10)
  const [showDiscoveredNodes, setShowDiscoveredNodes] = useState<boolean>(false);
  const [showExpandedNodes, setShowExpandedNodes] = useState<boolean>(true);
  const [showExploredEdges, setShowExploredEdges] = useState<boolean>(true);
  const [showAlternativeBranches, setShowAlternativeBranches] = useState<boolean>(false);
  const [showFinalPath, setShowFinalPath] = useState<boolean>(true);
  const [showTrajectories, setShowTrajectories] = useState<boolean>(false);
  const [showCollisionMarkers, setShowCollisionMarkers] = useState<boolean>(true);

  // Selection & Hover
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>('R0');
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);

  // Instance & Plan
  const [instance, setInstance] = useState<GeneratedInstance>(() =>
    generateInstance(8, 16, 'standard', 42)
  );
  const [planResult, setPlanResult] = useState<PlanningResult | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);

  // Baseline metrics for relative improvement calculations
  const [baselineMakespan, setBaselineMakespan] = useState<number | null>(null);
  const [baselineDistance, setBaselineDistance] = useState<number | null>(null);

  // Playback State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [autoPauseOnCollision, setAutoPauseOnCollision] = useState<boolean>(true);
  const playbackTimerRef = useRef<number | null>(null);

  // Guided Demo Mode State (Section 2)
  const [isGuidedDemo, setIsGuidedDemo] = useState<boolean>(false);
  const [guidedDemoStage, setGuidedDemoStage] = useState<GuidedDemoStage>(1);

  // Demo Specific Recorded Results
  const [demo1BFSResult, setDemo1BFSResult] = useState<SearchEfficiencyResult | null>(null);
  const [demo1AStarResult, setDemo1AStarResult] = useState<SearchEfficiencyResult | null>(null);

  const [demo2NearestResult, setDemo2NearestResult] = useState<TaskAllocationDemoResult | null>(null);
  const [demo2HCResult, setDemo2HCResult] = useState<TaskAllocationDemoResult | null>(null);

  const [demo3IndependentResult, setDemo3IndependentResult] = useState<CoordinationDemoResult | null>(null);
  const [demo4CoordinatedResult, setDemo4CoordinatedResult] = useState<CoordinationDemoResult | null>(null);

  // Comparison evaluation modal state
  const [comparisonResults, setComparisonResults] = useState<ComparisonRunResult[] | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Planning trigger
  const runPlanning = useCallback(
    (
      currentInst: GeneratedInstance,
      currentSolver: CoordinationSolver,
      currentAlloc: TaskAllocationMethod,
      dynObs: Set<string>,
      baseM: number | null = baselineMakespan,
      baseD: number | null = baselineDistance
    ) => {
      setIsPlanning(true);
      setIsPlaying(false);
      setCurrentStep(0);

      setTimeout(() => {
        try {
          const res = executeFleetPlanning({
            robots: currentInst.robots,
            tasks: currentInst.tasks,
            staticObstacles: currentInst.layout.staticObstacles,
            dynamicObstacles: dynObs,
            rows: 30,
            cols: 30,
            solver: currentSolver,
            allocationMethod: currentAlloc,
            baselineMakespan: baseM,
            baselineDistance: baseD,
          });

          setPlanResult(res);

          if (currentAlloc === 'nearest_robot') {
            setBaselineMakespan(res.metrics.makespan);
            setBaselineDistance(res.metrics.totalDistance);
          }
        } catch (err) {
          console.error('Fleet planning error:', err);
        } finally {
          setIsPlanning(false);
        }
      }, 15);
    },
    [baselineMakespan, baselineDistance]
  );

  // Initial plan generation on mount
  useEffect(() => {
    const initialInst = generateInstance(robotCount, taskCount, environment, seed);
    setInstance(initialInst);

    const baseResult = executeFleetPlanning({
      robots: initialInst.robots,
      tasks: initialInst.tasks,
      staticObstacles: initialInst.layout.staticObstacles,
      dynamicObstacles: new Set(),
      rows: 30,
      cols: 30,
      solver: 'coordinated_csp',
      allocationMethod: 'nearest_robot',
    });

    setBaselineMakespan(baseResult.metrics.makespan);
    setBaselineDistance(baseResult.metrics.totalDistance);

    const mainResult = executeFleetPlanning({
      robots: initialInst.robots,
      tasks: initialInst.tasks,
      staticObstacles: initialInst.layout.staticObstacles,
      dynamicObstacles: new Set(),
      rows: 30,
      cols: 30,
      solver: 'coordinated_csp',
      allocationMethod: 'hill_climbing',
      baselineMakespan: baseResult.metrics.makespan,
      baselineDistance: baseResult.metrics.totalDistance,
    });

    setPlanResult(mainResult);
  }, []);

  // Update when Robot Count changes
  const handleRobotCountChange = (count: number) => {
    setRobotCount(count);
    const newInst = generateInstance(count, taskCount, environment, seed);
    setInstance(newInst);
    runPlanning(newInst, solver, allocationMethod, dynamicObstacles);
  };

  // Update when Task Count changes
  const handleTaskCountChange = (count: number) => {
    setTaskCount(count);
    const newInst = generateInstance(robotCount, count, environment, seed);
    setInstance(newInst);
    runPlanning(newInst, solver, allocationMethod, dynamicObstacles);
  };

  // Update when Environment changes
  const handleEnvironmentChange = (env: WarehouseEnvironment) => {
    setEnvironment(env);
    const emptyDyn = new Set<string>();
    setDynamicObstacles(emptyDyn);
    const newInst = generateInstance(robotCount, taskCount, env, seed);
    setInstance(newInst);
    runPlanning(newInst, solver, allocationMethod, emptyDyn);
  };

  // Update Seed
  const handleSeedChange = (newSeed: number) => {
    setSeed(newSeed);
    const newInst = generateInstance(robotCount, taskCount, environment, newSeed);
    setInstance(newInst);
    runPlanning(newInst, solver, allocationMethod, dynamicObstacles);
  };

  const handleNewSeed = () => {
    const nextSeed = Math.floor(Math.random() * 90000) + 1000;
    handleSeedChange(nextSeed);
  };

  // Update Solver
  const handleSolverChange = (newSolver: CoordinationSolver) => {
    setSolver(newSolver);
    runPlanning(instance, newSolver, allocationMethod, dynamicObstacles);
  };

  // Update Allocation Method
  const handleAllocationChange = (newAlloc: TaskAllocationMethod) => {
    setAllocationMethod(newAlloc);
    runPlanning(instance, solver, newAlloc, dynamicObstacles);
  };

  // Re-Plan Fleet Button
  const handleRePlanFleet = () => {
    runPlanning(instance, solver, allocationMethod, dynamicObstacles);
  };

  // Dynamic Obstacle Tool Logic
  const handleCellClick = (cell: Cell) => {
    if (!obstacleModeActive) {
      return;
    }

    const key = cellToKey(cell);

    // 1. Cannot block row 29 permanent charging station
    if (cell.r === 29) {
      setObstacleMessage({
        text: `Cannot place obstacle on permanent Charging Station (Row 29).`,
        type: 'error',
      });
      return;
    }

    // 2. Cannot block static obstacle shelf
    if (instance.layout.staticObstacles.has(key)) {
      setObstacleMessage({
        text: `Cell (${cell.r}, ${cell.c}) is already a static shelf.`,
        type: 'error',
      });
      return;
    }

    // 3. Cannot overwrite robot starting positions
    const isRobotStart = instance.robots.some(r => r.start.r === cell.r && r.start.c === cell.c);
    if (isRobotStart) {
      setObstacleMessage({
        text: `Cannot place obstacle on Robot Starting Bay (${cell.r}, ${cell.c}).`,
        type: 'error',
      });
      return;
    }

    // 4. Cannot overwrite pickup or delivery stations
    const isPickup = instance.tasks.some(t => t.pickup.r === cell.r && t.pickup.c === cell.c);
    if (isPickup) {
      setObstacleMessage({
        text: `Cannot place obstacle on Task Pickup Station (${cell.r}, ${cell.c}).`,
        type: 'error',
      });
      return;
    }

    const isDelivery = instance.tasks.some(t => t.delivery.r === cell.r && t.delivery.c === cell.c);
    if (isDelivery) {
      setObstacleMessage({
        text: `Cannot place obstacle on Task Delivery Station (${cell.r}, ${cell.c}).`,
        type: 'error',
      });
      return;
    }

    // Toggle Dynamic Obstacle
    const nextDyn = new Set(dynamicObstacles);
    if (nextDyn.has(key)) {
      nextDyn.delete(key);
      setDynamicObstacles(nextDyn);
      setObstacleMessage({
        text: `Removed dynamic obstacle at (${cell.r}, ${cell.c}). Replanning fleet...`,
        type: 'info',
      });
      runPlanning(instance, solver, allocationMethod, nextDyn);
    } else {
      nextDyn.add(key);
      setDynamicObstacles(nextDyn);
      setObstacleMessage({
        text: `Obstacle placed at (${cell.r}, ${cell.c}). Replanning affected routes...`,
        type: 'success',
      });
      runPlanning(instance, solver, allocationMethod, nextDyn);
    }
  };

  const handleClearDynamicObstacles = () => {
    const emptyDyn = new Set<string>();
    setDynamicObstacles(emptyDyn);
    setObstacleMessage({
      text: 'All dynamic obstacles cleared. Recomputing base routes...',
      type: 'info',
    });
    runPlanning(instance, solver, allocationMethod, emptyDyn);
  };

  // Playback Controls
  const makespan = planResult ? planResult.metrics.makespan : 0;

  const play = () => {
    if (makespan <= 0) return;
    if (currentStep >= makespan) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const stepForward = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.min(prev + 1, makespan));
  };

  const stepBackward = () => {
    setIsPlaying(false);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const jumpToStep = (step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, makespan)));
  };

  // Playback Animation Loop with Auto-Pause on Collision
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(50, 450 / playbackSpeed);
      playbackTimerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;

          // Check if collision occurs at 'next' step and auto-pause is enabled
          if (autoPauseOnCollision && planResult && planResult.conflicts.length > 0) {
            const hasConflict = planResult.conflicts.some(c => c.t === next);
            if (hasConflict) {
              setIsPlaying(false);
              return next;
            }
          }

          if (next >= makespan) {
            setIsPlaying(false);
            return makespan;
          }
          return next;
        });
      }, intervalMs);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, makespan, playbackSpeed, autoPauseOnCollision, planResult]);

  // Presets
  const applyPreset = (presetName: 'default' | 'presetA' | 'presetB' | 'presetC' | 'presetD') => {
    setIsPlaying(false);
    setCurrentStep(0);

    if (presetName === 'default') {
      setRobotCount(8);
      setTaskCount(16);
      setEnvironment('standard');
      setSeed(42);
      setSolver('coordinated_csp');
      setAllocationMethod('hill_climbing');
      const emptyDyn = new Set<string>();
      setDynamicObstacles(emptyDyn);
      const inst = generateInstance(8, 16, 'standard', 42);
      setInstance(inst);
      runPlanning(inst, 'coordinated_csp', 'hill_climbing', emptyDyn);
    } else if (presetName === 'presetA') {
      // Preset A — Efficient Routing: BFS vs A*
      setRobotCount(1);
      setTaskCount(1);
      setEnvironment('standard');
      setSeed(101);
      setSolver('independent_astar');
      setAllocationMethod('nearest_robot');
      const emptyDyn = new Set<string>();
      setDynamicObstacles(emptyDyn);
      const inst = generateSearchDemoScenario();
      setInstance(inst);
      runPlanning(inst, 'independent_astar', 'nearest_robot', emptyDyn);
    } else if (presetName === 'presetB') {
      // Preset B — Collision Demonstration: Shared corridor conflict
      setRobotCount(2);
      setTaskCount(2);
      setEnvironment('standard');
      setSeed(42);
      setSolver('independent_astar');
      setAllocationMethod('nearest_robot');
      const emptyDyn = new Set<string>();
      setDynamicObstacles(emptyDyn);
      const inst = generateCollisionDemoScenario();
      setInstance(inst);
      runPlanning(inst, 'independent_astar', 'nearest_robot', emptyDyn);
    } else if (presetName === 'presetC') {
      // Preset C — Task Allocation Comparison
      setRobotCount(8);
      setTaskCount(24);
      setEnvironment('standard');
      setSeed(777);
      setSolver('coordinated_csp');
      setAllocationMethod('hill_climbing');
      const emptyDyn = new Set<string>();
      setDynamicObstacles(emptyDyn);
      const inst = generateInstance(8, 24, 'standard', 777);
      setInstance(inst);
      runPlanning(inst, 'coordinated_csp', 'hill_climbing', emptyDyn);
    } else if (presetName === 'presetD') {
      // Preset D — Dynamic Obstacle Replanning
      setRobotCount(4);
      setTaskCount(8);
      setEnvironment('standard');
      setSeed(888);
      setSolver('coordinated_csp');
      setAllocationMethod('hill_climbing');
      const dyn = new Set<string>(['10,5', '10,6']);
      setDynamicObstacles(dyn);
      const inst = generateInstance(4, 8, 'standard', 888);
      setInstance(inst);
      runPlanning(inst, 'coordinated_csp', 'hill_climbing', dyn);
    }
  };

  // Guided Demo Execution Helpers
  const startGuidedDemo = () => {
    setIsGuidedDemo(true);
    setGuidedDemoStage(1);
    setupDemoStage(1);
  };

  const exitGuidedDemo = () => {
    setIsGuidedDemo(false);
  };

  const setupDemoStage = (stage: GuidedDemoStage) => {
    setGuidedDemoStage(stage);
    setIsPlaying(false);
    setCurrentStep(0);

    if (stage === 1) {
      // Stage 1: BFS vs A* Search Efficiency
      const demoInst = generateSearchDemoScenario();
      setInstance(demoInst);
      setDynamicObstacles(new Set());
      setSolver('independent_bfs');
      setAllocationMethod('nearest_robot');
      setShowDiscoveredNodes(true);
      setShowExpandedNodes(true);
      setShowExploredEdges(true);
      setShowAlternativeBranches(true);
      setShowFinalPath(true);
      runPlanning(demoInst, 'independent_bfs', 'nearest_robot', new Set());
    } else if (stage === 2) {
      // Stage 2: Nearest Robot vs Hill Climbing Task Allocation
      const demoInst = generateInstance(8, 16, 'standard', 42);
      setInstance(demoInst);
      setDynamicObstacles(new Set());
      setSolver('coordinated_csp');
      setAllocationMethod('nearest_robot');
      setShowTrajectories(true);
      setShowFinalPath(true);
      runPlanning(demoInst, 'coordinated_csp', 'nearest_robot', new Set());
    } else if (stage === 3) {
      // Stage 3: Independent Planning Collision Demonstration
      const demoInst = generateCollisionDemoScenario();
      setInstance(demoInst);
      setDynamicObstacles(new Set());
      setSolver('independent_astar');
      setAllocationMethod('nearest_robot');
      setShowCollisionMarkers(true);
      setShowFinalPath(true);
      runPlanning(demoInst, 'independent_astar', 'nearest_robot', new Set());
    } else if (stage === 4) {
      // Stage 4: Coordinated Space-Time CSP (reuses Stage 3 scenario)
      const demoInst = generateCollisionDemoScenario();
      setInstance(demoInst);
      setDynamicObstacles(new Set());
      setSolver('coordinated_csp');
      setAllocationMethod('nearest_robot');
      setShowCollisionMarkers(true);
      setShowFinalPath(true);
      runPlanning(demoInst, 'coordinated_csp', 'nearest_robot', new Set());
    }
  };

  // Run Specific Demonstration Methods
  const runDemo1BFS = () => {
    setSolver('independent_bfs');
    const demoInst = generateSearchDemoScenario();
    setInstance(demoInst);
    runPlanning(demoInst, 'independent_bfs', 'nearest_robot', dynamicObstacles);

    // Compute standalone BFS for direct comparison
    const isObs = (c: Cell) => demoInst.layout.staticObstacles.has(`${c.r},${c.c}`);
    const res = findPathBFS(demoInst.robots[0].start, demoInst.tasks[0].pickup, 30, 30, isObs, 'R0');
    setDemo1BFSResult({
      algorithm: 'BFS',
      expandedNodes: res.expandedCount,
      discoveredNodes: res.generatedCount,
      exploredEdges: res.exploredEdgesCount,
      pathLength: res.path.length,
      searchTimeMs: parseFloat(res.timeMs.toFixed(2)),
    });
  };

  const runDemo1AStar = () => {
    setSolver('independent_astar');
    const demoInst = generateSearchDemoScenario();
    setInstance(demoInst);
    runPlanning(demoInst, 'independent_astar', 'nearest_robot', dynamicObstacles);

    const isObs = (c: Cell) => demoInst.layout.staticObstacles.has(`${c.r},${c.c}`);
    const res = findPathAStar(demoInst.robots[0].start, demoInst.tasks[0].pickup, 30, 30, isObs, 'R0');
    setDemo1AStarResult({
      algorithm: 'A*',
      expandedNodes: res.expandedCount,
      discoveredNodes: res.generatedCount,
      exploredEdges: res.exploredEdgesCount,
      pathLength: res.path.length,
      searchTimeMs: parseFloat(res.timeMs.toFixed(2)),
    });
  };

  const runDemo2Nearest = () => {
    setAllocationMethod('nearest_robot');
    const demoInst = generateInstance(8, 16, 'standard', 42);
    setInstance(demoInst);
    runPlanning(demoInst, 'coordinated_csp', 'nearest_robot', dynamicObstacles);

    const isObs = (c: Cell) => demoInst.layout.staticObstacles.has(`${c.r},${c.c}`);
    const res = allocateNearestRobot(demoInst.robots, demoInst.tasks, 30, 30, isObs);
    setDemo2NearestResult({
      method: 'Nearest Robot',
      estimatedMakespan: res.diagnostics.workloadDistribution.reduce((max, w) => Math.max(max, w.estimatedCost), 0),
      simulatedMakespan: 0,
      totalDistance: res.diagnostics.workloadDistribution.reduce((sum, w) => sum + w.estimatedCost, 0),
      objectiveJ: res.diagnostics.finalObjective,
      acceptedImprovements: 0,
      allocationTimeMs: res.diagnostics.timeMs,
    });
  };

  const runDemo2HillClimbing = () => {
    setAllocationMethod('hill_climbing');
    const demoInst = generateInstance(8, 16, 'standard', 42);
    setInstance(demoInst);
    runPlanning(demoInst, 'coordinated_csp', 'hill_climbing', dynamicObstacles);

    const isObs = (c: Cell) => demoInst.layout.staticObstacles.has(`${c.r},${c.c}`);
    const res = allocateHillClimbing(demoInst.robots, demoInst.tasks, 30, 30, isObs);
    setDemo2HCResult({
      method: 'Hill Climbing',
      estimatedMakespan: res.diagnostics.workloadDistribution.reduce((max, w) => Math.max(max, w.estimatedCost), 0),
      simulatedMakespan: 0,
      totalDistance: res.diagnostics.workloadDistribution.reduce((sum, w) => sum + w.estimatedCost, 0),
      objectiveJ: res.diagnostics.finalObjective,
      acceptedImprovements: res.diagnostics.acceptedImprovements,
      allocationTimeMs: res.diagnostics.timeMs,
    });
  };

  const runDemo3Independent = (algo: 'independent_bfs' | 'independent_astar') => {
    setSolver(algo);
    const demoInst = generateCollisionDemoScenario();
    setInstance(demoInst);
    runPlanning(demoInst, algo, 'nearest_robot', new Set());

    setTimeout(() => {
      if (planResult) {
        setDemo3IndependentResult({
          strategy: algo === 'independent_bfs' ? 'Independent BFS' : 'Independent A*',
          totalConflicts: planResult.metrics.totalConflicts,
          vertexConflicts: planResult.metrics.vertexConflicts,
          edgeSwapConflicts: planResult.metrics.edgeSwapConflicts,
          completedTasks: planResult.metrics.completedTasksCount,
          makespan: planResult.metrics.makespan,
          totalDistance: planResult.metrics.totalDistance,
          computationTimeMs: planResult.metrics.totalTimeMs,
          isFeasible: false,
          firstConflictStep: planResult.metrics.firstConflictStep,
          involvedRobots: planResult.conflicts.map(c => `${c.robotA} & ${c.robotB}`),
        });
      }
    }, 100);
  };

  const runDemo4Coordinated = () => {
    setSolver('coordinated_csp');
    const demoInst = generateCollisionDemoScenario();
    setInstance(demoInst);
    runPlanning(demoInst, 'coordinated_csp', 'nearest_robot', new Set());

    setTimeout(() => {
      if (planResult) {
        setDemo4CoordinatedResult({
          strategy: 'Coordinated Space-Time CSP',
          totalConflicts: planResult.metrics.totalConflicts,
          vertexConflicts: planResult.metrics.vertexConflicts,
          edgeSwapConflicts: planResult.metrics.edgeSwapConflicts,
          completedTasks: planResult.metrics.completedTasksCount,
          makespan: planResult.metrics.makespan,
          totalDistance: planResult.metrics.totalDistance,
          computationTimeMs: planResult.metrics.totalTimeMs,
          isFeasible: planResult.metrics.totalConflicts === 0,
          firstConflictStep: null,
          involvedRobots: [],
        });
      }
    }, 100);
  };

  // Run Comparative Evaluation Across All 4 Methods
  const runComparativeEvaluation = async () => {
    setIsComparing(true);
    setTimeout(() => {
      try {
        const configs: { solver: CoordinationSolver; allocation: TaskAllocationMethod; label: string }[] = [
          { solver: 'independent_bfs', allocation: 'nearest_robot', label: 'Independent BFS + Nearest Robot' },
          { solver: 'independent_astar', allocation: 'nearest_robot', label: 'Independent A* + Nearest Robot' },
          { solver: 'coordinated_csp', allocation: 'nearest_robot', label: 'Coordinated Space-Time CSP + Nearest Robot' },
          { solver: 'coordinated_csp', allocation: 'hill_climbing', label: 'Coordinated Space-Time CSP + Hill Climbing' },
        ];

        const results: ComparisonRunResult[] = configs.map(cfg => {
          const res = executeFleetPlanning({
            robots: instance.robots,
            tasks: instance.tasks,
            staticObstacles: instance.layout.staticObstacles,
            dynamicObstacles,
            rows: 30,
            cols: 30,
            solver: cfg.solver,
            allocationMethod: cfg.allocation,
          });

          return {
            solver: cfg.solver,
            allocation: cfg.allocation,
            label: cfg.label,
            completedTasks: res.metrics.completedTasksCount,
            totalTasks: res.metrics.totalTasksCount,
            conflicts: res.metrics.totalConflicts,
            vertexConflicts: res.metrics.vertexConflicts,
            edgeSwapConflicts: res.metrics.edgeSwapConflicts,
            makespan: res.metrics.makespan,
            totalDistance: res.metrics.totalDistance,
            expandedStates: res.metrics.totalExpandedStates,
            allocationTimeMs: res.metrics.taskAllocationTimeMs,
            planningTimeMs: res.metrics.pathPlanningTimeMs,
            totalTimeMs: res.metrics.totalTimeMs,
            isFeasible: res.status === 'success' && res.metrics.totalConflicts === 0,
          };
        });

        setComparisonResults(results);
      } catch (err) {
        console.error('Comparative evaluation error:', err);
      } finally {
        setIsComparing(false);
      }
    }, 50);
  };

  return {
    // Config state
    robotCount,
    taskCount,
    environment,
    seed,
    solver,
    allocationMethod,
    dynamicObstacles,
    obstacleModeActive,
    obstacleMessage,

    // 7 Visualization Toggles
    showDiscoveredNodes,
    showExpandedNodes,
    showExploredEdges,
    showAlternativeBranches,
    showFinalPath,
    showTrajectories,
    showCollisionMarkers,

    selectedRobotId,
    hoverCell,
    instance,
    planResult,
    isPlanning,
    currentStep,
    isPlaying,
    playbackSpeed,
    autoPauseOnCollision,
    makespan,
    comparisonResults,
    isComparing,

    // Guided Demo Mode State
    isGuidedDemo,
    guidedDemoStage,
    demo1BFSResult,
    demo1AStarResult,
    demo2NearestResult,
    demo2HCResult,
    demo3IndependentResult,
    demo4CoordinatedResult,

    // Setters & Actions
    setRobotCount: handleRobotCountChange,
    setTaskCount: handleTaskCountChange,
    setEnvironment: handleEnvironmentChange,
    setSeed: handleSeedChange,
    setNewSeed: handleNewSeed,
    setSolver: handleSolverChange,
    setAllocationMethod: handleAllocationChange,
    replanFleet: handleRePlanFleet,
    toggleObstacleMode: () => setObstacleModeActive(prev => !prev),
    handleCellClick,
    clearDynamicObstacles: handleClearDynamicObstacles,

    // Toggle Handlers
    setShowDiscoveredNodes,
    setShowExpandedNodes,
    setShowExploredEdges,
    setShowAlternativeBranches,
    setShowFinalPath,
    setShowTrajectories,
    setShowCollisionMarkers,
    setAutoPauseOnCollision,

    setSelectedRobotId,
    setHoverCell,
    applyPreset,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    jumpToStep,
    setPlaybackSpeed,
    runComparativeEvaluation,
    closeComparisonModal: () => setComparisonResults(null),

    // Guided Demo Actions
    startGuidedDemo,
    exitGuidedDemo,
    setupDemoStage,
    runDemo1BFS,
    runDemo1AStar,
    runDemo2Nearest,
    runDemo2HillClimbing,
    runDemo3Independent,
    runDemo4Coordinated,
  };
}
