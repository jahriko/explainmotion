import type { Channel, Keyframe } from '@/lib/types/animation'
import { getEasingFn } from './easing'

/** Linear interpolation between two values */
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Evaluate a single channel at a given frame number.
 *  Returns the interpolated value, or undefined if the channel has no keyframes. */
export const evaluateChannel = (
  channel: Channel,
  frame: number
): number | undefined => {
  const { keyframes } = channel
  if (keyframes.length === 0) return undefined

  // Sort keyframes by frame (should already be sorted, but defensive)
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame)

  // Before or at first keyframe: use first keyframe value
  if (frame <= sorted[0].frame) {
    return sorted[0].value
  }

  // After or at last keyframe: use last keyframe value
  if (frame >= sorted[sorted.length - 1].frame) {
    return sorted[sorted.length - 1].value
  }

  // Find the two keyframes surrounding the current frame
  let prevKf: Keyframe = sorted[0]
  let nextKf: Keyframe = sorted[1]

  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame < sorted[i + 1].frame) {
      prevKf = sorted[i]
      nextKf = sorted[i + 1]
      break
    }
  }

  // Hold: value stays constant until next keyframe
  if (prevKf.hold) {
    return prevKf.value
  }

  // Channel-level step mode
  if (channel.interpolationMode === 'step') {
    return prevKf.value
  }

  // Calculate normalized progress between keyframes
  const frameDelta = nextKf.frame - prevKf.frame
  if (frameDelta === 0) return prevKf.value

  const rawProgress = (frame - prevKf.frame) / frameDelta

  // Apply easing function (uses the previous keyframe's easing, which defines the curve TO the next)
  const easingFn = getEasingFn(prevKf.easing)
  const easedProgress = easingFn(rawProgress)

  return lerp(prevKf.value, nextKf.value, easedProgress)
}

/** Evaluate all channels in a list, returning a map of property -> value.
 *  Only includes properties that have keyframes. */
export const evaluateChannels = (
  channels: Channel[],
  frame: number
): Record<string, number> => {
  const result: Record<string, number> = {}

  for (const channel of channels) {
    const value = evaluateChannel(channel, frame)
    if (value !== undefined) {
      result[channel.property] = value
    }
  }

  return result
}
