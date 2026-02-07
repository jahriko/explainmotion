'use client'

import { useAnimationStore } from '@/lib/stores/animation-store'
import { useProjectStore } from '@/lib/stores/project-store'
import { usePlaybackEngine } from '@/lib/playback/playback-engine'

/** Format frame number as MM:SS:FF */
const formatTimecode = (frame: number, fps: number): string => {
  const totalSeconds = frame / fps
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const frames = frame % fps

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}

export const PlaybackControls = () => {
  const currentFrame = useAnimationStore((s) => s.currentFrame)
  const isPlaying = useAnimationStore((s) => s.isPlaying)
  const loopEnabled = useAnimationStore((s) => s.loopEnabled)
  const toggleLoop = useAnimationStore((s) => s.toggleLoop)
  const setCurrentFrame = useAnimationStore((s) => s.setCurrentFrame)
  const fps = useProjectStore((s) => s.settings.fps)
  const durationFrames = useProjectStore((s) => s.settings.durationFrames)

  const { play, pause, stop } = usePlaybackEngine()

  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const handleStop = () => {
    stop()
    setCurrentFrame(0)
  }

  const handleGoToStart = () => {
    if (isPlaying) stop()
    setCurrentFrame(0)
  }

  const handleGoToEnd = () => {
    if (isPlaying) stop()
    setCurrentFrame(durationFrames)
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Go to start */}
      <button
        onClick={handleGoToStart}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        title="Go to start"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="2" width="2" height="8" />
          <polygon points="11,2 11,10 4,6" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        className="w-8 h-8 flex items-center justify-center rounded bg-accent hover:bg-accent-hover text-white transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="1" width="3" height="10" rx="0.5" />
            <rect x="7" y="1" width="3" height="10" rx="0.5" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <polygon points="2,1 11,6 2,11" />
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        onClick={handleStop}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        title="Stop"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <rect x="1" y="1" width="8" height="8" rx="1" />
        </svg>
      </button>

      {/* Go to end */}
      <button
        onClick={handleGoToEnd}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        title="Go to end"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <polygon points="1,2 1,10 8,6" />
          <rect x="9" y="2" width="2" height="8" />
        </svg>
      </button>

      {/* Loop toggle */}
      <button
        onClick={toggleLoop}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          loopEnabled
            ? 'bg-accent/20 text-accent'
            : 'hover:bg-surface-hover text-muted hover:text-foreground'
        }`}
        title={loopEnabled ? 'Loop On' : 'Loop Off'}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3H4a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3Z" />
          <path d="M8 1l2 2-2 2" />
        </svg>
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Timecode display */}
      <div className="text-xs font-mono text-muted tabular-nums min-w-[100px] text-center">
        <span className="text-foreground">{formatTimecode(currentFrame, fps)}</span>
        <span className="text-muted mx-1">/</span>
        <span>{formatTimecode(durationFrames, fps)}</span>
      </div>

      {/* Frame counter */}
      <div className="text-xs font-mono text-muted tabular-nums">
        F{currentFrame}
      </div>
    </div>
  )
}
