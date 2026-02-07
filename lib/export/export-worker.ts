/// <reference lib="webworker" />

import type { WorkerInMessage, WorkerOutMessage, ExportFormat } from './export-worker-messages'

const ctx = self as unknown as DedicatedWorkerGlobalScope

/* eslint-disable @typescript-eslint/no-explicit-any */
let ffmpeg: any = null
let ffmpegLoaded = false
let format: ExportFormat = 'webm'
let fps = 30
let width = 1920
let height = 1080
let totalFrames = 0
let receivedFrames = 0

/** Track all written frame paths so we can clean them up after encoding */
const writtenFramePaths: string[] = []

const postMsg = (msg: WorkerOutMessage) => ctx.postMessage(msg)

const loadFFmpeg = async () => {
  if (ffmpegLoaded) return

  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const { toBlobURL } = await import('@ffmpeg/util')

    ffmpeg = new FFmpeg()

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    ffmpegLoaded = true
  } catch (err) {
    postMsg({ type: 'error', message: `Failed to load ffmpeg: ${err}` })
  }
}

const getEncodeArgs = (): string[] => {
  const inputArgs = [
    '-framerate', String(fps),
    '-i', 'frame_%05d.png',
  ]

  switch (format) {
    case 'webm':
      return [
        ...inputArgs,
        '-c:v', 'libvpx-vp9',
        '-b:v', '2M',
        '-pix_fmt', 'yuva420p',
        '-auto-alt-ref', '0',
        'output.webm',
      ]
    case 'mp4':
      return [
        ...inputArgs,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '23',
        '-preset', 'fast',
        'output.mp4',
      ]
    case 'gif':
      return [
        ...inputArgs,
        '-vf', `fps=${Math.min(fps, 15)},scale=${Math.min(width, 640)}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse`,
        'output.gif',
      ]
    default:
      return [...inputArgs, '-c:v', 'libvpx-vp9', '-b:v', '2M', 'output.webm']
  }
}

const getOutputFile = (): string => {
  switch (format) {
    case 'webm': return 'output.webm'
    case 'mp4': return 'output.mp4'
    case 'gif': return 'output.gif'
    default: return 'output.webm'
  }
}

const getMimeType = (): string => {
  switch (format) {
    case 'webm': return 'video/webm'
    case 'mp4': return 'video/mp4'
    case 'gif': return 'image/gif'
    default: return 'video/webm'
  }
}

const getExtension = (): string => {
  switch (format) {
    case 'webm': return '.webm'
    case 'mp4': return '.mp4'
    case 'gif': return '.gif'
    default: return '.webm'
  }
}

/** Delete all frame files from the virtual FS */
const cleanupFrames = async () => {
  for (const path of writtenFramePaths) {
    try {
      await ffmpeg.deleteFile(path)
    } catch {
      // Ignore
    }
  }
  writtenFramePaths.length = 0
}

ctx.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data

  switch (msg.type) {
    case 'init': {
      format = msg.format
      fps = msg.fps
      width = msg.width
      height = msg.height
      totalFrames = msg.totalFrames
      receivedFrames = 0
      writtenFramePaths.length = 0

      await loadFFmpeg()
      postMsg({ type: 'ready' })
      break
    }

    case 'frame': {
      if (!ffmpegLoaded || !ffmpeg) {
        postMsg({ type: 'error', message: 'ffmpeg not loaded' })
        return
      }

      try {
        // Use receivedFrames as the contiguous index (not msg.index)
        // to guarantee no gaps in the %05d sequence
        const framePath = `frame_${String(receivedFrames).padStart(5, '0')}.png`
        const data = new Uint8Array(msg.data)

        await ffmpeg.writeFile(framePath, data)
        writtenFramePaths.push(framePath)
        receivedFrames++

        postMsg({
          type: 'progress',
          frame: receivedFrames,
          total: totalFrames,
          phase: 'receiving',
        })
      } catch (err) {
        postMsg({ type: 'error', message: `Frame write failed: ${err}` })
      }
      break
    }

    case 'finalize': {
      if (!ffmpegLoaded || !ffmpeg) {
        postMsg({ type: 'error', message: 'ffmpeg not loaded' })
        return
      }

      if (receivedFrames === 0) {
        postMsg({ type: 'error', message: 'No frames received to encode' })
        return
      }

      try {
        postMsg({
          type: 'progress',
          frame: receivedFrames,
          total: totalFrames,
          phase: 'encoding',
        })

        const args = getEncodeArgs()
        await ffmpeg.exec(args)

        const outputFile = getOutputFile()
        const outputData = await ffmpeg.readFile(outputFile)

        let buffer: ArrayBuffer
        if (outputData instanceof Uint8Array) {
          const copy = new Uint8Array(outputData.byteLength)
          copy.set(outputData)
          buffer = copy.buffer as ArrayBuffer
        } else {
          buffer = new TextEncoder().encode(outputData as string).buffer as ArrayBuffer
        }

        postMsg({
          type: 'complete',
          data: buffer,
          mimeType: getMimeType(),
          extension: getExtension(),
        })

        // Cleanup all frame files and output after encoding
        await cleanupFrames()
        try {
          await ffmpeg.deleteFile(outputFile)
        } catch {
          // Ignore
        }
      } catch (err) {
        // Cleanup on error too
        await cleanupFrames()
        postMsg({ type: 'error', message: `Encoding failed: ${err}` })
      }
      break
    }

    case 'cancel': {
      await cleanupFrames()
      break
    }
  }
}
