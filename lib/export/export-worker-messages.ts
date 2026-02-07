/** Messages sent from main thread to export worker */
export type WorkerInMessage =
  | { type: 'init'; format: ExportFormat; fps: number; width: number; height: number; totalFrames: number }
  | { type: 'frame'; index: number; data: ArrayBuffer }
  | { type: 'finalize' }
  | { type: 'cancel' }

/** Messages sent from export worker back to main thread */
export type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'progress'; frame: number; total: number; phase: 'receiving' | 'encoding' }
  | { type: 'complete'; data: ArrayBuffer; mimeType: string; extension: string }
  | { type: 'error'; message: string }

export type ExportFormat = 'webm' | 'mp4' | 'gif'

export const MIME_TYPES: Record<ExportFormat, string> = {
  webm: 'video/webm',
  mp4: 'video/mp4',
  gif: 'image/gif',
}

export const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  webm: '.webm',
  mp4: '.mp4',
  gif: '.gif',
}
