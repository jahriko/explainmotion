import type { AnimatableProperty, EvaluatedProperties, TrackBaseState } from '@/lib/types/animation'
import type { ShapePropertyAdapter, AnimatableShape, AnimatedShapePartial } from './types'

const STROKE_SIZE_MAP: Record<string, number> = {
  s: 2, m: 3.5, l: 5, xl: 10,
}

const getStrokeWidth = (size: unknown): number =>
  STROKE_SIZE_MAP[size as string] ?? 3.5

export const arrowAdapter: ShapePropertyAdapter = {
  supportedProperties: ['x', 'y', 'opacity', 'strokeWidth'] satisfies AnimatableProperty[],

  getBaseState(shape: AnimatableShape): TrackBaseState {
    return {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation,
      opacity: shape.opacity,
      w: 0,
      h: 0,
      scale: 1,
      strokeWidth: getStrokeWidth(shape.props.size),
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
      rotation: shape.rotation,
      opacity: evaluated.opacity ?? baseState.opacity,
    }
  },
}
