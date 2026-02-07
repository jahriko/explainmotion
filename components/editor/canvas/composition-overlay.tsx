'use client'

import { track, useEditor } from 'tldraw'
import { useProjectStore } from '@/lib/stores/project-store'

/** Renders a dashed rectangle on the tldraw canvas showing the composition bounds.
 *  This is drawn in screen coordinates, transformed from world-space comp bounds. */
export const CompositionOverlay = track(function CompositionOverlay() {
  const editor = useEditor()
  const settings = useProjectStore((s) => s.settings)

  const { boundsX, boundsY, width, height } = settings

  // Convert world coords to screen coords using the camera
  const topLeft = editor.pageToViewport({ x: boundsX, y: boundsY })
  const bottomRight = editor.pageToViewport({
    x: boundsX + width,
    y: boundsY + height,
  })

  const screenX = topLeft.x
  const screenY = topLeft.y
  const screenW = bottomRight.x - topLeft.x
  const screenH = bottomRight.y - topLeft.y

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      {/* Semi-transparent overlay outside comp bounds */}
      <defs>
        <mask id="comp-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={screenX}
            y={screenY}
            width={Math.max(0, screenW)}
            height={Math.max(0, screenH)}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.4)"
        mask="url(#comp-mask)"
      />
      {/* Dashed border around comp area */}
      <rect
        x={screenX}
        y={screenY}
        width={Math.max(0, screenW)}
        height={Math.max(0, screenH)}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1.5}
        strokeDasharray="8 4"
        opacity={0.7}
      />
      {/* Label */}
      <text
        x={screenX + 6}
        y={screenY - 6}
        fill="#3b82f6"
        fontSize={11}
        fontFamily="var(--font-geist-sans), sans-serif"
        opacity={0.7}
      >
        {width} x {height}
      </text>
    </svg>
  )
})
