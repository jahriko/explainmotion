'use client'

import { useRef, useCallback } from 'react'
import { useAnimationStore } from '@/lib/stores/animation-store'
import { useProjectStore } from '@/lib/stores/project-store'
import { TimeRuler } from './time-ruler'
import { TrackList } from './track-list'
import { PlayheadCursor } from './playhead-cursor'
import { TimelineZoomControls } from './timeline-zoom-controls'
import { PropertiesPanel } from '../panels/properties-panel'

export const TimelinePanel = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const timelineZoom = useAnimationStore((s) => s.timelineZoom)
  const durationFrames = useProjectStore((s) => s.settings.durationFrames)
  const setTimelineScrollX = useAnimationStore((s) => s.setTimelineScrollX)

  const totalWidth = durationFrames * timelineZoom + 200 // extra padding

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setTimelineScrollX(scrollContainerRef.current.scrollLeft)
    }
  }, [setTimelineScrollX])

  return (
    <div className="flex h-full bg-timeline-bg border-t border-border">
      {/* Properties panel sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-border overflow-y-auto">
        <PropertiesPanel />
      </div>

      {/* Timeline content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Ruler + zoom controls */}
        <div className="flex items-center border-b border-border bg-timeline-ruler h-7 flex-shrink-0">
          {/* Track label header */}
          <div className="w-40 flex-shrink-0 px-2 text-xs text-muted flex items-center">
            Tracks
          </div>
          {/* Ruler area */}
          <div
            className="flex-1 overflow-hidden relative"
            style={{ position: 'relative' }}
          >
            <div
              style={{
                width: totalWidth,
                transform: `translateX(-${useAnimationStore.getState().timelineScrollX}px)`,
              }}
            >
              <TimeRuler />
            </div>
          </div>
          <TimelineZoomControls />
        </div>

        {/* Tracks + keyframes scrollable area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-auto relative"
        >
          <div style={{ minWidth: totalWidth + 160 }} className="relative">
            <TrackList />
            <PlayheadCursor containerRef={scrollContainerRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
