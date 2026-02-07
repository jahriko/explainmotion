'use client'

import { useCallback } from 'react'
import { useAnimationStore } from '@/lib/stores/animation-store'
import type { Track } from '@/lib/types/animation'
import { ChannelRow } from './channel-row'

interface TrackRowProps {
  track: Track
}

export const TrackRow = ({ track }: TrackRowProps) => {
  const selectedTrackId = useAnimationStore((s) => s.selectedTrackId)
  const setSelectedTrackId = useAnimationStore((s) => s.setSelectedTrackId)
  const toggleTrackVisibility = useAnimationStore((s) => s.toggleTrackVisibility)
  const toggleTrackLock = useAnimationStore((s) => s.toggleTrackLock)
  const toggleTrackCollapse = useAnimationStore((s) => s.toggleTrackCollapse)
  const removeTrack = useAnimationStore((s) => s.removeTrack)

  const isSelected = selectedTrackId === track.id

  const handleSelect = useCallback(() => {
    setSelectedTrackId(isSelected ? null : track.id)
  }, [isSelected, track.id, setSelectedTrackId])

  return (
    <div
      className={`${
        isSelected ? 'bg-accent/5' : 'bg-timeline-track'
      }`}
    >
      {/* Track header */}
      <div className="flex items-center">
        {/* Track label area */}
        <div
          className="w-40 flex-shrink-0 flex items-center gap-1 px-2 py-1 cursor-pointer select-none"
          onClick={handleSelect}
        >
          {/* Collapse toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleTrackCollapse(track.id)
            }}
            className="w-4 h-4 flex items-center justify-center text-muted hover:text-foreground"
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="currentColor"
              style={{
                transform: track.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 150ms',
              }}
            >
              <polygon points="1,1 7,4 1,7" />
            </svg>
          </button>

          {/* Track name */}
          <span className="text-xs text-foreground truncate flex-1">
            {track.label}
            {track.shapeIds.length > 1 && (
              <span className="text-muted ml-1">({track.shapeIds.length})</span>
            )}
          </span>

          {/* Visibility */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleTrackVisibility(track.id)
            }}
            className={`w-4 h-4 flex items-center justify-center transition-colors ${
              track.visible ? 'text-muted hover:text-foreground' : 'text-border-bright'
            }`}
            title={track.visible ? 'Hide' : 'Show'}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              {track.visible ? (
                <path d="M5 2C2.5 2 0.5 5 0.5 5s2 3 4.5 3 4.5-3 4.5-3-2-3-4.5-3zm0 5a2 2 0 110-4 2 2 0 010 4z" />
              ) : (
                <path d="M1 1l8 8M5 2C2.5 2 .5 5 .5 5s.8 1.2 2 2M5 8c2.5 0 4.5-3 4.5-3s-.8-1.2-2-2" />
              )}
            </svg>
          </button>

          {/* Lock */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleTrackLock(track.id)
            }}
            className={`w-4 h-4 flex items-center justify-center transition-colors ${
              track.locked ? 'text-warning' : 'text-muted hover:text-foreground'
            }`}
            title={track.locked ? 'Unlock' : 'Lock'}
          >
            <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor">
              {track.locked ? (
                <path d="M1 5V3a3 3 0 016 0v2h.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-4A.5.5 0 011 5zm1 0h4V3a2 2 0 00-4 0v2z" />
              ) : (
                <path d="M1 5h4V3a2 2 0 00-4 0v.5H0V3a3 3 0 016 0v2h.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-4A.5.5 0 011 5z" />
              )}
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeTrack(track.id)
            }}
            className="w-4 h-4 flex items-center justify-center text-muted hover:text-danger transition-colors"
            title="Remove track"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d="M1.2 0L0 1.2 2.8 4 0 6.8 1.2 8 4 5.2 6.8 8 8 6.8 5.2 4 8 1.2 6.8 0 4 2.8z" />
            </svg>
          </button>
        </div>

        {/* Keyframe strip area for first channel (when collapsed, shows combined) */}
        {track.collapsed && track.channels.length > 0 && (
          <div className="flex-1 h-6">
            {/* Collapsed: show all keyframes from all channels */}
          </div>
        )}
      </div>

      {/* Channel rows (expanded) */}
      {!track.collapsed &&
        track.channels.map((channel) => (
          <ChannelRow
            key={channel.property}
            trackId={track.id}
            channel={channel}
          />
        ))}
    </div>
  )
}
