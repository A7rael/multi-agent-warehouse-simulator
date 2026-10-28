import { Cell, WarehouseEnvironment } from '../types';
import { createRNG } from '../algorithms/gridUtils';

export interface WarehouseLayout {
  rows: number;
  cols: number;
  environment: WarehouseEnvironment;
  staticObstacles: Set<string>;
  freeCells: Cell[];
  borderCells: Cell[];
  dockCells: Cell[];
  storageCells: Cell[];
  chargingStationCells: Cell[]; // Row 29 permanent charging station
}

export function generateWarehouseLayout(
  rows: number = 30,
  cols: number = 30,
  env: WarehouseEnvironment = 'standard',
  seed: number = 42
): WarehouseLayout {
  const rng = createRNG(seed);
  const staticObstacles = new Set<string>();

  const isWithin = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;

  if (env === 'standard') {
    // Standard Warehouse — Aisles & Pods
    // Row 29: Permanent charging station (strictly open)
    // Rows 27..28: South access corridor
    // Rows 0..2: North main aisle / staging
    // Cols 0..2: West corridor
    // Cols 27..29: East buffer corridor
    // Center rows 4..24, cols 4..24:
    // Repeated pods: 3 rows x 2 cols blocks, separated by aisles of width 2
    for (let r = 4; r <= 23; r += 5) {
      for (let c = 4; c <= 24; c += 4) {
        // Pod block of 3 rows x 2 cols
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 2; dc++) {
            const pr = r + dr;
            const pc = c + dc;
            // Never place obstacles on row 29 (charging row) or row 28 (charging exit lane)
            if (isWithin(pr, pc) && pr < 27) {
              staticObstacles.add(`${pr},${pc}`);
            }
          }
        }
      }
    }
  } else if (env === 'open') {
    // Open Grid — Sparse Obstacles (~6% scattered pillars)
    // Keep row 29 (charging) and row 28 completely clear
    for (let r = 3; r < rows - 3; r++) {
      for (let c = 3; c < cols - 3; c++) {
        if (rng() < 0.06) {
          staticObstacles.add(`${r},${c}`);
        }
      }
    }
  } else if (env === 'congested') {
    // Congested Warehouse — Narrow 1-cell aisles and long shelf rows
    // Row 29 strictly free
    for (let r = 3; r < rows - 3; r += 2) {
      for (let c = 3; c < cols - 3; c++) {
        // Cross-cut corridors every 7 cells
        if (c % 7 !== 0) {
          staticObstacles.add(`${r},${c}`);
        }
      }
    }
  } else if (env === 'dense') {
    // Dense Random Grid (~22% obstacles)
    // Row 29 strictly free
    for (let r = 2; r < rows - 3; r++) {
      for (let c = 2; c < cols - 2; c++) {
        if (rng() < 0.22) {
          staticObstacles.add(`${r},${c}`);
        }
      }
    }
  }

  // Ensure row 29 and row 28 are 100% unobstructed across all environments
  for (let c = 0; c < cols; c++) {
    staticObstacles.delete(`29,${c}`);
    staticObstacles.delete(`28,${c}`);
  }

  // Classify cells
  const freeCells: Cell[] = [];
  const borderCells: Cell[] = [];
  const dockCells: Cell[] = [];
  const storageCells: Cell[] = [];
  const chargingStationCells: Cell[] = [];

  for (let c = 0; c < cols; c++) {
    chargingStationCells.push({ r: 29, c });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (!staticObstacles.has(key)) {
        const cell = { r, c };
        freeCells.push(cell);

        // Row 29 is the permanent charging station
        if (r === 29) {
          dockCells.push(cell);
        } else if (r <= 2 || r === 27 || r === 28 || c <= 2 || c >= cols - 3) {
          borderCells.push(cell);
        } else {
          storageCells.push(cell);
        }
      }
    }
  }

  return {
    rows,
    cols,
    environment: env,
    staticObstacles,
    freeCells,
    borderCells,
    dockCells,
    storageCells,
    chargingStationCells,
  };
}
