# Canu Drawing App — Feature Requests & Bug Fixes Prompt for Code Agent

## Context
This is a comprehensive feature request and bug fix list for **Canu** (https://canu.vercel.app), a real-time collaborative drawing board. Implement all items below. When in doubt about UX behavior, default to how Procreate or Sketchbook handles it.

---

## 🐛 Bug Fixes

1. **Two-finger zoom is broken** — Pinch-to-zoom with two fingers on touch devices should smoothly zoom the canvas. Currently non-functional or glitchy. Fix touch event handling for pinch gesture (use `pointercache` or `TouchEvent` distance delta).

2. **Canvas does not pan correctly when zoomed** — After zooming in, dragging/panning the canvas with one finger or mouse should move the viewport, not draw. Ensure zoom state blocks draw mode and enables pan mode.

3. **Stroke join quality** — Fast strokes show gaps or disconnected dots. Fix by drawing bezier curves between points instead of straight line segments (`quadraticCurveTo` or `bezierCurveTo`).

---

## ✨ New Features

### 🖊️ Drawing & Brush Tools

4. **Brush size control** — Add a brush size slider (range: 1px–200px). Show a live preview dot of the current size next to the slider.

5. **Brush type/preset selector** — Add brush type options: Pen, Pencil, Marker, Airbrush, Watercolor (soft edge). Each should have distinct opacity/softness/texture behavior.

6. **Brush tip opacity** — Separate opacity control for the brush tip (0–100%). Independent from layer opacity.

7. **Stabilizer / line smoothing** — Add a stroke stabilizer slider (0–100). At higher values, smooth out shaky input using a moving average or lazy-brush algorithm. Label it "Smoothing" or "Stabilizer".

8. **Pressure sensitivity simulation** — On devices without stylus, simulate pressure based on stroke speed: faster = thinner, slower = thicker (optional toggle).

9. **Stroke jitter reduction** — Reduce micro-jitter on slow strokes using Douglas-Peucker simplification on commit.

10. **Symmetry / Mirror tool** — Add a mirror drawing mode that reflects strokes horizontally, vertically, or both across the canvas center. Show a dashed axis line. Toggle on/off.

11. **Shape tool** — Add a shape insertion tool: Rectangle, Circle, Line, Arrow, Triangle. Click and drag to draw. Hold Shift to constrain proportions.

12. **Smudge tool** — Add a smudge/blend tool that drags and blends existing pixel colors together (sample surrounding pixels and blend in stroke direction).

13. **Blur tool** — Add a blur brush that applies a gaussian blur locally where you paint.

14. **Eraser tool** — Add a dedicated eraser. Should have its own size control. Option to erase to transparent (on layers) or to background color.

15. **Bucket / Fill tool** — Add a paint bucket fill tool that flood-fills a region with the selected color. Add tolerance slider (0–100).

16. **Color picker / eyedropper** — Add an eyedropper tool to sample color from anywhere on the canvas. Also add long-press on canvas to activate eyedropper temporarily.

17. **Text tool** — Add a text insertion tool. Click canvas → input box appears → type text → confirm → rasterize or keep as editable text object. Font size, font family (at least 3–5 options), bold/italic toggles.

18. **Lasso selection tool** — Freehand lasso select a region. Once selected, allow: move, scale, rotate, delete, copy/paste the selection. Show marching ants border.

19. **Color presets / swatches** — Save up to 20 custom color swatches. Click to save current color, click swatch to load. Persist in localStorage.

---

### 🗂️ Layers

20. **Layer system** — Add a layers panel with: Add layer, Delete layer, Reorder (drag), Toggle visibility, Rename layer. Draw operations apply to the active layer only.

21. **Layer opacity** — Per-layer opacity slider (0–100%).

22. **Layer merge** — Merge selected layer down or merge all visible layers.

23. **Mirror / Flip layer** — Horizontal and vertical flip of the active layer content.

---

### 🖼️ Canvas & Import/Export

24. **Import image onto canvas** — Allow user to upload an image (JPG, PNG, WEBP) and place it as a layer or stamp on canvas. After placing, user can draw on top.

25. **Draw on top of imported image** — Once an image is placed, it becomes a locked base layer. User draws freely on layers above it.

26. **Canvas paper size & quality settings** — On canvas creation or via settings, let user choose:
- Preset sizes: A4, A3, Square (1:1), 16:9, Custom (px input)
- Resolution: 72 DPI (web), 150 DPI, 300 DPI (print)
- Background: White, Black, Transparent

27. **Zoom & pan controls** — Add UI buttons for zoom in (+), zoom out (−), reset zoom (100%), and fit to screen. Also display current zoom % in corner.

28. **Two-finger pan while drawing** — On touch: two fingers = pan/zoom, one finger = draw. Implement correctly with pointer event caching.

---

### ⏱️ Animation / Slideshow

29. **Frame-based animation (Flipbook mode)** — Add ability to create multiple frames. Each frame is a separate canvas state. Playback button cycles through frames. Set FPS (1–24). Export as GIF or MP4.

30. **Per-frame duration** — Each frame can have its own display duration in milliseconds.

31. **Onion skinning** — Show previous frame(s) as ghost/semi-transparent underneath current frame while drawing (toggle on/off, adjustable opacity).

32. **Score/timed slideshow** — Given a theme/topic, auto-cycle through user-drawn frames, one per 5 seconds (configurable), assembled into one unified image sequence or video for presentation.

---

### 🤝 Collaboration

33. **Show collaborator cursors with names** — Each connected user's cursor should show their username or display name as a floating label. User should be able to set/choose their display name before joining or inside a room.

34. **Cursor trail / drawing preview** — See what other users are drawing in real-time as they draw (stroke preview, not just cursor).

35. **Room name / canvas name** — Allow naming the collaborative room/canvas.

36. **Return to own drawing** — Button or shortcut to re-center/navigate back to your own last drawing position on a large shared canvas.

---

### 🏆 Social / Gallery

37. **Album / Gallery page** — Users can save finished drawings to a personal gallery (requires auth or anonymous session). Gallery shows thumbnails in a grid.

38. **Public sharing** — Toggle a drawing as "public". Public drawings are visible on a community feed/explore page.

39. **PSP / Social post export** — One-click export optimized for social sharing: square crop option, PNG/JPG, download or share sheet.

40. **Ranking / Favorites** — Users can "like" or star their own saved drawings to rank them. Show most-liked at top of gallery. "Most liked drawing" badge.

41. **AI "Impostor" feature** — A fun mode where the AI is given a theme/word and draws it on the canvas step by step while the user watches. Other users try to guess what it's drawing (like skribbl.io). The AI should use the Anthropic API (claude-sonnet-4-20250514) to generate step-by-step drawing instructions and execute them as canvas strokes.

42. **Theme-based drawing prompt** — Show a random theme/word prompt to the user. When the timer runs out (configurable, e.g. 60s), the drawing is auto-saved and scored (peer rating 1–10). Show the score at the end.

---

### 🎛️ UI / UX

43. **Main menu / home screen** — Add a proper home screen with: Create new canvas, Join room by code, Open gallery, Settings.

44. **Undo / Redo** — Ctrl+Z / Cmd+Z for undo, Ctrl+Shift+Z for redo. Also add UI buttons. At least 50 steps of history.

45. **Keyboard shortcuts panel** — Show a shortcuts cheat sheet (? key or help button).

46. **Dark / Light mode toggle** — UI theme toggle. Canvas background remains user-set.

47. **Responsive mobile layout** — All tool panels should collapse into a floating toolbar or bottom sheet on small screens. No UI elements should overlap the canvas.

48. **Onboarding tooltip tour** — First-time users see a brief walkthrough of key tools.

---

## 📐 Technical Notes for the Agent

- Stack: Next.js + React (based on vercel deploy). Use Canvas 2D API or PixiJS for rendering.
- Collaboration: likely uses WebSockets (Socket.io or Liveblocks). Preserve existing real-time sync when adding layers/frames.
- Touch input: use `PointerEvent` API with `pointercache` for multi-touch. Avoid mixing `TouchEvent` and `MouseEvent`.
- Layer compositing: use multiple `<canvas>` elements stacked via CSS, or composite to one canvas per frame.
- For the AI Impostor feature: call `api.anthropic.com/v1/messages` with `claude-sonnet-4-20250514`. Prompt it to return a sequence of SVG-like draw commands (moveTo, lineTo, color, width) in JSON, then replay them on canvas.
- Color presets, canvas settings, and gallery data: persist in `localStorage` for anonymous users, sync to DB for authenticated users.
- Animation export: use `gif.js` or `ffmpeg.wasm` for client-side GIF/MP4 export.
- Lasso selection: implement with hit-testing (`isPointInPath`) and an offscreen canvas mask.

---

## Priority Order (suggested)

1. Bug fixes (zoom, pan, stroke quality)
2. Core tools: eraser, brush size, undo/redo, color picker, fill bucket
3. Layers system
4. Import image + draw on top
5. Text tool, lasso selection, shape tool
6. Symmetry, smudge, blur, stabilizer
7. Canvas size/quality settings
8. Animation / flipbook
9. Collaboration names + cursor preview
10. Gallery, public sharing, ranking
11. AI Impostor + theme prompts
12. Polish: main menu, mobile UI, onboarding
