'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import type { Project } from '@/lib/types/project'
import { DEFAULT_COMPOSITION_SETTINGS } from '@/lib/types/project'
import { ProjectCard } from '@/components/dashboard/project-card'
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog'
import { listProjects, saveProject, deleteProject } from '@/lib/persistence/indexeddb'

const DashboardPage = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadProjects = useCallback(async () => {
    try {
      const loaded = await listProjects()
      setProjects(loaded.sort((a, b) => b.updatedAt - a.updatedAt))
    } catch {
      // IndexedDB may not be available in SSR
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreateProject = useCallback(
    async (name: string) => {
      const project: Project = {
        id: nanoid(),
        name,
        settings: { ...DEFAULT_COMPOSITION_SETTINGS },
        tldrawSnapshot: null,
        tracks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await saveProject(project)
      router.push(`/editor/${project.id}`)
    },
    [router]
  )

  const handleDeleteProject = useCallback(
    async (id: string) => {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    },
    []
  )

  const handleOpenProject = useCallback(
    (id: string) => {
      router.push(`/editor/${id}`)
    },
    [router]
  )

  const handleQuickStart = useCallback(() => {
    const id = nanoid()
    const project: Project = {
      id,
      name: 'Untitled Project',
      settings: { ...DEFAULT_COMPOSITION_SETTINGS },
      tldrawSnapshot: null,
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    saveProject(project).then(() => {
      router.push(`/editor/${id}`)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-background p-8 overflow-auto">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              ExplainMotion
            </h1>
            <p className="text-sm text-muted mt-1">
              Vector animation for technical explainer videos
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleQuickStart}
              className="text-sm px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
            >
              Quick Start
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="text-sm px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-foreground transition-colors"
            >
              New Project
            </button>
          </div>
        </div>

        {/* Project grid */}
        {isLoading ? (
          <div className="text-sm text-muted">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-muted text-sm mb-4">
              No projects yet. Create one to get started.
            </div>
            <button
              onClick={handleQuickStart}
              className="text-sm px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpenProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      {showCreateDialog && (
        <CreateProjectDialog
          onCreate={handleCreateProject}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  )
}

export default DashboardPage
