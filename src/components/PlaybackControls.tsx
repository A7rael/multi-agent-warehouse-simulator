import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Gauge
} from 'lucide-react';
import { ConflictEvent } from '../types';

interface PlaybackControlsProps {
  currentStep: number;
  makespan: number;
  isPlaying: boolean;
  playbackSpeed: number;
  conflicts: ConflictEvent[];
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onJumpToStep: (step: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  makespan,
  isPlaying,
  playbackSpeed,
  conflicts,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onJumpToStep,
  onSpeedChange,
}) => {
  const currentStepConflicts = conflicts.filter(c => c.t === currentStep);
  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div style={{
      height: '62px',
      backgroundColor: 'var(--bg-panel)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      gap: '20px',
      zIndex: 15,
      flexShrink: 0,
    }}>
      {/* 1. Play / Pause & Stepping Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onReset}
          style={{
            padding: '7px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Reset to Step 0"
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={onStepBackward}
          disabled={currentStep <= 0}
          style={{
            padding: '7px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: currentStep <= 0 ? 'var(--text-dim)' : 'var(--text-main)',
            cursor: currentStep <= 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Previous Step (t-1)"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: isPlaying ? 'var(--accent-amber)' : 'var(--accent-cyan)',
            color: '#080B12',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: '90px',
            justifyContent: 'center',
          }}
          title={isPlaying ? 'Pause simulation' : 'Play simulation'}
        >
          {isPlaying ? (
            <>
              <Pause size={15} />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play size={15} />
              <span>PLAY</span>
            </>
          )}
        </button>

        <button
          onClick={onStepForward}
          disabled={currentStep >= makespan}
          style={{
            padding: '7px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: currentStep >= makespan ? 'var(--text-dim)' : 'var(--text-main)',
            cursor: currentStep >= makespan ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Next Step (t+1)"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 2. Timeline Scrubber Slider */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '750px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--accent-cyan)',
          minWidth: '125px',
        }}>
          <Clock size={14} />
          <span>Step {currentStep} / {makespan}</span>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(1, makespan)}
          value={currentStep}
          onChange={e => onJumpToStep(parseInt(e.target.value, 10))}
          style={{
            flex: 1,
            accentColor: 'var(--accent-cyan)',
            height: '5px',
            cursor: 'pointer',
          }}
        />

        {/* Real-time Conflict Pill at Current Step */}
        {currentStepConflicts.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'var(--accent-red-dim)',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            <AlertTriangle size={12} />
            <span>{currentStepConflicts.length} Conflict at t={currentStep}</span>
          </div>
        )}
      </div>

      {/* 3. Speed Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Gauge size={13} />
          <span>Speed:</span>
        </span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {speeds.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                padding: '3px 7px',
                borderRadius: '4px',
                backgroundColor: playbackSpeed === s ? 'var(--accent-cyan)' : 'var(--bg-card)',
                color: playbackSpeed === s ? '#080B12' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: playbackSpeed === s ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
