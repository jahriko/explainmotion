import { create } from 'zustand'
import type { Editor } from 'tldraw'
import type {
  CompositionSettings,
  Project,
} from '@/lib/types/project'
import { DEFAULT_COMPOSITION_SETTINGS } from '@/lib/types/project'

interface ProjectState {
  // Current project
  projectId: string | null
  projectName: string
  settings: CompositionSettings
  isDirty: boolean
  lastSavedAt: number | null

  // Editor reference (not serialized)
  editor: Editor | null

  // Actions
  setProjectId: (id: string | null) => void
  setProjectName: (name: string) => void
  setSettings: (settings: Partial<CompositionSettings>) => void
  setEditor: (editor: Editor | null) => void
  markDirty: () => void
  markClean: () => void

  /** Load full project data into the store */
  loadProject: (project: Project) => void

  /** Get the current settings as a CompositionSettings object */
  getSettings: () => CompositionSettings
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: null,
  projectName: 'Untitled Project',
  settings: { ...DEFAULT_COMPOSITION_SETTINGS },
  isDirty: false,
  lastSavedAt: null,
  editor: null,

  setProjectId: (id) => set({ projectId: id }),

  setProjectName: (name) => {
    set({ projectName: name, isDirty: true })
  },

  setSettings: (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
      isDirty: true,
    }))
  },

  setEditor: (editor) => set({ editor }),

  markDirty: () => set({ isDirty: true }),

  markClean: () => set({ isDirty: false, lastSavedAt: Date.now() }),

  loadProject: (project) => {
    set({
      projectId: project.id,
      projectName: project.name,
      settings: { ...project.settings },
      isDirty: false,
      lastSavedAt: project.updatedAt,
    })
  },

  getSettings: () => get().settings,
}))
