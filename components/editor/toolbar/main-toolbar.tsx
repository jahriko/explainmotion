'use client'

import { useCallback, useState } from 'react'
import { useProjectStore } from '@/lib/stores/project-store'
import { useAnimationStore } from '@/lib/stores/animation-store'
import { getAdapterForShape, getSupportedProperties } from '@/lib/animation/adapters/registry'
import type { AnimatableShape } from '@/lib/animation/adapters/types'
import type { TrackBaseState } from '@/lib/types/animation'
import { PlaybackControls } from './playback-controls'
import { CompositionSettingsDialog } from '../panels/composition-settings-dialog'
import { ExportDialog } from '../panels/export-dialog'

export const MainToolbar = () => {
  const editor = useProjectStore((s) => s.editor)
  const projectName = useProjectStore((s) => s.projectName)
  const setProjectName = useProjectStore((s) => s.setProjectName)
  const addTrack = useAnimationStore((s) => s.addTrack)
  const tracks = useAnimationStore((s) => s.tracks)
  const [showCompSettings, setShowCompSettings] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const handleAddToTimeline = useCallback(() => {
    if (!editor) return

    const selectedIds = editor.getSelectedShapeIds()
    if (selectedIds.length === 0) return

    // Check if any selected shape is already tracked
    const existingShapeIds = new Set(tracks.flatMap((t) => t.shapeIds))
    const newShapeIds = selectedIds.filter((id) => !existingShapeIds.has(id))
    if (newShapeIds.length === 0) return

    const shapes = newShapeIds
      .map((id) => editor.getShape(id))
      .filter(Boolean)

    if (shapes.length === 0) return

    // Build base states and determine supported properties
    const baseStates: Record<string, TrackBaseState> = {}
    let commonProperties = getSupportedProperties(shapes[0]!.type)

    for (const shape of shapes) {
      const animShape = shape as unknown as AnimatableShape
      const adapter = getAdapterForShape(animShape)
      baseStates[animShape.id] = adapter.getBaseState(animShape)

      // Intersect supported properties for group tracks
      if (shapes.length > 1) {
        const shapeProps = new Set(getSupportedProperties(animShape.type))
        commonProperties = commonProperties.filter((p) => shapeProps.has(p))
      }
    }

    const label =
      shapes.length === 1
        ? shapes[0]!.type.charAt(0).toUpperCase() + shapes[0]!.type.slice(1)
        : `Group (${shapes.length})`

    addTrack(
      newShapeIds as string[],
      label,
      baseStates,
      commonProperties
    )
  }, [editor, addTrack, tracks])

  return (
    <div className="h-10 bg-surface border-b border-border flex items-center px-3 gap-3 flex-shrink-0">
      {/* Project name */}
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="bg-transparent text-foreground text-sm font-medium border-none outline-none w-40 hover:bg-surface-hover px-1.5 py-0.5 rounded transition-colors"
      />

      <div className="w-px h-5 bg-border" />

      {/* Add to timeline */}
      <button
        onClick={handleAddToTimeline}
        className="text-xs px-2.5 py-1 rounded bg-accent hover:bg-accent-hover text-white transition-colors"
      >
        Add to Timeline
      </button>

      {/* Composition settings */}
      <button
        onClick={() => setShowCompSettings(true)}
        className="text-xs px-2.5 py-1 rounded bg-surface-hover hover:bg-border text-foreground transition-colors"
      >
        Settings
      </button>

      <div className="flex-1" />

      {/* Playback controls (centered) */}
      <PlaybackControls />

      <div className="flex-1" />

      {/* Export */}
      <button
        onClick={() => setShowExportDialog(true)}
        className="text-xs px-2.5 py-1 rounded bg-success/20 hover:bg-success/30 text-success transition-colors"
      >
        Export
      </button>

      {/* Dialogs */}
      {showCompSettings && (
        <CompositionSettingsDialog onClose={() => setShowCompSettings(false)} />
      )}
      {showExportDialog && (
        <ExportDialog onClose={() => setShowExportDialog(false)} />
      )}
    </div>
  )
}
