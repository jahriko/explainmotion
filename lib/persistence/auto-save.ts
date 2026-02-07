'use client'

import { useEffect, useRef } from 'react'
import { getSnapshot } from 'tldraw'
import { useAnimationStore } from '@/lib/stores/animation-store'
import { useProjectStore } from '@/lib/stores/project-store'
import { saveProject } from './indexeddb'
import type { Project } from '@/lib/types/project'

const AUTO_SAVE_DEBOUNCE_MS = 2000

/** Hook that auto-saves the current project to IndexedDB on changes.
 *  Watches both the animation store and the tldraw editor for changes. */
export const useAutoSave = () => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaveRef = useRef<string>('')

  useEffect(() => {
    const scheduleSave = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(async () => {
        const { projectId, projectName, settings, editor, markClean } =
          useProjectStore.getState()
        const { tracks } = useAnimationStore.getState()

        if (!projectId) return

        // Get tldraw snapshot if editor is available
        let tldrawSnapshot: unknown = null
        if (editor) {
          try {
            const snapshot = getSnapshot(editor.store)
            tldrawSnapshot = snapshot
          } catch {
            // Editor may not be ready
          }
        }

        const project: Project = {
          id: projectId,
          name: projectName,
          settings,
          tldrawSnapshot,
          tracks,
          createdAt: Date.now(), // Will be overwritten if project exists
          updatedAt: Date.now(),
        }

        // Dedupe saves by comparing serialized state
        const hash = JSON.stringify({ tracks: tracks.length, settings, name: projectName })
        if (hash === lastSaveRef.current) return
        lastSaveRef.current = hash

        try {
          await saveProject(project)
          markClean()
        } catch (err) {
          console.error('Auto-save failed:', err)
        }
      }, AUTO_SAVE_DEBOUNCE_MS)
    }

    // Subscribe to animation store changes
    const unsubAnim = useAnimationStore.subscribe(scheduleSave)

    // Subscribe to project store changes (settings, name)
    const unsubProject = useProjectStore.subscribe((state, prev) => {
      if (
        state.settings !== prev.settings ||
        state.projectName !== prev.projectName
      ) {
        scheduleSave()
      }
    })

    // Subscribe to tldraw store changes
    let unsubEditor: (() => void) | null = null
    const setupEditorListener = () => {
      const { editor } = useProjectStore.getState()
      if (editor) {
        const cleanup = editor.store.listen(scheduleSave, {
          source: 'user',
          scope: 'document',
        })
        unsubEditor = cleanup
      }
    }

    // Re-setup when editor changes
    const unsubEditorWatch = useProjectStore.subscribe((state, prev) => {
      if (state.editor !== prev.editor) {
        unsubEditor?.()
        setupEditorListener()
      }
    })

    setupEditorListener()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      unsubAnim()
      unsubProject()
      unsubEditorWatch()
      unsubEditor?.()
    }
  }, [])
}
