# Draw

A small diagram editor inspired by [Excalidraw](https://excalidraw.com), rendered with plain SVG and no diagramming libraries. Draw rectangles and ellipses, connect them with arrows, zoom and pan an infinite canvas, undo your mistakes, and export your work.

Excalidraw is used only as a behavioral reference; the implementation is original. The full behavior spec lives in [task.md](task.md).

## Features

- **Shapes:** rectangles and ellipses, drawn by dragging in any direction.
- **Select and move:** click to select, drag to move.
- **Arrows:** an arrow's start sticks to the shape it begins in and follows it when moved. Arrows can also be selected and moved on their own.
- **Zoom and pan:** cursor-anchored zoom, wheel scrolling, and Space + drag panning.
- **Multi-selection:** drag a selection box, or Shift + click.
- **Delete, undo, redo:** one drag is one undo step.
- **Export and import:** PNG (white background, cropped to your drawing) and JSON (round-trips the whole scene, including arrow bindings).

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm test` | Run the Playwright test suite |

The first time you run the tests, install the browser:

```bash
npx playwright install chromium
```

## Deployment

The app is a static Vite build, so it deploys to [Vercel](https://vercel.com) without any configuration:

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected settings: framework **Vite**, build command `npm run build`, output directory `dist`.

There are no environment variables and no backend. Every push to `main` is deployed automatically.

## Controls

| Action | Input |
|--------|-------|
| Draw a shape | Pick Rectangle or Ellipse in the toolbar, then drag |
| Draw an arrow | Pick Arrow, then drag from one point to another |
| Select | Click an element, or drag a box around elements on empty canvas |
| Add to / remove from selection | Shift + click |
| Move | Drag a selected element (all selected elements move together) |
| Delete | `Delete` or `Backspace` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Zoom | `Ctrl + mouse wheel` (anchored on the cursor) |
| Scroll vertically | Mouse wheel, or `Shift + wheel` |
| Scroll horizontally | `Space + wheel` |
| Pan | Hold `Space` and drag |
| Export / import | Buttons in the top-right corner |

The current zoom level is shown in the bottom-left corner.

### How arrows attach

- The **start** of an arrow attaches to the shape where you press the mouse. Moving that shape moves the start.
- The **end** attaches only if you release it inside that same shape. Otherwise it stays fixed at its position on the canvas, even when released inside another shape.
- Dragging an arrow on its own detaches it from shapes that are not moving with it.
- Deleting a shape leaves its arrows exactly where they were, unattached.

## How it works

The scene is a flat list of elements. Everything the user sees is derived from that list plus a view transform.

```
scene coordinates  --(scale by zoom, translate by scroll)-->  screen coordinates
scene = screen / zoom + scroll
```

Pointer input is converted to scene coordinates once, so tools never deal with zoom or pan. A 100 px drag at 200% zoom moves a shape 50 scene units.

### Project structure

```
src/
├── types.ts                 # Shape, Arrow, Binding, SceneState
├── store/
│   ├── sceneStore.ts        # tiny external store (useSyncExternalStore), no state library
│   ├── history.ts           # undo/redo snapshots
│   └── actions.ts           # delete selection
├── svg/
│   ├── Canvas.tsx           # <svg>, pointer and wheel routing
│   ├── ElementView.tsx      # renders a rectangle, ellipse or arrow
│   ├── SelectionBox.tsx     # selection outline
│   └── viewTransform.ts     # zoom, scroll, screen <-> scene
├── tools/                   # one module per interaction
│   ├── shapeTool.ts
│   ├── selectTool.ts        # select, move, selection box, Shift + click
│   ├── arrowTool.ts
│   └── panTool.ts
├── geometry/
│   ├── hitTest.ts           # which element is under the cursor
│   ├── arrows.ts            # bindings, syncing, removal
│   └── bounds.ts
├── export/                  # PNG, JSON export and JSON import
├── hooks/useKeyboard.ts     # Delete, undo/redo, Space
└── ui/                      # Toolbar, FileMenu, ZoomIndicator
tests/                       # one spec file per behavior, B1 to B8
```

### Data model

```ts
type Shape = { id; type: 'rectangle' | 'ellipse'; x; y; width; height }

type Arrow = {
  id; type: 'arrow'
  start: { x; y }; end: { x; y }          // absolute scene points
  startBinding: { shapeId; offsetX; offsetY } | null
  endBinding:   { shapeId; offsetX; offsetY } | null
  x; y; width; height                     // bounding box, kept in sync
}
```

A binding stores the endpoint as an **offset from the shape's origin**. When a shape moves, `syncArrows` recomputes the bound endpoints, so arrows follow without any special logic in the move code. Deleting a shape clears the binding but keeps the points, so the arrow does not jump.

### Undo and redo

History keeps snapshots of the elements array. Because the scene is treated as immutable, a snapshot is just a reference. `commit()` is called once per completed action (create, connect, delete, or the end of a drag), so a drag with hundreds of intermediate positions is a single undo step. Zoom, pan, and the active tool are intentionally not part of history.

### Export

- **JSON:** `{ "type": "draw-test", "version": 1, "elements": [...] }`. Import validates every element before replacing the scene, and the import itself can be undone.
- **PNG:** the elements are rendered to a standalone SVG with a white background, sized to the drawing's bounding box plus 20 units of padding, then rasterized at 2x through a canvas.

## Testing

All behaviors are covered by Playwright tests in [tests/](tests/), with one spec file per behavior (B1 to B8). The tests drive the real UI with the mouse and keyboard, and assert exact values instead of pixels.

For deterministic checks the app exposes:

- `<svg data-testid="canvas">`, and for each element `<g data-testid="element-<id>">` with `data-type`, `data-x`, `data-y`, `data-width`, `data-height`.
- `window.__scene`: a live, read-only view of `elements`, `selection`, `tool`, `zoom`, and `scroll`.
- Toolbar buttons: `tool-select`, `tool-rectangle`, `tool-ellipse`, `tool-arrow`. File buttons: `export-json`, `export-png`, `import-json`. Zoom label: `zoom-indicator`.

```bash
npm test
```

## Out of scope

Freehand drawing, text, diamonds and lines, images, styling (stroke, fill, opacity), collaboration, libraries, dark mode, grid snapping, rotation, and resize handles.

## Stack

React 19, TypeScript, Vite 6, Playwright. No state-management or diagramming libraries.
