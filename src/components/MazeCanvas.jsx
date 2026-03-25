import { useRef, useEffect, useCallback } from 'react';

const COLORS = ['#4F7DF2', '#EF4444', '#22C55E', '#F59E0B', '#A855F7', '#F97316'];
const WALL_COLOR = '#1E293B';
const PASSAGE_COLOR = '#E8ECF4';
const TRAIL_ALPHA = 0.55;

export default function MazeCanvas({
  mazeData,
  revealed,
  animatingIdx,
  onAnimationEnd,
  speed = 'normal',
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const trailsRef = useRef([]);

  const { grid, paths, cols, rows } = mazeData;

  // 셀 크기 계산
  const getCellSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 10;
    const parent = canvas.parentElement;
    const maxWidth = (parent?.clientWidth || 360) - 8;
    const maxHeight = Math.min(window.innerHeight * 0.55, 520);
    return Math.max(8, Math.floor(Math.min(maxWidth / cols, maxHeight / rows)));
  }, [cols, rows]);

  // 미로 그리기
  const drawMaze = useCallback((ctx, cellSize) => {
    const w = cols * cellSize;
    const h = rows * cellSize;
    ctx.clearRect(0, 0, w, h);

    // 배경 (벽)
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(0, 0, w, h);

    // 통로 그리기
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === 1) {
          ctx.fillStyle = PASSAGE_COLOR;
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // 입구 마커
    const { entries, exits } = mazeData;
    entries.forEach((e, i) => {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.4;
      ctx.fillRect(e.x * cellSize, e.y * cellSize, cellSize, cellSize);
      ctx.globalAlpha = 1;
    });

    // 출구 마커
    exits.forEach((e) => {
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(e.x * cellSize, e.y * cellSize, cellSize, cellSize);
    });
  }, [grid, cols, rows, mazeData]);

  // 기존 트레일 그리기
  const drawTrails = useCallback((ctx, cellSize) => {
    for (const trail of trailsRef.current) {
      drawTrailLine(ctx, trail.points, COLORS[trail.idx % COLORS.length], cellSize, TRAIL_ALPHA);
    }
  }, []);

  // 트레일을 선으로 그리기 (도트 대신 연결된 선)
  const drawTrailLine = useCallback((ctx, points, color, cellSize, alpha) => {
    if (points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = cellSize * 0.45;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(
      points[0].x * cellSize + cellSize / 2,
      points[0].y * cellSize + cellSize / 2
    );
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(
        points[i].x * cellSize + cellSize / 2,
        points[i].y * cellSize + cellSize / 2
      );
    }
    ctx.stroke();
    ctx.restore();
  }, []);

  // 팩맨 캐릭터 그리기
  const drawPacman = useCallback((ctx, px, py, idx, cellSize, direction, mouthOpen) => {
    const cx = px * cellSize + cellSize / 2;
    const cy = py * cellSize + cellSize / 2;
    const r = cellSize * 0.42;
    const color = COLORS[idx % COLORS.length];

    // 방향에 따른 회전 각도
    let baseAngle = 0;
    switch (direction) {
      case 'right': baseAngle = 0; break;
      case 'down':  baseAngle = Math.PI / 2; break;
      case 'left':  baseAngle = Math.PI; break;
      case 'up':    baseAngle = -Math.PI / 2; break;
    }

    // 입 벌림 각도 (0 ~ 0.35 라디안 사이에서 왔다갔다)
    const mouthAngle = mouthOpen * 0.35;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, baseAngle + mouthAngle, baseAngle + Math.PI * 2 - mouthAngle);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    // 눈
    const eyeR = r * 0.16;
    const eyeDist = r * 0.3;
    // 눈 위치: 진행 방향 기준 위쪽
    let eyeX = cx;
    let eyeY = cy;
    switch (direction) {
      case 'right': eyeX = cx + eyeDist * 0.3; eyeY = cy - eyeDist; break;
      case 'left':  eyeX = cx - eyeDist * 0.3; eyeY = cy - eyeDist; break;
      case 'down':  eyeX = cx + eyeDist; eyeY = cy + eyeDist * 0.3; break;
      case 'up':    eyeX = cx + eyeDist; eyeY = cy - eyeDist * 0.3; break;
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  // 초기 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cellSize = getCellSize();
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    const ctx = canvas.getContext('2d');
    drawMaze(ctx, cellSize);
    drawTrails(ctx, cellSize);
  }, [mazeData, getCellSize, drawMaze, drawTrails, cols, rows]);

  // 애니메이션
  useEffect(() => {
    if (animatingIdx === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cellSize = getCellSize();

    const pathData = paths.find((p) => p.from === animatingIdx);
    if (!pathData) return;

    const route = pathData.route;
    const trailPoints = [];

    const speedMap = { fast: 4, normal: 2.5, slow: 1.2 };
    const cellsPerFrame = (speedMap[speed] || 2.5) * 0.15;

    let progress = 0; // 현재 경로 상의 위치 (소수점)
    let frameCount = 0;

    const getDirection = (from, to) => {
      if (to.x > from.x) return 'right';
      if (to.x < from.x) return 'left';
      if (to.y > from.y) return 'down';
      return 'up';
    };

    const animate = () => {
      const stepIdx = Math.floor(progress);

      if (stepIdx >= route.length - 1) {
        // 애니메이션 완료
        trailsRef.current.push({ idx: animatingIdx, points: [...route] });

        drawMaze(ctx, cellSize);
        drawTrails(ctx, cellSize);

        const last = route[route.length - 1];
        const prevLast = route.length >= 2 ? route[route.length - 2] : last;
        drawPacman(ctx, last.x, last.y, animatingIdx, cellSize, getDirection(prevLast, last), 0);

        // 도착 이펙트
        drawArrivalEffect(ctx, last.x, last.y, cellSize, COLORS[animatingIdx % COLORS.length]);

        onAnimationEnd(animatingIdx);
        return;
      }

      const current = route[stepIdx];
      const next = route[Math.min(stepIdx + 1, route.length - 1)];
      const t = progress - stepIdx;

      const drawX = current.x + (next.x - current.x) * t;
      const drawY = current.y + (next.y - current.y) * t;

      // 트레일 업데이트 (매 정수 스텝마다)
      if (trailPoints.length <= stepIdx) {
        for (let i = trailPoints.length; i <= stepIdx; i++) {
          trailPoints.push(route[i]);
        }
      }

      // 전체 다시 그리기
      drawMaze(ctx, cellSize);
      drawTrails(ctx, cellSize);

      // 현재 진행 중인 트레일
      const color = COLORS[animatingIdx % COLORS.length];
      const trailWithCurrent = [...trailPoints, { x: drawX, y: drawY }];
      drawTrailLine(ctx, trailWithCurrent, color, cellSize, TRAIL_ALPHA);

      // 팩맨 그리기
      const direction = getDirection(current, next);
      // 입 벌림: sin으로 왔다갔다
      const mouthOpen = Math.abs(Math.sin(frameCount * 0.3));
      drawPacman(ctx, drawX, drawY, animatingIdx, cellSize, direction, mouthOpen);

      progress += cellsPerFrame;
      frameCount++;

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animatingIdx, paths, getCellSize, drawMaze, drawTrails, drawTrailLine, drawPacman, onAnimationEnd, speed]);

  return (
    <div className="flex justify-center overflow-auto">
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-inner"
        style={{ maxWidth: '100%', touchAction: 'manipulation' }}
      />
    </div>
  );
}

function drawArrivalEffect(ctx, x, y, cellSize, color) {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const inner = cellSize * 0.5;
    const outer = cellSize * 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
