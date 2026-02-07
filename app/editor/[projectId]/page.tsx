'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { loadSnapshot } from 'tldraw'
import { EditorLayout } from '@/components/editor/editor-layout'
import { useProjectStore } from '@/lib/stores/project-store'
import { useAnimationStore } from '@/lib/stores/animation-store'
import { useAutoSave } from '@/lib/persistence/auto-save'
import { loadProject } from '@/lib/persistence/indexeddb'

const EditorPage = () => {
  const params = useParams<{ projectId: string }>()
  const setProjectId = useProjectStore((s) => s.setProjectId)
  const loadProjectData = useProjectStore((s) => s.loadProject)
  const setTracks = useAnimationStore((s) => s.setTracks)
  const editor = useProjectStore((s) => s.editor)
  const [isLoading, setIsLoading] = useState(true)

  // Auto-save hook
  useAutoSave()

  // Load project from IndexedDB
  useEffect(() => {
    const load = async () => {
      if (!params.projectId) return

      setProjectId(params.projectId)

      const project = await loadProject(params.projectId)
      if (project) {
        loadProjectData(project)
        setTracks(project.tracks)

        // Restore tldraw snapshot when editor is ready
        if (editor && project.tldrawSnapshot) {
          try {
            loadSnapshot(editor.store, project.tldrawSnapshot as Parameters<typeof loadSnapshot>[1])
          } catch {
            // Snapshot may be incompatible
          }
        }
      }

      setIsLoading(false)
    }

    load()
  }, [params.projectId, setProjectId, loadProjectData, setTracks, editor])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-sm text-muted">Loading project...</div>
      </div>
    )
  }

  return <EditorLayout />
}

export default EditorPage
