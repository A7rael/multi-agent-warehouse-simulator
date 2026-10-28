import React, { useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { WarehouseGrid } from './components/WarehouseGrid';
import { PlaybackControls } from './components/PlaybackControls';
import { RightSidebar } from './components/RightSidebar';
import { ComparisonModal } from './components/ComparisonModal';
import { GuideModal } from './components/GuideModal';
import { GlossaryModal } from './components/GlossaryModal';
import { GuidedDemoBar } from './components/GuidedDemoBar';

export function App() {
  const sim = useSimulation();

  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showGlossaryModal, setShowGlossaryModal] = useState<boolean>(false);

  const handleOpenComparison = () => {
    setShowComparisonModal(true);
    if (!sim.comparisonResults) {
      sim.runComparativeEvaluation();
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-app)',
      overflow: 'hidden',
    }}>
      {/* 1. Technical Application Header */}
      <Header
        planResult={sim.planResult}
        isPlanning={sim.isPlanning}
        isGuidedDemo={sim.isGuidedDemo}
        onToggleGuidedDemo={() => {
          if (sim.isGuidedDemo) sim.exitGuidedDemo();
          else sim.startGuidedDemo();
        }}
        onOpenComparison={handleOpenComparison}
        onOpenGuide={() => setShowGuideModal(true)}
        onOpenGlossary={() => setShowGlossaryModal(true)}
      />

      {/* 2. Main Desktop Workstation Body (3-Column Layout) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Left Sidebar: Fleet & Warehouse Configuration */}
        <LeftSidebar
          robotCount={sim.robotCount}
          taskCount={sim.taskCount}
          environment={sim.environment}
          seed={sim.seed}
          solver={sim.solver}
          allocationMethod={sim.allocationMethod}
          dynamicObstaclesCount={sim.dynamicObstacles.size}
          obstacleModeActive={sim.obstacleModeActive}
          obstacleMessage={sim.obstacleMessage}
          showDiscoveredNodes={sim.showDiscoveredNodes}
          showExpandedNodes={sim.showExpandedNodes}
          showExploredEdges={sim.showExploredEdges}
          showAlternativeBranches={sim.showAlternativeBranches}
          showFinalPath={sim.showFinalPath}
          showTrajectories={sim.showTrajectories}
          showCollisionMarkers={sim.showCollisionMarkers}
          isPlanning={sim.isPlanning}
          isGuidedDemo={sim.isGuidedDemo}
          onStartGuidedDemo={sim.startGuidedDemo}
          onRobotCountChange={sim.setRobotCount}
          onTaskCountChange={sim.setTaskCount}
          onEnvironmentChange={sim.setEnvironment}
          onSeedChange={sim.setSeed}
          onNewSeed={sim.setNewSeed}
          onSolverChange={sim.setSolver}
          onAllocationChange={sim.setAllocationMethod}
          onRePlanFleet={sim.replanFleet}
          onToggleObstacleMode={sim.toggleObstacleMode}
          onClearDynamicObstacles={sim.clearDynamicObstacles}
          onToggleDiscoveredNodes={sim.setShowDiscoveredNodes}
          onToggleExpandedNodes={sim.setShowExpandedNodes}
          onToggleExploredEdges={sim.setShowExploredEdges}
          onToggleAlternativeBranches={sim.setShowAlternativeBranches}
          onToggleFinalPath={sim.setShowFinalPath}
          onToggleTrajectories={sim.setShowTrajectories}
          onToggleCollisionMarkers={sim.setShowCollisionMarkers}
          onApplyPreset={sim.applyPreset}
        />

        {/* Center Workspace: Warehouse Grid + Bottom Playback Bar */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-app)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Guided Demo Interactive Control Bar (when Guided Demo is active) */}
          {sim.isGuidedDemo && (
            <GuidedDemoBar
              stage={sim.guidedDemoStage}
              planResult={sim.planResult}
              demo1BFSResult={sim.demo1BFSResult}
              demo1AStarResult={sim.demo1AStarResult}
              demo2NearestResult={sim.demo2NearestResult}
              demo2HCResult={sim.demo2HCResult}
              demo3IndependentResult={sim.demo3IndependentResult}
              demo4CoordinatedResult={sim.demo4CoordinatedResult}
              autoPauseOnCollision={sim.autoPauseOnCollision}
              onSelectStage={sim.setupDemoStage}
              onRunDemo1BFS={sim.runDemo1BFS}
              onRunDemo1AStar={sim.runDemo1AStar}
              onRunDemo2Nearest={sim.runDemo2Nearest}
              onRunDemo2HillClimbing={sim.runDemo2HillClimbing}
              onRunDemo3Independent={sim.runDemo3Independent}
              onRunDemo4Coordinated={sim.runDemo4Coordinated}
              onPlay={sim.play}
              onReset={sim.reset}
              onToggleAutoPause={sim.setAutoPauseOnCollision}
              onExit={sim.exitGuidedDemo}
            />
          )}

          {/* Main Warehouse 30x30 Grid */}
          <WarehouseGrid
            rows={30}
            cols={30}
            staticObstacles={sim.instance.layout.staticObstacles}
            dynamicObstacles={sim.dynamicObstacles}
            robots={sim.planResult?.robots || sim.instance.robots}
            tasks={sim.planResult?.tasks || sim.instance.tasks}
            currentStep={sim.currentStep}
            selectedRobotId={sim.selectedRobotId}
            hoverCell={sim.hoverCell}
            showDiscoveredNodes={sim.showDiscoveredNodes}
            showExpandedNodes={sim.showExpandedNodes}
            showExploredEdges={sim.showExploredEdges}
            showAlternativeBranches={sim.showAlternativeBranches}
            showFinalPath={sim.showFinalPath}
            showTrajectories={sim.showTrajectories}
            showCollisionMarkers={sim.showCollisionMarkers}
            obstacleModeActive={sim.obstacleModeActive}
            conflicts={sim.planResult?.conflicts || []}
            planResult={sim.planResult}
            onCellClick={sim.handleCellClick}
            onSelectRobot={sim.setSelectedRobotId}
            onHoverCell={sim.setHoverCell}
          />

          {/* Bottom Simulation Playback Bar */}
          <PlaybackControls
            currentStep={sim.currentStep}
            makespan={sim.makespan}
            isPlaying={sim.isPlaying}
            playbackSpeed={sim.playbackSpeed}
            conflicts={sim.planResult?.conflicts || []}
            onPlay={sim.play}
            onPause={sim.pause}
            onStepForward={sim.stepForward}
            onStepBackward={sim.stepBackward}
            onReset={sim.reset}
            onJumpToStep={sim.jumpToStep}
            onSpeedChange={sim.setPlaybackSpeed}
          />
        </main>

        {/* Right Sidebar: Empirical Results & Route-Search Diagnostics */}
        <RightSidebar
          planResult={sim.planResult}
          selectedRobotId={sim.selectedRobotId}
          onSelectRobot={sim.setSelectedRobotId}
          onJumpToStep={sim.jumpToStep}
        />
      </div>

      {/* Modals */}
      {showComparisonModal && (
        <ComparisonModal
          results={sim.comparisonResults}
          isComparing={sim.isComparing}
          seed={sim.seed}
          onClose={() => setShowComparisonModal(false)}
          onRunComparison={sim.runComparativeEvaluation}
        />
      )}

      {showGuideModal && (
        <GuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {showGlossaryModal && (
        <GlossaryModal onClose={() => setShowGlossaryModal(false)} />
      )}
    </div>
  );
}

export default App;
