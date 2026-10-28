import React, { useState } from 'react';
import {
  PlanningResult,
  Robot,
  ConflictEvent,
} from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Compass,
  Cpu,
  Terminal,
  Activity,
  Filter,
  CheckCircle,
  TrendingDown,
  Layers
} from 'lucide-react';

interface RightSidebarProps {
  planResult: PlanningResult | null;
  selectedRobotId: string | null;
  onSelectRobot: (robotId: string) => void;
  onJumpToStep: (step: number) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  planResult,
  selectedRobotId,
  onSelectRobot,
  onJumpToStep,
}) => {
  const [conflictFilter, setConflictFilter] = useState<'all' | 'vertex' | 'edge_swap'>('all');

  if (!planResult) {
    return (
      <aside style={{
        width: '390px',
        height: 'calc(100vh - 56px)',
        backgroundColor: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border-color)',
        padding: '24px',
        color: 'var(--text-muted)',
      }}>
        Calculating empirical fleet results...
      </aside>
    );
  }

  const { metrics, allocationDiagnostics, conflicts, robots } = planResult;
  const isCollisionFree = metrics.totalConflicts === 0;

  const selectedRobot = robots.find(r => r.id === selectedRobotId) || robots[0];

  const filteredConflicts = conflicts.filter(c => {
    if (conflictFilter === 'vertex') return c.type === 'vertex';
    if (conflictFilter === 'edge_swap') return c.type === 'edge_swap';
    return true;
  });

  return (
    <aside style={{
      width: '390px',
      height: 'calc(100vh - 56px)',
      backgroundColor: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflowY: 'auto',
      zIndex: 10,
    }}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* SECTION A: COLLISION & CONFLICT VERIFICATION CARD */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '14px',
          border: `1px solid ${isCollisionFree ? 'var(--accent-green)' : 'var(--accent-red)'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: isCollisionFree ? 'var(--accent-green)' : 'var(--accent-red)',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
            }}>
              {isCollisionFree ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              <span>Collision Verification</span>
            </div>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: isCollisionFree ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
              color: isCollisionFree ? 'var(--accent-green)' : 'var(--accent-red)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}>
              {isCollisionFree ? '0 CONFLICTS VERIFIED' : `${metrics.totalConflicts} CONFLICTS`}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vertex Conflicts</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: metrics.vertexConflicts > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {metrics.vertexConflicts}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Edge-Swap Conflicts</div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: metrics.edgeSwapConflicts > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {metrics.edgeSwapConflicts}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Affected Robot Pairs</div>
              <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                {metrics.affectedRobotPairs} pairs
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>First Conflict Step</div>
              <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: metrics.firstConflictStep !== null ? 'var(--accent-amber)' : 'var(--text-dim)' }}>
                {metrics.firstConflictStep !== null ? `t = ${metrics.firstConflictStep}` : 'None'}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: DELIVERY MAKESPAN CARD */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Clock size={14} />
            <span>Delivery Makespan (M)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
              {metrics.makespan}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>time steps</span>

            {metrics.makespanImprovementPercent !== null && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '11.5px',
                fontWeight: 600,
                color: metrics.makespanImprovementPercent >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontFamily: 'var(--font-mono)',
              }}>
                <TrendingDown size={13} />
                {metrics.makespanImprovementPercent >= 0 ? `-${metrics.makespanImprovementPercent}%` : `+${Math.abs(metrics.makespanImprovementPercent)}%`}
              </span>
            )}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Tasks Fulfilled: {metrics.completedTasksCount} / {metrics.totalTasksCount}</span>
            <span style={{ color: 'var(--accent-cyan)' }}>
              {Math.round((metrics.completedTasksCount / Math.max(1, metrics.totalTasksCount)) * 100)}% Complete
            </span>
          </div>
        </section>

        {/* SECTION C: TOTAL DISTANCE TRAVELLED */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '14px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Compass size={14} />
            <span>Total Fleet Distance (T)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
              {metrics.totalDistance}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>movement steps</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Mean: {metrics.meanDistancePerTask} steps/task
            </span>
          </div>

          {/* Per-Robot Distance Bar Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            {robots.slice(0, 6).map(r => {
              const dist = metrics.distanceByRobot[r.id] || 0;
              const maxDist = Math.max(...Object.values(metrics.distanceByRobot), 1);
              const pct = (dist / maxDist) * 100;

              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px' }}>
                  <span style={{ width: '24px', color: r.color, fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                    {r.id}
                  </span>
                  <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-panel)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: r.color, borderRadius: '3px' }} />
                  </div>
                  <span style={{ width: '32px', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {dist}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION D: COMPUTATION TIMINGS */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Cpu size={14} />
            <span>Routing & Coordination Timings</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>Task Allocation:</div>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{metrics.taskAllocationTimeMs} ms</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>Fleet Planning:</div>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{metrics.pathPlanningTimeMs} ms</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>Total Expanded States:</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{metrics.totalExpandedStates}</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-panel)', padding: '6px', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '9.5px' }}>Total Computation:</div>
              <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{metrics.totalTimeMs} ms</div>
            </div>
          </div>
          <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', marginTop: '6px' }}>
            * High-resolution browser-side performance measurement.
          </div>
        </section>

        {/* SECTION E: ROUTE PLANNING TREE INSPECTOR */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textTransform: 'uppercase',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={14} />
              <span>Search Tree Inspector</span>
            </div>
            {/* Robot Selector Dropdown */}
            <select
              value={selectedRobotId || robots[0]?.id}
              onChange={e => onSelectRobot(e.target.value)}
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-panel)',
                color: selectedRobot.color,
                border: `1px solid ${selectedRobot.color}`,
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {robots.map(r => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Algorithm:</span> <span style={{ color: 'var(--text-main)' }}>{selectedRobot.diagnostics.algorithm}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Path Steps:</span> <span style={{ color: 'var(--text-main)' }}>{selectedRobot.diagnostics.pathLength}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Nodes Expanded:</span> <span style={{ color: 'var(--accent-cyan)' }}>{selectedRobot.diagnostics.expandedNodesCount}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Nodes Generated:</span> <span style={{ color: 'var(--text-main)' }}>{selectedRobot.diagnostics.generatedNodesCount}</span></div>
          </div>

          {/* Search Log Scrollbox */}
          <div style={{
            maxHeight: '110px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-panel)',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}>
            {selectedRobot.diagnostics.searchLogs.length > 0 ? (
              selectedRobot.diagnostics.searchLogs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>{log}</div>
              ))
            ) : (
              <div>No search logs recorded.</div>
            )}
          </div>
        </section>

        {/* SECTION F: COLLISION / CONFLICT VERIFIER LOG */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textTransform: 'uppercase',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} />
              <span>Conflict Verifier Log</span>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'vertex', 'edge_swap'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setConflictFilter(f)}
                  style={{
                    padding: '2px 5px',
                    borderRadius: '3px',
                    fontSize: '9.5px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: conflictFilter === f ? 'var(--accent-cyan)' : 'var(--bg-panel)',
                    color: conflictFilter === f ? '#080B12' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                >
                  {f === 'edge_swap' ? 'Swap' : f}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            maxHeight: '130px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            {filteredConflicts.length > 0 ? (
              filteredConflicts.map(c => (
                <div
                  key={c.id}
                  onClick={() => onJumpToStep(c.t)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--accent-red-dim)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  title="Click to jump simulation playback to this conflict step"
                >
                  <span>{c.description}</span>
                  <span style={{ color: 'var(--accent-cyan)', fontSize: '9px' }}>Jump »</span>
                </div>
              ))
            ) : (
              <div style={{
                padding: '10px',
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}>
                <CheckCircle size={14} />
                <span>Verification passed: no forbidden conflicts.</span>
              </div>
            )}
          </div>
        </section>

        {/* SECTION G: ALLOCATION DIAGNOSTICS */}
        <section style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.08em',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}>
            <Layers size={14} />
            <span>Allocation Diagnostics</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Initial J:</span>{' '}
              <span style={{ color: 'var(--text-main)' }}>{allocationDiagnostics.initialObjective}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Final J:</span>{' '}
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{allocationDiagnostics.finalObjective}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Accepted Moves:</span>{' '}
              <span style={{ color: 'var(--accent-cyan)' }}>{allocationDiagnostics.acceptedImprovements}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Alloc Time:</span>{' '}
              <span style={{ color: 'var(--text-main)' }}>{allocationDiagnostics.timeMs} ms</span>
            </div>
          </div>

          <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', marginTop: '6px', lineHeight: 1.3 }}>
            Objective: J = M̂ + 0.1 × T̂ (where M̂ = estimated makespan, T̂ = total distance).
          </div>
        </section>

      </div>
    </aside>
  );
};
