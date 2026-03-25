/**
 * 미로 사다리 알고리즘 v6 — 하이브리드 (사다리 로직 + 미로 시각)
 *
 * 1. generateLadder(): 아미다쿠지(사다리) 구조 생성
 *    → 수직 레인 + 수평 가로대(rung)로 경로 결정
 * 2. simulatePaths(): 각 참가자의 사다리 하강 시뮬레이션
 *    → 레인 전환 추적, 최종 출구 결정
 * 3. buildMazeGrid(): 재귀 백트래킹 미로 배경 + 사다리 통로 강제 개방
 *    → 시각적으로 복잡한 미로, 실제 경로는 사다리 로직
 */

// ── 설정 ──

// 참가자 수별 격자 크기 (셀 단위)
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

// ── 메인 export ──

export function generateMaze(participantCount) {
  const { cx: cellsX, cy: cellsY } = CELL_COUNTS[participantCount] || CELL_COUNTS[4];
  const cols = cellsX * 2 + 1;
  const rows = cellsY * 2 + 1;

  // 1단계: 사다리 구조 생성
  const ladder = generateLadder(participantCount, cellsX, cellsY);

  // 2단계: 경로 시뮬레이션
  const { pathLanes, exitOrder } = simulatePaths(ladder, participantCount);

  // 3단계: 미로 격자 생성 (배경 미로 + 사다리 통로 강제 개방)
  const grid = buildMazeGrid(cellsX, cellsY, ladder);

  // 4단계: 입구/출구 배치
  const entries = [];
  const exits = [];
  for (let i = 0; i < participantCount; i++) {
    const gx = ladder.laneX[i];
    // 입구: 최상단 벽 개방
    grid[0][gx] = 1;
    entries.push({ x: gx, y: 0 });
    // 출구: 최하단 벽 개방
    grid[rows - 1][gx] = 1;
    exits.push({ x: gx, y: rows - 1 });
  }

  // 5단계: 격자 좌표 기반 경로 생성
  const paths = [];
  for (let i = 0; i < participantCount; i++) {
    const route = buildRoute(pathLanes[i], ladder, rows);
    paths.push({ from: i, to: exitOrder[i], route });
  }

  return { grid, paths, entries, exits, cols, rows, exitOrder };
}

// ── 1. 사다리 구조 생성 ──

function generateLadder(participantCount, cellsX, cellsY) {
  // 레인 X 좌표 계산 (격자 좌표, 홀수값)
  const laneX = computeLanePositions(participantCount, cellsX);
  const laneCount = participantCount;

  // 가로대(rung) 가능 Y 범위: 격자 좌표 기준 y=3 ~ y=rows-4 (상하 여유)
  const rows = cellsY * 2 + 1;
  const rungGap = 2; // 가로대 간 최소 Y 간격 (격자 좌표 기준)
  const minY = 3;
  const maxY = rows - 4;

  // 가로대 후보 Y 위치들 (홀수 좌표)
  const rungYCandidates = [];
  for (let y = minY; y <= maxY; y += rungGap) {
    if (y % 2 === 1) rungYCandidates.push(y);
  }

  // 각 Y행에서 가로대 배치 (인접 레인 연결)
  // 제약: 같은 행에 겹치는 가로대 없음, 연속 같은 연결 제한
  const rungs = []; // { laneIdx, y } — laneIdx와 laneIdx+1을 y에서 연결
  let lastRungLane = -1;
  let consecutiveCount = 0;

  for (const y of rungYCandidates) {
    // 이 행에서 배치 가능한 가로대 후보
    const candidates = [];
    for (let l = 0; l < laneCount - 1; l++) {
      candidates.push(l);
    }

    // 랜덤하게 0~1개 가로대 배치 (가끔 2개도 허용, 겹치지 않게)
    const shuffled = shuffle(candidates);
    const placed = [];

    for (const lane of shuffled) {
      if (placed.length >= 2) break;
      // 이미 배치된 가로대와 인접하면 안 됨
      if (placed.some(p => Math.abs(p - lane) <= 1)) continue;
      // 연속 같은 레인 제한 (최대 2회)
      if (lane === lastRungLane && consecutiveCount >= 2) continue;

      placed.push(lane);
    }

    // 확률적으로 가로대 수 결정 (빈 행도 허용)
    const rungCount = Math.random() < 0.15 ? 0 : Math.random() < 0.7 ? 1 : placed.length;
    const selected = placed.slice(0, rungCount);

    for (const lane of selected) {
      rungs.push({ laneIdx: lane, y });
      if (lane === lastRungLane) {
        consecutiveCount++;
      } else {
        lastRungLane = lane;
        consecutiveCount = 1;
      }
    }
  }

  // 가로대가 너무 적으면 추가 (최소 참가자 수 * 2개)
  const minRungs = participantCount * 2;
  if (rungs.length < minRungs) {
    const extraCandidates = shuffle(rungYCandidates.filter(
      y => !rungs.some(r => r.y === y)
    ));
    for (const y of extraCandidates) {
      if (rungs.length >= minRungs) break;
      const lane = Math.floor(Math.random() * (laneCount - 1));
      rungs.push({ laneIdx: lane, y });
    }
  }

  // Y 기준 정렬
  rungs.sort((a, b) => a.y - b.y);

  return { laneX, laneCount, rungs, cellsX, cellsY };
}

function computeLanePositions(participantCount, cellsX) {
  const gridCols = cellsX * 2 + 1;
  // 레인을 균등 분배 (홀수 좌표)
  const positions = [];
  const totalWidth = gridCols - 2; // 양쪽 벽 제외
  const spacing = totalWidth / (participantCount + 1);

  for (let i = 0; i < participantCount; i++) {
    let x = Math.round(spacing * (i + 1));
    // 홀수로 맞추기
    if (x % 2 === 0) x = x + 1 < gridCols ? x + 1 : x - 1;
    // 범위 보정
    x = Math.max(1, Math.min(gridCols - 2, x));
    positions.push(x);
  }

  return positions;
}

// ── 2. 경로 시뮬레이션 ──

function simulatePaths(ladder, participantCount) {
  const { rungs } = ladder;
  const pathLanes = []; // 각 참가자의 레인 전환 기록
  const exitOrder = [];

  for (let i = 0; i < participantCount; i++) {
    let currentLane = i;
    const transitions = [{ lane: currentLane, y: 0 }]; // 시작

    // 가로대를 Y 순서대로 확인
    for (const rung of rungs) {
      if (rung.laneIdx === currentLane) {
        // 현재 레인에서 오른쪽으로 이동
        transitions.push({ lane: currentLane, y: rung.y, action: 'moveRight' });
        currentLane = currentLane + 1;
        transitions.push({ lane: currentLane, y: rung.y });
      } else if (rung.laneIdx === currentLane - 1) {
        // 현재 레인에서 왼쪽으로 이동
        transitions.push({ lane: currentLane, y: rung.y, action: 'moveLeft' });
        currentLane = currentLane - 1;
        transitions.push({ lane: currentLane, y: rung.y });
      }
    }

    transitions.push({ lane: currentLane, y: -1 }); // 끝 마커
    pathLanes.push(transitions);
    exitOrder.push(currentLane);
  }

  return { pathLanes, exitOrder };
}

// ── 3. 미로 격자 생성 ──

function buildMazeGrid(cellsX, cellsY, ladder) {
  const cols = cellsX * 2 + 1;
  const rows = cellsY * 2 + 1;

  // 격자 초기화 (모두 벽)
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  // 3-1: 재귀 백트래킹으로 배경 미로 생성
  carveBackgroundMaze(grid, cellsX, cellsY);

  // 3-2: 사다리 통로 강제 개방
  carveLadderCorridors(grid, ladder, rows);

  return grid;
}

function carveBackgroundMaze(grid, cellsX, cellsY) {
  const visited = Array.from({ length: cellsY }, () => Array(cellsX).fill(false));

  // 모든 셀을 통로로
  for (let cy = 0; cy < cellsY; cy++) {
    for (let cx = 0; cx < cellsX; cx++) {
      grid[cy * 2 + 1][cx * 2 + 1] = 1;
    }
  }

  const dirs = [
    { dcx: 0, dcy: -1 },
    { dcx: 0, dcy: 1 },
    { dcx: -1, dcy: 0 },
    { dcx: 1, dcy: 0 },
  ];

  // 스택 기반 DFS
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

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    visited[next.cy][next.cx] = true;

    // 벽 제거
    const wallX = cur.cx * 2 + 1 + next.dcx;
    const wallY = cur.cy * 2 + 1 + next.dcy;
    grid[wallY][wallX] = 1;

    stack.push({ cx: next.cx, cy: next.cy });
  }
}

function carveLadderCorridors(grid, ladder, rows) {
  const { laneX, laneCount, rungs } = ladder;

  // 수직 레인 전체 개방 (각 레인의 X 좌표를 위에서 아래까지 통로로)
  for (let l = 0; l < laneCount; l++) {
    const gx = laneX[l];
    for (let y = 1; y < rows - 1; y++) {
      grid[y][gx] = 1;
    }
  }

  // 가로대 개방 (두 레인 사이의 수평 통로)
  for (const rung of rungs) {
    const x1 = laneX[rung.laneIdx];
    const x2 = laneX[rung.laneIdx + 1];
    const y = rung.y;

    if (y < 1 || y >= rows - 1) continue;

    // x1과 x2 사이의 모든 셀을 통로로
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      grid[y][x] = 1;
    }
  }
}

// ── 4. 격자 좌표 경로 생성 ──

function buildRoute(transitions, ladder, rows) {
  const { laneX } = ladder;
  const route = [];

  for (let t = 0; t < transitions.length; t++) {
    const tr = transitions[t];

    if (tr.y === 0) {
      // 시작점: 입구(y=0)에서 시작
      route.push({ x: laneX[tr.lane], y: 0 });
    } else if (tr.y === -1) {
      // 끝점: 출구까지
      const lastPoint = route[route.length - 1];
      if (lastPoint) {
        // 현재 위치에서 바닥까지 수직 이동
        for (let y = lastPoint.y + 1; y < rows; y++) {
          route.push({ x: laneX[tr.lane], y });
        }
      }
    } else if (tr.action === 'moveRight' || tr.action === 'moveLeft') {
      // 가로대 도달 전까지 수직 이동
      const lastPoint = route[route.length - 1];
      if (lastPoint && lastPoint.y < tr.y) {
        for (let y = lastPoint.y + 1; y <= tr.y; y++) {
          route.push({ x: laneX[tr.lane], y });
        }
      }
    } else {
      // 가로대 이후 새 레인 도착 (수평 이동)
      const prevTr = transitions[t - 1];
      if (prevTr && (prevTr.action === 'moveRight' || prevTr.action === 'moveLeft')) {
        const fromX = laneX[prevTr.lane];
        const toX = laneX[tr.lane];
        const y = tr.y;

        // 수평 이동 (한 칸씩)
        if (toX > fromX) {
          for (let x = fromX + 1; x <= toX; x++) {
            route.push({ x, y });
          }
        } else {
          for (let x = fromX - 1; x >= toX; x--) {
            route.push({ x, y });
          }
        }
      }
    }
  }

  // 중복 제거
  const cleaned = [route[0]];
  for (let i = 1; i < route.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    if (route[i].x !== prev.x || route[i].y !== prev.y) {
      cleaned.push(route[i]);
    }
  }

  return cleaned;
}
