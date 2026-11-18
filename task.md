# Task: SVG diagram editor with shapes, connected arrows, zoom and undo

## Overview

Build a small diagram editor inspired by Excalidraw (excalidraw.com), rendered with plain SVG and no diagramming libraries. Excalidraw is used only as a behavioral reference: the implementation is original.

This task covers a limited subset of the reference app. Every behavior below has an objective success criterion and an automated check.

## Status of this spec

Every criterion has been confirmed against the screen recordings of the reference app (`reference/screenshots/`).

## Reference material

- `reference/screenshots/`: screen recordings of the reference app

## Scope

| ID | Behavior |
|----|----------|
| B1 | Create rectangles and ellipses |
| B2 | Select and move shapes |
| B3 | Arrows connected to shapes, which follow them when moved |
| B4 | Zoom and pan the canvas |
| B5 | Multi-selection |
| B6 | Delete selected elements |
| B7 | Undo and redo |
| B8 | Export to PNG and JSON, and import JSON |

## Out of scope

Anything not listed above, for example: freehand drawing, text tool, diamonds, lines, images, styling panel (stroke, fill, opacity), collaboration, libraries, dark mode, grid snapping, rotation and resize handles.

## Test setup (for deterministic checks)

- The canvas is an `<svg data-testid="canvas">`. Each element is a `<g data-testid="element-<id>">` with `data-type` (`rectangle`, `ellipse`, `arrow`) and its scene coordinates in `data-x`, `data-y`, `data-width`, `data-height`.
- A debug hook `window.__scene` exposes the current scene (elements, selection, zoom, scroll offset) so tests can assert exact values, not just visual output.
- Toolbar buttons expose `data-testid="tool-rectangle"`, `tool-ellipse`, `tool-arrow`, `tool-select`.

## Success criteria

### B1: Create shapes
- **B1.1** With the rectangle tool active, pressing at scene point (100, 100) and releasing at (300, 200) creates a rectangle with x=100, y=100, width=200, height=100.
- **B1.2** The same gesture with the ellipse tool creates an ellipse with the same bounding box.
- **B1.3** Dragging up and to the left (from (300, 200) to (100, 100)) produces the same normalized bounding box as B1.1.
- **B1.4** After a shape is created, the active tool returns to Select automatically.

### B2: Select and move
- **B2.1** Clicking a shape selects it and shows a selection outline. Clicking empty canvas clears the selection.
- **B2.2** Dragging a selected shape by (+50, +30) moves its x and y by exactly that amount. Width and height do not change.

### B3: Arrows attached to shapes

An arrow's **start** is attached to the shape it begins in. Its **end** is attached only when it is released inside that same shape (arrow fully inside one shape). An end released on empty canvas, or inside a different shape, stays fixed at its scene point: it never follows the shape it lands on.

- **B3.1** No visual indicator (highlight or outline) is shown while dragging an arrow over a shape.
- **B3.2** Arrow fully inside one shape: an arrow drawn with both endpoints inside shape A moves together with A. Moving A by (+50, +30) moves both endpoints by exactly (+50, +30).
- **B3.3** Arrow starting inside a shape and ending outside: moving shape A moves the arrow's start by the same offset, while the end stays at its original scene point. The arrow stretches or shortens accordingly.
- **B3.4** Arrow drawn entirely on empty canvas: moving any shape does not affect it.
- **B3.5** The arrow itself can be selected and moved on its own, independently of any shape.
- **B3.6** Arrow from inside shape A to inside shape B: moving A moves only the start, and the end stays at its original scene point. Moving B does not move the arrow at all: the arrow stays in the same place.
- **B3.7** Deleting a shape that an arrow is attached to deletes only the shape. The arrow stays intact, with the same position and shape it had before the deletion.

### B4: Zoom and pan
- **B4.1** Ctrl + mouse wheel zooms in (wheel up) and out (wheel down).
- **B4.1b** Ctrl + mouse wheel is the only way to zoom. The mouse wheel without Ctrl does not change the zoom level.
- **B4.1c** Zoom is anchored on the cursor: the scene point under the cursor stays fixed on screen while zooming.
- **B4.2** The current zoom level is shown as a percentage in the bottom-left corner, starting at 100%, and updates on every zoom change.
- **B4.3** The mouse wheel without Ctrl scrolls the canvas vertically: wheel down moves the view down, wheel up moves it up. The zoom level does not change.
- **B4.3b** Holding Space while using the wheel scrolls the canvas horizontally: wheel down moves the view right, wheel up moves it left. The zoom level does not change.
- **B4.3d** Holding Shift while using the wheel scrolls the canvas vertically, the same as the wheel alone: wheel down moves the view down, wheel up moves it up. The zoom level does not change.
- **B4.3c** Holding Space and dragging pans the whole canvas freely in any direction, by exactly the drag distance on screen.
- **B4.4** Shapes keep their scene coordinates when zooming or panning. Only the view transform changes.
- **B4.5** Creating or moving a shape while zoomed at 200% uses scene coordinates: a 100 px screen drag moves the shape by 50 scene units.

### B5: Multi-selection
- **B5.1** Dragging a selection box on empty canvas selects every element fully inside the box.
- **B5.2** Shift + click adds or removes a shape from the current selection.
- **B5.3** Dragging any selected shape moves all selected elements by the same offset.

### B6: Delete
- **B6.1** Pressing Delete or Backspace removes all selected elements.
- **B6.2** Elements that were not selected are not affected (except arrows staying in place, see B3.7).

### B7: Undo and redo
- **B7.1** Ctrl + Z undoes the last action (create, move, delete, connect).
- **B7.2** Ctrl + Shift + Z redoes the last undone action.
- **B7.3** A single drag-to-move is undone in one step, no matter how many intermediate positions it had.
- **B7.4** Performing a new action after undo clears the redo history.
- **B7.5** Undo and redo do not change zoom or pan.

### B8: Export and import
- **B8.1** Export to JSON downloads a file containing every element with its type, coordinates, size and arrow bindings.
- **B8.2** Importing that JSON into an empty canvas reproduces the same scene: same elements, positions and bindings.
- **B8.3** Export to PNG downloads an image containing all elements, cropped to their bounding box plus padding.
- **B8.4** The exported PNG has a white background (not transparent).

## Verification

All criteria are covered by Playwright tests in `tests/`, one `describe` block per behavior ID (B1 to B8), asserting against `window.__scene` and the rendered SVG. Run:

```bash
npx playwright test
```

A task is considered complete only when every test passes.
