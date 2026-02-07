'use client'

import { ShapeUtil, T, HTMLContainer, Rectangle2d, type TLBaseShape } from 'tldraw'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** LaTeX shape props */
interface LatexShapeProps {
  formula: string
  w: number
  h: number
  fontSize: number
  color: string
}

type LatexShape = TLBaseShape<'latex', LatexShapeProps>

// @ts-expect-error -- 'latex' is a custom shape type not in tldraw's default union
export class LatexShapeUtil extends ShapeUtil<LatexShape> {
  static override type = 'latex' as const

  static override props = {
    formula: T.string,
    w: T.number,
    h: T.number,
    fontSize: T.number,
    color: T.string,
  }

  getDefaultProps(): LatexShapeProps {
    return {
      formula: 'E = mc^2',
      w: 200,
      h: 60,
      fontSize: 24,
      color: '#ffffff',
    }
  }

  getGeometry(shape: LatexShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: LatexShape) {
    let html = ''
    try {
      html = katex.renderToString(shape.props.formula, {
        throwOnError: false,
        displayMode: true,
      })
    } catch {
      html = '<span style="color: red;">Invalid LaTeX</span>'
    }

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: shape.props.fontSize,
          color: shape.props.color,
          pointerEvents: 'all',
          overflow: 'hidden',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </HTMLContainer>
    )
  }

  indicator(shape: LatexShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={4}
        ry={4}
      />
    )
  }
}
