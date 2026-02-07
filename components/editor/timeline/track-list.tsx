'use client'

import { useAnimationStore } from '@/lib/stores/animation-store'
import { TrackRow } from './track-row'

export const TrackList = () => {
  const tracks = useAnimationStore((s) => s.tracks)
  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order)

  if (sortedTracks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted p-8">
        Select shapes on the canvas and click &quot;Add to Timeline&quot; to start animating.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {sortedTracks.map((track) => (
        <TrackRow key={track.id} track={track} />
      ))}
    </div>
  )
}
