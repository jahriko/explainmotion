/** Properties the animation system can target.
 *  Not all properties are available on all shape types -- see adapters. */
export type AnimatableProperty =
  | 'x'
  | 'y'
  | 'rotation'
  | 'scale'
  | 'opacity'
  | 'strokeWidth'

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'step'

/** Interpolation mode for a channel */
export type InterpolationMode = 'smooth' | 'linear' | 'step'

export interface Keyframe {
  id: string
  /** Integer frame number */
  frame: number
  value: number
  /** Easing curve TO the next keyframe */
  easing: EasingType
  /** If true, value holds constant until next keyframe (overrides easing) */
  hold: boolean
}

export interface Channel {
  property: AnimatableProperty
  keyframes: Keyframe[]
  /** New keyframes inherit this easing */
  defaultEasing: EasingType
  /** Channel-level interpolation mode */
  interpolationMode: InterpolationMode
}

/** Snapshot of the shape's animatable values at the moment the track was created.
 *  Used for scale calculations and as fallback for channels with no keyframes. */
export interface TrackBaseState {
  x: number
  y: number
  rotation: number
  opacity: number
  /** Base width (from shape props) */
  w: number
  /** Base height (from shape props) */
  h: number
  /** Always 1 at creation */
  scale: number
  strokeWidth: number
}

export interface Track {
  id: string
  /** One or more TLShapeIds (supports group tracks) */
  shapeIds: string[]
  /** Display name (shape name or group name) */
  label: string
  channels: Channel[]
  visible: boolean
  locked: boolean
  /** Whether channels are collapsed in timeline UI */
  collapsed: boolean
  /** For manual track reordering */
  order: number
  /** Base states keyed by shapeId */
  baseStates: Record<string, TrackBaseState>
}

/** Map of property names to their evaluated numeric values */
export type EvaluatedProperties = Partial<Record<AnimatableProperty, number>>

/** Result of evaluating a group track -- one entry per shape */
export interface EvaluatedShapeState {
  shapeId: string
  values: EvaluatedProperties
}
