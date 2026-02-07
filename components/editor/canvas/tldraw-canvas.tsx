'use client'

import { useCallback, useMemo } from 'react'
import { Tldraw, Editor, type TLAnyShapeUtilConstructor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useProjectStore } from '@/lib/stores/project-store'
import { CompositionOverlay } from './composition-overlay'
import { LatexShapeUtil } from '@/lib/shapes/latex-shape'
import { registerAdapter } from '@/lib/animation/adapters/registry'
import { latexAdapter } from '@/lib/shapes/latex-adapter'

// Register the latex adapter once
registerAdapter('latex', latexAdapter)

interface TldrawCanvasProps {
  className?: string
}

export const TldrawCanvas = ({ className }: TldrawCanvasProps) => {
  const setEditor = useProjectStore((s) => s.setEditor)

  const shapeUtils = useMemo(
    () => [LatexShapeUtil as unknown as TLAnyShapeUtilConstructor],
    []
  )

  const handleMount = useCallback(
    (editor: Editor) => {
      setEditor(editor)
      editor.user.updateUserPreferences({ colorScheme: 'dark' })
    },
    [setEditor]
  )

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Tldraw
        onMount={handleMount}
        shapeUtils={shapeUtils}
        components={{
          OnTheCanvas: CompositionOverlay,
        }}
      />
    </div>
  )
}
