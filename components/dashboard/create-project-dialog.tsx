'use client'

import { useState } from 'react'

interface CreateProjectDialogProps {
  onCreate: (name: string) => void
  onClose: () => void
}

export const CreateProjectDialog = ({
  onCreate,
  onClose,
}: CreateProjectDialogProps) => {
  const [name, setName] = useState('Untitled Project')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-lg p-5 w-[340px] shadow-xl"
      >
        <h2 className="text-sm font-semibold mb-4">New Project</h2>

        <div className="mb-4">
          <label className="text-xs text-muted block mb-1">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
            placeholder="My Animation"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded bg-surface-hover hover:bg-border text-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  )
}
