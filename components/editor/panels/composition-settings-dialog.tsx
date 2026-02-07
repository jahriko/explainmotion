'use client'

import { useState } from 'react'
import { useProjectStore } from '@/lib/stores/project-store'

interface CompositionSettingsDialogProps {
  onClose: () => void
}

export const CompositionSettingsDialog = ({
  onClose,
}: CompositionSettingsDialogProps) => {
  const settings = useProjectStore((s) => s.settings)
  const setSettings = useProjectStore((s) => s.setSettings)

  const [width, setWidth] = useState(settings.width)
  const [height, setHeight] = useState(settings.height)
  const [fps, setFps] = useState(settings.fps)
  const [durationSeconds, setDurationSeconds] = useState(
    settings.durationFrames / settings.fps
  )

  const handleApply = () => {
    setSettings({
      width,
      height,
      fps,
      durationFrames: Math.round(durationSeconds * fps),
    })
    onClose()
  }

  const presets = [
    { label: '1920x1080 (1080p)', w: 1920, h: 1080 },
    { label: '1280x720 (720p)', w: 1280, h: 720 },
    { label: '3840x2160 (4K)', w: 3840, h: 2160 },
    { label: '1080x1080 (Square)', w: 1080, h: 1080 },
    { label: '1080x1920 (Vertical)', w: 1080, h: 1920 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-border rounded-lg p-5 w-[380px] shadow-xl">
        <h2 className="text-sm font-semibold mb-4">Composition Settings</h2>

        {/* Resolution presets */}
        <div className="mb-4">
          <label className="text-xs text-muted block mb-1.5">Presets</label>
          <div className="flex flex-wrap gap-1">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setWidth(preset.w)
                  setHeight(preset.h)
                }}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  width === preset.w && height === preset.h
                    ? 'bg-accent text-white'
                    : 'bg-surface-hover hover:bg-border text-muted'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Width / Height */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted block mb-1">Width</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Height</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
              className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* FPS */}
        <div className="mb-3">
          <label className="text-xs text-muted block mb-1">Frame Rate (FPS)</label>
          <div className="flex gap-2">
            {[24, 30, 60].map((f) => (
              <button
                key={f}
                onClick={() => setFps(f)}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  fps === f
                    ? 'bg-accent text-white'
                    : 'bg-surface-hover hover:bg-border text-muted'
                }`}
              >
                {f}
              </button>
            ))}
            <input
              type="number"
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value) || 30)}
              className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
              min={1}
              max={120}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="mb-5">
          <label className="text-xs text-muted block mb-1">
            Duration (seconds) = {Math.round(durationSeconds * fps)} frames
          </label>
          <input
            type="number"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(parseFloat(e.target.value) || 0)}
            step={0.5}
            min={0.5}
            max={300}
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded bg-surface-hover hover:bg-border text-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="text-xs px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
