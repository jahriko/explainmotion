import { Box } from 'tldraw'
import type { Editor, TLShapeId } from 'tldraw'
import type { Track, TrackBaseState } from '@/lib/types/animation'
import type { CompositionSettings } from '@/lib/types/project'
import { getCompositionBounds } from '@/lib/types/project'
import { evaluateAllTracks } from '@/lib/animation/evaluator'
import { getAdapter } from '@/lib/animation/adapters/registry'
import type { AnimatableShape, AnimatedShapePartial } from '@/lib/animation/adapters/types'
import type { TLShapePartial } from 'tldraw'

/** Cast adapter output to tldraw's strict partial type */
const toTLPartial = (partial: AnimatedShapePartial): TLShapePartial =>
  partial as unknown as TLShapePartial

/** Apply animated state for a single frame (no history recording) */
const applyFrameState = (
  editor: Editor,
  tracks: Track[],
  frame: number
): void => {
  const evaluated = evaluateAllTracks(tracks, frame)
  const partials: TLShapePartial[] = []

  for (const evalState of evaluated) {
    const shape = editor.getShape(evalState.shapeId as TLShapeId)
    if (!shape) continue

    const adapter = getAdapter(shape.type)
    const track = tracks.find((t) => t.shapeIds.includes(evalState.shapeId))
    const baseState: TrackBaseState =
      track?.baseStates[evalState.shapeId] ??
      adapter.getBaseState(shape as unknown as AnimatableShape)

    const partial = adapter.applyState(
      shape as unknown as AnimatableShape,
      baseState,
      evalState.values
    )
    partials.push(toTLPartial(partial))
  }

  if (partials.length > 0) {
    editor.run(
      () => {
        editor.updateShapes(partials)
      },
      { history: 'ignore' }
    )
  }
}

/** Snapshot all tracked shapes and return restore function */
const snapshotTrackedShapes = (
  editor: Editor,
  tracks: Track[]
): (() => void) => {
  const partials: TLShapePartial[] = []
  const seenIds = new Set<string>()

  for (const track of tracks) {
    for (const shapeId of track.shapeIds) {
      if (seenIds.has(shapeId)) continue
      seenIds.add(shapeId)

      const shape = editor.getShape(shapeId as TLShapeId)
      if (!shape) continue

      const adapter = getAdapter(shape.type)
      const baseState = adapter.getBaseState(shape as unknown as AnimatableShape)
      const restorePartial = adapter.applyState(
        shape as unknown as AnimatableShape,
        baseState,
        {
          x: baseState.x,
          y: baseState.y,
          rotation: baseState.rotation,
          opacity: baseState.opacity,
          scale: 1,
          strokeWidth: baseState.strokeWidth,
        }
      )
      partials.push(toTLPartial(restorePartial))
    }
  }

  return () => {
    if (partials.length > 0) {
      editor.run(
        () => {
          editor.updateShapes(partials)
        },
        { history: 'ignore' }
      )
    }
  }
}

export interface RenderFrameOptions {
  editor: Editor
  tracks: Track[]
  settings: CompositionSettings
  frame: number
}

/** Render a single frame and return PNG blob */
export const renderFrame = async ({
  editor,
  tracks,
  settings,
  frame,
}: RenderFrameOptions): Promise<Blob | null> => {
  // Apply animated state at this frame
  applyFrameState(editor, tracks, frame)

  // Render to image using world-coord composition bounds
  const b = getCompositionBounds(settings)
  const bounds = new Box(b.x, b.y, b.w, b.h)
  const result = await editor.toImage([], {
    format: 'png',
    bounds,
    padding: 0,
    background: true,
  })

  return result?.blob ?? null
}

export interface RenderAllFramesOptions {
  editor: Editor
  tracks: Track[]
  settings: CompositionSettings
  onFrame: (index: number, blob: Blob) => Promise<void>
  onProgress?: (frame: number, total: number) => void
  shouldCancel?: () => boolean
}

/** Render all frames sequentially, calling onFrame for each.
 *  Snapshots and restores shape state before/after.
 *  Uses a contiguous outputIndex so the worker receives gap-free frame numbers. */
export const renderAllFrames = async ({
  editor,
  tracks,
  settings,
  onFrame,
  onProgress,
  shouldCancel,
}: RenderAllFramesOptions): Promise<void> => {
  const restore = snapshotTrackedShapes(editor, tracks)
  let outputIndex = 0

  try {
    const totalFrames = settings.durationFrames
    for (let frame = 0; frame <= totalFrames; frame++) {
      if (shouldCancel?.()) break

      const blob = await renderFrame({ editor, tracks, settings, frame })
      if (!blob) {
        // Render a blank 1x1 PNG as a fallback to avoid gaps in the sequence
        const canvas = new OffscreenCanvas(settings.width, settings.height)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, settings.width, settings.height)
        }
        const fallback = await canvas.convertToBlob({ type: 'image/png' })
        await onFrame(outputIndex, fallback)
      } else {
        await onFrame(outputIndex, blob)
      }

      outputIndex++
      onProgress?.(frame, totalFrames)
    }
  } finally {
    // Always restore shapes to authored state
    restore()
  }
}
