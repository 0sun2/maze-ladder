import { useRef, useEffect, useCallback } from 'react';

const COLORS = ['#4F7DF2', '#EF4444', '#22C55E', '#F59E0B', '#A855F7', '#F97316'];
const WALL_COLOR = '#1E293B';
const PASSAGE_COLOR = '#F8FAFC';
const TRAIL_ALPHA = 0.6;

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

  // Calculate cell size to fit container
  const getCellSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 12;
    const parent = canvas.parentElement;
    const maxWidth = parent?.clientWidth || 360;
    const maxHeight = Math.min(window.innerHeight * 0.5, 500);
    return Math.floor(Math.min(maxWidth / cols, maxHeight / rows));
  }, [cols, rows]);

  // Draw the maze
  const drawMaze = useCallback((ctx, cellSize) => {
    const w = cols * cellSize;
    const h = rows * cellSize;

    ctx.clearRect(0, 0, w, h);

    // Draw walls and passages
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = grid[y][x] === 1 ? PASSAGE_COLOR : WALL_COLOR;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Add subtle grid lines for passages
        if (grid[y][x] === 1) {
          ctx.strokeStyle = 'rgba(0,0,0,0.03)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw entry markers
    const { entries, exits } = mazeData;
    entries.forEach((e, i) => {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fillRect(e.x * cellSize, e.y * cellSize, cellSize, cellSize);
    });

    // Draw exit markers
    exits.forEach((e) => {
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(e.x * cellSize, e.y * cellSize, cellSize, cellSize);
    });
  }, [grid, cols, rows, mazeData]);

  // Draw existing trails
  const drawTrails = useCallback((ctx, cellSize) => {
    for (const trail of trailsRef.current) {
      const color = COLORS[trail.idx % COLORS.length];
      ctx.globalAlpha = TRAIL_ALPHA;
      for (const p of trail.points) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          p.x * cellSize + cellSize / 2,
          p.y * cellSize + cellSize / 2,
          cellSize * 0.3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }, []);

  // Draw character
  const drawCharacter = useCallback((ctx, x, y, idx, cellSize, expression = 'normal') => {
    const cx = x * cellSize + cellSize / 2;
    const cy = y * cellSize + cellSize / 2;
    const r = cellSize * 0.4;
    const color = COLORS[idx % COLORS.length];

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // White outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eyes
    const eyeR = r * 0.18;
    const eyeOffX = r * 0.3;
    const eyeOffY = r * -0.15;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cx - eyeOffX, cy + eyeOffY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOffX, cy + eyeOffY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    const pupilR = eyeR * 0.5;
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(cx - eyeOffX, cy + eyeOffY, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + eyeOffX, cy + eyeOffY, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    if (expression === 'happy') {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.1, r * 0.25, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.25, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  // Initial draw
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

  // Animation
  useEffect(() => {
    if (animatingIdx === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cellSize = getCellSize();

    // Find the path for this participant
    const pathData = paths.find((p) => p.from === animatingIdx);
    if (!pathData) return;

    const route = pathData.route;
    const trailPoints = [];

    const speedMap = { fast: 3, normal: 2, slow: 1 };
    const framesPerCell = Math.max(2, Math.floor(8 / (speedMap[speed] || 2)));

    let step = 0;
    let subStep = 0;

    const animate = () => {
      if (step >= route.length) {
        // Animation complete
        trailsRef.current.push({ idx: animatingIdx, points: [...trailPoints] });

        // Final draw with happy expression
        drawMaze(ctx, cellSize);
        drawTrails(ctx, cellSize);

        const lastPoint = route[route.length - 1];
        drawCharacter(ctx, lastPoint.x, lastPoint.y, animatingIdx, cellSize, 'happy');

        // Arrival effect
        drawArrivalEffect(ctx, lastPoint.x, lastPoint.y, cellSize, COLORS[animatingIdx % COLORS.length]);

        onAnimationEnd(animatingIdx);
        return;
      }

      // Interpolate position
      const current = route[step];
      const next = step + 1 < route.length ? route[step + 1] : current;
      const t = subStep / framesPerCell;

      const drawX = current.x + (next.x - current.x) * t;
      const drawY = current.y + (next.y - current.y) * t;

      // Add to trail
      if (subStep === 0) {
        trailPoints.push({ x: current.x, y: current.y });
      }

      // Redraw
      drawMaze(ctx, cellSize);
      drawTrails(ctx, cellSize);

      // Draw current trail
      const color = COLORS[animatingIdx % COLORS.length];
      ctx.globalAlpha = TRAIL_ALPHA;
      for (const p of trailPoints) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          p.x * cellSize + cellSize / 2,
          p.y * cellSize + cellSize / 2,
          cellSize * 0.3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Bounce effect
      const bounceY = Math.sin(step * 0.5) * cellSize * 0.08;

      drawCharacter(ctx, drawX, drawY - bounceY / cellSize, animatingIdx, cellSize);

      subStep++;
      if (subStep >= framesPerCell) {
        subStep = 0;
        step++;

        // Pause at turns
        if (step < route.length - 1 && step > 0) {
          const prev = route[step - 1];
          const curr = route[step];
          const nxt = route[step + 1];
          const dirChanged =
            (curr.x - prev.x !== nxt.x - curr.x) || (curr.y - prev.y !== nxt.y - curr.y);
          if (dirChanged && Math.random() < 0.3) {
            // Small pause at turns — skip a frame
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [animatingIdx, paths, getCellSize, drawMaze, drawTrails, drawCharacter, onAnimationEnd, speed]);

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

  // Star burst effect
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const len = cellSize * 0.8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * cellSize * 0.5, cy + Math.sin(angle) * cellSize * 0.5);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
