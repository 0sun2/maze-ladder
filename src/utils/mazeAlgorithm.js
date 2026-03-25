/**
 * 미로 사다리 알고리즘 v5 — 정통 미로 생성
 *
 * 1. 재귀 백트래킹으로 완벽한(perfect) 미로 생성
 *    → 모든 셀이 연결, 루프 없음 → 두 점 사이 경로가 정확히 1개
 * 2. 입구/출구를 미로 격자에 맞춰 배치
 * 3. BFS로 유일한 경로를 찾아 캐릭터가 따라감
 *    → 완벽 미로이므로 갈림길에서 "선택"이 아닌 "유일한 길"
 */

// 셀 좌표는 홀수 (1,3,5,...), 벽은 짝수 (0,2,4,...)
// 실제 격자 크기 = cellCount * 2 + 1

const CELL_COUNTS = {
  2: { cx: 8,  cy: 10 },
  3: { cx: 10, cy: 11 },
  4: { cx: 12, cy: 12 },
  5: { cx: 14, cy: 13 },
  6: { cx: 15, cy: 13 },
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

// 셀 좌표(cx,cy) → 격자 좌표(gx,gy)
const cellToGrid = (cx, cy) => ({ x: cx * 2 + 1, y: cy * 2 + 1 });

export function generateMaze(participantCount) {
  const { cx: cellsX, cy: cellsY } = CELL_COUNTS[participantCount] || CELL_COUNTS[4];
  const cols = cellsX * 2 + 1;
  const rows = cellsY * 2 + 1;

  // 격자: 0 = 벽, 1 = 통로
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  // ── 1단계: 재귀 백트래킹으로 완벽 미로 생성 ──
  carveRecursive(grid, cellsX, cellsY);

  // ── 2단계: 입구/출구 배치 ──
  const entries = [];
  const exits = [];
  const spacing = Math.floor(cellsX / participantCount);
  const offset = Math.floor((cellsX - spacing * (participantCount - 1)) / 2);

  for (let i = 0; i < participantCount; i++) {
    const cx = Math.min(cellsX - 1, offset + spacing * i);
    const gx = cx * 2 + 1;

    // 입구: 최상단 벽을 뚫어 연결
    grid[0][gx] = 1;
    entries.push({ x: gx, y: 0 });

    // 출구: 최하단 벽을 뚫어 연결
    grid[rows - 1][gx] = 1;
    exits.push({ x: gx, y: rows - 1 });
  }

  // ── 3단계: 출구 셔플 (랜덤 매핑) ──
  const exitOrder = shuffle(Array.from({ length: participantCount }, (_, i) => i));

  // ── 4단계: BFS로 유일한 경로 찾기 ──
  const paths = [];
  for (let i = 0; i < participantCount; i++) {
    const entry = entries[i];
    const exit = exits[exitOrder[i]];
    const route = bfsPath(grid, entry, exit, cols, rows);
    paths.push({ from: i, to: exitOrder[i], route });
  }

  return { grid, paths, entries, exits, cols, rows, exitOrder };
}

/**
 * 재귀 백트래킹 미로 생성 (Recursive Backtracker)
 * - 모든 셀을 방문하여 완벽 미로(perfect maze) 생성
 * - 루프 없음 → 임의의 두 셀 사이 경로가 정확히 1개
 */
function carveRecursive(grid, cellsX, cellsY) {
  const visited = Array.from({ length: cellsY }, () => Array(cellsX).fill(false));

  // 모든 셀 위치를 통로로 초기화
  for (let cy = 0; cy < cellsY; cy++) {
    for (let cx = 0; cx < cellsX; cx++) {
      const { x, y } = cellToGrid(cx, cy);
      grid[y][x] = 1;
    }
  }

  const dirs = [
    { dcx: 0, dcy: -1 }, // 위
    { dcx: 0, dcy: 1 },  // 아래
    { dcx: -1, dcy: 0 }, // 왼쪽
    { dcx: 1, dcy: 0 },  // 오른쪽
  ];

  // 스택 기반 DFS (재귀 깊이 제한 회피)
  const stack = [{ cx: 0, cy: 0 }];
  visited[0][0] = true;

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const neighbors = [];

    for (const { dcx, dcy } of dirs) {
      const nx = cur.cx + dcx;
      const ny = cur.cy + dcy;
      if (nx >= 0 && nx < cellsX && ny >= 0 && ny < cellsY && !visited[ny][nx]) {
        neighbors.push({ cx: nx, cy: ny, dcx, dcy });
      }
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    // 랜덤 이웃 선택
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    visited[next.cy][next.cx] = true;

    // 두 셀 사이의 벽을 제거 (통로 연결)
    const wallX = cur.cx * 2 + 1 + next.dcx;
    const wallY = cur.cy * 2 + 1 + next.dcy;
    grid[wallY][wallX] = 1;

    stack.push({ cx: next.cx, cy: next.cy });
  }
}

/**
 * BFS 최단 경로 탐색
 * 완벽 미로이므로 경로는 정확히 1개 → 항상 같은 결과
 */
function bfsPath(grid, start, end, cols, rows) {
  const queue = [{ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] }];
  const visited = new Set([key(start.x, start.y)]);

  const dirs = [
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
  ];

  while (queue.length > 0) {
    const { x, y, path } = queue.shift();

    if (x === end.x && y === end.y) {
      return path;
    }

    for (const { dx, dy } of dirs) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (grid[ny][nx] !== 1) continue;
      if (visited.has(key(nx, ny))) continue;

      visited.add(key(nx, ny));
      queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
    }
  }

  // 도달 불가 시 폴백 (정상적으로는 발생하지 않음)
  return [start, end];
}
