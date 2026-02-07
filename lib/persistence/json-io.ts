import type { Project } from '@/lib/types/project'

/** Export a project as a downloadable JSON file */
export const exportProjectToJson = (project: Project): void => {
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.explainmotion.json`
  link.click()

  URL.revokeObjectURL(url)
}

/** Import a project from a JSON file.
 *  Returns the parsed project or null if invalid. */
export const importProjectFromJson = (): Promise<Project | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.explainmotion.json'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      try {
        const text = await file.text()
        const data = JSON.parse(text) as Project

        // Basic validation
        if (!data.id || !data.name || !data.settings) {
          throw new Error('Invalid project file')
        }

        resolve(data)
      } catch {
        resolve(null)
      }
    }

    input.oncancel = () => resolve(null)
    input.click()
  })
}
