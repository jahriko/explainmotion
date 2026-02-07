'use client'

import { useAnimationStore } from '@/lib/stores/animation-store'

export const TimelineZoomControls = () => {
  const timelineZoom = useAnimationStore((s) => s.timelineZoom)
  const setTimelineZoom = useAnimationStore((s) => s.setTimelineZoom)

  const handleZoomIn = () => setTimelineZoom(timelineZoom + 2)
  const handleZoomOut = () => setTimelineZoom(timelineZoom - 2)

  return (
    <div className="flex items-center gap-0.5 px-2 flex-shrink-0">
      <button
        onClick={handleZoomOut}
        className="w-5 h-5 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-xs"
        title="Zoom out"
      >
        -
      </button>
      <span className="text-[9px] text-muted tabular-nums min-w-[28px] text-center">
        {timelineZoom}px
      </span>
      <button
        onClick={handleZoomIn}
        className="w-5 h-5 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-xs"
        title="Zoom in"
      >
        +
      </button>
    </div>
  )
}
