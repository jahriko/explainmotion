import type { AnimatableProperty, EvaluatedProperties, TrackBaseState } from '@/lib/types/animation'
import type { ShapePropertyAdapter, AnimatableShape, AnimatedShapePartial } from './types'

/** Fallback adapter that handles x/y/rotation/opacity for any shape type. */
export const defaultAdapter: ShapePropertyAdapter = {
  supportedProperties: ['x', 'y', 'rotation', 'opacity'] satisfies AnimatableProperty[],

  getBaseState(shape: AnimatableShape): TrackBaseState {
    return {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation,
      opacity: shape.opacity,
      w: 0,
      h: 0,
      scale: 1,
      strokeWidth: 0,
    }
  },

  applyState(
    shape: AnimatableShape,
    baseState: TrackBaseState,
    evaluated: EvaluatedProperties
  ): AnimatedShapePartial {
    return {
      id: shape.id,
      type: shape.type,
      x: evaluated.x ?? baseState.x,
      y: evaluated.y ?? baseState.y,
      rotation: evaluated.rotation ?? baseState.rotation,
      opacity: evaluated.opacity ?? baseState.opacity,
    }
  },
}
