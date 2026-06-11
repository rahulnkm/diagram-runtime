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

## Notes

- Mermaid and the Geist fonts load from jsDelivr; pages need network to render.
- After pushing a change, purge the CDN cache so open diagrams pick it up sooner:
  `curl https://purge.jsdelivr.net/gh/rahulnkm/diagram-runtime@main/diagram.js`

## License

MIT
