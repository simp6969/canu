"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { HexColorPicker } from "react-colorful";
import { Badge } from "@/components/ui/badge";
import Toolbar from "@/components/Toolbar";
import RoomDialog from "@/components/RoomDialog";
import HistoryDialog from "@/components/HistoryDialog";
import { useRoom } from "@/hooks/useRoom";
import { useDrawingHistory } from "@/hooks/useDrawingHistory";
import { useCanvas } from "@/hooks/useCanvas";

export default function HomePage() {
  const [color, setColor] = useState("#8cb9e0");
  const [eraseMode, setEraseMode] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [showStrokeSlider, setShowStrokeSlider] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const userId = user?.id ?? null;
  const userName = user?.fullName || user?.firstName || "Anonymous";

  const {
    roomCode, isConnected, members, error: roomError,
    createRoom, joinRoom, leaveRoom,
    broadcastStroke, broadcastClear, broadcastUndo,
    onStrokeReceived, onClearReceived, onUndoReceived,
  } = useRoom(userId, userName);

  const {
    history, loading: historyLoading,
    saveDrawing, loadHistory, loadDrawing, deleteDrawing,
  } = useDrawingHistory(userId);

  const {
    canvasRef, initCanvas,
    onPointerDown, onPointerMove, onPointerUp,
    undo, redo, clear, exportPng, getPaths, loadPaths,
    applyRemoteStroke, applyRemoteClear, applyRemoteUndo,
  } = useCanvas({ color, strokeWidth, eraseMode, isConnected, broadcastStroke, broadcastClear, broadcastUndo });

  // ── Init canvas on mount ────────────────────────────────────────────
  // Callback ref fires when the canvas element actually mounts (not on first
  // render which may show the loading spinner instead).
  const canvasCallbackRef = useCallback((el) => {
    if (el) {
      canvasRef.current = el;
      initCanvas(el);
    }
  }, [initCanvas]);

  // ── Remote events ─────────────────────────────────────────────────────────
  useEffect(() => {
    onStrokeReceived(({ path }) => path && applyRemoteStroke(path));
    onClearReceived(() => applyRemoteClear());
    onUndoReceived(() => applyRemoteUndo());
  }, [onStrokeReceived, onClearReceived, onUndoReceived]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Tool handlers ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    const url = exportPng();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = "canu_drawing.png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast("Image downloaded!");
  };

  const handleSave = async () => {
    if (!userId) return;
    const paths = getPaths();
    const thumbnail = exportPng();
    const result = await saveDrawing(paths, thumbnail);
    showToast(result ? "Drawing saved!" : "Failed to save");
  };

  const handleHistoryOpen = async () => {
    setHistoryDialogOpen(true);
    await loadHistory();
  };

  const handleLoadDrawing = async (id) => {
    const paths = await loadDrawing(id);
    if (paths) { loadPaths(paths); setHistoryDialogOpen(false); showToast("Drawing loaded!"); }
  };

  const handleDeleteDrawing = async (id) => {
    await deleteDrawing(id); showToast("Drawing deleted");
  };

  const handleCreateRoom = () => {
    const code = createRoom(); showToast(`Room created: ${code}`);
  };

  const handleJoinRoom = async (code) => {
    const ok = await joinRoom(code);
    if (ok) showToast(`Joined room ${code}`);
  };

  const handleLeaveRoom = () => {
    leaveRoom(); setRoomDialogOpen(false); showToast("Left room");
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code); showToast("Room code copied!");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span className="text-[#8cb9e0]/40 text-sm font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <>
      {/* ── Canvas ── */}
      <canvas
        ref={canvasCallbackRef}
        style={{ display: "block", cursor: eraseMode ? "cell" : "crosshair" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* ── Presence bar ── */}
      {isConnected && (
        <div className="presence-bar">
          <Badge className="bg-[#8cb9e0]/10 text-[#8cb9e0] border-[#8cb9e0]/20 font-mono tracking-wider text-xs">
            {roomCode}
          </Badge>
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m, i) => (
              <div key={m.userId || i} title={m.userName}
                className="w-7 h-7 rounded-full bg-[#8cb9e0]/20 border-2 border-[#141832] flex items-center justify-center text-[10px] text-[#8cb9e0] font-semibold">
                {(m.userName || "?")[0].toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-[11px] text-[#8cb9e0]/40">{members.length}/5</span>
        </div>
      )}

      {/* ── User avatar ── */}
      {isSignedIn && (
        <div style={{ position: "fixed", top: 16, left: 16, zIndex: 110 }}>
          <UserButton />
        </div>
      )}

      {/* ── Color picker ── */}
      {colorPickerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150 }}
          onClick={() => setColorPickerOpen(false)}>
          <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 160 }}
            className="p-4 rounded-2xl bg-[#141832]/95 backdrop-blur-xl border border-[#8cb9e0]/15 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <HexColorPicker color={color} onChange={setColor} />
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-lg border border-[#8cb9e0]/20" style={{ background: color }} />
              <span className="text-xs text-[#8cb9e0]/50 font-mono">{color}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <Toolbar
        color={color}
        onColorClick={() => setColorPickerOpen((o) => !o)}
        eraseMode={eraseMode}
        onEraserToggle={() => setEraseMode((e) => !e)}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        onClear={clear}
        onUndo={undo}
        onRedo={redo}
        onDownload={handleDownload}
        onSave={handleSave}
        onHistoryOpen={handleHistoryOpen}
        onRoomOpen={() => setRoomDialogOpen(true)}
        onSignUp={() => router.push("/sign-up")}
        isSignedIn={isSignedIn}
        isInRoom={isConnected}
        roomCode={roomCode}
        showStrokeSlider={showStrokeSlider}
        onStrokeSliderToggle={() => setShowStrokeSlider((s) => !s)}
      />

      {/* ── Dialogs ── */}
      <RoomDialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}
        roomCode={roomCode} isConnected={isConnected} members={members}
        error={roomError} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom} onCopyCode={handleCopyCode} />

      <HistoryDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}
        history={history} loading={historyLoading}
        onLoadDrawing={handleLoadDrawing} onDeleteDrawing={handleDeleteDrawing} />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
