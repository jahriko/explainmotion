import type { AnimatableProperty, EvaluatedProperties, TrackBaseState } from '@/lib/types/animation'
import type { ShapePropertyAdapter, AnimatableShape, AnimatedShapePartial } from './types'

const FONT_SIZE_MAP: Record<string, number> = {
  s: 18, m: 28, l: 36, xl: 44,
}

const getFontSize = (size: unknown): number =>
  FONT_SIZE_MAP[size as string] ?? 28

export const textAdapter: ShapePropertyAdapter = {
  supportedProperties: ['x', 'y', 'rotation', 'scale', 'opacity'] satisfies AnimatableProperty[],

  getBaseState(shape: AnimatableShape): TrackBaseState {
    return {
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation,
      opacity: shape.opacity,
      w: (shape.props.w as number) ?? 100,
      h: 0,
      scale: 1,
      strokeWidth: getFontSize(shape.props.size),
    }
  },

  applyState(
    shape: AnimatableShape,
    baseState: TrackBaseState,
    evaluated: EvaluatedProperties
  ): AnimatedShapePartial {
    const scale = evaluated.scale ?? 1
    const newW = baseState.w * scale
    const dx = (baseState.w - newW) / 2

    return {
      id: shape.id,
      type: shape.type,
      x: (evaluated.x ?? baseState.x) + dx,
      y: evaluated.y ?? baseState.y,
      rotation: evaluated.rotation ?? baseState.rotation,
      opacity: evaluated.opacity ?? baseState.opacity,
      props: { w: newW },
    }
  },
}
