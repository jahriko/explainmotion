import type { Editor } from 'tldraw'
import type { WorkerInMessage, WorkerOutMessage, ExportFormat } from './export-worker-messages'
import { renderAllFrames } from './frame-renderer'
import { useAnimationStore } from '@/lib/stores/animation-store'
import { useProjectStore } from '@/lib/stores/project-store'

export interface ExportOptions {
  editor: Editor
  format: ExportFormat
  width: number
  height: number
  onProgress?: (frame: number, total: number) => void
}

/** Export video from the current editor state.
 *  Renders frames on the main thread, streams to a Web Worker for encoding. */
export const exportVideo = async ({
  editor,
  format,
  width,
  height,
  onProgress,
}: ExportOptions): Promise<void> => {
  const { tracks } = useAnimationStore.getState()
  const { settings } = useProjectStore.getState()

  // Create export settings with requested resolution
  const exportSettings = {
    ...settings,
    width,
    height,
  }

  const totalFrames = settings.durationFrames

  // Try to use Web Worker for encoding
  let worker: Worker | null = null

  try {
    worker = new Worker(
      new URL('./export-worker.ts', import.meta.url),
      { type: 'module' }
    )
  } catch {
    // Web Worker creation may fail in some environments
    // Fall back to client-only approach
  }

  if (worker) {
    return exportWithWorker({
      editor,
      tracks,
      settings: exportSettings,
      format,
      totalFrames,
      onProgress,
      worker,
    })
  }

  // Fallback: no worker available, just render frames and offer download
  throw new Error('Web Worker not available for encoding. Please try a different browser.')
}

interface WorkerExportOptions {
  editor: Editor
  tracks: ReturnType<typeof useAnimationStore.getState>['tracks']
  settings: ReturnType<typeof useProjectStore.getState>['settings']
  format: ExportFormat
  totalFrames: number
  onProgress?: (frame: number, total: number) => void
  worker: Worker
}

const exportWithWorker = ({
  editor,
  tracks,
  settings,
  format,
  totalFrames,
  onProgress,
  worker,
}: WorkerExportOptions): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    let cancelled = false

    const postToWorker = (msg: WorkerInMessage, transfer?: Transferable[]) => {
      worker.postMessage(msg, transfer ?? [])
    }

    worker.onmessage = async (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data

      switch (msg.type) {
        case 'ready': {
          // Worker is initialized, start rendering frames
          try {
            await renderAllFrames({
              editor,
              tracks,
              settings,
              shouldCancel: () => cancelled,
              onProgress: (frame, total) => {
                onProgress?.(frame, total)
              },
              onFrame: async (index, blob) => {
                const buffer = await blob.arrayBuffer()
                postToWorker(
                  { type: 'frame', index, data: buffer },
                  [buffer] // Transfer ownership to avoid copy
                )
              },
            })

            // All frames sent, tell worker to finalize
            if (!cancelled) {
              postToWorker({ type: 'finalize' })
            }
          } catch (err) {
            reject(err)
            worker.terminate()
          }
          break
        }

        case 'progress': {
          if (msg.phase === 'encoding') {
            // Encoding progress from ffmpeg
            onProgress?.(totalFrames, totalFrames)
          }
          break
        }

        case 'complete': {
          // Create blob and trigger download
          const blob = new Blob([msg.data], { type: msg.mimeType })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `export${msg.extension}`
          link.click()
          URL.revokeObjectURL(url)

          worker.terminate()
          resolve()
          break
        }

        case 'error': {
          worker.terminate()
          reject(new Error(msg.message))
          break
        }
      }
    }

    worker.onerror = (err) => {
      reject(new Error(`Worker error: ${err.message}`))
      worker.terminate()
    }

    // Initialize the worker
    postToWorker({
      type: 'init',
      format,
      fps: settings.fps,
      width: settings.width,
      height: settings.height,
      totalFrames,
    })
  })
}
