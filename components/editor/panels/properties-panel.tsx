'use client'

import { useAnimationStore } from '@/lib/stores/animation-store'
import { ALL_EASING_TYPES, EASING_LABELS } from '@/lib/animation/easing'
import type { AnimatableProperty, EasingType } from '@/lib/types/animation'

/** Finds the track, property, and keyframe data for a given keyframe ID */
const findKeyframeContext = (
  tracks: ReturnType<typeof useAnimationStore.getState>['tracks'],
  keyframeId: string
) => {
  for (const track of tracks) {
    for (const channel of track.channels) {
      const kf = channel.keyframes.find((k) => k.id === keyframeId)
      if (kf) {
        return { track, channel, keyframe: kf }
      }
    }
  }
  return null
}

export const PropertiesPanel = () => {
  const selectedKeyframeIds = useAnimationStore((s) => s.selectedKeyframeIds)
  const tracks = useAnimationStore((s) => s.tracks)
  const updateKeyframeValue = useAnimationStore((s) => s.updateKeyframeValue)
  const updateKeyframeEasing = useAnimationStore((s) => s.updateKeyframeEasing)
  const toggleKeyframeHold = useAnimationStore((s) => s.toggleKeyframeHold)
  const removeKeyframe = useAnimationStore((s) => s.removeKeyframe)

  if (selectedKeyframeIds.length === 0) {
    return (
      <div className="p-3 text-xs text-muted">
        Select a keyframe to edit its properties.
      </div>
    )
  }

  // Gather context for all selected keyframes
  const contexts = selectedKeyframeIds
    .map((id) => findKeyframeContext(tracks, id))
    .filter(Boolean)

  if (contexts.length === 0) {
    return (
      <div className="p-3 text-xs text-muted">
        Selected keyframe not found.
      </div>
    )
  }

  const isSingleSelection = contexts.length === 1
  const ctx = contexts[0]!

  // For multi-selection, check if values are mixed
  const allSameEasing = contexts.every(
    (c) => c!.keyframe.easing === ctx.keyframe.easing
  )
  const allSameHold = contexts.every(
    (c) => c!.keyframe.hold === ctx.keyframe.hold
  )

  const handleValueChange = (value: number) => {
    if (!isSingleSelection) return
    updateKeyframeValue(
      ctx.track.id,
      ctx.channel.property as AnimatableProperty,
      ctx.keyframe.id,
      value
    )
  }

  const handleEasingChange = (easing: EasingType) => {
    for (const c of contexts) {
      if (!c) continue
      updateKeyframeEasing(
        c.track.id,
        c.channel.property as AnimatableProperty,
        c.keyframe.id,
        easing
      )
    }
  }

  const handleToggleHold = () => {
    for (const c of contexts) {
      if (!c) continue
      toggleKeyframeHold(
        c.track.id,
        c.channel.property as AnimatableProperty,
        c.keyframe.id
      )
    }
  }

  const handleDelete = () => {
    for (const c of contexts) {
      if (!c) continue
      removeKeyframe(
        c.track.id,
        c.channel.property as AnimatableProperty,
        c.keyframe.id
      )
    }
  }

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs font-semibold text-foreground">
        {isSingleSelection
          ? `Keyframe: ${ctx.channel.property}`
          : `${contexts.length} Keyframes Selected`}
      </div>

      {/* Value */}
      {isSingleSelection && (
        <div>
          <label className="text-xs text-muted block mb-1">Value</label>
          <input
            type="number"
            value={ctx.keyframe.value}
            onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
            step={ctx.channel.property === 'opacity' ? 0.05 : 1}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Frame */}
      {isSingleSelection && (
        <div>
          <label className="text-xs text-muted block mb-1">Frame</label>
          <div className="text-sm text-foreground font-mono">
            {ctx.keyframe.frame}
          </div>
        </div>
      )}

      {/* Easing */}
      <div>
        <label className="text-xs text-muted block mb-1">Easing</label>
        <select
          value={allSameEasing ? ctx.keyframe.easing : ''}
          onChange={(e) => handleEasingChange(e.target.value as EasingType)}
          className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
        >
          {!allSameEasing && <option value="">Mixed</option>}
          {ALL_EASING_TYPES.map((type) => (
            <option key={type} value={type}>
              {EASING_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Hold */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={allSameHold ? ctx.keyframe.hold : false}
          onChange={handleToggleHold}
          className="rounded"
          id="hold-toggle"
        />
        <label htmlFor="hold-toggle" className="text-xs text-muted">
          Hold value (step)
        </label>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="w-full text-xs px-2 py-1.5 rounded bg-danger/10 hover:bg-danger/20 text-danger transition-colors"
      >
        Delete {isSingleSelection ? 'Keyframe' : `${contexts.length} Keyframes`}
      </button>
    </div>
  )
}
