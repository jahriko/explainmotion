import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type {
  Track,
  Channel,
  Keyframe,
  AnimatableProperty,
  EasingType,
  TrackBaseState,
} from '@/lib/types/animation'

interface AnimationState {
  // Track data
  tracks: Track[]

  // Playhead
  currentFrame: number
  isPlaying: boolean
  loopEnabled: boolean

  // Selection
  selectedTrackId: string | null
  selectedKeyframeIds: string[]

  // Timeline UI
  timelineZoom: number // pixels per frame
  timelineScrollX: number

  // Actions -- Tracks
  addTrack: (
    shapeIds: string[],
    label: string,
    baseStates: Record<string, TrackBaseState>,
    supportedProperties: AnimatableProperty[]
  ) => string
  removeTrack: (trackId: string) => void
  reorderTrack: (trackId: string, newOrder: number) => void
  toggleTrackVisibility: (trackId: string) => void
  toggleTrackLock: (trackId: string) => void
  toggleTrackCollapse: (trackId: string) => void
  setTracks: (tracks: Track[]) => void

  // Actions -- Keyframes
  addKeyframe: (
    trackId: string,
    property: AnimatableProperty,
    frame: number,
    value: number
  ) => string | null
  removeKeyframe: (trackId: string, property: AnimatableProperty, keyframeId: string) => void
  removeKeyframes: (keyframeIds: string[]) => void
  moveKeyframe: (
    trackId: string,
    property: AnimatableProperty,
    keyframeId: string,
    newFrame: number
  ) => void
  updateKeyframeValue: (
    trackId: string,
    property: AnimatableProperty,
    keyframeId: string,
    value: number
  ) => void
  updateKeyframeEasing: (
    trackId: string,
    property: AnimatableProperty,
    keyframeId: string,
    easing: EasingType
  ) => void
  toggleKeyframeHold: (
    trackId: string,
    property: AnimatableProperty,
    keyframeId: string
  ) => void
  setChannelDefaultEasing: (
    trackId: string,
    property: AnimatableProperty,
    easing: EasingType
  ) => void

  // Actions -- Clipboard
  copiedKeyframes: { property: AnimatableProperty; keyframes: Keyframe[] } | null
  copyKeyframes: (
    trackId: string,
    property: AnimatableProperty,
    keyframeIds: string[]
  ) => void
  pasteKeyframes: (
    trackId: string,
    property: AnimatableProperty,
    atFrame: number
  ) => void

  // Actions -- Playhead
  setCurrentFrame: (frame: number) => void
  setIsPlaying: (playing: boolean) => void
  toggleLoop: () => void

  // Actions -- Selection
  setSelectedTrackId: (id: string | null) => void
  setSelectedKeyframeIds: (ids: string[]) => void
  toggleKeyframeSelection: (id: string) => void
  addKeyframeToSelection: (id: string) => void

  // Actions -- Timeline UI
  setTimelineZoom: (zoom: number) => void
  setTimelineScrollX: (scrollX: number) => void

  // Helpers
  getTrack: (trackId: string) => Track | undefined
  getChannel: (trackId: string, property: AnimatableProperty) => Channel | undefined
  getKeyframe: (trackId: string, property: AnimatableProperty, keyframeId: string) => Keyframe | undefined
}

const createDefaultChannel = (
  property: AnimatableProperty,
  initialValue: number
): Channel => ({
  property,
  keyframes: [
    {
      id: nanoid(),
      frame: 0,
      value: initialValue,
      easing: 'easeOutCubic',
      hold: false,
    },
  ],
  defaultEasing: 'easeOutCubic',
  interpolationMode: 'smooth',
})

const getPropertyFromBaseState = (
  baseState: TrackBaseState,
  property: AnimatableProperty
): number => {
  switch (property) {
    case 'x':
      return baseState.x
    case 'y':
      return baseState.y
    case 'rotation':
      return baseState.rotation
    case 'scale':
      return baseState.scale
    case 'opacity':
      return baseState.opacity
    case 'strokeWidth':
      return baseState.strokeWidth
    default:
      return 0
  }
}

export const useAnimationStore = create<AnimationState>((set, get) => ({
  tracks: [],
  currentFrame: 0,
  isPlaying: false,
  loopEnabled: true,
  selectedTrackId: null,
  selectedKeyframeIds: [],
  timelineZoom: 8, // 8px per frame
  timelineScrollX: 0,
  copiedKeyframes: null,

  // -- Track actions --

  addTrack: (shapeIds, label, baseStates, supportedProperties) => {
    const trackId = nanoid()
    const primaryBase = baseStates[shapeIds[0]]
    const maxOrder = Math.max(0, ...get().tracks.map((t) => t.order))

    const channels: Channel[] = supportedProperties.map((prop) =>
      createDefaultChannel(prop, getPropertyFromBaseState(primaryBase, prop))
    )

    const track: Track = {
      id: trackId,
      shapeIds,
      label,
      channels,
      visible: true,
      locked: false,
      collapsed: false,
      order: maxOrder + 1,
      baseStates,
    }

    set((state) => ({ tracks: [...state.tracks, track] }))
    return trackId
  },

  removeTrack: (trackId) => {
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== trackId),
      selectedTrackId:
        state.selectedTrackId === trackId ? null : state.selectedTrackId,
    }))
  },

  reorderTrack: (trackId, newOrder) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, order: newOrder } : t
      ),
    }))
  },

  toggleTrackVisibility: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, visible: !t.visible } : t
      ),
    }))
  },

  toggleTrackLock: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, locked: !t.locked } : t
      ),
    }))
  },

  toggleTrackCollapse: (trackId) => {
    set((state) => ({
      tracks: state.tracks.map((t) =>
        t.id === trackId ? { ...t, collapsed: !t.collapsed } : t
      ),
    }))
  },

  setTracks: (tracks) => set({ tracks }),

  // -- Keyframe actions --

  addKeyframe: (trackId, property, frame, value) => {
    const keyframeId = nanoid()
    set((state) => {
      const tracks = state.tracks.map((track) => {
        if (track.id !== trackId) return track

        const channels = track.channels.map((ch) => {
          if (ch.property !== property) return ch

          // Check if a keyframe already exists at this frame
          const existing = ch.keyframes.find((kf) => kf.frame === frame)
          if (existing) {
            // Update existing keyframe value
            return {
              ...ch,
              keyframes: ch.keyframes.map((kf) =>
                kf.frame === frame ? { ...kf, value } : kf
              ),
            }
          }

          const newKf: Keyframe = {
            id: keyframeId,
            frame,
            value,
            easing: ch.defaultEasing,
            hold: false,
          }

          return {
            ...ch,
            keyframes: [...ch.keyframes, newKf].sort(
              (a, b) => a.frame - b.frame
            ),
          }
        })

        return { ...track, channels }
      })

      return { tracks }
    })
    return keyframeId
  },

  removeKeyframe: (trackId, property, keyframeId) => {
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          channels: track.channels.map((ch) => {
            if (ch.property !== property) return ch
            return {
              ...ch,
              keyframes: ch.keyframes.filter((kf) => kf.id !== keyframeId),
            }
          }),
        }
      }),
      selectedKeyframeIds: state.selectedKeyframeIds.filter(
        (id) => id !== keyframeId
      ),
    }))
  },

  removeKeyframes: (keyframeIds) => {
    const idSet = new Set(keyframeIds)
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        channels: track.channels.map((ch) => ({
          ...ch,
          keyframes: ch.keyframes.filter((kf) => !idSet.has(kf.id)),
        })),
      })),
      selectedKeyframeIds: state.selectedKeyframeIds.filter(
        (id) => !idSet.has(id)
      ),
    }))
  },

  moveKeyframe: (trackId, property, keyframeId, newFrame) => {
    const clampedFrame = Math.max(0, Math.round(newFrame))
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          channels: track.channels.map((ch) => {
            if (ch.property !== property) return ch
            return {
              ...ch,
              keyframes: ch.keyframes
                .map((kf) =>
                  kf.id === keyframeId ? { ...kf, frame: clampedFrame } : kf
                )
                .sort((a, b) => a.frame - b.frame),
            }
          }),
        }
      }),
    }))
  },

  updateKeyframeValue: (trackId, property, keyframeId, value) => {
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          channels: track.channels.map((ch) => {
            if (ch.property !== property) return ch
            return {
              ...ch,
              keyframes: ch.keyframes.map((kf) =>
                kf.id === keyframeId ? { ...kf, value } : kf
              ),
            }
          }),
        }
      }),
    }))
  },

  updateKeyframeEasing: (trackId, property, keyframeId, easing) => {
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          channels: track.channels.map((ch) => {
            if (ch.property !== property) return ch
            return {
              ...ch,
              keyframes: ch.keyframes.map((kf) =>
                kf.id === keyframeId ? { ...kf, easing } : kf
              ),
            }
          }),
        }
      }),
    }))
  },

  toggleKeyframeHold: (trackId, property, keyframeId) => {
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          channels: track.channels.map((ch) => {
            if (ch.property !== property) return ch
            return {
              ...ch,
              keyframes: ch.keyframes.map((kf) =>
                kf.id === keyframeId ? { ...kf, hold: !kf.hold } : kf
              ),
            }
          }),
        }
      }),
    }))
  },

  setChannelDefaultEasing: (trackId, property, easing) => {
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          channels: track.channels.map((ch) =>
            ch.property === property ? { ...ch, defaultEasing: easing } : ch
          ),
        }
      }),
    }))
  },

  // -- Clipboard --

  copyKeyframes: (trackId, property, keyframeIds) => {
    const track = get().tracks.find((t) => t.id === trackId)
    if (!track) return

    const channel = track.channels.find((c) => c.property === property)
    if (!channel) return

    const idSet = new Set(keyframeIds)
    const keyframes = channel.keyframes.filter((kf) => idSet.has(kf.id))
    if (keyframes.length === 0) return

    set({ copiedKeyframes: { property, keyframes: [...keyframes] } })
  },

  pasteKeyframes: (trackId, property, atFrame) => {
    const { copiedKeyframes } = get()
    if (!copiedKeyframes || copiedKeyframes.keyframes.length === 0) return

    const minFrame = Math.min(...copiedKeyframes.keyframes.map((kf) => kf.frame))
    const offset = atFrame - minFrame

    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id !== trackId) return track
        return {
          ...track,
          channels: track.channels.map((ch) => {
            if (ch.property !== property) return ch
            const newKeyframes = copiedKeyframes.keyframes.map((kf) => ({
              ...kf,
              id: nanoid(),
              frame: kf.frame + offset,
            }))
            return {
              ...ch,
              keyframes: [...ch.keyframes, ...newKeyframes].sort(
                (a, b) => a.frame - b.frame
              ),
            }
          }),
        }
      }),
    }))
  },

  // -- Playhead --

  setCurrentFrame: (frame) => set({ currentFrame: Math.max(0, Math.round(frame)) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  toggleLoop: () => set((state) => ({ loopEnabled: !state.loopEnabled })),

  // -- Selection --

  setSelectedTrackId: (id) => set({ selectedTrackId: id }),
  setSelectedKeyframeIds: (ids) => set({ selectedKeyframeIds: ids }),
  toggleKeyframeSelection: (id) =>
    set((state) => ({
      selectedKeyframeIds: state.selectedKeyframeIds.includes(id)
        ? state.selectedKeyframeIds.filter((kid) => kid !== id)
        : [...state.selectedKeyframeIds, id],
    })),
  addKeyframeToSelection: (id) =>
    set((state) => ({
      selectedKeyframeIds: state.selectedKeyframeIds.includes(id)
        ? state.selectedKeyframeIds
        : [...state.selectedKeyframeIds, id],
    })),

  // -- Timeline UI --

  setTimelineZoom: (zoom) =>
    set({ timelineZoom: Math.max(2, Math.min(40, zoom)) }),
  setTimelineScrollX: (scrollX) =>
    set({ timelineScrollX: Math.max(0, scrollX) }),

  // -- Helpers --

  getTrack: (trackId) => get().tracks.find((t) => t.id === trackId),
  getChannel: (trackId, property) => {
    const track = get().tracks.find((t) => t.id === trackId)
    return track?.channels.find((c) => c.property === property)
  },
  getKeyframe: (trackId, property, keyframeId) => {
    const channel = get().getChannel(trackId, property)
    return channel?.keyframes.find((kf) => kf.id === keyframeId)
  },
}))
