import type { Track, EvaluatedProperties, EvaluatedShapeState } from '@/lib/types/animation'
import { evaluateChannels } from './interpolation'

/** Evaluate a single track at a given frame.
 *  For single-shape tracks, returns one EvaluatedShapeState.
 *  For group tracks, returns one EvaluatedShapeState per shape in the group,
 *  with position applied as offsets relative to each shape's base position. */
export const evaluateTrack = (
  track: Track,
  frame: number
): EvaluatedShapeState[] => {
  const channelValues = evaluateChannels(track.channels, frame) as EvaluatedProperties
  const isGroup = track.shapeIds.length > 1

  if (!isGroup) {
    // Single shape track: direct absolute values
    const shapeId = track.shapeIds[0]
    return [
      {
        shapeId,
        values: channelValues,
      },
    ]
  }

  // Group track: apply position as offsets relative to each shape's base
  const primaryBase = track.baseStates[track.shapeIds[0]]
  if (!primaryBase) return []

  const offsetX =
    channelValues.x !== undefined ? channelValues.x - primaryBase.x : 0
  const offsetY =
    channelValues.y !== undefined ? channelValues.y - primaryBase.y : 0

  return track.shapeIds.map((shapeId) => {
    const base = track.baseStates[shapeId]
    if (!base) {
      return { shapeId, values: channelValues }
    }

    return {
      shapeId,
      values: {
        // Position: offset from each shape's individual base
        ...(channelValues.x !== undefined ? { x: base.x + offsetX } : {}),
        ...(channelValues.y !== undefined ? { y: base.y + offsetY } : {}),
        // Non-position properties apply uniformly
        ...(channelValues.rotation !== undefined
          ? { rotation: channelValues.rotation }
          : {}),
        ...(channelValues.opacity !== undefined
          ? { opacity: channelValues.opacity }
          : {}),
        ...(channelValues.scale !== undefined
          ? { scale: channelValues.scale }
          : {}),
        ...(channelValues.strokeWidth !== undefined
          ? { strokeWidth: channelValues.strokeWidth }
          : {}),
      },
    }
  })
}

/** Evaluate all tracks at a given frame.
 *  Returns a flat array of EvaluatedShapeState for all shapes across all tracks. */
export const evaluateAllTracks = (
  tracks: Track[],
  frame: number
): EvaluatedShapeState[] => {
  const results: EvaluatedShapeState[] = []

  for (const track of tracks) {
    if (!track.visible || track.locked) continue
    const trackResults = evaluateTrack(track, frame)
    results.push(...trackResults)
  }

  return results
}
