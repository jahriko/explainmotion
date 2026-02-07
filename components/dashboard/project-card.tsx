'use client'

import type { Project } from '@/lib/types/project'

interface ProjectCardProps {
  project: Project
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

export const ProjectCard = ({ project, onOpen, onDelete }: ProjectCardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${project.name}"?`)) {
      onDelete(project.id)
    }
  }

  return (
    <div
      onClick={() => onOpen(project.id)}
      className="group relative bg-surface border border-border rounded-lg p-4 cursor-pointer hover:border-border-bright hover:bg-surface-hover transition-colors"
    >
      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-background rounded mb-3 flex items-center justify-center">
        <div className="text-muted text-xs">
          {project.settings.width} x {project.settings.height}
        </div>
      </div>

      {/* Info */}
      <div>
        <h3 className="text-sm font-medium text-foreground truncate">
          {project.name}
        </h3>
        <p className="text-xs text-muted mt-0.5">
          {formatDate(project.updatedAt)} &middot;{' '}
          {(project.settings.durationFrames / project.settings.fps).toFixed(1)}s
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center bg-surface-hover text-muted hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete project"
      >
        <svg width="10" height="10" viewBox="0 0 8 8" fill="currentColor">
          <path d="M1.2 0L0 1.2 2.8 4 0 6.8 1.2 8 4 5.2 6.8 8 8 6.8 5.2 4 8 1.2 6.8 0 4 2.8z" />
        </svg>
      </button>
    </div>
  )
}
