'use client'

import { useCallback, useRef, useState } from 'react'
import { useAnimationStore } from '@/lib/stores/animation-store'
import type { Keyframe, AnimatableProperty } from '@/lib/types/animation'

interface KeyframeDiamondProps {
  keyframe: Keyframe
  trackId: string
  property: AnimatableProperty
  x: number
}

export const KeyframeDiamond = ({
  keyframe,
  trackId,
  property,
  x,
}: KeyframeDiamondProps) => {
  const selectedKeyframeIds = useAnimationStore((s) => s.selectedKeyframeIds)
  const setSelectedKeyframeIds = useAnimationStore((s) => s.setSelectedKeyframeIds)
  const toggleKeyframeSelection = useAnimationStore((s) => s.toggleKeyframeSelection)
  const moveKeyframe = useAnimationStore((s) => s.moveKeyframe)
  const timelineZoom = useAnimationStore((s) => s.timelineZoom)

  const isSelected = selectedKeyframeIds.includes(keyframe.id)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ clientX: number; startFrame: number } | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      // Selection logic
      if (e.ctrlKey || e.metaKey) {
        toggleKeyframeSelection(keyframe.id)
      } else if (e.shiftKey) {
        // Range select: add to selection
        useAnimationStore.getState().addKeyframeToSelection(keyframe.id)
      } else if (!isSelected) {
        setSelectedKeyframeIds([keyframe.id])
      }

      // Start drag
      dragStartRef.current = {
        clientX: e.clientX,
        startFrame: keyframe.frame,
      }
      setIsDragging(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return

        const deltaX = moveEvent.clientX - dragStartRef.current.clientX
        const deltaFrames = Math.round(deltaX / timelineZoom)

        // Snap to frames (unless Shift is held)
        const newFrame = moveEvent.shiftKey
          ? dragStartRef.current.startFrame + deltaX / timelineZoom
          : dragStartRef.current.startFrame + deltaFrames

        moveKeyframe(trackId, property, keyframe.id, Math.max(0, newFrame))
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        dragStartRef.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [
      keyframe.id,
      keyframe.frame,
      trackId,
      property,
      isSelected,
      timelineZoom,
      setSelectedKeyframeIds,
      toggleKeyframeSelection,
      moveKeyframe,
    ]
  )

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 cursor-pointer group/diamond"
      style={{ left: x - 5 }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`w-2.5 h-2.5 rotate-45 border transition-colors ${
          isDragging
            ? 'bg-accent border-accent scale-125'
            : isSelected
              ? 'bg-timeline-keyframe border-timeline-keyframe'
              : keyframe.hold
                ? 'bg-warning/60 border-warning'
                : 'bg-timeline-keyframe/70 border-timeline-keyframe/50 group-hover/diamond:bg-timeline-keyframe group-hover/diamond:border-timeline-keyframe'
        }`}
      />
    </div>
  )
}
