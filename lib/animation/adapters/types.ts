import type { AnimatableProperty, EvaluatedProperties, TrackBaseState } from '@/lib/types/animation'

/** Generic shape type that captures the fields we need from any tldraw shape.
 *  tldraw's TLShape is a complex union type, so we use a simpler interface
 *  that all shapes satisfy for our adapter system. */
export interface AnimatableShape {
  id: string
  type: string
  x: number
  y: number
  rotation: number
  opacity: number
  props: Record<string, unknown>
}

/** Shape partial output from adapters. This is a loose type that will be
 *  cast to TLShapePartial when passed to editor.updateShapes(). */
export interface AnimatedShapePartial {
  id: string
  type: string
  x?: number
  y?: number
  rotation?: number
  opacity?: number
  props?: Record<string, unknown>
}

/** Per-shape-type adapter that handles reading/writing animatable properties.
 *  Each tldraw shape type stores properties differently (root vs props vs nested),
 *  so adapters provide a uniform interface for the animation engine. */
export interface ShapePropertyAdapter {
  /** Which AnimatableProperties this shape type supports */
  supportedProperties: AnimatableProperty[]

  /** Extract the base (authored) animatable values from a shape.
   *  Returns a TrackBaseState with all known properties populated. */
  getBaseState(shape: AnimatableShape): TrackBaseState

  /** Apply evaluated animated values back onto a shape, producing a shape partial.
   *  Handles the mapping from abstract properties (e.g. 'scale') to
   *  concrete shape fields (e.g. props.w, props.h with centering offset). */
  applyState(
    shape: AnimatableShape,
    baseState: TrackBaseState,
    evaluated: EvaluatedProperties
  ): AnimatedShapePartial
}
