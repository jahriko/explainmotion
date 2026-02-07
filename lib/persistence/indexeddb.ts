import { get, set, del, keys, entries } from 'idb-keyval'
import type { Project } from '@/lib/types/project'

const PROJECT_PREFIX = 'project:'

const getProjectKey = (id: string) => `${PROJECT_PREFIX}${id}`

/** Save a project to IndexedDB */
export const saveProject = async (project: Project): Promise<void> => {
  await set(getProjectKey(project.id), {
    ...project,
    updatedAt: Date.now(),
  })
}

/** Load a project from IndexedDB by ID */
export const loadProject = async (id: string): Promise<Project | null> => {
  const data = await get<Project>(getProjectKey(id))
  return data ?? null
}

/** List all saved projects (metadata only for performance) */
export const listProjects = async (): Promise<Project[]> => {
  const allEntries = await entries<string, Project>()
  return allEntries
    .filter(([key]) => (key as string).startsWith(PROJECT_PREFIX))
    .map(([, value]) => value)
}

/** Delete a project from IndexedDB */
export const deleteProject = async (id: string): Promise<void> => {
  await del(getProjectKey(id))
}

/** Check if a project exists */
export const projectExists = async (id: string): Promise<boolean> => {
  const allKeys = await keys()
  return allKeys.includes(getProjectKey(id))
}
