'use client'

import { useCallback, useRef } from 'react'
import type { TLShapePartial, TLShapeId } from 'tldraw'
import { useAnimationStore } from '@/lib/stores/animation-store'
import { useProjectStore } from '@/lib/stores/project-store'
import { evaluateAllTracks } from '@/lib/animation/evaluator'
import { getAdapter } from '@/lib/animation/adapters/registry'
import type { AnimatableShape, AnimatedShapePartial } from '@/lib/animation/adapters/types'
import type { TrackBaseState } from '@/lib/types/animation'

/** Cast our loose partial type to tldraw's strict TLShapePartial */
const toTLPartial = (partial: AnimatedShapePartial): TLShapePartial =>
  partial as unknown as TLShapePartial

/** Snapshot of shape states before playback, used to restore after preview */
interface ShapeSnapshot {
  id: string
  partial: AnimatedShapePartial
}

export const usePlaybackEngine = () => {
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const startFrameRef = useRef<number>(0)
  const snapshotsRef = useRef<ShapeSnapshot[]>([])
  const isScrubbingRef = useRef(false)

  const snapshotShapes = useCallback(() => {
    const editor = useProjectStore.getState().editor
    if (!editor) return

    const tracks = useAnimationStore.getState().tracks
    const snapshots: ShapeSnapshot[] = []
    const seenIds = new Set<string>()

    for (const track of tracks) {
      for (const shapeId of track.shapeIds) {
        if (seenIds.has(shapeId)) continue
        seenIds.add(shapeId)

        const shape = editor.getShape(shapeId as TLShapeId)
        if (!shape) continue

        const adapter = getAdapter(shape.type)
        const baseState = adapter.getBaseState(shape as unknown as AnimatableShape)

        // Build a partial that can fully restore the shape
        snapshots.push({
          id: shapeId,
          partial: adapter.applyState(shape as unknown as AnimatableShape, baseState, {
            x: baseState.x,
            y: baseState.y,
            rotation: baseState.rotation,
            opacity: baseState.opacity,
            scale: 1,
            strokeWidth: baseState.strokeWidth,
          }),
        })
      }
    }

    snapshotsRef.current = snapshots
  }, [])

  const restoreShapes = useCallback(() => {
    const editor = useProjectStore.getState().editor
    if (!editor || snapshotsRef.current.length === 0) return

    const partials = snapshotsRef.current.map((s) => toTLPartial(s.partial))
    editor.run(
      () => {
        editor.updateShapes(partials)
      },
      { history: 'ignore' }
    )

    snapshotsRef.current = []
  }, [])

  const applyFrame = useCallback((frame: number) => {
    const editor = useProjectStore.getState().editor
    if (!editor) return

    const tracks = useAnimationStore.getState().tracks
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
  }, [])

  const tick = useCallback(() => {
    const { isPlaying, loopEnabled, setCurrentFrame, setIsPlaying } =
      useAnimationStore.getState()
    const { settings } = useProjectStore.getState()

    if (!isPlaying) return

    const elapsed = (performance.now() - startTimeRef.current) / 1000
    const frame = startFrameRef.current + Math.floor(elapsed * settings.fps)

    if (frame >= settings.durationFrames) {
      if (loopEnabled) {
        startTimeRef.current = performance.now()
        startFrameRef.current = 0
        setCurrentFrame(0)
        applyFrame(0)
      } else {
        setCurrentFrame(settings.durationFrames)
        applyFrame(settings.durationFrames)
        setIsPlaying(false)
        restoreShapes()
        return
      }
    } else {
      setCurrentFrame(frame)
      applyFrame(frame)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [applyFrame, restoreShapes])

  const play = useCallback(() => {
    const { isPlaying, currentFrame } = useAnimationStore.getState()
    if (isPlaying) return

    snapshotShapes()

    startTimeRef.current = performance.now()
    startFrameRef.current = currentFrame
    useAnimationStore.getState().setIsPlaying(true)

    rafRef.current = requestAnimationFrame(tick)
  }, [snapshotShapes, tick])

  const pause = useCallback(() => {
    useAnimationStore.getState().setIsPlaying(false)
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    useAnimationStore.getState().setIsPlaying(false)
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    restoreShapes()
  }, [restoreShapes])

  /** Start scrubbing mode: snapshot shapes for restoration later */
  const startScrub = useCallback(() => {
    if (isScrubbingRef.current) return
    isScrubbingRef.current = true
    snapshotShapes()
  }, [snapshotShapes])

  /** Scrub to a specific frame */
  const scrubTo = useCallback(
    (frame: number) => {
      useAnimationStore.getState().setCurrentFrame(frame)
      applyFrame(frame)
    },
    [applyFrame]
  )

  /** End scrubbing mode: restore shapes to authored state */
  const endScrub = useCallback(() => {
    if (!isScrubbingRef.current) return
    isScrubbingRef.current = false
    restoreShapes()
  }, [restoreShapes])

  return {
    play,
    pause,
    stop,
    startScrub,
    scrubTo,
    endScrub,
    applyFrame,
    snapshotShapes,
    restoreShapes,
  }
}
