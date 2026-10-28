import React from 'react';
import { X, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  const steps = [
    {
      step: '1',
      title: 'Compare Pathfinding Search: BFS vs A*',
      desc: 'Select "Preset A: Routing" or toggle between Independent BFS and Independent A*. Note that while both produce identical shortest paths on the grid, A* explores significantly fewer states due to Manhattan heuristic guidance $f(n) = g(n) + h(n)$. Check the "Nodes Expanded" counter in the Right Panel.',
    },
    {
      step: '2',
      title: 'Demonstrate Uncoordinated Fleets & Collisions',
      desc: 'Select "Preset B: Conflicts" or choose Independent A* on the Congested layout with 12 robots. Observe the Conflict Verifier immediately flagging vertex collisions (two robots in the exact same cell) and edge-swap collisions (robots swapping cells). Click on any conflict log to jump playback to that exact step.',
    },
    {
      step: '3',
      title: 'Enable Coordinated Space-Time CSP (0 Collision)',
      desc: 'Switch the Coordination Solver to "Coordinated: Space-Time CSP". Notice how the independent verifier now displays "0 Conflicts (Verified)". The planner uses 3D state space $(r, c, t)$ with vertex and edge-swap reservations, introducing coordinated wait actions where necessary.',
    },
    {
      step: '4',
      title: 'Evaluate Task Allocation: Nearest Robot vs Hill Climbing',
      desc: 'Compare "Nearest Robot" against "Hill Climbing (J = M + 0.1 × T)". The greedy baseline assigns tasks sequentially, creating uneven robot workloads. Hill Climbing performs neighborhood relocation and swapping to balance route lengths, lowering fleet makespan $M$ while preserving total distance $T$.',
    },
    {
      step: '5',
      title: 'Interactive Dynamic Obstacle Replanning',
      desc: 'Click "Enable Obstacle Tool" in the left sidebar. Click any free corridor cell along a robot\'s planned route. Observe the real-time automatic fleet replan: affected routes detour around the newly blocked cell without creating new conflicts.',
    },
    {
      step: '6',
      title: 'Simulation Playback & Collision Inspection',
      desc: 'Use the bottom playback bar: click PLAY or drag the timeline slider. Observe robots navigating smoothly, waiting at choke points, and completing pickups and drop-offs. If in independent mode, observe conflicting robots physically crossing paths at flagged conflict steps.',
    },
    {
      step: '7',
      title: 'Matrix Benchmark Comparison',
      desc: 'Click "Compare Algorithms" in the top header. Review the empirical summary matrix comparing Feasibility, Conflicts, Makespan, Expanded States, and Computation Time across all 4 algorithmic pipelines under identical warehouse conditions.',
    },
  ];

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
        maxWidth: '750px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Presentation Demonstration Guide
            </h2>
          </div>
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

        {/* Steps List */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Follow this recommended walkthrough during your college presentation to demonstrate every algorithmic aspect of the project clearly and convincingly:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {steps.map(s => (
              <div
                key={s.step}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-cyan-dim)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                }}>
                  {s.step}
                </div>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-cyan-dim)',
            border: '1px solid var(--accent-cyan)',
            fontSize: '11.5px',
            color: 'var(--accent-cyan)',
            lineHeight: 1.4,
          }}>
            <strong>Live Presentation Tip:</strong> Use the "Show Route Planning Tree (Edges)" and "Show Expanded Frontier Nodes" toggles during Step 1 to visually display the search expansion cone of A* versus the uniform circle of BFS.
          </div>
        </div>
      </div>
    </div>
  );
};
