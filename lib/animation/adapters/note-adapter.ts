import type { AnimatableProperty, EvaluatedProperties, TrackBaseState } from '@/lib/types/animation'
import type { ShapePropertyAdapter, AnimatableShape, AnimatedShapePartial } from './types'

export const noteAdapter: ShapePropertyAdapter = {
  supportedProperties: ['x', 'y', 'rotation', 'scale', 'opacity'] satisfies AnimatableProperty[],

  getBaseState(shape: AnimatableShape): TrackBaseState {
    return {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation,
      opacity: shape.opacity,
      w: (shape.props.w as number) ?? 200,
      h: (shape.props.h as number) ?? 200,
      scale: 1,
      strokeWidth: 0,
    }
  },

  applyState(
    shape: AnimatableShape,
    baseState: TrackBaseState,
    evaluated: EvaluatedProperties
  ): AnimatedShapePartial {
    const scale = evaluated.scale ?? 1
    const newW = baseState.w * scale
    const newH = baseState.h * scale
    const dx = (baseState.w - newW) / 2
    const dy = (baseState.h - newH) / 2

    return {
      id: shape.id,
      type: shape.type,
      x: (evaluated.x ?? baseState.x) + dx,
      y: (evaluated.y ?? baseState.y) + dy,
      rotation: evaluated.rotation ?? baseState.rotation,
      opacity: evaluated.opacity ?? baseState.opacity,
    }
  },
}
