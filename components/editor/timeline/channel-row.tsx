'use client'

import { useCallback } from 'react'
import { useAnimationStore } from '@/lib/stores/animation-store'
import type { Channel, AnimatableProperty } from '@/lib/types/animation'
import { KeyframeDiamond } from './keyframe-diamond'

interface ChannelRowProps {
  trackId: string
  channel: Channel
}

const PROPERTY_LABELS: Record<AnimatableProperty, string> = {
  x: 'X',
  y: 'Y',
  rotation: 'Rot',
  scale: 'Scale',
  opacity: 'Opacity',
  strokeWidth: 'Stroke',
}

export const ChannelRow = ({ trackId, channel }: ChannelRowProps) => {
  const timelineZoom = useAnimationStore((s) => s.timelineZoom)
  const currentFrame = useAnimationStore((s) => s.currentFrame)
  const addKeyframe = useAnimationStore((s) => s.addKeyframe)

  const handleAddKeyframeAtPlayhead = useCallback(() => {
    // Find interpolated value at current frame, or use 0 as default
    const lastKf = [...channel.keyframes]
      .sort((a, b) => b.frame - a.frame)
      .find((kf) => kf.frame <= currentFrame)
    const value = lastKf?.value ?? 0

    addKeyframe(trackId, channel.property, currentFrame, value)
  }, [trackId, channel, currentFrame, addKeyframe])

  return (
    <div className="flex items-center h-6 group">
      {/* Channel label */}
      <div className="w-40 flex-shrink-0 flex items-center gap-1 px-2 pl-8">
        <span className="text-[10px] text-muted">
          {PROPERTY_LABELS[channel.property] ?? channel.property}
        </span>
        {/* Add keyframe button */}
        <button
          onClick={handleAddKeyframeAtPlayhead}
          className="w-3.5 h-3.5 flex items-center justify-center text-muted hover:text-timeline-keyframe opacity-0 group-hover:opacity-100 transition-opacity"
          title="Add keyframe at playhead"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <path d="M3.5 0v3.5H0v1h3.5V8h1V4.5H8v-1H4.5V0z" />
          </svg>
        </button>
      </div>

      {/* Keyframe strip */}
      <div className="flex-1 relative h-full">
        {channel.keyframes.map((kf) => (
          <KeyframeDiamond
            key={kf.id}
            keyframe={kf}
            trackId={trackId}
            property={channel.property}
            x={kf.frame * timelineZoom}
          />
        ))}
      </div>
    </div>
  )
}
