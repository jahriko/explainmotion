import type { AnimatableProperty } from '@/lib/types/animation'
import type { ShapePropertyAdapter, AnimatableShape } from './types'
import { defaultAdapter } from './default-adapter'
import { geoAdapter } from './geo-adapter'
import { arrowAdapter } from './arrow-adapter'
import { drawAdapter } from './draw-adapter'
import { textAdapter } from './text-adapter'
import { imageAdapter } from './image-adapter'
import { noteAdapter } from './note-adapter'

/** Registry mapping tldraw shape types to their animation property adapters */
const adapterRegistry: Record<string, ShapePropertyAdapter> = {
  geo: geoAdapter,
  arrow: arrowAdapter,
  draw: drawAdapter,
  text: textAdapter,
  image: imageAdapter,
  video: imageAdapter, // video shapes have same w/h structure
  note: noteAdapter,
}

/** Get the adapter for a given tldraw shape type.
 *  Falls back to the default adapter (x/y/rotation/opacity) for unknown types. */
export const getAdapter = (shapeType: string): ShapePropertyAdapter =>
  adapterRegistry[shapeType] ?? defaultAdapter

/** Get supported animatable properties for a given shape type. */
export const getSupportedProperties = (shapeType: string): AnimatableProperty[] =>
  getAdapter(shapeType).supportedProperties

/** Get the adapter for a specific shape instance. */
export const getAdapterForShape = (shape: AnimatableShape): ShapePropertyAdapter =>
  getAdapter(shape.type)

/** Register a custom adapter for a shape type (e.g., for custom shapes like latex). */
export const registerAdapter = (
  shapeType: string,
  adapter: ShapePropertyAdapter
): void => {
  adapterRegistry[shapeType] = adapter
}
