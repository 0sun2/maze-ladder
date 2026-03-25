/**
 * 미로 사다리 알고리즘 v4
 *
 * 전략: 경유점(waypoint) 기반 경로 생성
 * 1. 입구→출구 사이에 여러 경유점을 랜덤 배치
 * 2. 경유점을 L자 세그먼트로 연결 → 자연스러운 구불구불함
 * 3. 경로만 통로, 나머지는 벽 → 갈림길 없음
 * 4. 장식 통로 추가 → 시각적 복잡도
 */

const GRID_SIZES = {
  2: { cols: 25, rows: 33 },
  3: { cols: 31, rows: 35 },
  4: { cols: 37, rows: 37 },
  5: { cols: 43, rows: 39 },
  6: { cols: 47, rows: 39 },
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
  const { cols, rows } = GRID_SIZES[participantCount] || GRID_SIZES[4];
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  // 입구/출구 균등 배치
  const spacing = Math.floor(cols / (participantCount + 1));
  const entries = [];
  const exits = [];
  for (let i = 0; i < participantCount; i++) {
    entries.push({ x: spacing * (i + 1), y: 0 });
    exits.push({ x: spacing * (i + 1), y: rows - 1 });
  }

  // 출구 셔플
  const exitOrder = shuffle(Array.from({ length: participantCount }, (_, i) => i));

  // 교차 거리가 큰 쌍부터 경로 생성 (공간 확보)
  const pairs = exitOrder.map((exitIdx, i) => ({
    idx: i,
    entry: entries[i],
    exit: exits[exitIdx],
    crossDist: Math.abs(entries[i].x - exits[exitIdx].x),
  }));
  pairs.sort((a, b) => b.crossDist - a.crossDist);

  const globalUsed = new Set();
  const paths = new Array(participantCount);

  for (const pair of pairs) {
    const route = buildRoute(pair.entry, pair.exit, cols, rows, globalUsed);
    paths[pair.idx] = { from: pair.idx, to: exitOrder[pair.idx], route };
    for (const p of route) {
      grid[p.y][p.x] = 1;
      globalUsed.add(key(p.x, p.y));
    }
  }

  // 장식용 독립 통로
  addDecorations(grid, cols, rows);

  return { grid, paths, entries, exits, cols, rows, exitOrder };
}

/**
 * 경유점 기반 경로 생성
 */
function buildRoute(start, end, cols, rows, globalUsed) {
  // 경유점 개수: 행 수에 비례 (5~8개)
  const waypointCount = 5 + Math.floor(Math.random() * 4);
  const waypoints = [start];

  // 세로 구간을 균등 분할하고, 각 구간에 랜덤 x 위치 경유점 배치
  const segH = Math.floor((rows - 2) / (waypointCount + 1));
  for (let i = 1; i <= waypointCount; i++) {
    const wy = Math.min(rows - 2, i * segH + Math.floor(Math.random() * 3) - 1);
    // x는 양쪽 여백 2칸 확보, 넓은 범위에서 랜덤
    const wx = 2 + Math.floor(Math.random() * (cols - 4));
    waypoints.push({ x: wx, y: wy });
  }
  waypoints.push(end);

  // 경유점들을 L자 세그먼트로 연결
  const fullPath = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const segment = connectLShape(from, to, cols, rows, globalUsed, fullPath);
    // 첫 세그먼트가 아니면 시작점 중복 제거
    if (i > 0 && segment.length > 0) segment.shift();
    fullPath.push(...segment);
  }

  // 자기 자신과 겹치는 부분 정리 (루프 제거)
  return removeSelfLoops(fullPath);
}

/**
 * 두 점을 L자로 연결 (가로→세로 또는 세로→가로, 랜덤 선택)
 * 다른 경로와 겹치면 우회 시도
 */
function connectLShape(from, to, cols, rows, globalUsed, currentPath) {
  const currentSet = new Set(currentPath.map(p => key(p.x, p.y)));

  // 두 가지 L자 패턴 시도: 가로먼저 vs 세로먼저
  const patterns = Math.random() < 0.5
    ? ['hv', 'vh']
    : ['vh', 'hv'];

  for (const pattern of patterns) {
    const segment = tryLPattern(from, to, pattern, cols, rows, globalUsed, currentSet);
    if (segment) return segment;
  }

  // 둘 다 막히면 경유점 추가해서 우회
  const midY = Math.floor((from.y + to.y) / 2);
  const midX = Math.max(2, Math.min(cols - 3,
    Math.floor((from.x + to.x) / 2) + Math.floor(Math.random() * 8) - 4
  ));

  const seg1 = tryLPattern(from, { x: midX, y: midY }, 'hv', cols, rows, globalUsed, currentSet) ||
               directLine(from, { x: midX, y: midY });
  const segSet = new Set([...currentPath, ...seg1].map(p => key(p.x, p.y)));
  const seg2 = tryLPattern({ x: midX, y: midY }, to, 'vh', cols, rows, globalUsed, segSet) ||
               directLine({ x: midX, y: midY }, to);

  if (seg2.length > 0) seg2.shift(); // 중복 제거
  return [...seg1, ...seg2];
}

function tryLPattern(from, to, pattern, cols, rows, globalUsed, currentSet) {
  const segment = [];

  if (pattern === 'hv') {
    // 가로 먼저, 세로 나중
    const midX = to.x;
    const midY = from.y;

    // 가로 이동
    const dx = midX > from.x ? 1 : -1;
    let x = from.x;
    while (x !== midX) {
      if (isBlocked(x, midY, globalUsed, currentSet)) return null;
      segment.push({ x, y: midY });
      x += dx;
    }

    // 세로 이동
    const dy = to.y > midY ? 1 : -1;
    let y = midY;
    while (y !== to.y) {
      if (isBlocked(midX, y, globalUsed, currentSet)) return null;
      segment.push({ x: midX, y });
      y += dy;
    }
    segment.push({ x: to.x, y: to.y });
  } else {
    // 세로 먼저, 가로 나중
    const midX = from.x;
    const midY = to.y;

    // 세로 이동
    const dy = midY > from.y ? 1 : -1;
    let y = from.y;
    while (y !== midY) {
      if (isBlocked(midX, y, globalUsed, currentSet)) return null;
      segment.push({ x: midX, y });
      y += dy;
    }

    // 가로 이동
    const dx = to.x > midX ? 1 : -1;
    let x = midX;
    while (x !== to.x) {
      if (isBlocked(x, midY, globalUsed, currentSet)) return null;
      segment.push({ x, y: midY });
      x += dx;
    }
    segment.push({ x: to.x, y: to.y });
  }

  return segment;
}

function isBlocked(x, y, globalUsed, currentSet) {
  const k = key(x, y);
  return globalUsed.has(k) && !currentSet.has(k);
}

function directLine(from, to) {
  const path = [];
  let { x, y } = from;
  while (x !== to.x) {
    path.push({ x, y });
    x += x < to.x ? 1 : -1;
  }
  while (y !== to.y) {
    path.push({ x, y });
    y += y < to.y ? 1 : -1;
  }
  path.push({ x: to.x, y: to.y });
  return path;
}

/**
 * 경로 내 자기 교차(루프) 제거
 */
function removeSelfLoops(path) {
  const seen = new Map(); // key -> index in cleaned path
  const cleaned = [];

  for (const p of path) {
    const k = key(p.x, p.y);
    if (seen.has(k)) {
      // 루프 발견: 이전 위치까지 되감기
      const prevIdx = seen.get(k);
      // prevIdx+1부터 현재까지 제거
      const removed = cleaned.splice(prevIdx + 1);
      for (const r of removed) {
        seen.delete(key(r.x, r.y));
      }
    } else {
      seen.set(k, cleaned.length);
      cleaned.push(p);
    }
  }

  return cleaned;
}

/**
 * 시각적 복잡도를 위한 장식 통로
 */
function addDecorations(grid, cols, rows) {
  const count = Math.floor(cols * rows * 0.025);

  for (let i = 0; i < count; i++) {
    const sx = 1 + Math.floor(Math.random() * (cols - 2));
    const sy = 2 + Math.floor(Math.random() * (rows - 4));

    if (grid[sy][sx] === 1) continue;

    // 기존 통로와 인접하면 건너뜀
    let adjacent = false;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const nx = sx + dx;
      const ny = sy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 1) {
        adjacent = true;
        break;
      }
    }
    if (adjacent) continue;

    // 1~3칸 짧은 독립 통로
    const len = 1 + Math.floor(Math.random() * 3);
    const horizontal = Math.random() < 0.5;
    const cells = [{ x: sx, y: sy }];
    let valid = true;

    for (let j = 1; j < len; j++) {
      const nx = horizontal ? sx + j : sx;
      const ny = horizontal ? sy : sy + j;
      if (nx >= cols - 1 || ny >= rows - 1) { valid = false; break; }
      if (grid[ny][nx] === 1) { valid = false; break; }

      let adj2 = false;
      for (const [ddx, ddy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const ax = nx + ddx;
        const ay = ny + ddy;
        if (ax >= 0 && ax < cols && ay >= 0 && ay < rows && grid[ay][ax] === 1) {
          adj2 = true;
          break;
        }
      }
      if (adj2) { valid = false; break; }
      cells.push({ x: nx, y: ny });
    }

    if (valid) {
      for (const c of cells) grid[c.y][c.x] = 1;
    }
  }
}
