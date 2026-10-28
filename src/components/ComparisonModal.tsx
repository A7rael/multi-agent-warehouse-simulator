import React from 'react';
import { X, Play, ShieldAlert, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { ComparisonRunResult } from '../types';

interface ComparisonModalProps {
  results: ComparisonRunResult[] | null;
  isComparing: boolean;
  seed: number;
  onClose: () => void;
  onRunComparison: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  results,
  isComparing,
  seed,
  onClose,
  onRunComparison,
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(8, 11, 18, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1050px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Multi-Algorithm Comparative Evaluation Matrix</span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', color: 'var(--accent-cyan)' }}>
                Seed: {seed}
              </span>
            </h2>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Side-by-side empirical comparison on the exact same warehouse instance, tasks, and fleet configuration.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onRunComparison}
              disabled={isComparing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-cyan)',
                color: '#080B12',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isComparing ? 'not-allowed' : 'pointer',
              }}
            >
              <Play size={13} />
              <span>{isComparing ? 'Running Suite...' : 'Re-Run Evaluation'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '6px',
                borderRadius: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content / Table */}
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          {isComparing ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              <div className="animate-pulse-slow" style={{ fontSize: '14px', marginBottom: '8px' }}>
                Executing deterministic benchmark runs across all 4 solver/allocation configurations...
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Comparing node expansions, conflict verifications, makespans, and runtimes.
              </div>
            </div>
          ) : results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Algorithm Pipeline</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Feasibility</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Conflicts (V / ES)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Makespan (M)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Total Dist (T)</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Expanded States</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Alloc Time</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Plan Time</th>
                      <th style={{ padding: '10px 12px', fontWeight: 600 }}>Total Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => {
                      const isCSP = r.solver === 'coordinated_csp';
                      const isHC = r.allocation === 'hill_climbing';

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(27, 39, 64, 0.4)',
                          }}
                        >
                          <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{r.label}</span>
                              {isCSP && isHC && (
                                <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>
                                  OPTIMAL FLEET
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '12px' }}>
                            {r.isFeasible ? (
                              <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={13} />
                                <span>Feasible (0 Col)</span>
                              </span>
                            ) : (
                              <span style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ShieldAlert size={13} />
                                <span>Infeasible</span>
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px', color: r.conflicts > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                            {r.conflicts} ({r.vertexConflicts}V / {r.edgeSwapConflicts}ES)
                          </td>

                          <td style={{ padding: '12px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                            {r.makespan} steps
                          </td>

                          <td style={{ padding: '12px', color: 'var(--text-main)' }}>
                            {r.totalDistance}
                          </td>

                          <td style={{ padding: '12px', color: r.solver === 'independent_astar' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                            {r.expandedStates.toLocaleString()}
                          </td>

                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                            {r.allocationTimeMs} ms
                          </td>

                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                            {r.planningTimeMs} ms
                          </td>

                          <td style={{ padding: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>
                            {r.totalTimeMs} ms
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empirical Findings & Analysis Notes */}
              <div style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '8px',
                padding: '14px',
                border: '1px solid var(--border-color)',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} color="var(--accent-cyan)" />
                  <span>Key Academic Observations & Benchmark Insights</span>
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>
                    <strong style={{ color: 'var(--text-main)' }}>BFS vs A* Expansion Efficiency:</strong> A* uses Manhattan distance guidance to explore significantly fewer states than uninformed BFS while yielding identically optimal spatial lengths.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text-main)' }}>Independent Routing Fallacy:</strong> Independent BFS and A* compute shorter makespans and lower runtimes only because they completely ignore collisions, rendering them mathematically infeasible for real warehouse operations.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text-main)' }}>Space-Time CSP Coordination:</strong> Space-Time CSP enforces vertex reservations and edge-swap constraints, producing independently verified 0-collision trajectories through coordinated waiting and detour actions.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--text-main)' }}>Hill Climbing vs Nearest Robot:</strong> Hill Climbing balances robot workloads via relocation and swap operators (Objective: J = M + 0.1 × T), consistently reducing global makespan compared to the greedy nearest-robot baseline.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Click "Re-Run Evaluation" to calculate side-by-side metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
