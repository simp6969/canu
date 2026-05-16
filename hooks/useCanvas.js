"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_UNDO = 50;
export const WORLD_W = 1920;
export const WORLD_H = 1080;
const BG_COLOR = "#0d1020";
const MIN_SCALE = 0.05;
const MAX_SCALE = 40;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function ptDist(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
function ptMid(a, b) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

// Stack-based flood fill
function floodFill(imageData, sx, sy, fillRgb, tolerance) {
  const { data, width, height } = imageData;
  sx = Math.floor(sx);
  sy = Math.floor(sy);
  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return;
  const si = (sy * width + sx) * 4;
  const [tr, tg, tb] = [data[si], data[si + 1], data[si + 2]];
  const [fr, fg, fb] = fillRgb;
  if (tr === fr && tg === fg && tb === fb) return;
  const maxDist = tolerance * 7.65;
  const visited = new Uint8ClampedArray(width * height);
  const stack = [sx + sy * width];
  while (stack.length) {
    const idx = stack.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;
    const x = idx % width,
      y = (idx / width) | 0;
    const pi = idx * 4;
    if (
      Math.abs(data[pi] - tr) +
        Math.abs(data[pi + 1] - tg) +
        Math.abs(data[pi + 2] - tb) >
      maxDist
    )
      continue;
    data[pi] = fr;
    data[pi + 1] = fg;
    data[pi + 2] = fb;
    data[pi + 3] = 255;
    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }
}

// Smooth bezier path
function renderSmoothPath(ctx, pts, strokeStyle, lineWidth, alpha, comp) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = comp || "source-over";
  ctx.globalAlpha = alpha ?? 1;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
  } else {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2,
        my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
  ctx.stroke();
  ctx.restore();
}

function renderAirbrush(ctx, pts, color, radius, opacity) {
  if (!pts || !pts.length) return;
  const [r, g, b] = hexToRgb(color);
  ctx.save();
  for (const pt of pts) {
    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
    grad.addColorStop(0, `rgba(${r},${g},${b},${opacity * 0.35})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${opacity * 0.12})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawShapeOnCtx(
  ctx,
  shapeType,
  x1,
  y1,
  x2,
  y2,
  strokeStyle,
  lineWidth,
  shiftKey,
) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  let w = x2 - x1,
    h = y2 - y1;
  if (shiftKey) {
    const s = Math.min(Math.abs(w), Math.abs(h));
    w = Math.sign(w) * s;
    h = Math.sign(h) * s;
  }
  ctx.beginPath();
  switch (shapeType) {
    case "rect":
      ctx.strokeRect(x1, y1, w, h);
      break;
    case "circle":
      ctx.ellipse(
        x1 + w / 2,
        y1 + h / 2,
        Math.abs(w / 2),
        Math.abs(h / 2),
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      break;
    case "line":
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      break;
    case "arrow": {
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const len = Math.hypot(x2 - x1, y2 - y1);
      const hl = Math.min(len * 0.25, lineWidth * 6 + 20);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - hl * Math.cos(ang - Math.PI / 6),
        y2 - hl * Math.sin(ang - Math.PI / 6),
      );
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - hl * Math.cos(ang + Math.PI / 6),
        y2 - hl * Math.sin(ang + Math.PI / 6),
      );
      ctx.stroke();
      break;
    }
    case "triangle":
      ctx.moveTo((x1 + x2) / 2, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x1, y2);
      ctx.closePath();
      ctx.stroke();
      break;
  }
  ctx.restore();
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useCanvas({
  tool = "pen",
  color = "#8cb9e0",
  strokeWidth = 4,
  brushType = "pen",
  brushOpacity = 1,
  smoothing = 0,
  shapeType = "rect",
  fillTolerance = 30,
  symmetryMode = null,
  simulatePressure = false,
  layers,
  activeLayerIndex = 0,
  isConnected = false,
  broadcastStroke,
  broadcastClear,
  broadcastUndo,
  onColorPicked,
  textFont = "Poppins, sans-serif",
  textSize = 24,
  textBold = false,
  textItalic = false,
} = {}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const layerCanvasesRef = useRef({});
  const overlayRef = useRef(null);

  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const [zoom, setZoom] = useState(1);

  const pointerCacheRef = useRef(new Map());
  const isDrawingRef = useRef(false);
  const isPinchingRef = useRef(false);
  const lastPinchDistRef = useRef(0);
  const lastPinchMidRef = useRef({ x: 0, y: 0 });

  const currentPtsRef = useRef([]);
  const smoothBufRef = useRef([]);
  const prevPtRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lastDistRef = useRef(0);

  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const pathHistoryRef = useRef([]);

  const shapeStartRef = useRef(null);
  const shapeShiftRef = useRef(false);
  const lassoRef = useRef([]);
  const lassoPathRef = useRef(null);

  const [textState, setTextState] = useState({
    active: false,
    x: 0,
    y: 0,
    value: "",
  });
  const textStateRef = useRef({ active: false, x: 0, y: 0, value: "" });
  const [selectionState, setSelectionState] = useState({
    active: false,
    bounds: null,
  });

  const rafRef = useRef(null);
  const needsRedrawRef = useRef(false);
  const layersRef = useRef(layers);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);
  const activeLayerIndexRef = useRef(activeLayerIndex);
  useEffect(() => {
    activeLayerIndexRef.current = activeLayerIndex;
  }, [activeLayerIndex]);

  // Refs for props used in callbacks (avoid stale closures)
  const toolRef = useRef(tool);
  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  const colorRef = useRef(color);
  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  const strokeWidthRef = useRef(strokeWidth);
  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);
  const brushTypeRef = useRef(brushType);
  useEffect(() => {
    brushTypeRef.current = brushType;
  }, [brushType]);
  const brushOpacityRef = useRef(brushOpacity);
  useEffect(() => {
    brushOpacityRef.current = brushOpacity;
  }, [brushOpacity]);
  const smoothingRef = useRef(smoothing);
  useEffect(() => {
    smoothingRef.current = smoothing;
  }, [smoothing]);
  const shapeTypeRef = useRef(shapeType);
  useEffect(() => {
    shapeTypeRef.current = shapeType;
  }, [shapeType]);
  const fillToleranceRef = useRef(fillTolerance);
  useEffect(() => {
    fillToleranceRef.current = fillTolerance;
  }, [fillTolerance]);
  const symmetryModeRef = useRef(symmetryMode);
  useEffect(() => {
    symmetryModeRef.current = symmetryMode;
  }, [symmetryMode]);
  const simulatePressureRef = useRef(simulatePressure);
  useEffect(() => {
    simulatePressureRef.current = simulatePressure;
  }, [simulatePressure]);
  const textFontRef = useRef(textFont);
  useEffect(() => {
    textFontRef.current = textFont;
  }, [textFont]);
  const textSizeRef = useRef(textSize);
  useEffect(() => {
    textSizeRef.current = textSize;
  }, [textSize]);
  const textBoldRef = useRef(textBold);
  useEffect(() => {
    textBoldRef.current = textBold;
  }, [textBold]);
  const textItalicRef = useRef(textItalic);
  useEffect(() => {
    textItalicRef.current = textItalic;
  }, [textItalic]);

  // ── Layer helpers ─────────────────────────────────────────────────────────────
  const ensureLayerCanvas = useCallback((id) => {
    if (!layerCanvasesRef.current[id]) {
      const c = document.createElement("canvas");
      c.width = WORLD_W;
      c.height = WORLD_H;
      layerCanvasesRef.current[id] = c;
    }
    return layerCanvasesRef.current[id];
  }, []);

  const getLayerCanvas = useCallback(
    (id) => layerCanvasesRef.current[id] ?? null,
    [],
  );
  const initLayerCanvas = useCallback(
    (id) => {
      const c = ensureLayerCanvas(id);
      c.getContext("2d").clearRect(0, 0, WORLD_W, WORLD_H);
    },
    [ensureLayerCanvas],
  );
  const deleteLayerCanvas = useCallback((id) => {
    delete layerCanvasesRef.current[id];
  }, []);

  // ── Composite ─────────────────────────────────────────────────────────────────
  const composite = useCallback(() => {
    const canvas = canvasRef.current,
      ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const { scale, offsetX, offsetY } = transformRef.current;
    const ls = layersRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    if (ls) {
      for (const l of ls) {
        if (!l.visible) continue;
        const lc = layerCanvasesRef.current[l.id];
        if (!lc) continue;
        ctx.globalAlpha = l.opacity;
        ctx.drawImage(lc, 0, 0);
      }
    }
    ctx.globalAlpha = 1;
    const ov = overlayRef.current;
    if (ov) ctx.drawImage(ov, 0, 0);

    const sm = symmetryModeRef.current;
    if (sm) {
      ctx.save();
      ctx.strokeStyle = "rgba(140,185,224,0.45)";
      ctx.lineWidth = 1 / scale;
      ctx.setLineDash([6 / scale, 6 / scale]);
      if (sm === "h" || sm === "both") {
        ctx.beginPath();
        ctx.moveTo(WORLD_W / 2, 0);
        ctx.lineTo(WORLD_W / 2, WORLD_H);
        ctx.stroke();
      }
      if (sm === "v" || sm === "both") {
        ctx.beginPath();
        ctx.moveTo(0, WORLD_H / 2);
        ctx.lineTo(WORLD_W, WORLD_H / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, []);

  const scheduleRedraw = useCallback(() => {
    needsRedrawRef.current = true;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (needsRedrawRef.current) {
          needsRedrawRef.current = false;
          composite();
        }
      });
    }
  }, [composite]);

  // ── Init ──────────────────────────────────────────────────────────────────────
  const initCanvas = useCallback(
    (el) => {
      if (!el) return;
      canvasRef.current = el;
      el.width = window.innerWidth;
      el.height = window.innerHeight;
      const ctx = el.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
      const ov = document.createElement("canvas");
      ov.width = WORLD_W;
      ov.height = WORLD_H;
      overlayRef.current = ov;
      const s = Math.min(el.width / WORLD_W, el.height / WORLD_H) * 0.92;
      transformRef.current = {
        scale: s,
        offsetX: (el.width - WORLD_W * s) / 2,
        offsetY: (el.height - WORLD_H * s) / 2,
      };
      setZoom(s);
      const ls = layersRef.current;
      if (ls) {
        ls.forEach((l, i) => {
          ensureLayerCanvas(l.id);
          if (i === 0) {
            const lc = layerCanvasesRef.current[l.id];
            const lctx = lc.getContext("2d");
            lctx.fillStyle = BG_COLOR;
            lctx.fillRect(0, 0, WORLD_W, WORLD_H);
          }
        });
      }
      composite();
      const onResize = () => {
        el.width = window.innerWidth;
        el.height = window.innerHeight;
        scheduleRedraw();
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    [ensureLayerCanvas, composite, scheduleRedraw],
  );

  useEffect(() => {
    if (!layers) return;
    layers.forEach((l) => ensureLayerCanvas(l.id));
    scheduleRedraw();
  }, [layers, ensureLayerCanvas, scheduleRedraw]);

  // ── Transform ─────────────────────────────────────────────────────────────────
  const screenToWorld = useCallback((sx, sy) => {
    const { scale, offsetX, offsetY } = transformRef.current;
    return { x: (sx - offsetX) / scale, y: (sy - offsetY) / scale };
  }, []);

  // ── Undo/Redo ─────────────────────────────────────────────────────────────────
  const getActiveLayerId = useCallback(() => {
    const ls = layersRef.current;
    return ls?.[activeLayerIndexRef.current]?.id ?? null;
  }, []);

  const pushUndo = useCallback(() => {
    const id = getActiveLayerId();
    if (!id) return;
    const lc = layerCanvasesRef.current[id];
    if (!lc) return;
    const imageData = lc.getContext("2d").getImageData(0, 0, WORLD_W, WORLD_H);
    undoStackRef.current.push({ layerId: id, imageData });
    if (undoStackRef.current.length > MAX_UNDO) undoStackRef.current.shift();
    redoStackRef.current = [];
  }, [getActiveLayerId]);

  const undo = useCallback(() => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    const lc = layerCanvasesRef.current[entry.layerId];
    if (!lc) return;
    const lctx = lc.getContext("2d");
    redoStackRef.current.push({
      layerId: entry.layerId,
      imageData: lctx.getImageData(0, 0, WORLD_W, WORLD_H),
    });
    lctx.putImageData(entry.imageData, 0, 0);
    scheduleRedraw();
    if (isConnected && broadcastUndo) broadcastUndo();
  }, [isConnected, broadcastUndo, scheduleRedraw]);

  const redo = useCallback(() => {
    const entry = redoStackRef.current.pop();
    if (!entry) return;
    const lc = layerCanvasesRef.current[entry.layerId];
    if (!lc) return;
    const lctx = lc.getContext("2d");
    undoStackRef.current.push({
      layerId: entry.layerId,
      imageData: lctx.getImageData(0, 0, WORLD_W, WORLD_H),
    });
    lctx.putImageData(entry.imageData, 0, 0);
    scheduleRedraw();
  }, [scheduleRedraw]);

  // ── Drawing primitives ────────────────────────────────────────────────────────
  const getActiveCtx = useCallback(() => {
    const id = getActiveLayerId();
    if (!id) return null;
    const lc = layerCanvasesRef.current[id];
    return lc ? lc.getContext("2d") : null;
  }, [getActiveLayerId]);

  const drawPathToCtx = useCallback((ctx, pts, opts) => {
    const { color: c, width: w, opacity: op, erase, brushType: bt } = opts;
    if (!ctx || !pts || pts.length < 2) return;
    if (bt === "airbrush" && !erase) {
      renderAirbrush(ctx, pts, c, w * 2, op);
      return;
    }
    let sw = w,
      alpha = op,
      comp = "source-over",
      ss = c;
    if (erase) {
      comp = "destination-out";
      ss = "rgba(0,0,0,1)";
      sw = w * 2.5;
      alpha = 1;
    } else
      switch (bt) {
        case "pencil":
          alpha = op * 0.55;
          sw = w * 0.8;
          break;
        case "marker":
          alpha = op * 0.85;
          sw = w * 1.4;
          break;
        case "watercolor":
          alpha = op * 0.12;
          sw = w * 1.3;
          break;
      }
    renderSmoothPath(ctx, pts, ss, sw, alpha, comp);
    if (bt === "watercolor" && !erase)
      renderSmoothPath(ctx, pts, ss, sw * 1.8, alpha * 0.4, comp);
  }, []);

  const clearOverlay = useCallback(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    ov.getContext("2d").clearRect(0, 0, WORLD_W, WORLD_H);
  }, []);

  const commitStroke = useCallback(
    (pts, opts) => {
      const ctx = getActiveCtx();
      if (!ctx) return;
      drawPathToCtx(ctx, pts, opts);
      const sm = symmetryModeRef.current;
      if (sm && !opts.erase) {
        const mirrors = [];
        if (sm === "h" || sm === "both")
          mirrors.push(pts.map((p) => ({ x: WORLD_W - p.x, y: p.y })));
        if (sm === "v" || sm === "both")
          mirrors.push(pts.map((p) => ({ x: p.x, y: WORLD_H - p.y })));
        if (sm === "both")
          mirrors.push(
            pts.map((p) => ({ x: WORLD_W - p.x, y: WORLD_H - p.y })),
          );
        for (const mp of mirrors) drawPathToCtx(ctx, mp, opts);
      }
    },
    [getActiveCtx, drawPathToCtx],
  );

  // ── Smoothing ─────────────────────────────────────────────────────────────────
  const getSmoothedPt = useCallback((rawPt) => {
    const K =
      smoothingRef.current <= 0 ? 1 : Math.ceil(smoothingRef.current / 8);
    smoothBufRef.current.push(rawPt);
    if (smoothBufRef.current.length > K) smoothBufRef.current.shift();
    const buf = smoothBufRef.current;
    return {
      x: buf.reduce((s, p) => s + p.x, 0) / buf.length,
      y: buf.reduce((s, p) => s + p.y, 0) / buf.length,
    };
  }, []);

  const getPressureWidth = useCallback((base) => {
    if (!simulatePressureRef.current) return base;
    const now = performance.now();
    const dt = Math.max(now - lastTimeRef.current, 1);
    lastTimeRef.current = now;
    const speed = lastDistRef.current / dt;
    lastDistRef.current = 0;
    return base * clamp(1 - speed * 0.08, 0.4, 2.0);
  }, []);

  // ── Wheel zoom ────────────────────────────────────────────────────────────────
  const onWheel = useCallback(
    (e) => {
      e.preventDefault();
      const { scale, offsetX, offsetY } = transformRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      const sx = e.clientX - (rect?.left ?? 0),
        sy = e.clientY - (rect?.top ?? 0);
      const wx = (sx - offsetX) / scale,
        wy = (sy - offsetY) / scale;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const ns = clamp(scale * delta, MIN_SCALE, MAX_SCALE);
      transformRef.current = {
        scale: ns,
        offsetX: sx - wx * ns,
        offsetY: sy - wy * ns,
      };
      setZoom(ns);
      scheduleRedraw();
    },
    [scheduleRedraw],
  );

  // ── Pointer Down ──────────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      const nx = e.clientX - (rect?.left ?? 0),
        ny = e.clientY - (rect?.top ?? 0);
      pointerCacheRef.current.set(e.pointerId, { clientX: nx, clientY: ny });

      if (pointerCacheRef.current.size === 2) {
        isPinchingRef.current = true;
        isDrawingRef.current = false;
        clearOverlay();
        scheduleRedraw();
        const pts = [...pointerCacheRef.current.values()];
        lastPinchDistRef.current = ptDist(pts[0], pts[1]);
        lastPinchMidRef.current = ptMid(pts[0], pts[1]);
        return;
      }
      if (pointerCacheRef.current.size > 1) return;

      const { x: wx, y: wy } = screenToWorld(nx, ny);
      const t = toolRef.current;

      if (t === "text") {
        const ns = { active: true, x: wx, y: wy, value: "" };
        textStateRef.current = ns;
        setTextState(ns);
        return;
      }

      if (t === "fill") {
        pushUndo();
        const id = getActiveLayerId();
        if (!id) return;
        const lc = layerCanvasesRef.current[id];
        if (!lc) return;
        const lctx = lc.getContext("2d");
        const imgData = lctx.getImageData(0, 0, WORLD_W, WORLD_H);
        floodFill(
          imgData,
          wx,
          wy,
          hexToRgb(colorRef.current),
          fillToleranceRef.current,
        );
        lctx.putImageData(imgData, 0, 0);
        scheduleRedraw();
        return;
      }

      if (t === "eyedropper") {
        const tmp = document.createElement("canvas");
        tmp.width = WORLD_W;
        tmp.height = WORLD_H;
        const tctx = tmp.getContext("2d");
        tctx.fillStyle = BG_COLOR;
        tctx.fillRect(0, 0, WORLD_W, WORLD_H);
        const ls = layersRef.current;
        if (ls) {
          for (const l of ls) {
            if (!l.visible) continue;
            const lc = layerCanvasesRef.current[l.id];
            if (lc) {
              tctx.globalAlpha = l.opacity;
              tctx.drawImage(lc, 0, 0);
            }
          }
        }
        tctx.globalAlpha = 1;
        const px = Math.floor(wx),
          py = Math.floor(wy);
        if (px >= 0 && px < WORLD_W && py >= 0 && py < WORLD_H) {
          const d = tctx.getImageData(px, py, 1, 1).data;
          onColorPicked?.(rgbToHex(d[0], d[1], d[2]));
        }
        return;
      }

      if (t === "shape") {
        pushUndo();
        shapeStartRef.current = { x: wx, y: wy };
        shapeShiftRef.current = e.shiftKey;
        isDrawingRef.current = true;
        canvasRef.current?.setPointerCapture(e.pointerId);
        return;
      }

      if (t === "lasso") {
        lassoRef.current = [{ x: wx, y: wy }];
        isDrawingRef.current = true;
        clearOverlay();
        canvasRef.current?.setPointerCapture(e.pointerId);
        return;
      }

      pushUndo();
      isDrawingRef.current = true;
      currentPtsRef.current = [{ x: wx, y: wy }];
      smoothBufRef.current = [{ x: wx, y: wy }];
      prevPtRef.current = { x: wx, y: wy };
      lastTimeRef.current = performance.now();
      lastDistRef.current = 0;
      clearOverlay();
      canvasRef.current?.setPointerCapture(e.pointerId);
    },
    [
      screenToWorld,
      pushUndo,
      getActiveLayerId,
      clearOverlay,
      scheduleRedraw,
      onColorPicked,
    ],
  );

  // ── Pointer Move ──────────────────────────────────────────────────────────────
  const onPointerMove = useCallback(
    (e) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      const nx = e.clientX - (rect?.left ?? 0),
        ny = e.clientY - (rect?.top ?? 0);
      pointerCacheRef.current.set(e.pointerId, { clientX: nx, clientY: ny });

      if (isPinchingRef.current && pointerCacheRef.current.size === 2) {
        const pts = [...pointerCacheRef.current.values()];
        const newDist = ptDist(pts[0], pts[1]),
          newMid = ptMid(pts[0], pts[1]);
        const { scale, offsetX, offsetY } = transformRef.current;
        const ratio = newDist / (lastPinchDistRef.current || newDist);
        const ns = clamp(scale * ratio, MIN_SCALE, MAX_SCALE);
        const wx = (newMid.x - offsetX) / scale,
          wy = (newMid.y - offsetY) / scale;
        const panDx = newMid.x - lastPinchMidRef.current.x,
          panDy = newMid.y - lastPinchMidRef.current.y;
        transformRef.current = {
          scale: ns,
          offsetX: newMid.x - wx * ns + panDx * 0.3,
          offsetY: newMid.y - wy * ns + panDy * 0.3,
        };
        setZoom(ns);
        lastPinchDistRef.current = newDist;
        lastPinchMidRef.current = newMid;
        scheduleRedraw();
        return;
      }

      if (!isDrawingRef.current) return;
      const { x: wx, y: wy } = screenToWorld(nx, ny);
      const t = toolRef.current;

      if (t === "shape" && shapeStartRef.current) {
        const ov = overlayRef.current?.getContext("2d");
        if (ov) {
          ov.clearRect(0, 0, WORLD_W, WORLD_H);
          drawShapeOnCtx(
            ov,
            shapeTypeRef.current,
            shapeStartRef.current.x,
            shapeStartRef.current.y,
            wx,
            wy,
            colorRef.current,
            strokeWidthRef.current,
            e.shiftKey || shapeShiftRef.current,
          );
          scheduleRedraw();
        }
        return;
      }

      if (t === "lasso") {
        lassoRef.current.push({ x: wx, y: wy });
        const ov = overlayRef.current?.getContext("2d");
        if (ov) {
          ov.clearRect(0, 0, WORLD_W, WORLD_H);
          ov.save();
          ov.strokeStyle = "rgba(140,185,224,0.8)";
          ov.lineWidth = 1.5;
          ov.setLineDash([5, 5]);
          ov.beginPath();
          const lpts = lassoRef.current;
          ov.moveTo(lpts[0].x, lpts[0].y);
          for (let i = 1; i < lpts.length; i++) ov.lineTo(lpts[i].x, lpts[i].y);
          ov.stroke();
          ov.restore();
          scheduleRedraw();
        }
        return;
      }

      const rawPt = { x: wx, y: wy };
      const pt = getSmoothedPt(rawPt);
      const prev = prevPtRef.current;
      if (prev) lastDistRef.current += Math.hypot(pt.x - prev.x, pt.y - prev.y);
      const w = getPressureWidth(strokeWidthRef.current);

      if (t === "smudge") {
        const lc = layerCanvasesRef.current[getActiveLayerId()];
        if (lc && prev) {
          const lctx = lc.getContext("2d");
          const r = Math.ceil(strokeWidthRef.current * 1.5);
          const x0 = Math.max(0, Math.floor(prev.x - r)),
            y0 = Math.max(0, Math.floor(prev.y - r));
          const pw = Math.min(r * 2, WORLD_W - x0),
            ph = Math.min(r * 2, WORLD_H - y0);
          if (pw > 0 && ph > 0) {
            const patch = lctx.getImageData(x0, y0, pw, ph);
            const tmp = document.createElement("canvas");
            tmp.width = pw;
            tmp.height = ph;
            tmp.getContext("2d").putImageData(patch, 0, 0);
            lctx.save();
            lctx.globalAlpha = 0.35;
            lctx.drawImage(tmp, Math.floor(pt.x - r), Math.floor(pt.y - r));
            lctx.restore();
          }
        }
        prevPtRef.current = pt;
        scheduleRedraw();
        return;
      }

      if (t === "blur") {
        const lc = layerCanvasesRef.current[getActiveLayerId()];
        if (lc) {
          const lctx = lc.getContext("2d");
          const r = Math.ceil(strokeWidthRef.current * 1.5);
          const x0 = Math.max(0, Math.floor(pt.x - r)),
            y0 = Math.max(0, Math.floor(pt.y - r));
          const rw = Math.min(r * 2, WORLD_W - x0),
            rh = Math.min(r * 2, WORLD_H - y0);
          if (rw > 0 && rh > 0) {
            const patch = lctx.getImageData(x0, y0, rw, rh);
            const d = patch.data,
              out = new Uint8ClampedArray(d.length);
            for (let py = 0; py < rh; py++)
              for (let px = 0; px < rw; px++) {
                let ra = 0,
                  ga = 0,
                  ba = 0,
                  aa = 0,
                  cnt = 0;
                for (let ky = -1; ky <= 1; ky++)
                  for (let kx = -1; kx <= 1; kx++) {
                    const nx2 = px + kx,
                      ny2 = py + ky;
                    if (nx2 >= 0 && nx2 < rw && ny2 >= 0 && ny2 < rh) {
                      const ki = (ny2 * rw + nx2) * 4;
                      ra += d[ki];
                      ga += d[ki + 1];
                      ba += d[ki + 2];
                      aa += d[ki + 3];
                      cnt++;
                    }
                  }
                const oi = (py * rw + px) * 4;
                out[oi] = ra / cnt;
                out[oi + 1] = ga / cnt;
                out[oi + 2] = ba / cnt;
                out[oi + 3] = aa / cnt;
              }
            patch.data.set(out);
            lctx.putImageData(patch, x0, y0);
          }
        }
        prevPtRef.current = pt;
        scheduleRedraw();
        return;
      }

      currentPtsRef.current.push(pt);
      const ov = overlayRef.current?.getContext("2d");
      if (ov) {
        ov.clearRect(0, 0, WORLD_W, WORLD_H);
        const opts = {
          color: colorRef.current,
          width: w,
          opacity: brushOpacityRef.current,
          erase: t === "eraser",
          brushType: brushTypeRef.current,
        };
        drawPathToCtx(ov, currentPtsRef.current, opts);
        const sm = symmetryModeRef.current;
        if (sm && !opts.erase) {
          const mpts = currentPtsRef.current;
          if (sm === "h" || sm === "both")
            drawPathToCtx(
              ov,
              mpts.map((p) => ({ x: WORLD_W - p.x, y: p.y })),
              opts,
            );
          if (sm === "v" || sm === "both")
            drawPathToCtx(
              ov,
              mpts.map((p) => ({ x: p.x, y: WORLD_H - p.y })),
              opts,
            );
          if (sm === "both")
            drawPathToCtx(
              ov,
              mpts.map((p) => ({ x: WORLD_W - p.x, y: WORLD_H - p.y })),
              opts,
            );
        }
      }
      prevPtRef.current = pt;
      scheduleRedraw();
    },
    [
      screenToWorld,
      getSmoothedPt,
      getPressureWidth,
      getActiveLayerId,
      drawPathToCtx,
      scheduleRedraw,
    ],
  );

  // ── Pointer Up ────────────────────────────────────────────────────────────────
  const onPointerUp = useCallback(
    (e) => {
      e?.preventDefault?.();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (e) pointerCacheRef.current.delete(e.pointerId);
      if (pointerCacheRef.current.size < 2) isPinchingRef.current = false;
      if (pointerCacheRef.current.size === 1) return;
      if (!isDrawingRef.current) {
        isDrawingRef.current = false;
        return;
      }
      isDrawingRef.current = false;
      clearOverlay();
      const t = toolRef.current;

      if (t === "shape" && shapeStartRef.current) {
        const nx = (e?.clientX ?? 0) - (rect?.left ?? 0),
          ny = (e?.clientY ?? 0) - (rect?.top ?? 0);
        const { x: wx, y: wy } = screenToWorld(nx, ny);
        const ctx = getActiveCtx();
        if (ctx)
          drawShapeOnCtx(
            ctx,
            shapeTypeRef.current,
            shapeStartRef.current.x,
            shapeStartRef.current.y,
            wx,
            wy,
            colorRef.current,
            strokeWidthRef.current,
            e?.shiftKey || shapeShiftRef.current,
          );
        shapeStartRef.current = null;
        scheduleRedraw();
        return;
      }

      if (t === "lasso") {
        const lpts = lassoRef.current;
        if (lpts.length > 3) {
          const xs = lpts.map((p) => p.x),
            ys = lpts.map((p) => p.y);
          const bounds = {
            x: Math.min(...xs),
            y: Math.min(...ys),
            w: Math.max(...xs) - Math.min(...xs),
            h: Math.max(...ys) - Math.min(...ys),
          };
          lassoPathRef.current = lpts;
          setSelectionState({ active: true, bounds });
          const ov = overlayRef.current?.getContext("2d");
          if (ov) {
            ov.clearRect(0, 0, WORLD_W, WORLD_H);
            ov.save();
            ov.strokeStyle = "#8cb9e0";
            ov.lineWidth = 1.5;
            ov.setLineDash([5, 5]);
            ov.beginPath();
            ov.moveTo(lpts[0].x, lpts[0].y);
            for (let i = 1; i < lpts.length; i++)
              ov.lineTo(lpts[i].x, lpts[i].y);
            ov.closePath();
            ov.stroke();
            ov.restore();
          }
        }
        scheduleRedraw();
        return;
      }

      const pts = currentPtsRef.current;
      if (pts.length > 1) {
        const w = strokeWidthRef.current;
        const opts = {
          color: colorRef.current,
          width: w,
          opacity: brushOpacityRef.current,
          erase: t === "eraser",
          brushType: brushTypeRef.current,
        };
        commitStroke(pts, opts);
        const path = { points: pts, ...opts };
        pathHistoryRef.current.push(path);
        if (isConnected && broadcastStroke) broadcastStroke({ path });
      }
      currentPtsRef.current = [];
      smoothBufRef.current = [];
      scheduleRedraw();
    },
    [
      screenToWorld,
      getActiveCtx,
      commitStroke,
      clearOverlay,
      scheduleRedraw,
      isConnected,
      broadcastStroke,
    ],
  );

  // ── Text ──────────────────────────────────────────────────────────────────────
  const setTextValue = useCallback((v) => {
    const ns = { ...textStateRef.current, value: v };
    textStateRef.current = ns;
    setTextState(ns);
  }, []);

  const commitText = useCallback(() => {
    const { active, x, y, value } = textStateRef.current;
    if (!active || !value.trim()) {
      const ns = { active: false, x: 0, y: 0, value: "" };
      textStateRef.current = ns;
      setTextState(ns);
      return;
    }
    pushUndo();
    const ctx = getActiveCtx();
    if (ctx) {
      const style = `${textItalicRef.current ? "italic " : ""}${textBoldRef.current ? "bold " : ""}${textSizeRef.current}px ${textFontRef.current}`;
      ctx.save();
      ctx.font = style;
      ctx.fillStyle = colorRef.current;
      ctx.globalAlpha = brushOpacityRef.current;
      ctx.fillText(value, x, y + textSizeRef.current);
      ctx.restore();
    }
    const ns = { active: false, x: 0, y: 0, value: "" };
    textStateRef.current = ns;
    setTextState(ns);
    scheduleRedraw();
  }, [pushUndo, getActiveCtx, scheduleRedraw]);

  const cancelText = useCallback(() => {
    const ns = { active: false, x: 0, y: 0, value: "" };
    textStateRef.current = ns;
    setTextState(ns);
  }, []);

  // ── Selection ─────────────────────────────────────────────────────────────────
  const clearSelection = useCallback(() => {
    lassoPathRef.current = null;
    setSelectionState({ active: false, bounds: null });
    clearOverlay();
    scheduleRedraw();
  }, [clearOverlay, scheduleRedraw]);

  const deleteSelection = useCallback(() => {
    const pts = lassoPathRef.current;
    if (!pts || pts.length < 3) return;
    pushUndo();
    const ctx = getActiveCtx();
    if (ctx) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    clearSelection();
  }, [pushUndo, getActiveCtx, clearSelection]);

  // ── Zoom controls ─────────────────────────────────────────────────────────────
  const applyZoom = useCallback(
    (ns, cx, cy) => {
      const { scale, offsetX, offsetY } = transformRef.current;
      cx = cx ?? canvasRef.current?.width / 2 ?? 0;
      cy = cy ?? canvasRef.current?.height / 2 ?? 0;
      const wx = (cx - offsetX) / scale,
        wy = (cy - offsetY) / scale;
      const s = clamp(ns, MIN_SCALE, MAX_SCALE);
      transformRef.current = {
        scale: s,
        offsetX: cx - wx * s,
        offsetY: cy - wy * s,
      };
      setZoom(s);
      scheduleRedraw();
    },
    [scheduleRedraw],
  );

  const zoomIn = useCallback(
    () => applyZoom(transformRef.current.scale * 1.25),
    [applyZoom],
  );
  const zoomOut = useCallback(
    () => applyZoom(transformRef.current.scale * 0.8),
    [applyZoom],
  );
  const resetZoom = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    transformRef.current = {
      scale: 1,
      offsetX: (c.width - WORLD_W) / 2,
      offsetY: (c.height - WORLD_H) / 2,
    };
    setZoom(1);
    scheduleRedraw();
  }, [scheduleRedraw]);
  const fitToScreen = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const s = Math.min(c.width / WORLD_W, c.height / WORLD_H) * 0.92;
    transformRef.current = {
      scale: s,
      offsetX: (c.width - WORLD_W * s) / 2,
      offsetY: (c.height - WORLD_H * s) / 2,
    };
    setZoom(s);
    scheduleRedraw();
  }, [scheduleRedraw]);

  // ── Clear ─────────────────────────────────────────────────────────────────────
  const clear = useCallback(() => {
    pushUndo();
    const ls = layersRef.current;
    if (ls) {
      for (const l of ls) {
        const lc = layerCanvasesRef.current[l.id];
        if (!lc) continue;
        const lctx = lc.getContext("2d");
        lctx.clearRect(0, 0, WORLD_W, WORLD_H);
        if (l.id === ls[0]?.id) {
          lctx.fillStyle = BG_COLOR;
          lctx.fillRect(0, 0, WORLD_W, WORLD_H);
        }
      }
    }
    pathHistoryRef.current = [];
    clearOverlay();
    scheduleRedraw();
    if (isConnected && broadcastClear) broadcastClear();
  }, [pushUndo, clearOverlay, scheduleRedraw, isConnected, broadcastClear]);

  // ── Export ────────────────────────────────────────────────────────────────────
  const exportPng = useCallback(() => {
    const tmp = document.createElement("canvas");
    tmp.width = WORLD_W;
    tmp.height = WORLD_H;
    const tctx = tmp.getContext("2d");
    tctx.fillStyle = BG_COLOR;
    tctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const ls = layersRef.current;
    if (ls) {
      for (const l of ls) {
        if (!l.visible) continue;
        const lc = layerCanvasesRef.current[l.id];
        if (lc) {
          tctx.globalAlpha = l.opacity;
          tctx.drawImage(lc, 0, 0);
        }
      }
    }
    tctx.globalAlpha = 1;
    return tmp.toDataURL("image/png");
  }, []);

  // ── Import image ──────────────────────────────────────────────────────────────
  const importImage = useCallback(
    (dataUrl, wx = 0, wy = 0) => {
      pushUndo();
      const img = new Image();
      img.onload = () => {
        const ctx = getActiveCtx();
        if (ctx) {
          ctx.drawImage(img, wx, wy);
          scheduleRedraw();
        }
      };
      img.src = dataUrl;
    },
    [pushUndo, getActiveCtx, scheduleRedraw],
  );

  // ── Flip layer ────────────────────────────────────────────────────────────────
  const flipLayerH = useCallback(
    (layerId) => {
      const lc = layerCanvasesRef.current[layerId];
      if (!lc) return;
      pushUndo();
      const lctx = lc.getContext("2d");
      const tmp = document.createElement("canvas");
      tmp.width = WORLD_W;
      tmp.height = WORLD_H;
      const tctx = tmp.getContext("2d");
      tctx.translate(WORLD_W, 0);
      tctx.scale(-1, 1);
      tctx.drawImage(lc, 0, 0);
      lctx.clearRect(0, 0, WORLD_W, WORLD_H);
      lctx.drawImage(tmp, 0, 0);
      scheduleRedraw();
    },
    [pushUndo, scheduleRedraw],
  );

  const flipLayerV = useCallback(
    (layerId) => {
      const lc = layerCanvasesRef.current[layerId];
      if (!lc) return;
      pushUndo();
      const lctx = lc.getContext("2d");
      const tmp = document.createElement("canvas");
      tmp.width = WORLD_W;
      tmp.height = WORLD_H;
      const tctx = tmp.getContext("2d");
      tctx.translate(0, WORLD_H);
      tctx.scale(1, -1);
      tctx.drawImage(lc, 0, 0);
      lctx.clearRect(0, 0, WORLD_W, WORLD_H);
      lctx.drawImage(tmp, 0, 0);
      scheduleRedraw();
    },
    [pushUndo, scheduleRedraw],
  );

  // ── Collaboration ─────────────────────────────────────────────────────────────
  const getPaths = useCallback(() => pathHistoryRef.current, []);
  const loadPaths = useCallback(
    (paths) => {
      if (!paths) return;
      pathHistoryRef.current = paths;
      const ls = layersRef.current;
      const layerId = ls?.[0]?.id;
      if (!layerId) return;
      const lc = ensureLayerCanvas(layerId);
      const lctx = lc.getContext("2d");
      lctx.fillStyle = BG_COLOR;
      lctx.fillRect(0, 0, WORLD_W, WORLD_H);
      for (const p of paths) drawPathToCtx(lctx, p.points, p);
      scheduleRedraw();
    },
    [ensureLayerCanvas, drawPathToCtx, scheduleRedraw],
  );

  const applyRemoteStroke = useCallback(
    (path) => {
      const ls = layersRef.current;
      const layerId = ls?.[0]?.id;
      if (!layerId) return;
      const lc = ensureLayerCanvas(layerId);
      const lctx = lc.getContext("2d");
      drawPathToCtx(lctx, path.points, { ...path, remote: true });
      pathHistoryRef.current.push({ ...path, remote: true });
      scheduleRedraw();
    },
    [ensureLayerCanvas, drawPathToCtx, scheduleRedraw],
  );

  const applyRemoteClear = useCallback(() => {
    const ls = layersRef.current;
    if (!ls) return;
    for (const l of ls) {
      const lc = layerCanvasesRef.current[l.id];
      if (!lc) continue;
      const lctx = lc.getContext("2d");
      lctx.clearRect(0, 0, WORLD_W, WORLD_H);
      if (l.id === ls[0]?.id) {
        lctx.fillStyle = BG_COLOR;
        lctx.fillRect(0, 0, WORLD_W, WORLD_H);
      }
    }
    pathHistoryRef.current = [];
    scheduleRedraw();
  }, [scheduleRedraw]);

  const applyRemoteUndo = useCallback(() => {
    const idx = [...pathHistoryRef.current]
      .reverse()
      .findIndex((p) => p.remote);
    if (idx === -1) return;
    pathHistoryRef.current.splice(pathHistoryRef.current.length - 1 - idx, 1);
    loadPaths(pathHistoryRef.current);
  }, [loadPaths]);

  return {
    canvasRef,
    initCanvas,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    undo,
    redo,
    clear,
    exportPng,
    getPaths,
    loadPaths,
    applyRemoteStroke,
    applyRemoteClear,
    applyRemoteUndo,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    getLayerCanvas,
    initLayerCanvas,
    deleteLayerCanvas,
    flipLayerH,
    flipLayerV,
    textState,
    setTextValue,
    commitText,
    cancelText,
    selectionState,
    clearSelection,
    deleteSelection,
    importImage,
    scheduleRedraw,
  };
}
