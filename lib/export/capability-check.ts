import type { ExportFormat } from './export-worker-messages'

/** Cached result of codec availability check */
let cachedCapabilities: Record<ExportFormat, boolean> | null = null

/** Check which export formats are available.
 *  WebM (VP9) is always available in ffmpeg.wasm.
 *  MP4 (H.264) may or may not be available depending on the build.
 *  GIF is always available. */
export const getAvailableFormats = async (): Promise<Record<ExportFormat, boolean>> => {
  if (cachedCapabilities) return cachedCapabilities

  // Default capabilities -- VP9 and GIF are always available in ffmpeg.wasm
  // H.264 support varies by build
  cachedCapabilities = {
    webm: true,
    mp4: false, // Conservative default -- will be updated on first export attempt
    gif: true,
  }

  return cachedCapabilities
}

/** Update the cached capability for a format after a runtime test */
export const setFormatAvailability = (format: ExportFormat, available: boolean): void => {
  if (!cachedCapabilities) {
    cachedCapabilities = { webm: true, mp4: false, gif: true }
  }
  cachedCapabilities[format] = available
}
