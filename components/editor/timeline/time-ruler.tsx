'use client'

import { useAnimationStore } from '@/lib/stores/animation-store'
import { useProjectStore } from '@/lib/stores/project-store'

export const TimeRuler = () => {
  const timelineZoom = useAnimationStore((s) => s.timelineZoom)
  const fps = useProjectStore((s) => s.settings.fps)
  const durationFrames = useProjectStore((s) => s.settings.durationFrames)

  // Determine tick interval based on zoom level
  const getTickInterval = () => {
    const pxPerSecond = timelineZoom * fps
    if (pxPerSecond > 400) return 1 // every frame
    if (pxPerSecond > 200) return 5
    if (pxPerSecond > 100) return Math.round(fps / 4)
    if (pxPerSecond > 50) return Math.round(fps / 2)
    return fps // every second
  }

  const tickInterval = getTickInterval()
  const ticks: { frame: number; isMajor: boolean }[] = []

  for (let f = 0; f <= durationFrames; f += tickInterval) {
    const isMajor = f % fps === 0
    ticks.push({ frame: f, isMajor })
  }

  return (
    <div className="relative h-full select-none" style={{ height: 26 }}>
      {ticks.map(({ frame, isMajor }) => {
        const x = frame * timelineZoom
        return (
          <div
            key={frame}
            className="absolute top-0"
            style={{ left: x }}
          >
            <div
              className={`${
                isMajor ? 'h-3 bg-muted' : 'h-2 bg-border-bright'
              }`}
              style={{ width: 1 }}
            />
            {isMajor && (
              <div
                className="text-muted absolute whitespace-nowrap"
                style={{
                  fontSize: 9,
                  top: 12,
                  left: 2,
                }}
              >
                {(frame / fps).toFixed(frame % fps === 0 ? 0 : 1)}s
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
