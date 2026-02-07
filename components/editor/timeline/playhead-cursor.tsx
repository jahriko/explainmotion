'use client'

import { useCallback, useRef, type RefObject } from 'react'
import { useAnimationStore } from '@/lib/stores/animation-store'
import { useProjectStore } from '@/lib/stores/project-store'
import { usePlaybackEngine } from '@/lib/playback/playback-engine'

const TRACK_LABEL_WIDTH = 160 // matches w-40 = 160px

interface PlayheadCursorProps {
  containerRef: RefObject<HTMLDivElement | null>
}

export const PlayheadCursor = ({ containerRef }: PlayheadCursorProps) => {
  const currentFrame = useAnimationStore((s) => s.currentFrame)
  const timelineZoom = useAnimationStore((s) => s.timelineZoom)
  const isPlaying = useAnimationStore((s) => s.isPlaying)
  const durationFrames = useProjectStore((s) => s.settings.durationFrames)

  const { startScrub, scrubTo, endScrub } = usePlaybackEngine()
  const isDraggingRef = useRef(false)
  const scrubThrottleRef = useRef<number>(0)

  const x = TRACK_LABEL_WIDTH + currentFrame * timelineZoom

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPlaying) return
      e.preventDefault()
      e.stopPropagation()

      isDraggingRef.current = true
      startScrub()

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return

        // Throttle to ~60fps
        const now = performance.now()
        if (now - scrubThrottleRef.current < 16) return
        scrubThrottleRef.current = now

        const rect = containerRef.current.getBoundingClientRect()
        const scrollLeft = containerRef.current.scrollLeft
        const relativeX =
          moveEvent.clientX - rect.left + scrollLeft - TRACK_LABEL_WIDTH
        const frame = Math.round(
          Math.max(0, Math.min(durationFrames, relativeX / timelineZoom))
        )

        scrubTo(frame)
      }

      const handleMouseUp = () => {
        isDraggingRef.current = false
        endScrub()
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [isPlaying, timelineZoom, durationFrames, containerRef, startScrub, scrubTo, endScrub]
  )

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none"
      style={{
        left: x,
        zIndex: 50,
      }}
    >
      {/* Line */}
      <div className="absolute top-0 bottom-0 w-px bg-timeline-playhead" />

      {/* Handle (draggable) */}
      <div
        className="absolute -top-0 -left-[5px] w-[11px] h-4 bg-timeline-playhead cursor-col-resize pointer-events-auto"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)',
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
