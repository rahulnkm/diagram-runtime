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

// Whether IndexedDB actually works here. The Claude preview opens diagrams as a `data:`
// URL with an opaque (null) origin, where ALL storage is blocked — and tldraw HARD-CRASHES
// if it can't open IndexedDB for its persistenceKey. So probe first, and only pass
// persistenceKey when storage is real (e.g. served over http://localhost). Otherwise mount
// in-memory: editing works for the session but nothing persists.
async function canPersist() {
  try {
    await new Promise((res, rej) => {
      const q = indexedDB.open('__diagram_probe', 1)
      q.onsuccess = () => { try { q.result.close() } catch (e) {} ; res() }
      q.onerror = () => rej(q.error || new Error('idb error'))
      setTimeout(() => rej(new Error('idb timeout')), 2000)
    })
    return true
  } catch (e) {
    return false
  }
}

// Mount a full tldraw editor into `container`. On a FRESH canvas, seed it by converting
// `mermaidText` into editable shapes. On reopen (with persistence), tldraw has already
// rehydrated the saved canvas from IndexedDB — so we must NOT re-seed (it would duplicate).
// Returns { root, persisted } so the caller can tell the user when edits are session-only.
export async function mountEditor(container, mermaidText, persistenceKey) {
  if (!document.getElementById('tldraw-css')) {
    const s = document.createElement('style')
    s.id = 'tldraw-css'
    s.textContent = tldrawCss
    document.head.appendChild(s)
  }
  const persisted = await canPersist()
  const props = {
    onMount: async (editor) => {
      const fresh = editor.getCurrentPageShapeIds().size === 0
      if (!fresh) return // reopened with persistence: tldraw already restored the canvas
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
  }
  // Only bind persistence when storage is real — passing persistenceKey in an opaque
  // origin is exactly what crashes tldraw.
  if (persisted) props.persistenceKey = persistenceKey
  const root = createRoot(container)
  root.render(React.createElement(Tldraw, props))
  return { root, persisted }
}
