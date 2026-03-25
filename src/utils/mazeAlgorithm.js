/**
 * Real maze generator
 *
 * 1. 참가자와 결과 매핑을 먼저 랜덤으로 정한다.
 * 2. 별도의 실제 미로를 생성한다.
 * 3. 생성된 미로 안에서 entry -> assigned exit 경로를 추출한다.
 */

const LAYOUTS = {
  2: { cellCols: 13, cellRows: 17 },
  3: { cellCols: 15, cellRows: 18 },
  4: { cellCols: 17, cellRows: 19 },
  5: { cellCols: 19, cellRows: 20 },
  6: { cellCols: 21, cellRows: 21 },
}

const DIRECTIONS = [
  { dx: 0, dy: 1, name: 'down' },
  { dx: 1, dy: 0, name: 'right' },
  { dx: -1, dy: 0, name: 'left' },
  { dx: 0, dy: -1, name: 'up' },
]

function resolveLayout(participantCount) {
  const base = LAYOUTS[participantCount] || LAYOUTS[4]
  return {
    ...base,
    cols: base.cellCols * 2 + 1,
    rows: base.cellRows * 2 + 1,
  }
}

function createRandom(seed) {
  if (seed === undefined || seed === null) {
    return Math.random
  }

  let state = Math.abs(Number(seed)) || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shuffle(arr, rng) {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function pointKey(x, y) {
  return `${x},${y}`
}

function cellKey(cell) {
  return pointKey(cell.x, cell.y)
}

function edgeKey(a, b) {
  const first = cellKey(a)
  const second = cellKey(b)
  return first < second ? `${first}|${second}` : `${second}|${first}`
}

function cellToGrid(cell) {
  return {
    x: cell.x * 2 + 1,
    y: cell.y * 2 + 1,
  }
}

function computeBoundaryCells(participantCount, cellCols) {
  const start = 2
  const end = cellCols - 3
  const span = end - start

  return Array.from({ length: participantCount }, (_, idx) => {
    if (participantCount === 1) {
      return Math.floor(cellCols / 2)
    }
    return Math.round(start + (span * idx) / (participantCount - 1))
  })
}

function createResultOrder(participantCount, rng) {
  const identity = Array.from({ length: participantCount }, (_, idx) => idx)

  for (let attempt = 0; attempt < 8; attempt++) {
    const shuffled = shuffle(identity, rng)
    if (participantCount <= 1) return shuffled
    if (shuffled.some((value, idx) => value !== idx)) {
      return shuffled
    }
  }

  return identity.map((_, idx) => (idx + 1) % participantCount)
}

function createMazeState(layout) {
  return {
    openEdges: new Map(),
    layout,
  }
}

function carveLogicalEdge(state, from, to) {
  state.openEdges.set(edgeKey(from, to), [from, to])
}

function getNeighborCells(cell, layout) {
  return DIRECTIONS
    .map(({ dx, dy, name }) => ({
      x: cell.x + dx,
      y: cell.y + dy,
      direction: name,
    }))
    .filter((candidate) => (
      candidate.x >= 0 &&
      candidate.x < layout.cellCols &&
      candidate.y >= 0 &&
      candidate.y < layout.cellRows
    ))
}

function directionWeight(from, candidate, layout) {
  const verticalCenter = (layout.cellCols - 1) / 2
  let weight = 1

  if (candidate.y > from.y) weight += 2.4
  if (candidate.y === from.y) weight += 1.2
  if (candidate.y < from.y) weight += 0.4
  weight += Math.max(0, 4 - Math.abs(candidate.x - verticalCenter)) * 0.08

  return weight
}

function chooseWeightedNeighbor(from, neighbors, layout, rng) {
  const options = neighbors.map((candidate) => ({
    value: candidate,
    weight: directionWeight(from, candidate, layout),
  }))

  const total = options.reduce((sum, option) => sum + option.weight, 0)
  let roll = rng() * total

  for (const option of options) {
    roll -= option.weight
    if (roll <= 0) {
      return option.value
    }
  }

  return options[options.length - 1]?.value ?? null
}

function createPerfectMaze(layout, rng) {
  const state = createMazeState(layout)
  const visited = new Set()
  const stack = [{ x: Math.floor(layout.cellCols / 2), y: 0 }]
  visited.add(cellKey(stack[0]))

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const unvisitedNeighbors = getNeighborCells(current, layout)
      .filter((candidate) => !visited.has(cellKey(candidate)))

    if (unvisitedNeighbors.length === 0) {
      stack.pop()
      continue
    }

    const next = chooseWeightedNeighbor(current, unvisitedNeighbors, layout, rng)
    carveLogicalEdge(state, current, next)
    visited.add(cellKey(next))
    stack.push({ x: next.x, y: next.y })
  }

  return state
}

function carveCorridor(grid, start, end) {
  const dx = Math.sign(end.x - start.x)
  const dy = Math.sign(end.y - start.y)

  let x = start.x
  let y = start.y
  grid[y][x] = 1

  while (x !== end.x || y !== end.y) {
    x += dx
    y += dy
    grid[y][x] = 1
  }
}

function buildMazeGrid(state, layout, entryCells, exitCells) {
  const grid = Array.from({ length: layout.rows }, () => Array(layout.cols).fill(0))

  for (let y = 0; y < layout.cellRows; y++) {
    for (let x = 0; x < layout.cellCols; x++) {
      const cell = cellToGrid({ x, y })
      grid[cell.y][cell.x] = 1
    }
  }

  for (const [from, to] of state.openEdges.values()) {
    carveCorridor(grid, cellToGrid(from), cellToGrid(to))
  }

  for (const cell of entryCells) {
    const point = cellToGrid(cell)
    grid[0][point.x] = 1
  }

  for (const cell of exitCells) {
    const point = cellToGrid(cell)
    grid[layout.rows - 1][point.x] = 1
  }

  return grid
}

function solveMazeRoute(grid, start, end) {
  const rows = grid.length
  const cols = grid[0].length
  const queue = [start]
  const visited = new Set([pointKey(start.x, start.y)])
  const parent = new Map()

  while (queue.length > 0) {
    const current = queue.shift()
    if (current.x === end.x && current.y === end.y) {
      break
    }

    for (const { dx, dy } of DIRECTIONS) {
      const nextX = current.x + dx
      const nextY = current.y + dy

      if (nextX < 0 || nextX >= cols || nextY < 0 || nextY >= rows) continue
      if (grid[nextY][nextX] !== 1) continue

      const nextKey = pointKey(nextX, nextY)
      if (visited.has(nextKey)) continue

      visited.add(nextKey)
      parent.set(nextKey, current)
      queue.push({ x: nextX, y: nextY })
    }
  }

  const route = []
  let cursor = end
  const endKey = pointKey(end.x, end.y)
  if (!visited.has(endKey)) {
    return []
  }

  while (cursor) {
    route.push(cursor)
    if (cursor.x === start.x && cursor.y === start.y) {
      break
    }
    cursor = parent.get(pointKey(cursor.x, cursor.y))
  }

  return route.reverse()
}

function countTurns(route) {
  let turns = 0

  for (let i = 2; i < route.length; i++) {
    const ax = route[i - 1].x - route[i - 2].x
    const ay = route[i - 1].y - route[i - 2].y
    const bx = route[i].x - route[i - 1].x
    const by = route[i].y - route[i - 1].y

    if (ax !== bx || ay !== by) {
      turns++
    }
  }

  return turns
}

function horizontalMoveCount(route) {
  let horizontalMoves = 0

  for (let i = 1; i < route.length; i++) {
    if (route[i].x !== route[i - 1].x) {
      horizontalMoves++
    }
  }

  return horizontalMoves
}

function validateMaze({ grid, paths, entries, exits, exitOrder, layout }) {
  const errors = []
  const routeLengths = paths.map((path) => path.route.length)
  const avgLength = routeLengths.reduce((sum, value) => sum + value, 0) / Math.max(1, routeLengths.length)
  const maxDelta = Math.max(10, Math.round(avgLength * 0.32))

  const allowedBorderOpenings = new Set(
    [...entries, ...exits].map((point) => pointKey(point.x, point.y))
  )

  for (let y = 0; y < layout.rows; y++) {
    for (let x = 0; x < layout.cols; x++) {
      if (x !== 0 && x !== layout.cols - 1 && y !== 0 && y !== layout.rows - 1) {
        continue
      }

      if (grid[y][x] !== 1) continue
      if (!allowedBorderOpenings.has(pointKey(x, y))) {
        errors.push(`unexpected border opening at (${x}, ${y})`)
      }
    }
  }

  for (const path of paths) {
    const entry = entries[path.from]
    const exit = exits[path.to]
    const route = path.route

    if (route.length === 0) {
      errors.push(`route ${path.from} is empty`)
      continue
    }

    if (Math.abs(route.length - avgLength) > maxDelta) {
      errors.push(`route ${path.from} length is too imbalanced`)
    }

    if (countTurns(route) < Math.max(6, Math.floor(layout.cellRows / 2))) {
      errors.push(`route ${path.from} does not feel maze-like enough`)
    }

    if (horizontalMoveCount(route) < Math.max(8, Math.floor(layout.cellRows * 0.35))) {
      errors.push(`route ${path.from} has too little horizontal exploration`)
    }

    const start = route[0]
    const end = route[route.length - 1]
    if (start.x !== entry.x || start.y !== entry.y) {
      errors.push(`route ${path.from} does not start at its entry`)
    }
    if (end.x !== exit.x || end.y !== exit.y) {
      errors.push(`route ${path.from} does not end at its assigned exit`)
    }

    for (let i = 0; i < route.length; i++) {
      const point = route[i]
      if (grid[point.y]?.[point.x] !== 1) {
        errors.push(`route ${path.from} walks through a wall`)
        break
      }

      if (i === 0) continue

      const previous = route[i - 1]
      const distance = Math.abs(previous.x - point.x) + Math.abs(previous.y - point.y)
      if (distance !== 1) {
        errors.push(`route ${path.from} is not contiguous`)
        break
      }
    }
  }

  const seenTargets = new Set(exitOrder)
  if (seenTargets.size !== exitOrder.length) {
    errors.push('result mapping is not a permutation')
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export function generateMaze(participantCount, options = {}) {
  const layout = resolveLayout(participantCount)
  const rng = createRandom(options.seed)
  const entryColumns = computeBoundaryCells(participantCount, layout.cellCols)
  const exitColumns = computeBoundaryCells(participantCount, layout.cellCols)
  const entryCells = entryColumns.map((x) => ({ x, y: 0 }))
  const exitCells = exitColumns.map((x) => ({ x, y: layout.cellRows - 1 }))

  for (let attempt = 0; attempt < 48; attempt++) {
    const exitOrder = createResultOrder(participantCount, rng)
    const mazeState = createPerfectMaze(layout, rng)
    const grid = buildMazeGrid(mazeState, layout, entryCells, exitCells)

    const entries = entryCells.map((cell) => ({ x: cellToGrid(cell).x, y: 0 }))
    const exits = exitCells.map((cell) => ({ x: cellToGrid(cell).x, y: layout.rows - 1 }))

    const paths = entryCells.map((entryCell, participantIdx) => {
      const assignedExitCell = exitCells[exitOrder[participantIdx]]
      const start = { x: cellToGrid(entryCell).x, y: 0 }
      const end = { x: cellToGrid(assignedExitCell).x, y: layout.rows - 1 }

      return {
        from: participantIdx,
        to: exitOrder[participantIdx],
        route: solveMazeRoute(grid, start, end),
      }
    })

    const validation = validateMaze({
      grid,
      paths,
      entries,
      exits,
      exitOrder,
      layout,
    })

    if (!validation.ok) {
      continue
    }

    return {
      grid,
      paths,
      entries,
      exits,
      cols: layout.cols,
      rows: layout.rows,
      exitOrder,
      layout,
    }
  }

  throw new Error('Unable to generate a valid real maze')
}
