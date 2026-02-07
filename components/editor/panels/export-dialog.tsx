'use client'

import { useState, useCallback } from 'react'
import { useProjectStore } from '@/lib/stores/project-store'

type ExportFormat = 'webm' | 'mp4' | 'gif'
type ExportResolution = '720p' | '1080p' | '4k'

interface ExportDialogProps {
  onClose: () => void
}

const RESOLUTION_MAP: Record<ExportResolution, { w: number; h: number }> = {
  '720p': { w: 1280, h: 720 },
  '1080p': { w: 1920, h: 1080 },
  '4k': { w: 3840, h: 2160 },
}

export const ExportDialog = ({ onClose }: ExportDialogProps) => {
  const settings = useProjectStore((s) => s.settings)
  const [format, setFormat] = useState<ExportFormat>('webm')
  const [resolution, setResolution] = useState<ExportResolution>('720p')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const durationSeconds = settings.durationFrames / settings.fps
  const totalFrames = settings.durationFrames

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setProgress(0)
    setError(null)

    try {
      // Dynamic import to avoid loading ffmpeg on page load
      const { exportVideo } = await import('@/lib/export/video-exporter')
      const editor = useProjectStore.getState().editor
      if (!editor) throw new Error('Editor not available')

      const res = RESOLUTION_MAP[resolution]
      await exportVideo({
        editor,
        format,
        width: res.w,
        height: res.h,
        onProgress: (frame, total) => {
          setProgress(Math.round((frame / total) * 100))
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }, [format, resolution])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-border rounded-lg p-5 w-[380px] shadow-xl">
        <h2 className="text-sm font-semibold mb-4">Export Video</h2>

        {/* Format */}
        <div className="mb-4">
          <label className="text-xs text-muted block mb-1.5">Format</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('webm')}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                format === 'webm'
                  ? 'bg-accent text-white'
                  : 'bg-surface-hover hover:bg-border text-muted'
              }`}
            >
              WebM (VP9)
            </button>
            <button
              onClick={() => setFormat('mp4')}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                format === 'mp4'
                  ? 'bg-accent text-white'
                  : 'bg-surface-hover hover:bg-border text-muted'
              }`}
              title="Best effort -- may not be available in all browsers"
            >
              MP4 (H.264)
            </button>
            <button
              onClick={() => setFormat('gif')}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                format === 'gif'
                  ? 'bg-accent text-white'
                  : 'bg-surface-hover hover:bg-border text-muted'
              }`}
            >
              GIF
            </button>
          </div>
        </div>

        {/* Resolution */}
        <div className="mb-4">
          <label className="text-xs text-muted block mb-1.5">Resolution</label>
          <div className="flex gap-2">
            {(['720p', '1080p', '4k'] as ExportResolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`text-xs px-3 py-1.5 rounded transition-colors ${
                  resolution === res
                    ? 'bg-accent text-white'
                    : 'bg-surface-hover hover:bg-border text-muted'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-muted mb-4 space-y-1">
          <div>Duration: {durationSeconds.toFixed(1)}s ({totalFrames} frames)</div>
          <div>FPS: {settings.fps}</div>
          {durationSeconds > 60 && (
            <div className="text-warning">
              Warning: Long exports may be slow or fail in the browser.
            </div>
          )}
          {resolution === '4k' && (
            <div className="text-warning">
              4K exports are resource-intensive. Consider 1080p for faster results.
            </div>
          )}
        </div>

        {/* Progress */}
        {isExporting && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Rendering frames...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-danger mb-4 p-2 bg-danger/10 rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-xs px-3 py-1.5 rounded bg-surface-hover hover:bg-border text-muted transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Cancel' : 'Close'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="text-xs px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
