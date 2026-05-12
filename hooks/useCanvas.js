"use client";

import { useRef, useCallback } from "react";

export function useCanvas({ color, strokeWidth, eraseMode, isConnected, broadcastStroke, broadcastClear, broadcastUndo }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const pathHistoryRef = useRef([]);
  const currentPathRef = useRef(null);
  const redoStackRef = useRef([]);

  // ── Init canvas (call in onMount) ─────────────────────────────────────────
  const initCanvas = useCallback((canvas) => {
    if (!canvas) return;
    canvasRef.current = canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
    fillBackground(ctx, canvas.width, canvas.height);
  }, []);

  const fillBackground = (ctx, w, h) => {
    ctx.fillStyle = "#0d1020";
    ctx.fillRect(0, 0, w, h);
  };

  const drawPath = useCallback((ctx, path) => {
    if (!path?.points?.length) return;
    ctx.beginPath();
    ctx.strokeStyle = path.erase ? "#0d1020" : path.color;
    ctx.lineWidth = path.erase ? path.width * 2.5 : path.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const pts = path.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }, []);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    fillBackground(ctx, canvas.width, canvas.height);
    for (const p of pathHistoryRef.current) drawPath(ctx, p);
  }, [drawPath]);

  const getPoint = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ── Pointer handlers ──────────────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    const pt = getPoint(e);
    isDrawingRef.current = true;
    redoStackRef.current = [];
    currentPathRef.current = {
      color,
      width: strokeWidth,
      erase: eraseMode,
      points: [pt],
    };
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.strokeStyle = eraseMode ? "#0d1020" : color;
    ctx.lineWidth = eraseMode ? strokeWidth * 2.5 : strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(pt.x, pt.y);
    canvasRef.current.setPointerCapture(e.pointerId);
  }, [color, strokeWidth, eraseMode]);

  const onPointerMove = useCallback((e) => {
    if (!isDrawingRef.current) return;
    const pt = getPoint(e);
    currentPathRef.current.points.push(pt);
    const ctx = ctxRef.current;
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }, []);

  const onPointerUp = useCallback((e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const path = currentPathRef.current;
    if (path?.points?.length > 1) {
      pathHistoryRef.current.push(path);
      if (isConnected) broadcastStroke({ path });
    }
    currentPathRef.current = null;
  }, [isConnected, broadcastStroke]);

  // ── Tool actions ──────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (!pathHistoryRef.current.length) return;
    redoStackRef.current.push(pathHistoryRef.current.pop());
    redrawAll();
    if (isConnected) broadcastUndo();
  }, [redrawAll, isConnected, broadcastUndo]);

  const redo = useCallback(() => {
    if (!redoStackRef.current.length) return;
    const path = redoStackRef.current.pop();
    pathHistoryRef.current.push(path);
    drawPath(ctxRef.current, path);
  }, [drawPath]);

  const clear = useCallback(() => {
    pathHistoryRef.current = [];
    redoStackRef.current = [];
    redrawAll();
    if (isConnected) broadcastClear();
  }, [redrawAll, isConnected, broadcastClear]);

  const exportPng = useCallback(() => canvasRef.current?.toDataURL("image/png"), []);

  const getPaths = useCallback(() => pathHistoryRef.current, []);

  const loadPaths = useCallback((paths) => {
    pathHistoryRef.current = paths || [];
    redoStackRef.current = [];
    redrawAll();
  }, [redrawAll]);

  // ── Remote events ─────────────────────────────────────────────────────────
  const applyRemoteStroke = useCallback((path) => {
    pathHistoryRef.current.push({ ...path, remote: true });
    drawPath(ctxRef.current, path);
  }, [drawPath]);

  const applyRemoteClear = useCallback(() => {
    pathHistoryRef.current = [];
    redoStackRef.current = [];
    redrawAll();
  }, [redrawAll]);

  const applyRemoteUndo = useCallback(() => {
    // Remove last remote stroke
    const idx = [...pathHistoryRef.current].reverse().findIndex(p => p.remote);
    if (idx === -1) return;
    pathHistoryRef.current.splice(pathHistoryRef.current.length - 1 - idx, 1);
    redrawAll();
  }, [redrawAll]);

  return {
    canvasRef,
    initCanvas,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    undo,
    redo,
    clear,
    exportPng,
    getPaths,
    loadPaths,
    applyRemoteStroke,
    applyRemoteClear,
    applyRemoteUndo,
  };
}
