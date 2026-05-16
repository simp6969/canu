"use client";

import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
}) {
  return (
    <div className="zoom-controls">
      <button onClick={onZoomOut} title="Zoom out" className="zoom-btn">
        <ZoomOut size={14} />
      </button>
      <span className="text-[11px] text-[#8cb9e0]/60 font-mono w-12 text-center select-none">
        {Math.round((zoom ?? 1) * 100)}%
      </span>
      <button onClick={onZoomIn} title="Zoom in" className="zoom-btn">
        <ZoomIn size={14} />
      </button>
      <div className="w-px h-4 bg-[#8cb9e0]/15 mx-1" />
      <button
        onClick={onFitToScreen}
        title="Fit to screen"
        className="zoom-btn"
      >
        <Maximize size={14} />
      </button>
      <button
        onClick={onResetZoom}
        title="Reset zoom (100%)"
        className="zoom-btn"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
