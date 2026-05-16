"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FlipHorizontal,
  FlipVertical,
  Merge,
} from "lucide-react";
import { cn } from "@/lib/utils";

function LayerRow({
  layer,
  index,
  isActive,
  total,
  onSelect,
  onToggleVisibility,
  onSetOpacity,
  onDelete,
  onRename,
  onMoveUp,
  onMoveDown,
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(layer.name);

  return (
    <div
      onClick={() => onSelect(index)}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all select-none",
        isActive
          ? "bg-[#8cb9e0]/15 border border-[#8cb9e0]/30"
          : "hover:bg-[#8cb9e0]/5 border border-transparent",
      )}
    >
      {/* Visibility */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility(index);
        }}
        className="shrink-0 text-[#8cb9e0]/40 hover:text-[#8cb9e0] transition-colors"
      >
        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Thumbnail placeholder */}
      <div className="w-8 h-6 rounded bg-[#0d1020]/60 border border-[#8cb9e0]/10 shrink-0" />

      {/* Name */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              onRename(index, draftName);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onRename(index, draftName);
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraftName(layer.name);
                setEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-[#8cb9e0] text-xs outline-none border-b border-[#8cb9e0]/40"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className={cn(
              "text-xs truncate block",
              isActive ? "text-[#8cb9e0]" : "text-[#8cb9e0]/60",
            )}
          >
            {layer.name}
          </span>
        )}
      </div>

      {/* Opacity */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={layer.opacity}
        onChange={(e) => {
          e.stopPropagation();
          onSetOpacity(index, Number(e.target.value));
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-12 h-1 appearance-none rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ accentColor: "#8cb9e0" }}
        title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
      />

      {/* Move */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp(index);
          }}
          disabled={index === 0}
          className="text-[#8cb9e0]/40 hover:text-[#8cb9e0] disabled:opacity-20"
        >
          <ChevronUp size={10} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown(index);
          }}
          disabled={index === total - 1}
          className="text-[#8cb9e0]/40 hover:text-[#8cb9e0] disabled:opacity-20"
        >
          <ChevronDown size={10} />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(index);
        }}
        disabled={total <= 1}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/50 hover:text-red-400 disabled:opacity-20"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export default function LayersPanel({
  layers,
  activeLayerIndex,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onSetOpacity,
  onRenameLayer,
  onSetActiveLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onFlipLayerH,
  onFlipLayerV,
  onMergeLayerDown,
  open,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="layers-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#8cb9e0] text-sm font-semibold">Layers</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onFlipLayerH}
            title="Flip H"
            className="p-1 text-[#8cb9e0]/50 hover:text-[#8cb9e0] transition-colors"
          >
            <FlipHorizontal size={13} />
          </button>
          <button
            onClick={onFlipLayerV}
            title="Flip V"
            className="p-1 text-[#8cb9e0]/50 hover:text-[#8cb9e0] transition-colors"
          >
            <FlipVertical size={13} />
          </button>
          <button
            onClick={() => onMergeLayerDown(activeLayerIndex)}
            title="Merge down"
            className="p-1 text-[#8cb9e0]/50 hover:text-[#8cb9e0] transition-colors"
            disabled={activeLayerIndex >= layers.length - 1}
          >
            <Merge size={13} />
          </button>
          <button
            onClick={onAddLayer}
            title="Add layer"
            className="p-1 text-[#8cb9e0]/70 hover:text-[#8cb9e0] transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Layer list — reversed so top layer is at top */}
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {[...layers].reverse().map((layer, revIdx) => {
          const index = layers.length - 1 - revIdx;
          return (
            <LayerRow
              key={layer.id}
              layer={layer}
              index={index}
              isActive={index === activeLayerIndex}
              total={layers.length}
              onSelect={onSetActiveLayer}
              onToggleVisibility={onToggleVisibility}
              onSetOpacity={onSetOpacity}
              onDelete={onDeleteLayer}
              onRename={onRenameLayer}
              onMoveUp={onMoveLayerUp}
              onMoveDown={onMoveLayerDown}
            />
          );
        })}
      </div>

      {/* Active layer opacity */}
      <div className="mt-3 pt-3 border-t border-[#8cb9e0]/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#8cb9e0]/50 uppercase tracking-wider">
            Opacity
          </span>
          <span className="text-[11px] text-[#8cb9e0]/70 font-mono">
            {Math.round((layers[activeLayerIndex]?.opacity ?? 1) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={layers[activeLayerIndex]?.opacity ?? 1}
          onChange={(e) =>
            onSetOpacity(activeLayerIndex, Number(e.target.value))
          }
          className="w-full h-1 appearance-none rounded cursor-pointer"
          style={{ accentColor: "#8cb9e0" }}
        />
      </div>
    </div>
  );
}
