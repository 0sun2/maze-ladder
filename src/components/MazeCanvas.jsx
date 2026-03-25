import { useRef, useEffect, useCallback } from 'react';
import { animateDescent } from '../utils/animateDescent';

const COLORS = ['#4F7DF2', '#EF4444', '#22C55E', '#F59E0B', '#A855F7', '#F97316'];
const WALL_COLOR = '#1E293B';
const PASSAGE_COLOR = '#F6F7FB';
const WALL_RATIO = 0.42;
const PASSAGE_RATIO = 1.18;

export default function MazeCanvas({
  mazeData,
  animatingIdx,
  onAnimationEnd,
  speed = 'normal',
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const { grid, paths, cols, rows } = mazeData;

  const getGridMetrics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return createGridMetrics(cols, rows, 360, 520);
    }
    const parent = canvas.parentElement;
    const maxWidth = (parent?.clientWidth || 360) - 8;
    const maxHeight = Math.min(window.innerHeight * 0.55, 520);
    return createGridMetrics(cols, rows, maxWidth, maxHeight);
  }, [cols, rows]);

  // 미로 그리기
  const drawMaze = useCallback((ctx, metrics) => {
    const { width: w, height: h } = metrics;
    ctx.clearRect(0, 0, w, h);

    // 배경 (통로)
    ctx.fillStyle = PASSAGE_COLOR;
    ctx.fillRect(0, 0, w, h);

    // 벽 그리기
    ctx.fillStyle = WALL_COLOR;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === 0) {
          const rect = getCellRect(metrics, x, y);
          ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
        }
      }
    }

    // 입구 마커
    const { entries, exits } = mazeData;
    entries.forEach((e, i) => {
      const rect = getCellRect(metrics, e.x, e.y);
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.globalAlpha = 0.4;
      ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
      ctx.globalAlpha = 1;
    });

    // 출구 마커
    exits.forEach((e) => {
      const rect = getCellRect(metrics, e.x, e.y);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
    });
  }, [grid, cols, rows, mazeData]);

  // 팩맨 캐릭터 그리기
  const drawPacman = useCallback((ctx, px, py, idx, metrics, direction, mouthOpen) => {
    const { x: cx, y: cy } = gridToCanvasPoint(px, py, metrics);
    const r = Math.max(5, Math.min(metrics.passageWidthX, metrics.passageWidthY) * 0.42);
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

    const metrics = getGridMetrics();
    canvas.width = Math.ceil(metrics.width);
    canvas.height = Math.ceil(metrics.height);

    const ctx = canvas.getContext('2d');
    drawMaze(ctx, metrics);
  }, [mazeData, getGridMetrics, drawMaze]);

  // 애니메이션
  useEffect(() => {
    if (animatingIdx === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const metrics = getGridMetrics();

    const pathData = paths.find((p) => p.from === animatingIdx);
    if (!pathData) return;

    const route = pathData.route;

    const getDirection = (from, to) => {
      if (to.x > from.x) return 'right';
      if (to.x < from.x) return 'left';
      if (to.y > from.y) return 'down';
      return 'up';
    };

    animFrameRef.current = animateDescent({
      route,
      speed,
      onFrame: ({ drawX, drawY, current, next, mouthOpen }) => {
        drawMaze(ctx, metrics);
        drawPacman(ctx, drawX, drawY, animatingIdx, metrics, getDirection(current, next), mouthOpen);
      },
      onComplete: ({ last, previous }) => {
        drawMaze(ctx, metrics);
        drawPacman(ctx, last.x, last.y, animatingIdx, metrics, getDirection(previous, last), 0);
        drawArrivalEffect(ctx, last.x, last.y, metrics, COLORS[animatingIdx % COLORS.length]);
        onAnimationEnd(animatingIdx);
      },
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animatingIdx, paths, getGridMetrics, drawMaze, drawPacman, onAnimationEnd, speed]);

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

function drawArrivalEffect(ctx, x, y, metrics, color) {
  const { x: cx, y: cy } = gridToCanvasPoint(x, y, metrics);
  const base = Math.max(6, Math.min(metrics.passageWidthX, metrics.passageWidthY));

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const inner = base * 0.5;
    const outer = base * 0.95;
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

function createGridMetrics(cols, rows, maxWidth, maxHeight) {
  const colUnits = Array.from({ length: cols }, (_, idx) => (idx % 2 === 0 ? WALL_RATIO : PASSAGE_RATIO));
  const rowUnits = Array.from({ length: rows }, (_, idx) => (idx % 2 === 0 ? WALL_RATIO : PASSAGE_RATIO));
  const totalColUnits = colUnits.reduce((sum, unit) => sum + unit, 0);
  const totalRowUnits = rowUnits.reduce((sum, unit) => sum + unit, 0);
  const unit = Math.min(maxWidth / totalColUnits, maxHeight / totalRowUnits);

  const colWidths = colUnits.map((value) => value * unit);
  const rowHeights = rowUnits.map((value) => value * unit);
  const colOffsets = buildOffsets(colWidths);
  const rowOffsets = buildOffsets(rowHeights);
  const colCenters = colOffsets.map((offset, idx) => offset + colWidths[idx] / 2);
  const rowCenters = rowOffsets.map((offset, idx) => offset + rowHeights[idx] / 2);

  return {
    width: colWidths.reduce((sum, value) => sum + value, 0),
    height: rowHeights.reduce((sum, value) => sum + value, 0),
    colWidths,
    rowHeights,
    colOffsets,
    rowOffsets,
    colCenters,
    rowCenters,
    passageWidthX: unit * PASSAGE_RATIO,
    passageWidthY: unit * PASSAGE_RATIO,
  };
}

function buildOffsets(sizes) {
  const offsets = [];
  let acc = 0;

  for (const size of sizes) {
    offsets.push(acc);
    acc += size;
  }

  return offsets;
}

function getCellRect(metrics, x, y) {
  return {
    left: metrics.colOffsets[x],
    top: metrics.rowOffsets[y],
    width: metrics.colWidths[x],
    height: metrics.rowHeights[y],
  };
}

function gridToCanvasPoint(x, y, metrics) {
  return {
    x: interpolateCenter(metrics.colCenters, x),
    y: interpolateCenter(metrics.rowCenters, y),
  };
}

function interpolateCenter(centers, value) {
  const minIndex = 0;
  const maxIndex = centers.length - 1;
  const clamped = Math.max(minIndex, Math.min(maxIndex, value));
  const lower = Math.floor(clamped);
  const upper = Math.ceil(clamped);

  if (lower === upper) {
    return centers[lower];
  }

  const t = clamped - lower;
  return centers[lower] + (centers[upper] - centers[lower]) * t;
}
