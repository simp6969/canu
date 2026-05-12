"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  MoreHorizontal,
  Pen,
} from "lucide-react";
import { HexColorPicker, HexColorInput } from "react-colorful";

// Styles that match shadcn ghost icon button — applied directly to TooltipTrigger
// so we never nest <button> inside <button>
const triggerCls = cn(
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
  "text-[#8cb9e0]/70 transition-all duration-150",
  "hover:bg-[#8cb9e0]/10 hover:text-[#8cb9e0]",
  "active:scale-95",
  "disabled:pointer-events-none disabled:opacity-40",
);

function ToolBtn({ tooltip, active, onClick, children, disabled = false }) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        disabled={disabled}
        className={cn(
          triggerCls,
          active &&
            "bg-[#8cb9e0]/15 text-[#8cb9e0] shadow-[0_0_12px_rgba(140,185,224,0.2)]",
        )}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-[#141832] border border-[#8cb9e0]/15 text-[#8cb9e0] text-xs z-[200]"
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
  userAvatar,
}) {
  const dotSize = Math.max(6, Math.min(strokeWidth || 4, 18));

  const renderSecondaryTools = (inPopover = false) => (
    <>
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
          {!inPopover && <div className="toolbar-divider" />}
        </>
      )}

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
          {!inPopover && <div className="toolbar-divider" />}
          <ToolBtn tooltip="Sign up to collaborate" onClick={onSignUp}>
            <LogIn size={17} />
          </ToolBtn>
        </>
      )}
    </>
  );

  return (
    <div className="floating-toolbar">
      {/* Color swatch */}
      <Dialog>
        <DialogTrigger
          className={cn(
            "flex shrink-0 items-center justify-center w-9 h-10 gap-[20px] rounded-lg hover:bg-[#8cb9e0]/10 transition-all active:scale-95",
          )}
        >
          <span
            className="block rounded-full border-2 border-[#8cb9e0]/30 transition-transform hover:scale-110"
            style={{ background: color, width: 20, height: 20 }}
          />
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-xs bg-[#141832]/95 backdrop-blur-xl border-[#8cb9e0]/20 shadow-2xl flex flex-col items-center p-6 pt-10 z-[250]"
          showCloseButton={true}
        >
          <DialogTitle className="sr-only">Color Picker</DialogTitle>
          <DialogDescription className="sr-only">
            Select your drawing color
          </DialogDescription>

          <div className="w-full flex justify-center mb-5 mt-1">
            <HexColorPicker
              color={color}
              onChange={(c) => {
                onColorClick(c);
                onEraserToggle(false);
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-3 w-full bg-[#0d1020]/50 p-2.5 rounded-xl border border-[#8cb9e0]/10 focus-within:border-[#8cb9e0]/40 transition-colors">
            <div
              className="w-6 h-6 rounded-md border border-[#8cb9e0]/40 shadow-inner flex-shrink-0"
              style={{ background: color }}
            />
            <HexColorInput
              color={color}
              onChange={(c) => {
                onColorClick(c);
                onEraserToggle(false);
              }}
              prefixed
              className="w-20 bg-transparent text-sm text-[#8cb9e0]/90 font-mono tracking-wider uppercase outline-none placeholder:text-[#8cb9e0]/30"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Pen */}
      <ToolBtn
        tooltip="Pen"
        active={!eraseMode}
        onClick={() => onEraserToggle(false)}
      >
        <Pen size={17} />
      </ToolBtn>

      {/* Eraser */}
      <ToolBtn
        tooltip="Eraser"
        active={eraseMode}
        onClick={() => onEraserToggle(true)}
      >
        <Eraser size={17} />
      </ToolBtn>

      {/* Stroke width toggle */}
      <ToolBtn
        tooltip="Stroke width"
        active={showStrokeSlider}
        onClick={onStrokeSliderToggle}
      >
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

      {/* Undo / Redo */}
      <ToolBtn tooltip="Undo  Ctrl+Z" onClick={onUndo}>
        <Undo2 size={17} />
      </ToolBtn>
      <ToolBtn tooltip="Redo  Ctrl+Y" onClick={onRedo}>
        <Redo2 size={17} />
      </ToolBtn>

      {/* Clear */}
      <ToolBtn tooltip="Clear canvas" onClick={onClear}>
        <Trash2 size={17} />
      </ToolBtn>

      <div className="toolbar-divider" />

      {/* Desktop: Inline Secondary Tools */}
      <div className="hidden md:flex items-center gap-1.5">
        {renderSecondaryTools(false)}
      </div>

      {/* Mobile: More Menu */}
      <div className="flex md:hidden items-center">
        <Popover>
          <PopoverTrigger className={triggerCls}>
            <MoreHorizontal size={17} />
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={14}
            className="bg-[#141832]/95 backdrop-blur-xl border border-[#8cb9e0]/15 w-auto p-2.5 flex items-center gap-1.5 rounded-2xl shadow-2xl z-[150]"
          >
            {renderSecondaryTools(true)}
          </PopoverContent>
        </Popover>
      </div>

      {userAvatar && (
        <>
          <div className="toolbar-divider" />
          <div className="flex items-center justify-center w-8 h-8 ml-1 scale-90 origin-center flex-shrink-0">
            {userAvatar}
          </div>
        </>
      )}
    </div>
  );
}
