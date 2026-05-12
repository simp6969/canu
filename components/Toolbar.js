"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Save,
  History,
  Users,
  LogIn,
} from "lucide-react";

// Styles that match shadcn ghost icon button — applied directly to TooltipTrigger
// so we never nest <button> inside <button>
const triggerCls = cn(
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
  "text-[#8cb9e0]/70 transition-all duration-150",
  "hover:bg-[#8cb9e0]/10 hover:text-[#8cb9e0]",
  "active:scale-95",
  "disabled:pointer-events-none disabled:opacity-40"
);

function ToolBtn({ tooltip, active, onClick, children, disabled = false }) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        disabled={disabled}
        className={cn(triggerCls, active && "bg-[#8cb9e0]/15 text-[#8cb9e0] shadow-[0_0_12px_rgba(140,185,224,0.2)]")}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-[#141832] border border-[#8cb9e0]/15 text-[#8cb9e0] text-xs"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export default function Toolbar({
  color,
  onColorClick,
  eraseMode,
  onEraserToggle,
  strokeWidth,
  onStrokeWidthChange,
  onClear,
  onUndo,
  onRedo,
  onDownload,
  onSave,
  onHistoryOpen,
  onRoomOpen,
  onSignUp,
  isSignedIn,
  isInRoom,
  roomCode,
  showStrokeSlider,
  onStrokeSliderToggle,
}) {
  const dotSize = Math.max(6, Math.min(strokeWidth || 4, 18));

  return (
    <div className="floating-toolbar">
      {/* Color swatch */}
      <ToolBtn tooltip="Color picker" onClick={onColorClick}>
        <span
          className="block rounded-full border-2 border-[#8cb9e0]/30 transition-transform hover:scale-110"
          style={{ background: color, width: 20, height: 20 }}
        />
      </ToolBtn>

      {/* Eraser */}
      <ToolBtn tooltip={eraseMode ? "Draw mode" : "Eraser"} active={eraseMode} onClick={onEraserToggle}>
        <Eraser size={17} />
      </ToolBtn>

      {/* Stroke width toggle */}
      <ToolBtn tooltip="Stroke width" active={showStrokeSlider} onClick={onStrokeSliderToggle}>
        <span
          className="block rounded-full bg-[#8cb9e0] transition-all"
          style={{ width: dotSize, height: dotSize }}
        />
      </ToolBtn>

      {/* Stroke width slider — inline when open */}
      {showStrokeSlider && (
        <div className="flex items-center gap-2 px-1">
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            className="w-24 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              accentColor: "#8cb9e0",
              background: `linear-gradient(to right, #8cb9e0 ${((strokeWidth - 1) / 19) * 100}%, rgba(140,185,224,0.15) 0%)`,
            }}
          />
          <span className="text-[11px] text-[#8cb9e0]/50 font-mono w-5 text-right">
            {strokeWidth}
          </span>
        </div>
      )}

      {/* Clear */}
      <ToolBtn tooltip="Clear canvas" onClick={onClear}>
        <Trash2 size={17} />
      </ToolBtn>

      <div className="toolbar-divider" />

      {/* Room — signed-in only */}
      {isSignedIn && (
        <>
          <ToolBtn
            tooltip={isInRoom ? `Room: ${roomCode}` : "Create / Join room"}
            active={isInRoom}
            onClick={onRoomOpen}
          >
            <Users size={17} />
          </ToolBtn>
          <div className="toolbar-divider" />
        </>
      )}

      {/* Undo / Redo */}
      <ToolBtn tooltip="Undo  Ctrl+Z" onClick={onUndo}>
        <Undo2 size={17} />
      </ToolBtn>
      <ToolBtn tooltip="Redo  Ctrl+Y" onClick={onRedo}>
        <Redo2 size={17} />
      </ToolBtn>

      <div className="toolbar-divider" />

      {/* Download */}
      <ToolBtn tooltip="Download image" onClick={onDownload}>
        <Download size={17} />
      </ToolBtn>

      {/* Save + History — signed-in only */}
      {isSignedIn && (
        <>
          <ToolBtn tooltip="Save drawing" onClick={onSave}>
            <Save size={17} />
          </ToolBtn>
          <ToolBtn tooltip="Drawing history" onClick={onHistoryOpen}>
            <History size={17} />
          </ToolBtn>
        </>
      )}

      {/* Sign-up — signed out only */}
      {!isSignedIn && (
        <>
          <div className="toolbar-divider" />
          <ToolBtn tooltip="Sign up to collaborate" onClick={onSignUp}>
            <LogIn size={17} />
          </ToolBtn>
        </>
      )}
    </div>
  );
}
