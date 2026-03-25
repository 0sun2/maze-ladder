const GRID_SIZES = {
  2: { cols: 15, rows: 19 },
  3: { cols: 19, rows: 21 },
  4: { cols: 23, rows: 23 },
  5: { cols: 27, rows: 25 },
  6: { cols: 27, rows: 25 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const key = (x, y) => `${x},${y}`;

export function generateMaze(participantCount) {
  // Use odd dimensions for clean maze walls
  let { cols, rows } = GRID_SIZES[participantCount] || GRID_SIZES[4];
  if (cols % 2 === 0) cols++;
  if (rows % 2 === 0) rows++;

  // Initialize grid: 0 = wall, 1 = passage
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  // First, generate a full maze using recursive backtracking
  generateFullMaze(grid, cols, rows);

  // Calculate entry and exit positions (evenly spaced, on odd columns)
  const entries = [];
  const exits = [];
  const step = Math.floor(cols / (participantCount + 1));
  for (let i = 0; i < participantCount; i++) {
    let x = step * (i + 1);
    // Snap to odd column for maze alignment
    if (x % 2 === 0) x = Math.min(x + 1, cols - 2);
    entries.push({ x, y: 0 });
    exits.push({ x, y: rows - 1 });
  }

  // Open entries and exits
  for (const e of entries) grid[e.y][e.x] = 1;
  for (const e of exits) grid[e.y][e.x] = 1;

  // Random mapping: shuffle exit indices
  const exitOrder = shuffle(Array.from({ length: participantCount }, (_, i) => i));

  // Find paths using BFS through the generated maze
  const paths = [];
  for (let i = 0; i < participantCount; i++) {
    const entry = entries[i];
    const exit = exits[exitOrder[i]];
    const route = bfsPath(grid, entry, exit, cols, rows);
    paths.push({ from: i, to: exitOrder[i], route });
  }

  return { grid, paths, entries, exits, cols, rows, exitOrder };
}

// Recursive backtracking maze generation
function generateFullMaze(grid, cols, rows) {
  // Start from cell (1,1)
  const stack = [{ x: 1, y: 1 }];
  grid[1][1] = 1;
  const visited = new Set([key(1, 1)]);

  // Directions: move 2 cells at a time
  const dirs = [
    { dx: 0, dy: -2 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
    { dx: 2, dy: 0 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [];

    for (const { dx, dy } of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && !visited.has(key(nx, ny))) {
        neighbors.push({ x: nx, y: ny, wx: current.x + dx / 2, wy: current.y + dy / 2 });
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    // Pick random neighbor
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    // Carve passage: open wall between current and next
    grid[next.wy][next.wx] = 1;
    grid[next.y][next.x] = 1;
    visited.add(key(next.x, next.y));
    stack.push({ x: next.x, y: next.y });
  }

  // Add extra passages for multiple solutions (makes paths less predictable)
  const extraPassages = Math.floor((cols * rows) * 0.04);
  for (let i = 0; i < extraPassages; i++) {
    const x = 1 + Math.floor(Math.random() * (cols - 2));
    const y = 1 + Math.floor(Math.random() * (rows - 2));
    if (grid[y][x] === 0) {
      // Only open if it connects two passages
      let passageNeighbors = 0;
      if (y > 0 && grid[y - 1][x] === 1) passageNeighbors++;
      if (y < rows - 1 && grid[y + 1][x] === 1) passageNeighbors++;
      if (x > 0 && grid[y][x - 1] === 1) passageNeighbors++;
      if (x < cols - 1 && grid[y][x + 1] === 1) passageNeighbors++;
      if (passageNeighbors >= 2) {
        grid[y][x] = 1;
      }
    }
  }
}

// BFS to find shortest path
function bfsPath(grid, start, end, cols, rows) {
  const queue = [[start]];
  const visited = new Set([key(start.x, start.y)]);
  const dirs = [
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
  ];

  while (queue.length > 0) {
    const path = queue.shift();
    const { x, y } = path[path.length - 1];

    if (x === end.x && y === end.y) {
      return path;
    }

    // Shuffle directions for variety
    const shuffledDirs = shuffle(dirs);
    for (const { dx, dy } of shuffledDirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (grid[ny][nx] !== 1) continue;
      if (visited.has(key(nx, ny))) continue;

      visited.add(key(nx, ny));
      queue.push([...path, { x: nx, y: ny }]);
    }
  }

  // Fallback: should never happen with a proper maze, but just in case
  return [start, end];
}
