/* diagram.js — single source of truth for the `diagram` skill's design system.
 *
 * Each diagram .html is a tiny shell: a <pre class="mermaid"> holding the graph,
 * a <title>, and one <script type="module"> pointing here. This file builds the
 * whole page around it: light theme, Geist fonts, Radix palette, semantic role
 * colors, infinite-canvas pan/zoom. Fix or improve anything here and EVERY
 * diagram — old and new — picks it up on next open.
 *
 * Served via jsDelivr from github.com/rahulnkm/diagram-runtime.
 * After pushing changes, purge the CDN cache:
 *   curl https://purge.jsdelivr.net/gh/rahulnkm/diagram-runtime@main/diagram.js
 */

const CSS = `
  @font-face { font-family:'Geist'; font-weight:100 900; font-display:swap;
    src:url('https://cdn.jsdelivr.net/npm/geist@1.7.2/dist/fonts/geist-sans/Geist-Variable.woff2') format('woff2-variations'); }
  @font-face { font-family:'Geist Mono'; font-weight:100 900; font-display:swap;
    src:url('https://cdn.jsdelivr.net/npm/geist@1.7.2/dist/fonts/geist-mono/GeistMono-Variable.woff2') format('woff2-variations'); }
  :root{ --font-sans:'Geist',ui-sans-serif,system-ui,-apple-system,sans-serif;
         --font-mono:'Geist Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace; }
  html,body{ margin:0; height:100%; background:#ffffff; overflow:hidden; }
  body{ color:#1a1f24; font-family:var(--font-sans); display:flex; flex-direction:column;
        height:100vh; padding:24px 28px 28px; box-sizing:border-box;
        background:radial-gradient(120% 80% at 50% -10%, #ffffff 0%, #f3f4f6 70%); }
  header{ display:flex; align-items:center; gap:9px; margin:0 4px 14px; flex:0 0 auto; }
  header .mark{ width:8px; height:8px; border-radius:2px; background:#0d74ce; }
  header .eyebrow{ font-family:var(--font-mono); font-weight:500; font-size:12px; letter-spacing:.14em;
                   text-transform:uppercase; color:#5f666d; }
  .stage{ position:relative; flex:1 1 auto; background:#fff; border:1px solid #e2e5e9; border-radius:16px;
          box-shadow:0 1px 2px rgba(17,24,28,.04),0 14px 36px -10px rgba(17,24,28,.10);
          overflow:hidden; cursor:grab; touch-action:none; }
  .stage.grabbing{ cursor:grabbing; }
  .stage.grabbing, .stage.grabbing *{ user-select:none; -webkit-user-select:none; }
  .pz{ position:absolute; top:0; left:0; transform-origin:0 0; }
  .pz.animate{ transition: transform 220ms cubic-bezier(.23,1,.32,1), opacity 220ms ease-out; will-change:transform; }
  .stage.grabbing .pz{ will-change:transform; }
  @media (prefers-reduced-motion: reduce){
    .pz.animate{ transition: opacity 160ms ease-out; }   /* keep fade, drop motion */
  }
  .mermaid{ padding:8px; display:block; }
  .mermaid svg{ display:block; }
  .mermaid .node rect,.mermaid .node polygon{ rx:7px; } .mermaid .cluster rect{ rx:12px; }
  .mermaid .cluster-label .nodeLabel,.mermaid .cluster-label foreignObject div{
    font-family:var(--font-mono)!important; text-transform:uppercase; letter-spacing:.09em;
    font-size:11px!important; color:#5f666d!important; }
  .mermaid .edgeLabel,.mermaid .edgeLabel *{ font-family:var(--font-mono)!important; letter-spacing:.02em; font-size:11.5px!important; }
  .mermaid .edgeLabel{ color:#5f666d!important; } .mermaid .edgeLabel rect{ fill:#fff!important; opacity:.92; }
  .mermaid .edgePath path,.mermaid .flowchart-link{ stroke-width:1.4px; }
  .controls{ position:absolute; right:14px; bottom:14px; display:flex; gap:6px; align-items:center;
             background:rgba(255,255,255,.86); backdrop-filter:blur(8px);
             border:1px solid #e2e5e9; border-radius:11px; padding:5px; box-shadow:0 6px 18px -8px rgba(17,24,28,.18); }
  .controls button{ font-family:var(--font-mono); font-size:13px; color:#1a1f24; background:#fff; border:1px solid #e2e5e9;
             width:30px; height:30px; border-radius:7px; cursor:pointer; display:flex; align-items:center; justify-content:center;
             line-height:1; transition:background .12s ease,border-color .12s ease,transform .14s cubic-bezier(.23,1,.32,1); }
  .controls button:active{ transform:scale(0.94); }
  @media (hover: hover) and (pointer: fine){
    .controls button:hover{ background:#f1f3f5; border-color:#cdd2d8; }   /* hover only where hover exists — no stuck state on touch */
  }
  .controls .reset{ width:auto; padding:0 11px; font-size:11px; letter-spacing:.08em; text-transform:uppercase; }
  .controls .zlabel{ font-family:var(--font-mono); font-size:11px; color:#5f666d; min-width:42px; text-align:center; }
  .hint{ position:absolute; left:14px; bottom:14px; font-family:var(--font-mono); font-size:11px; color:#9aa1a9;
         background:rgba(255,255,255,.7); border-radius:7px; padding:5px 9px; pointer-events:none; }
`;

const ROLES = [
  'classDef action fill:#e6f4fe,stroke:#0090ff,stroke-width:1.5px,color:#0d74ce;',
  'classDef store fill:#e6f6eb,stroke:#30a46c,stroke-width:1.5px,color:#218358;',
  'classDef cache fill:#e1f8f4,stroke:#12a594,stroke-width:1.5px,color:#008573;',
  'classDef queue fill:#fef7c3,stroke:#f5ae39,stroke-width:1.5px,color:#9e6c00;',
  'classDef ext fill:#f2eefe,stroke:#6e56cf,stroke-width:1.5px,stroke-dasharray:5 3,color:#6550b9;',
  'classDef client fill:#def7f9,stroke:#00a2c7,stroke-width:1.5px,color:#0c7792;',
  'classDef gateway fill:#feebe7,stroke:#e54d2e,stroke-width:1.5px,color:#d13415;',
  'classDef decision fill:#fef7c3,stroke:#f5ae39,stroke-width:1.5px,color:#9e6c00;',
  'classDef done fill:#e6f6eb,stroke:#30a46c,stroke-width:2px,color:#218358;',
  'classDef danger fill:#ffeff0,stroke:#e5484d,stroke-width:2px,color:#ce2c31;'
].join('\n');

const THEME = {
  darkMode:false, background:'#ffffff', fontFamily:"'Geist',ui-sans-serif,system-ui,sans-serif", fontSize:'15px',
  primaryColor:'#f1f3f5', primaryBorderColor:'#cdd2d8', primaryTextColor:'#1a1f24',
  secondaryColor:'#f7f8fa', tertiaryColor:'#f7f8fa', lineColor:'#9aa1a9', textColor:'#1a1f24',
  mainBkg:'#f1f3f5', nodeBorder:'#cdd2d8', nodeTextColor:'#1a1f24',
  clusterBkg:'#f7f8fa', clusterBorder:'#e2e5e9', titleColor:'#1a1f24', edgeLabelBackground:'#ffffff', defaultLinkColor:'#9aa1a9',
  actorBkg:'#f1f3f5', actorBorder:'#cdd2d8', actorTextColor:'#1a1f24', actorLineColor:'#cdd2d8',
  signalColor:'#5f666d', signalTextColor:'#5f666d', labelBoxBkgColor:'#f7f8fa', labelBoxBorderColor:'#e2e5e9', labelTextColor:'#1a1f24',
  loopTextColor:'#5f666d', activationBkgColor:'#eceef0', activationBorderColor:'#cdd2d8', sequenceNumberColor:'#ffffff',
  noteBkgColor:'#fef7c3', noteTextColor:'#1a1f24', noteBorderColor:'#f5ae39',
  labelColor:'#1a1f24', altBackground:'#f7f8fa', classText:'#1a1f24', errorBkgColor:'#ffeff0', errorTextColor:'#ce2c31'
};

async function main() {
  const srcPre = document.querySelector('pre.mermaid');
  if (!srcPre) return;

  // Recover the literal mermaid source. The browser parsed inline <br/> / <i> into real
  // DOM nodes; textContent would DROP them (collapsing multi-line labels). innerHTML keeps
  // the markup, and a <textarea> (RCDATA) turns it back into literal text + un-escapes
  // &amp;/&gt; — the exact source string Mermaid expects.
  const ta = document.createElement('textarea');
  ta.innerHTML = srcPre.innerHTML;
  const lines = ta.value.replace(/^\s+|\s+$/g, '').split('\n');
  const di = lines.findIndex(l => /^\s*(flowchart|graph)\b/.test(l));
  if (di !== -1) lines.splice(di + 1, 0, ROLES);
  const src = lines.join('\n');

  // Build the page around the graph.
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  document.body.innerHTML =
    '<header><span class="mark"></span><span class="eyebrow"></span></header>' +
    '<div class="stage" id="stage">' +
      '<div class="pz" id="pz"><pre class="mermaid" id="graph"></pre></div>' +
      '<div class="controls">' +
        '<button id="zout" title="Zoom out">−</button>' +
        '<span class="zlabel" id="zlabel">100%</span>' +
        '<button id="zin" title="Zoom in">+</button>' +
        '<button class="reset" id="zreset" title="Fit to screen">Fit</button>' +
      '</div>' +
      '<div class="hint">scroll / drag to pan · pinch or +/− to zoom</div>' +
    '</div>';
  document.querySelector('.eyebrow').textContent = document.title || 'Diagram';
  document.getElementById('graph').textContent = src;

  // Label rendering mode — the big one for zoom perf. HTML labels (htmlLabels:true) render each
  // label as HTML inside an SVG <foreignObject>, which the browser must RE-RASTERIZE every frame
  // during a CSS-transform zoom. Standalone Chrome has the GPU headroom; the Electron preview panel
  // does NOT, so label-dense diagrams crawl on zoom in the panel. Native SVG <text> (htmlLabels:false)
  // composites cheaply → smooth zoom everywhere. So default to native text, and only switch to HTML
  // labels when the graph actually uses emphasis markup that native text can't render.
  // (<br>/<br/> work in BOTH modes, so multi-line never forces HTML.)
  const needsHtmlLabels = /<\/?(?:i|b|em|strong|span|u|sub|sup|small|mark|font|code|a)\b/i.test(src);
  const mermaid = (await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')).default;
  mermaid.initialize({
    startOnLoad:false, securityLevel:'loose', theme:'base', themeVariables:THEME,
    htmlLabels: needsHtmlLabels,
    flowchart:{ curve:'basis', htmlLabels:needsHtmlLabels, nodeSpacing:58, rankSpacing:70, padding:16, useMaxWidth:false },
    sequence:{ useMaxWidth:false, mirrorActors:false, messageFontFamily:"'Geist Mono',monospace" }
  });
  try { await document.fonts.ready; } catch (e) {}
  await mermaid.run();

  /* ---- pan / zoom / pinch (infinite-canvas) ---- */
  const stage = document.getElementById('stage');
  const pz = document.getElementById('pz');
  const svg = pz.querySelector('svg');
  const zlabel = document.getElementById('zlabel');
  let scale = 1, tx = 0, ty = 0, natW = 600, natH = 400;
  if (svg) { svg.style.maxWidth = 'none'; const r = svg.getBoundingClientRect(); natW = r.width; natH = r.height; }
  const clamp = s => Math.min(5, Math.max(0.1, s));
  function apply() {
    pz.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    if (zlabel) zlabel.textContent = Math.round(scale * 100) + '%';
  }
  function zoomTo(factor, px, py) {
    const prev = scale; scale = clamp(scale * factor); const ratio = scale / prev;
    tx = px - (px - tx) * ratio; ty = py - (py - ty) * ratio; apply();
  }
  function fit() {
    const r = stage.getBoundingClientRect(), pad = 56;
    scale = clamp(Math.min((r.width - pad) / natW, (r.height - pad) / natH, 1.5));
    tx = (r.width - natW * scale) / 2; ty = (r.height - natH * scale) / 2; apply();
  }
  fit();

  /* ---- late-settle re-fit: font swap can resize the SVG after render, leaving the initial
     auto-fit framed against stale measurements. Re-measure once things settle and re-fit —
     but only if the user hasn't started interacting (never fight a gesture). ---- */
  let interacted = false;
  function remeasure() {
    if (!svg) return;
    const m = new DOMMatrix(getComputedStyle(pz).transform);
    const r2 = svg.getBoundingClientRect();
    const w = r2.width / (m.a || 1), h = r2.height / (m.d || 1);
    if (Math.abs(w - natW) > 1 || Math.abs(h - natH) > 1) {
      natW = w; natH = h;
      if (!interacted) glide(fit);
    }
  }
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', remeasure);
  setTimeout(remeasure, 700);

  /* ---- glide: animate ONLY discrete actions (buttons, entrance) — gestures stay 1:1 ---- */
  let glideTimer;
  function glide(fn) {
    pz.classList.add('animate');
    fn();
    clearTimeout(glideTimer);
    glideTimer = setTimeout(() => pz.classList.remove('animate'), 240);
  }
  function killGlide() { clearTimeout(glideTimer); pz.classList.remove('animate'); }

  document.getElementById('zin').onclick = () => { interacted = true; glide(() => { const r = stage.getBoundingClientRect(); zoomTo(1.2, r.width/2, r.height/2); }); };
  document.getElementById('zout').onclick = () => { interacted = true; glide(() => { const r = stage.getBoundingClientRect(); zoomTo(1/1.2, r.width/2, r.height/2); }); };
  document.getElementById('zreset').onclick = () => glide(fit);

  /* ---- entrance: one-time fade + settle to the exact fit framing ---- */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const entranceTarget = { s: scale, tx, ty };
  pz.style.opacity = '0';
  if (!reduceMotion) {
    const r = stage.getBoundingClientRect();
    zoomTo(0.985, r.width / 2, r.height / 2);   // start a hair smaller, centered
  }
  // double rAF so the browser paints the small/transparent state first — otherwise it snaps
  requestAnimationFrame(() => requestAnimationFrame(() => {
    glide(() => {
      pz.style.opacity = '1';
      scale = entranceTarget.s; tx = entranceTarget.tx; ty = entranceTarget.ty; apply();
    });
  }));

  // wheel: scroll = pan, ctrl/⌘ (trackpad pinch reports as wheel+ctrlKey) = zoom toward cursor.
  // deltaMode normalization: the same gesture reports deltaY in px (0), lines (1), or pages (2)
  // depending on device/OS — without this, line-mode mice get ~3 instead of ~100 and zoom feels dead.
  // Trackpad pinch sends TINY deltas (~0.5–3) while a mouse notch sends ~100 — one speed constant
  // can't serve that 50× range, so pinch and wheel get separate knobs.
  const PINCH_SPEED = 0.018;  // trackpad pinch: tiny deltas, needs punch (tune 0.012–0.025)
  const WHEEL_SPEED = 0.005;  // ctrl + real mouse wheel: big notches, stays calm
  const MAX_WHEEL_PX = 60;    // cap one event's contribution so a single mouse notch can't teleport
  let wcTimer;
  stage.addEventListener('wheel', e => {
    if (e.cancelable) e.preventDefault();
    interacted = true;
    killGlide();                                   // gestures are always instant — never animated
    pz.style.willChange = 'transform';             // transient layer promotion while wheeling
    clearTimeout(wcTimer); wcTimer = setTimeout(() => { pz.style.willChange = ''; }, 300);
    const r = stage.getBoundingClientRect();
    const PX = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    if (e.ctrlKey || e.metaKey) {
      const raw = e.deltaY * PX;
      const pinch = e.ctrlKey && Math.abs(raw) < 50;   // small ctrl-wheel = trackpad pinch
      const speed = pinch ? PINCH_SPEED : WHEEL_SPEED;
      const dy = Math.max(-MAX_WHEEL_PX, Math.min(MAX_WHEEL_PX, raw));
      zoomTo(Math.exp(-dy * speed), e.clientX - r.left, e.clientY - r.top);
    } else { tx -= e.deltaX * PX; ty -= e.deltaY * PX; apply(); }
  }, { passive:false });

  // pointer: 1 = drag-pan, 2 = pinch-zoom; presses on the controls keep their clicks
  const pts = new Map(); let pinchDist = 0;
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('.controls')) return;
    if (e.cancelable) e.preventDefault();           // stop a text selection from ever starting
    interacted = true;
    killGlide();                                    // a grab interrupts any gliding zoom — drag stays 1:1
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}  // fast pans that leave the element don't drop
    pts.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (pts.size === 1) stage.classList.add('grabbing');
  });
  stage.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if (pts.size === 1) {
      const sel = window.getSelection();            // safety net: clear any highlight that leaked in
      if (sel && !sel.isCollapsed) sel.removeAllRanges();
      tx += e.clientX - prev.x; ty += e.clientY - prev.y; apply();
    }
    else if (pts.size === 2) {
      const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), r = stage.getBoundingClientRect();
      if (pinchDist) zoomTo(d / pinchDist, (a[0].x + a[1].x)/2 - r.left, (a[0].y + a[1].y)/2 - r.top);
      pinchDist = d;
    }
  });
  function endPt(e) { pts.delete(e.pointerId); if (pts.size < 2) pinchDist = 0; if (pts.size === 0) stage.classList.remove('grabbing'); }
  stage.addEventListener('pointerup', endPt); stage.addEventListener('pointercancel', endPt);
}

main();
