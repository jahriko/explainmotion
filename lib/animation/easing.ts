import type { EasingType } from '@/lib/types/animation'

/** Easing function: takes progress 0..1, returns eased value 0..1 */
export type EasingFn = (t: number) => number

const linear: EasingFn = (t) => t

const easeIn: EasingFn = (t) => t * t

const easeOut: EasingFn = (t) => t * (2 - t)

const easeInOut: EasingFn = (t) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

const easeInCubic: EasingFn = (t) => t * t * t

const easeOutCubic: EasingFn = (t) => {
  const t1 = t - 1
  return t1 * t1 * t1 + 1
}

const easeInOutCubic: EasingFn = (t) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1

const step: EasingFn = () => 0

/** Map of easing type names to their functions */
const easingFunctions: Record<EasingType, EasingFn> = {
  linear,
  easeIn,
  easeOut,
  easeInOut,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  step,
}

/** Get the easing function for a given easing type */
export const getEasingFn = (type: EasingType): EasingFn =>
  easingFunctions[type] ?? linear

/** Human-readable labels for easing types */
export const EASING_LABELS: Record<EasingType, string> = {
  linear: 'Linear',
  easeIn: 'Ease In',
  easeOut: 'Ease Out',
  easeInOut: 'Ease In Out',
  easeInCubic: 'Ease In (Cubic)',
  easeOutCubic: 'Ease Out (Cubic)',
  easeInOutCubic: 'Ease In Out (Cubic)',
  step: 'Step',
}

/** All available easing types for UI dropdowns */
export const ALL_EASING_TYPES: EasingType[] = [
  'linear',
  'easeIn',
  'easeOut',
  'easeInOut',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
  'step',
]
