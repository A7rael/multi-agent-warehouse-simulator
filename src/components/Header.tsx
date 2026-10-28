import React from 'react';
import { Play, CheckCircle, AlertTriangle, Layers, BookOpen, HelpCircle, Activity } from 'lucide-react';
import { PlanningResult } from '../types';

interface HeaderProps {
  planResult: PlanningResult | null;
  isPlanning: boolean;
  isGuidedDemo: boolean;
  onToggleGuidedDemo: () => void;
  onOpenComparison: () => void;
  onOpenGuide: () => void;
  onOpenGlossary: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  planResult,
  isPlanning,
  isGuidedDemo,
  onToggleGuidedDemo,
  onOpenComparison,
  onOpenGuide,
  onOpenGlossary,
}) => {
  const isCollisionFree = planResult ? planResult.conflicts.length === 0 : true;
  const isSuccess = planResult?.status === 'success';

  return (
    <header style={{
      height: '56px',
      backgroundColor: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 20,
      flexShrink: 0,
    }}>
      {/* Title & Project Description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: 'var(--accent-cyan-dim)',
          border: '1px solid var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-cyan)',
        }}>
          <Activity size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'var(--text-main)',
              fontFamily: 'var(--font-sans)',
            }}>
              Multi-Agent Warehouse Navigation & Algorithm Comparison Simulator
            </h1>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}>
              MAPF Research Workstation
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Heuristic Search, Constraint-Based Coordination and Task Allocation: A Comparative Evaluation
          </p>
        </div>
      </div>

      {/* Right controls: Planning status badge + Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Verification Status Pill */}
        {isPlanning ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: 'var(--accent-cyan-dim)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
          }}>
            <span className="animate-pulse-slow" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            Planning Fleet...
          </div>
        ) : planResult ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: isCollisionFree && isSuccess ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
            border: `1px solid ${isCollisionFree && isSuccess ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            color: isCollisionFree && isSuccess ? 'var(--accent-green)' : 'var(--accent-red)',
            fontFamily: 'var(--font-mono)',
          }}>
            {isCollisionFree && isSuccess ? (
              <>
                <CheckCircle size={13} />
                <span>Verified 0 Collision</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} />
                <span>{planResult.conflicts.length} Conflicts Detected</span>
              </>
            )}
          </div>
        ) : null}

        {/* Guided Demo Mode Button (Prominent) */}
        <button
          onClick={onToggleGuidedDemo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '6px',
            backgroundColor: isGuidedDemo ? 'var(--accent-amber)' : 'var(--accent-cyan)',
            color: '#080B12',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            boxShadow: isGuidedDemo ? '0 0 12px rgba(255, 190, 69, 0.4)' : '0 0 12px rgba(39, 197, 245, 0.4)',
            transition: 'all 0.15s ease',
          }}
          title="Interactive 4-Stage Demonstration Mode (BFS vs A*, Hill Climbing, Collisions, Space-Time CSP)"
        >
          <Play size={13} fill="#080B12" />
          <span>{isGuidedDemo ? 'GUIDED DEMO: ACTIVE' : 'GUIDED DEMO'}</span>
        </button>

        {/* Compare Algorithms Button */}
        <button
          onClick={onOpenComparison}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            backgroundColor: 'var(--accent-cyan-dim)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Compare BFS, A*, Coordinated CSP and Hill Climbing side-by-side"
        >
          <Layers size={14} />
          <span>Compare Algorithms</span>
        </button>

        {/* How to Demonstrate Guide */}
        <button
          onClick={onOpenGuide}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Step-by-step demonstration walkthrough for college presentation"
        >
          <BookOpen size={14} />
          <span>Presentation Guide</span>
        </button>

        {/* Technical Glossary */}
        <button
          onClick={onOpenGlossary}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
          title="Technical glossary: MAPF, Heuristics, Reservations, Makespan"
        >
          <HelpCircle size={14} />
          <span>Glossary</span>
        </button>
      </div>
    </header>
  );
};
