import type { Track } from './animation'

export interface CompositionSettings {
  /** World-space X origin of composition rectangle */
  boundsX: number
  /** World-space Y origin of composition rectangle */
  boundsY: number
  /** Composition width in pixels */
  width: number
  /** Composition height in pixels */
  height: number
  /** Frames per second */
  fps: number
  /** Total duration in frames */
  durationFrames: number
}

export const DEFAULT_COMPOSITION_SETTINGS: CompositionSettings = {
  boundsX: 0,
  boundsY: 0,
  width: 1920,
  height: 1080,
  fps: 30,
  durationFrames: 150, // 5 seconds at 30fps
}

export interface Project {
  id: string
  name: string
  settings: CompositionSettings
  /** Serialized TLStoreSnapshot */
  tldrawSnapshot: unknown
  tracks: Track[]
  createdAt: number
  updatedAt: number
}

/** Bounds in world coordinates for export/rendering */
export interface CompositionBounds {
  x: number
  y: number
  w: number
  h: number
}

export const getCompositionBounds = (
  settings: CompositionSettings
): CompositionBounds => ({
  x: settings.boundsX,
  y: settings.boundsY,
  w: settings.width,
  h: settings.height,
})
