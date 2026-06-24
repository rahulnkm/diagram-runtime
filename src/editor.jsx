/* editor.jsx — source for editor.js, the heavy edit-mode bundle (React + tldraw + the
 * official @tldraw/mermaid converter). diagram.js lazy-imports the built editor.js ONLY
 * when the user enters edit mode, so the default view stays a fast ~15KB SVG render.
 *
 * Build: `npm run build` (esbuild) → editor.js (committed; served via jsDelivr).
 * editor.js is multi-MB, so it is NOT cache-busted like diagram.js — it caches normally
 * and we purge jsDelivr on the rare times it changes. See README.
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Tldraw, DefaultFontStyle } from 'tldraw'
import { createMermaidDiagram } from '@tldraw/mermaid'
import tldrawCss from 'tldraw/tldraw.css'

// Mount a full tldraw editor into `container`. On a FRESH canvas, seed it by converting
// `mermaidText` into editable shapes. On reopen, tldraw's persistenceKey has already
// rehydrated the saved canvas from IndexedDB — so we must NOT re-seed (it would duplicate).
export async function mountEditor(container, mermaidText, persistenceKey) {
  if (!document.getElementById('tldraw-css')) {
    const s = document.createElement('style')
    s.id = 'tldraw-css'
    s.textContent = tldrawCss
    document.head.appendChild(s)
  }
  const root = createRoot(container)
  root.render(
    React.createElement(Tldraw, {
      persistenceKey,
      onMount: async (editor) => {
        const fresh = editor.getCurrentPageShapeIds().size === 0
        if (!fresh) return // reopened: tldraw already restored the saved canvas
        try {
          await createMermaidDiagram(editor, mermaidText)
          // Drop tldraw's hand-drawn default font for a cleaner look closer to the
          // generated-diagram aesthetic. (tldraw fonts are baked in; 'sans' is the cleanest.)
          editor.selectAll()
          editor.setStyleForSelectedShapes(DefaultFontStyle, 'sans')
          editor.selectNone()
          editor.zoomToFit({ animation: { duration: 0 } })
        } catch (e) {
          console.error('[diagram] mermaid → shapes failed:', e)
        }
      },
    })
  )
  return root
}
