# diagram-runtime

Rendering runtime for self-contained [Mermaid](https://mermaid.js.org) diagram pages. One script builds the whole page around a `<pre class="mermaid">` block: light theme, Geist type, a semantic color vocabulary for flowchart roles, and pan/zoom canvas controls.

Diagram files stay tiny — title, graph, one script tag:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Orders — request path</title>
</head>
<body>
<pre class="mermaid" style="display:none">
flowchart LR
  user([User]):::client --> api[Orders API]:::action
  api --> db[(Postgres)]:::store
</pre>
<script type="module" src="https://cdn.jsdelivr.net/gh/rahulnkm/diagram-runtime@main/diagram.js"></script>
</body>
</html>
```

Because every diagram loads this one file, fixes and improvements here reach all of them on next open.

## Roles

Flowchart nodes can be tagged `:::action`, `:::store`, `:::cache`, `:::queue`, `:::ext`, `:::client`, `:::gateway`, `:::decision`, `:::done`, `:::danger` — each maps to a fixed fill/border/text color. Untagged nodes render neutral.

## Edit mode

Each diagram has an **Edit** button that converts the rendered graph into an editable [tldraw](https://tldraw.dev) canvas — draw shapes, drag nodes, retype labels. This is a second, heavier runtime file, `editor.js` (React + tldraw + the official `@tldraw/mermaid` converter), lazy-loaded only on click so the default view stays a fast SVG render.

- **Persistence:** tldraw auto-saves the canvas to IndexedDB, keyed to a hash of the mermaid source. Reopening an edited diagram boots straight into the saved canvas. No files are written.
- **Source + build:** `src/editor.jsx` → `editor.js` via esbuild.

  ```sh
  npm install
  npm run build   # regenerates the committed editor.js
  ```

- **Caching:** `editor.js` is ~4.6MB, so it is NOT cache-busted (`diagram.js` is). It caches normally; purge jsDelivr after changing it:
  `curl https://purge.jsdelivr.net/gh/rahulnkm/diagram-runtime@main/editor.js`

## Notes

- Mermaid and the Geist fonts load from jsDelivr; pages need network to render.
- After pushing a change, purge the CDN cache so open diagrams pick it up sooner:
  `curl https://purge.jsdelivr.net/gh/rahulnkm/diagram-runtime@main/diagram.js`

## License

MIT
