'use client'

import { useState, useCallback } from 'react'
import { TldrawCanvas } from './canvas/tldraw-canvas'
import { TimelinePanel } from './timeline/timeline-panel'
import { MainToolbar } from './toolbar/main-toolbar'

const MIN_TIMELINE_HEIGHT = 150
const MAX_TIMELINE_HEIGHT = 600
const DEFAULT_TIMELINE_HEIGHT = 280

export const EditorLayout = () => {
  const [timelineHeight, setTimelineHeight] = useState(DEFAULT_TIMELINE_HEIGHT)
  const [isDragging, setIsDragging] = useState(false)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)

      const startY = e.clientY
      const startHeight = timelineHeight

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = startY - moveEvent.clientY
        const newHeight = Math.max(
          MIN_TIMELINE_HEIGHT,
          Math.min(MAX_TIMELINE_HEIGHT, startHeight + deltaY)
        )
        setTimelineHeight(newHeight)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [timelineHeight]
  )

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      {/* Main toolbar */}
      <MainToolbar />

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <TldrawCanvas className="absolute inset-0" />
      </div>

      {/* Resize handle */}
      <div
        className={`h-1 cursor-row-resize transition-colors ${
          isDragging
            ? 'bg-accent'
            : 'bg-border hover:bg-border-bright'
        }`}
        onMouseDown={handleResizeStart}
      />

      {/* Timeline panel */}
      <div
        style={{ height: timelineHeight }}
        className="flex-shrink-0 overflow-hidden"
      >
        <TimelinePanel />
      </div>
    </div>
  )
}
