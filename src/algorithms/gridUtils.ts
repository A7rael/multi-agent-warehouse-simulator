import { Cell } from '../types';

export function cellToKey(cell: Cell): string {
  return `${cell.r},${cell.c}`;
}

export function keyToCell(key: string): Cell {
  const parts = key.split(',');
  return {
    r: parseInt(parts[0], 10),
    c: parseInt(parts[1], 10),
  };
}

export function manhattanDistance(a: Cell, b: Cell): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

export function areCellsEqual(a: Cell, b: Cell): boolean {
  return a.r === b.r && a.c === b.c;
}

// Deterministic Pseudo-Random Number Generator (Mulberry32)
export function createRNG(seed: number) {
  let s = Math.floor(seed);
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DIRECTIONS: Cell[] = [
  { r: -1, c: 0 }, // North
  { r: 1, c: 0 },  // South
  { r: 0, c: -1 }, // West
  { r: 0, c: 1 },  // East
];

export function getValidNeighbors(
  cell: Cell,
  rows: number,
  cols: number,
  isObstacle: (cell: Cell) => boolean
): Cell[] {
  const neighbors: Cell[] = [];
  for (const dir of DIRECTIONS) {
    const nr = cell.r + dir.r;
    const nc = cell.c + dir.c;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      const neighbor: Cell = { r: nr, c: nc };
      if (!isObstacle(neighbor)) {
        neighbors.push(neighbor);
      }
    }
  }
  return neighbors;
}

// Binary Min-Heap Priority Queue for optimal performance
export class PriorityQueue<T> {
  private heap: { item: T; priority: number }[] = [];

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  enqueue(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0].item;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority < this.heap[parentIndex].priority) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[parentIndex];
        this.heap[parentIndex] = temp;
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (
        leftChild < length &&
        this.heap[leftChild].priority < this.heap[smallest].priority
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < length &&
        this.heap[rightChild].priority < this.heap[smallest].priority
      ) {
        smallest = rightChild;
      }

      if (smallest !== index) {
        const temp = this.heap[index];
        this.heap[index] = this.heap[smallest];
        this.heap[smallest] = temp;
        index = smallest;
      } else {
        break;
      }
    }
  }
}
