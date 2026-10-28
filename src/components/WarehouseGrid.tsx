import React, { useState, useRef, useMemo } from 'react';
import {
  Robot,
  Task,
  Cell,
  ConflictEvent,
  PlanningResult,
} from '../types';
import { cellToKey } from '../algorithms/gridUtils';
import { ZoomIn, ZoomOut, Maximize2, AlertTriangle, BatteryCharging, Zap } from 'lucide-react';

interface WarehouseGridProps {
  rows: number;
  cols: number;
  staticObstacles: Set<string>;
  dynamicObstacles: Set<string>;
  robots: Robot[];
  tasks: Task[];
  currentStep: number;
  selectedRobotId: string | null;
  hoverCell: Cell | null;
  // 7 Independent Visualization Toggles
  showDiscoveredNodes: boolean;
  showExpandedNodes: boolean;
  showExploredEdges: boolean;
  showAlternativeBranches: boolean;
  showFinalPath: boolean;
  showTrajectories: boolean;
  showCollisionMarkers: boolean;
  obstacleModeActive: boolean;
  conflicts: ConflictEvent[];
  planResult: PlanningResult | null;
  onCellClick: (cell: Cell) => void;
  onSelectRobot: (robotId: string) => void;
  onHoverCell: (cell: Cell | null) => void;
}

export const WarehouseGrid: React.FC<WarehouseGridProps> = ({
  rows,
  cols,
  staticObstacles,
  dynamicObstacles,
  robots,
  tasks,
  currentStep,
  selectedRobotId,
  hoverCell,
  showDiscoveredNodes,
  showExpandedNodes,
  showExploredEdges,
  showAlternativeBranches,
  showFinalPath,
  showTrajectories,
  showCollisionMarkers,
  obstacleModeActive,
  conflicts,
  planResult,
  onCellClick,
  onSelectRobot,
  onHoverCell,
}) => {
  const cellSize = 30;
  const width = cols * cellSize;
  const height = rows * cellSize;

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Find conflicts that occur specifically at currentStep
  const currentStepConflicts = useMemo(() => {
    return conflicts.filter(c => c.t === currentStep);
  }, [conflicts, currentStep]);

  // Robots currently involved in conflict at currentStep
  const conflictingRobotIds = useMemo(() => {
    const set = new Set<string>();
    currentStepConflicts.forEach(c => {
      set.add(c.robotA);
      set.add(c.robotB);
    });
    return set;
  }, [currentStepConflicts]);

  // Map of robots currently at currentStep
  const robotPositionsAtStep = useMemo(() => {
    const map = new Map<string, { cell: Cell; action: string; waypointType?: string; taskId?: string; isParked: boolean }>();

    for (const r of robots) {
      if (r.trajectory.length === 0) {
        map.set(r.id, { cell: r.start, action: 'wait', isParked: false });
        continue;
      }

      if (currentStep < r.trajectory.length) {
        const pt = r.trajectory[currentStep];
        map.set(r.id, {
          cell: { r: pt.r, c: pt.c },
          action: pt.action,
          waypointType: pt.waypointType,
          taskId: pt.taskId,
          isParked: false,
        });
      } else {
        const lastPt = r.trajectory[r.trajectory.length - 1];
        map.set(r.id, {
          cell: { r: lastPt.r, c: lastPt.c },
          action: 'wait',
          waypointType: 'delivery',
          isParked: true,
        });
      }
    }

    return map;
  }, [robots, currentStep]);

  // Handle Pan Mouse Events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (obstacleModeActive) return;
    if ((e.button === 0 && (e.altKey || e.shiftKey)) || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(3.5, Math.max(0.6, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectedRobot = robots.find(r => r.id === selectedRobotId);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-app)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: obstacleModeActive ? 'crosshair' : isPanning ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Zoom / View Overlay Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--bg-card)',
        padding: '6px 8px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}>
        <button
          onClick={() => setZoom(prev => Math.min(3.5, prev * 1.15))}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '36px', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.max(0.6, prev * 0.85))}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={resetView}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}
          title="Reset View Fit"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Coordinate & Cell Inspector Hover Badge */}
      {hoverCell && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(17, 26, 43, 0.94)',
          border: '1px solid var(--border-color)',
          backdropFilter: 'blur(4px)',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '11px',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-mono)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div>
            <span style={{ color: 'var(--accent-cyan)' }}>Cell [R:{hoverCell.r}, C:{hoverCell.c}]</span>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            {hoverCell.r === 29
              ? '⚡ Permanent Robot Charging Station (Row 29)'
              : staticObstacles.has(`${hoverCell.r},${hoverCell.c}`)
              ? '■ Static Pod Shelf'
              : dynamicObstacles.has(`${hoverCell.r},${hoverCell.c}`)
              ? '⚠ Dynamic Obstacle (Click to remove)'
              : obstacleModeActive
              ? '⊕ Free Corridor (Click to block)'
              : 'Free Corridor'}
          </div>
        </div>
      )}

      {/* SVG Canvas for Warehouse Grid */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: `${width * zoom}px`,
          height: `${height * zoom}px`,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          border: '1px solid var(--border-color)',
          backgroundColor: '#0A0F1D',
          borderRadius: '4px',
        }}
      >
        <defs>
          {/* Dynamic Obstacle Amber Stripe Pattern */}
          <pattern id="dynamicObstaclePattern" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#FFBE45" strokeWidth="2.5" />
            <line x1="0" y1="0" x2="6" y2="0" stroke="#B27A00" strokeWidth="1" />
          </pattern>

          {/* Shelf Pod Texture Pattern */}
          <pattern id="shelfTexture" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#152033" />
            <line x1="0" y1="5" x2="10" y2="5" stroke="#253755" strokeWidth="1" />
            <line x1="5" y1="0" x2="5" y2="10" stroke="#1f2d45" strokeWidth="0.8" />
          </pattern>

          {/* Charging Pad Texture Pattern (Row 29) */}
          <pattern id="chargingTexture" width="15" height="15" patternUnits="userSpaceOnUse">
            <rect width="15" height="15" fill="#0C1A30" />
            <line x1="0" y1="0" x2="15" y2="0" stroke="#1D3860" strokeWidth="1" />
            <circle cx="7.5" cy="7.5" r="3" fill="none" stroke="#27C5F5" strokeWidth="0.8" opacity="0.6" />
          </pattern>

          {/* Glow filter for active/selected routes */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="conflictGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Base Grid Cells & Floor Lines */}
        <g id="gridCells">
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const key = `${r},${c}`;
              const isStatic = staticObstacles.has(key);
              const isDynamic = dynamicObstacles.has(key);
              const isChargingRow = r === 29;
              const isHovered = hoverCell?.r === r && hoverCell?.c === c;

              let fillColor = '#0D1424';
              if (isChargingRow) fillColor = 'url(#chargingTexture)';
              else if (isStatic) fillColor = 'url(#shelfTexture)';
              else if (isDynamic) fillColor = 'url(#dynamicObstaclePattern)';

              return (
                <rect
                  key={key}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={fillColor}
                  stroke={
                    isHovered
                      ? 'var(--accent-cyan)'
                      : isChargingRow
                      ? '#1D3B66'
                      : isStatic
                      ? '#253755'
                      : isDynamic
                      ? '#FFBE45'
                      : '#141E33'
                  }
                  strokeWidth={isHovered ? 1.5 : isChargingRow ? 1.1 : isStatic || isDynamic ? 1 : 0.6}
                  style={{ cursor: obstacleModeActive && !isChargingRow ? 'pointer' : 'default' }}
                  onMouseEnter={() => onHoverCell({ r, c })}
                  onMouseLeave={() => onHoverCell(null)}
                  onClick={() => onCellClick({ r, c })}
                />
              );
            })
          )}
        </g>

        {/* 2. Warehouse Zone Markings & Permanent Charging Station Banner */}
        <g id="zoneMarkings" pointerEvents="none">
          {/* Row 29: Permanent Charging Station Indicator Strip */}
          <rect
            x={1}
            y={29 * cellSize + 1}
            width={cols * cellSize - 2}
            height={cellSize - 2}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="1.2"
            strokeDasharray="6 3"
            opacity="0.8"
          />
          <text
            x={width / 2}
            y={29 * cellSize + 19}
            textAnchor="middle"
            fill="var(--accent-cyan)"
            fontSize="9"
            fontWeight="bold"
            fontFamily="var(--font-mono)"
            letterSpacing="0.15em"
            opacity="0.9"
          >
            ⚡ PERMANENT CHARGING STATION (ROW 29) — VEHICLE DEPLOYMENT BAYS ⚡
          </text>

          {/* West charging/staging lane */}
          <rect
            x={1}
            y={3 * cellSize}
            width={2 * cellSize - 2}
            height={(rows - 6) * cellSize}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.25"
          />

          {/* South access bay (row 27..28) */}
          <rect
            x={3 * cellSize}
            y={27 * cellSize + 1}
            width={(cols - 6) * cellSize}
            height={cellSize * 1.8}
            fill="none"
            stroke="var(--accent-green)"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.25"
          />
        </g>

        {/* 3. Task Waypoints: Pickups (P#) and Deliveries (D#) */}
        <g id="taskMarkers" pointerEvents="none">
          {tasks.map(t => {
            const pX = t.pickup.c * cellSize + cellSize / 2;
            const pY = t.pickup.r * cellSize + cellSize / 2;
            const dX = t.delivery.c * cellSize + cellSize / 2;
            const dY = t.delivery.r * cellSize + cellSize / 2;

            return (
              <g key={t.id}>
                {/* Pickup Waypoint: Amber diamond */}
                <polygon
                  points={`${pX},${pY - 7} ${pX + 7},${pY} ${pX},${pY + 7} ${pX - 7},${pY}`}
                  fill="#FFBE45"
                  stroke="#080B12"
                  strokeWidth="1.2"
                />
                <text
                  x={pX}
                  y={pY + 3.2}
                  textAnchor="middle"
                  fill="#080B12"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                >
                  P
                </text>

                {/* Delivery Waypoint: Green square */}
                <rect
                  x={dX - 7}
                  y={dY - 7}
                  width="14"
                  height="14"
                  rx="2.5"
                  fill="#37D995"
                  stroke="#080B12"
                  strokeWidth="1.2"
                />
                <text
                  x={dX}
                  y={dY + 3.2}
                  textAnchor="middle"
                  fill="#080B12"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                >
                  D
                </text>
              </g>
            );
          })}
        </g>

        {/* 4. Overlay: Explored Edges (translucent blue-gray) */}
        {showExploredEdges && (
          <g id="exploredEdges" pointerEvents="none">
            {robots.map(r => {
              const edges = r.diagnostics.searchEdgesSampled;
              if (!edges || edges.length === 0) return null;

              return (
                <g key={`edges_${r.id}`} stroke="rgba(148, 163, 184, 0.38)" strokeWidth="1">
                  {edges.map((edge, idx) => (
                    <line
                      key={idx}
                      x1={edge.fromC * cellSize + cellSize / 2}
                      y1={edge.fromR * cellSize + cellSize / 2}
                      x2={edge.toC * cellSize + cellSize / 2}
                      y2={edge.toR * cellSize + cellSize / 2}
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              );
            })}
          </g>
        )}

        {/* 5. Overlay: Alternative Explored Branches (search tree edges not on final path) */}
        {showAlternativeBranches && (
          <g id="alternativeBranches" pointerEvents="none">
            {robots.map(r => {
              const altEdges = r.diagnostics.alternativeBranchesSampled;
              if (!altEdges || altEdges.length === 0) return null;

              return (
                <g key={`alt_${r.id}`} stroke="rgba(255, 190, 69, 0.45)" strokeWidth="1.1" strokeDasharray="3 3">
                  {altEdges.map((edge, idx) => (
                    <line
                      key={`alt_e_${idx}`}
                      x1={edge.fromC * cellSize + cellSize / 2}
                      y1={edge.fromR * cellSize + cellSize / 2}
                      x2={edge.toC * cellSize + cellSize / 2}
                      y2={edge.toR * cellSize + cellSize / 2}
                    />
                  ))}
                </g>
              );
            })}
          </g>
        )}

        {/* 6. Overlay: Discovered Nodes (light blue) */}
        {showDiscoveredNodes && (
          <g id="discoveredNodes" pointerEvents="none">
            {robots.map(r => {
              const discovered = r.diagnostics.discoveredNodesSampled;
              if (!discovered || discovered.length === 0) return null;

              return (
                <g key={`disc_${r.id}`}>
                  {discovered.map((node, idx) => (
                    <circle
                      key={`disc_n_${idx}`}
                      cx={node.c * cellSize + cellSize / 2}
                      cy={node.r * cellSize + cellSize / 2}
                      r="2.4"
                      fill="#38BDF8"
                      opacity="0.55"
                    />
                  ))}
                </g>
              );
            })}
          </g>
        )}

        {/* 7. Overlay: Expanded Nodes (violet) */}
        {showExpandedNodes && (
          <g id="expandedNodes" pointerEvents="none">
            {robots.map(r => {
              const expanded = r.diagnostics.expandedNodesSampled;
              if (!expanded || expanded.length === 0) return null;

              return (
                <g key={`exp_${r.id}`}>
                  {expanded.map((node, idx) => (
                    <circle
                      key={`exp_n_${idx}`}
                      cx={node.c * cellSize + cellSize / 2}
                      cy={node.r * cellSize + cellSize / 2}
                      r="2.6"
                      fill="#A78BFA"
                      opacity="0.75"
                    />
                  ))}
                </g>
              );
            })}
          </g>
        )}

        {/* 8. Overlay: Final Selected Path (bright cyan or green) */}
        {showFinalPath && (
          <g id="finalSelectedPath" pointerEvents="none">
            {robots.map(r => {
              const isSelected = r.id === selectedRobotId;
              if (r.trajectory.length < 2) return null;

              const pointsString = r.trajectory
                .map(p => `${p.c * cellSize + cellSize / 2},${p.r * cellSize + cellSize / 2}`)
                .join(' ');

              return (
                <polyline
                  key={`path_${r.id}`}
                  points={pointsString}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={isSelected ? 3.8 : 2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isSelected ? 1 : 0.65}
                  filter={isSelected ? 'url(#routeGlow)' : undefined}
                />
              );
            })}
          </g>
        )}

        {/* 9. Overlay: Vehicle Trajectories (wait markers, steps) */}
        {showTrajectories && (
          <g id="trajectoryWaypoints" pointerEvents="none">
            {robots.map(r =>
              r.trajectory.map((pt, idx) => {
                if (pt.action === 'wait' && idx > 0) {
                  const cx = pt.c * cellSize + cellSize / 2;
                  const cy = pt.r * cellSize + cellSize / 2;
                  return (
                    <g key={`wait_${r.id}_${idx}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="4"
                        fill="#FFBE45"
                        stroke="#080B12"
                        strokeWidth="1"
                      />
                      <text x={cx} y={cy + 2.5} textAnchor="middle" fill="#080B12" fontSize="5.5" fontWeight="bold">
                        W
                      </text>
                    </g>
                  );
                }
                return null;
              })
            )}
          </g>
        )}

        {/* 10. Active Robots at Current Time Step */}
        <g id="robots">
          {robots.map(r => {
            const pos = robotPositionsAtStep.get(r.id);
            if (!pos) return null;

            const cx = pos.cell.c * cellSize + cellSize / 2;
            const cy = pos.cell.r * cellSize + cellSize / 2;
            const isSelected = r.id === selectedRobotId;
            const hasConflictNow = conflictingRobotIds.has(r.id);

            return (
              <g
                key={`robot_${r.id}`}
                transform={`translate(${cx}, ${cy})`}
                onClick={e => {
                  e.stopPropagation();
                  onSelectRobot(r.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Selection outer pulse ring */}
                {isSelected && (
                  <circle
                    r="14"
                    fill="none"
                    stroke={hasConflictNow ? '#FF4567' : 'var(--accent-cyan)'}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="animate-pulse-slow"
                  />
                )}

                {/* Robot Main Body (Red if currently colliding) */}
                <circle
                  r="9.5"
                  fill={hasConflictNow ? '#FF4567' : pos.isParked ? '#263859' : r.color}
                  stroke={hasConflictNow ? '#FFFFFF' : isSelected ? '#FFFFFF' : '#080B12'}
                  strokeWidth="1.8"
                />

                {/* Robot ID Label */}
                <text
                  textAnchor="middle"
                  dy="3.2"
                  fill={hasConflictNow ? '#FFFFFF' : '#080B12'}
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                >
                  {r.id}
                </text>
              </g>
            );
          })}
        </g>

        {/* 11. Overlay: Collision Markers (flashing red markers at conflict locations) */}
        {showCollisionMarkers && currentStepConflicts.length > 0 && (
          <g id="conflictsLive" pointerEvents="none">
            {currentStepConflicts.map(c => {
              const cx = c.cellA.c * cellSize + cellSize / 2;
              const cy = c.cellA.r * cellSize + cellSize / 2;

              return (
                <g key={c.id} className="conflict-glow">
                  {/* Flashing Red Cell Box */}
                  <rect
                    x={c.cellA.c * cellSize}
                    y={c.cellA.r * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="rgba(255, 69, 103, 0.45)"
                    stroke="#FF4567"
                    strokeWidth="2.5"
                    rx="3"
                  />

                  {/* Warning Icon Badge */}
                  <circle
                    cx={cx}
                    cy={cy - 12}
                    r="6.5"
                    fill="#FF4567"
                    stroke="#080B12"
                    strokeWidth="1.2"
                  />
                  <text
                    x={cx}
                    y={cy - 9.5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="8"
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    !
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
