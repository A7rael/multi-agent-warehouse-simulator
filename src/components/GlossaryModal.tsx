import React from 'react';
import { X, HelpCircle, Code, CheckCircle2 } from 'lucide-react';

interface GlossaryModalProps {
  onClose: () => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ onClose }) => {
  const terms = [
    {
      term: 'MAPF (Multi-Agent Path Finding)',
      desc: 'The computational problem of finding collision-free paths for a fleet of autonomous mobile robots from their respective start locations to designated destinations while minimizing cost (e.g., makespan or sum of costs).',
    },
    {
      term: 'BFS (Breadth-First Search)',
      desc: 'An uninformed search algorithm that explores grid neighbors level by level using a FIFO queue. Guaranteed to find shortest paths on unit-cost grids, but expands radially in all directions without goal awareness.',
    },
    {
      term: 'A* Search & Manhattan Heuristic',
      desc: 'A heuristic search algorithm evaluating nodes using f(n) = g(n) + h(n), where g(n) is the exact cost from start to node n, and h(n) = |n.r - goal.r| + |n.c - goal.c| is the admissible Manhattan distance heuristic on 4-connected grids.',
    },
    {
      term: 'Vertex Collision',
      desc: 'A conflict where two distinct robots R_i and R_j occupy the exact same physical grid cell (r, c) at the exact same discrete time step t. Formally: pos(R_i, t) = pos(R_j, t).',
    },
    {
      term: 'Edge-Swap Collision',
      desc: 'A conflict where two robots attempt to traverse the same corridor in opposing directions between consecutive time steps. Formally: R_i moves u -> v from t to t+1 while R_j moves v -> u from t to t+1.',
    },
    {
      term: 'Space-Time Planning (3D State Space)',
      desc: 'Extends 2D spatial search (r, c) with a discrete temporal dimension t. Search states are tuples (r, c, t), enabling robots to execute explicit "WAIT" actions in addition to movement actions.',
    },
    {
      term: 'Reservation Table (Constraint-Based Coordination)',
      desc: 'A dynamic lookup table maintaining vertex reservations (r, c, t) and edge reservations (u -> v @ t) committed by higher-priority robots. Subsequent robots plan their space-time routes around these reservations.',
    },
    {
      term: 'Delivery Makespan (M)',
      desc: 'The completion time step of the very last delivery across all robots in the fleet. Minimizing makespan maximizes overall warehouse throughput and equipment utilization.',
    },
    {
      term: 'Hill Climbing Allocation (J = M̂ + 0.1 × T̂)',
      desc: 'A neighborhood search optimization that starts from greedy nearest-robot assignments and iteratively evaluates task relocations and swaps to minimize the weighted objective J, balancing robot workloads.',
    },
    {
      term: 'Expanded vs. Frontier States',
      desc: 'Expanded states are nodes whose neighbors have already been generated and processed. Frontier states are generated nodes currently awaiting expansion in the open priority queue.',
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
            <HelpCircle size={18} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Technical Reference & Algorithm Glossary
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

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {terms.map((t, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-card)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '4px',
              }}>
                {t.term}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {t.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
