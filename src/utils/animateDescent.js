export function animateDescent({ route, speed, onFrame, onComplete }) {
  const speedMap = { fast: 1.2, normal: 0.65, slow: 0.42 }
  const cellsPerFrame = (speedMap[speed] || 0.65) * 0.1

  let progress = 0
  let frameCount = 0
  let frameId = null

  const step = () => {
    const stepIdx = Math.floor(progress)

    if (stepIdx >= route.length - 1) {
      const last = route[route.length - 1]
      const previous = route.length >= 2 ? route[route.length - 2] : last
      onComplete({ finalTrail: [...route], last, previous })
      return
    }

    const current = route[stepIdx]
    const next = route[Math.min(stepIdx + 1, route.length - 1)]
    const t = progress - stepIdx

    const drawX = current.x + (next.x - current.x) * t
    const drawY = current.y + (next.y - current.y) * t

    onFrame({
      drawX,
      drawY,
      current,
      next,
      mouthOpen: Math.abs(Math.sin(frameCount * 0.3)),
    })

    progress += cellsPerFrame
    frameCount++
    frameId = requestAnimationFrame(step)
  }

  frameId = requestAnimationFrame(step)
  return frameId
}
