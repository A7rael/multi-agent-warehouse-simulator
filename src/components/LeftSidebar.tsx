import React from 'react';
import {
  Truck,
  Package,
  Grid,
  Cpu,
  Share2,
  Eye,
  AlertCircle,
  RefreshCw,
  Shuffle,
  Bookmark,
  Trash2,
  MousePointer,
  Check,
  Compass,
  Play
} from 'lucide-react';
import {
  CoordinationSolver,
  TaskAllocationMethod,
  WarehouseEnvironment,
} from '../types';

interface LeftSidebarProps {
  robotCount: number;
  taskCount: number;
  environment: WarehouseEnvironment;
  seed: number;
  solver: CoordinationSolver;
  allocationMethod: TaskAllocationMethod;
  dynamicObstaclesCount: number;
  obstacleModeActive: boolean;
  obstacleMessage: { text: string; type: 'success' | 'error' | 'info' } | null;

  // 7 Independent Visualization Toggles
  showDiscoveredNodes: boolean;
  showExpandedNodes: boolean;
  showExploredEdges: boolean;
  showAlternativeBranches: boolean;
  showFinalPath: boolean;
  showTrajectories: boolean;
  showCollisionMarkers: boolean;

  isPlanning: boolean;
  isGuidedDemo: boolean;
  onStartGuidedDemo: () => void;
  onRobotCountChange: (count: number) => void;
  onTaskCountChange: (count: number) => void;
  onEnvironmentChange: (env: WarehouseEnvironment) => void;
  onSeedChange: (seed: number) => void;
  onNewSeed: () => void;
  onSolverChange: (solver: CoordinationSolver) => void;
  onAllocationChange: (method: TaskAllocationMethod) => void;
  onRePlanFleet: () => void;
  onToggleObstacleMode: () => void;
  onClearDynamicObstacles: () => void;

  onToggleDiscoveredNodes: (val: boolean) => void;
  onToggleExpandedNodes: (val: boolean) => void;
  onToggleExploredEdges: (val: boolean) => void;
  onToggleAlternativeBranches: (val: boolean) => void;
  onToggleFinalPath: (val: boolean) => void;
  onToggleTrajectories: (val: boolean) => void;
  onToggleCollisionMarkers: (val: boolean) => void;

  onApplyPreset: (preset: 'default' | 'presetA' | 'presetB' | 'presetC' | 'presetD') => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  robotCount,
  taskCount,
  environment,
  seed,
  solver,
  allocationMethod,
  dynamicObstaclesCount,
  obstacleModeActive,
  obstacleMessage,
  showDiscoveredNodes,
  showExpandedNodes,
  showExploredEdges,
  showAlternativeBranches,
  showFinalPath,
  showTrajectories,
  showCollisionMarkers,
  isPlanning,
  isGuidedDemo,
  onStartGuidedDemo,
  onRobotCountChange,
  onTaskCountChange,
  onEnvironmentChange,
  onSeedChange,
  onNewSeed,
  onSolverChange,
  onAllocationChange,
  onRePlanFleet,
  onToggleObstacleMode,
  onClearDynamicObstacles,
  onToggleDiscoveredNodes,
  onToggleExpandedNodes,
  onToggleExploredEdges,
  onToggleAlternativeBranches,
  onToggleFinalPath,
  onToggleTrajectories,
  onToggleCollisionMarkers,
  onApplyPreset,
}) => {
  const robotOptions = [2, 4, 8, 12, 16, 20, 24, 28];
  const taskOptions = [4, 8, 12, 16, 24, 32, 48];

  return (
    <aside style={{
      width: '375px',
      height: 'calc(100vh - 56px)',
      backgroundColor: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
      zIndex: 10,
    }}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* GUIDED DEMO MODE PROMINENT TRIGGER */}
        {!isGuidedDemo && (
          <button
            onClick={onStartGuidedDemo}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-cyan)',
              color: '#080B12',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(39, 197, 245, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Compass size={16} />
            <span>START GUIDED DEMO (4 STAGES)</span>
          </button>
        )}

        {/* SECTION 1: FLEET & WAREHOUSE CONFIGURATION */}
        <section>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Truck size={13} />
            <span>Fleet & Warehouse Setup</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Active Fleet Vehicles */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Active Fleet Vehicles (Start Row 29)
              </label>
              <select
                value={robotCount}
                onChange={e => onRobotCountChange(parseInt(e.target.value, 10))}
                disabled={isPlanning}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {robotOptions.map(r => (
                  <option key={r} value={r}>
                    {r} vehicles {r === 8 ? '(Default Benchmark)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Workload Density */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Task Workload Density
                </label>
                <button
                  type="button"
                  onClick={() => onTaskCountChange(robotCount * 2)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--accent-cyan-dim)',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                  title="Preset: Exactly 2 tasks per robot"
                >
                  2 × R ({robotCount * 2} tasks)
                </button>
              </div>
              <select
                value={taskCount}
                onChange={e => onTaskCountChange(parseInt(e.target.value, 10))}
                disabled={isPlanning}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {taskOptions.map(t => (
                  <option key={t} value={t}>
                    {t} tasks {t === 16 ? '(16 Tasks - 2x/Robot Standard)' : t === 8 ? '(8 Tasks - Demo)' : ''}
                  </option>
                ))}
                {!taskOptions.includes(taskCount) && (
                  <option value={taskCount}>{taskCount} tasks (Custom)</option>
                )}
              </select>
            </div>

            {/* Warehouse Environment */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Warehouse Environment (30 × 30)
              </label>
              <select
                value={environment}
                onChange={e => onEnvironmentChange(e.target.value as WarehouseEnvironment)}
                disabled={isPlanning}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="standard">1. Standard Warehouse — Aisles & Pods</option>
                <option value="open">2. Open Grid — Sparse Obstacles</option>
                <option value="congested">3. Congested Warehouse</option>
                <option value="dense">4. Dense Random Grid</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 2: ALGORITHM PIPELINE */}
        <section>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Cpu size={13} />
            <span>Algorithm Pipeline</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Coordination Solver */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Coordination Solver
              </label>
              <select
                value={solver}
                onChange={e => onSolverChange(e.target.value as CoordinationSolver)}
                disabled={isPlanning}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="coordinated_csp">Coordinated: Space-Time CSP (0 Collision)</option>
                <option value="independent_bfs">Independent: BFS</option>
                <option value="independent_astar">Independent: A*</option>
              </select>
              <p style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '4px' }}>
                {solver === 'coordinated_csp'
                  ? 'Space-time reservation constraints with vertex & edge-swap protection.'
                  : solver === 'independent_bfs'
                  ? 'Spatial unweighted BFS. Robots do not coordinate (conflicts reported).'
                  : 'Spatial Manhattan A*. Optimal individual routing, uncoordinated.'}
              </p>
            </div>

            {/* Task Allocation Method */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Task Allocation Method
              </label>
              <select
                value={allocationMethod}
                onChange={e => onAllocationChange(e.target.value as TaskAllocationMethod)}
                disabled={isPlanning}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="nearest_robot">Nearest Robot (Greedy Baseline)</option>
                <option value="hill_climbing">Hill Climbing (J = M̂ + 0.1 × T̂)</option>
              </select>
              <p style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '4px' }}>
                {allocationMethod === 'hill_climbing'
                  ? 'Neighborhood search (relocate/swap) optimizing makespan & total distance.'
                  : 'Sequential greedy assignment based on current robot endpoint.'}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: DYNAMIC OBSTACLE TOOL */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '12px',
          border: obstacleModeActive ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-amber)',
            letterSpacing: '0.08em',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textTransform: 'uppercase',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={13} />
              <span>Dynamic Obstacle Tool</span>
            </div>
            {dynamicObstaclesCount > 0 && (
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-amber-dim)',
                color: 'var(--accent-amber)',
                fontFamily: 'var(--font-mono)',
              }}>
                {dynamicObstaclesCount} Blocked
              </span>
            )}
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Click any free corridor cell to place temporary obstacles. The planner recomputes routes around blocked cells.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onToggleObstacleMode}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '6px',
                backgroundColor: obstacleModeActive ? 'var(--accent-amber)' : 'var(--bg-panel)',
                color: obstacleModeActive ? '#080B12' : 'var(--accent-amber)',
                border: `1px solid var(--accent-amber)`,
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <MousePointer size={13} />
              <span>{obstacleModeActive ? 'Obstacle Mode: ON' : 'Enable Obstacle Tool'}</span>
            </button>

            {dynamicObstaclesCount > 0 && (
              <button
                onClick={onClearDynamicObstacles}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                }}
                title="Clear all user-placed dynamic obstacles"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {obstacleMessage && (
            <div style={{
              marginTop: '8px',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              backgroundColor: obstacleMessage.type === 'error' ? 'var(--accent-red-dim)' : 'var(--bg-panel)',
              border: `1px solid ${obstacleMessage.type === 'error' ? 'var(--accent-red)' : 'var(--border-color)'}`,
              color: obstacleMessage.type === 'error' ? 'var(--accent-red)' : 'var(--text-main)',
            }}>
              {obstacleMessage.text}
            </div>
          )}
        </section>

        {/* SECTION 4: 7 INDEPENDENT VISUALIZATION OVERLAYS */}
        <section>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Eye size={13} />
            <span>Search & Route Overlays</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 1. Show Discovered Nodes */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showDiscoveredNodes}
                onChange={e => onToggleDiscoveredNodes(e.target.checked)}
                style={{ accentColor: '#38BDF8', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
                <span>Show Discovered Nodes (Light Blue)</span>
              </span>
            </label>

            {/* 2. Show Expanded Nodes */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showExpandedNodes}
                onChange={e => onToggleExpandedNodes(e.target.checked)}
                style={{ accentColor: '#A78BFA', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#A78BFA' }} />
                <span>Show Expanded Nodes (Violet)</span>
              </span>
            </label>

            {/* 3. Show Explored Edges */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showExploredEdges}
                onChange={e => onToggleExploredEdges(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '2px', backgroundColor: 'rgba(148, 163, 184, 0.8)' }} />
                <span>Show Explored Edges (Blue-Gray)</span>
              </span>
            </label>

            {/* 4. Show Explored Alternative Branches */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showAlternativeBranches}
                onChange={e => onToggleAlternativeBranches(e.target.checked)}
                style={{ accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '2px', backgroundColor: '#FFBE45' }} />
                <span>Show Alternative Explored Branches</span>
              </span>
            </label>

            {/* 5. Show Final Selected Path */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showFinalPath}
                onChange={e => onToggleFinalPath(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '3px', backgroundColor: 'var(--accent-cyan)' }} />
                <span>Show Final Selected Path</span>
              </span>
            </label>

            {/* 6. Show Vehicle Trajectories & Waypoints */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showTrajectories}
                onChange={e => onToggleTrajectories(e.target.checked)}
                style={{ accentColor: 'var(--accent-green)', cursor: 'pointer' }}
              />
              <span>Show Vehicle Trajectories & Waits</span>
            </label>

            {/* 7. Show Collision Markers */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showCollisionMarkers}
                onChange={e => onToggleCollisionMarkers(e.target.checked)}
                style={{ accentColor: 'var(--accent-red)', cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#FF4567', borderRadius: '2px' }} />
                <span>Show Collision Markers</span>
              </span>
            </label>
          </div>
        </section>

        {/* SECTION 5: DEMONSTRATION PRESETS */}
        <section>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Bookmark size={13} />
            <span>Demonstration Presets</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => onApplyPreset('default')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>Default Standard</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>8R · 16T · Row 29</div>
            </button>

            <button
              onClick={() => onApplyPreset('presetA')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-green)' }}>Preset A: Routing</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>BFS vs A* Expansion</div>
            </button>

            <button
              onClick={() => onApplyPreset('presetB')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-red)' }}>Preset B: Conflict</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Shared Corridor Colls</div>
            </button>

            <button
              onClick={() => onApplyPreset('presetC')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>Preset C: Alloc</div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Nearest vs HillClimb</div>
            </button>
          </div>
        </section>

        {/* SECTION 6: RANDOM SEED & ACTIONS */}
        <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SEED: {seed}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={onNewSeed}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
                title="Generate new deterministic pseudo-random seed"
              >
                <Shuffle size={12} />
                <span>New Scenario</span>
              </button>
            </div>
          </div>

          <button
            onClick={onRePlanFleet}
            disabled={isPlanning}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-cyan)',
              color: '#080B12',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: isPlanning ? 'not-allowed' : 'pointer',
              opacity: isPlanning ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <RefreshCw size={14} className={isPlanning ? 'animate-pulse-slow' : ''} />
            <span>{isPlanning ? 'Planning in progress...' : 'Re-Plan Fleet'}</span>
          </button>
        </section>

      </div>
    </aside>
  );
};
