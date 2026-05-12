"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, LogOut, Users, Loader2 } from "lucide-react";

export default function RoomDialog({
  open,
  onOpenChange,
  roomCode,
  isConnected,
  members,
  error,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onCopyCode,
}) {
  const [joinCode, setJoinCode] = useState("");

  const handleJoin = () => {
    if (joinCode.length === 6) {
      onJoinRoom(joinCode.toUpperCase());
      setJoinCode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#141832]/95 backdrop-blur-xl border-[#8cb9e0]/15">
        <DialogHeader>
          <DialogTitle className="text-[#8cb9e0]">
            {isConnected ? "Room Connected" : "Create or Join Room"}
          </DialogTitle>
          <DialogDescription className="text-[#8cb9e0]/50">
            {isConnected
              ? "Share this code with others to draw together"
              : "Create a new room or enter a 6-character code to join"}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4">
            {/* Room code display */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0d1020] border border-[#8cb9e0]/10">
              <span className="room-code text-lg">{roomCode}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopyCode(roomCode)}
                className="text-[#8cb9e0]/60 hover:text-[#8cb9e0] hover:bg-[#8cb9e0]/10"
              >
                <Copy size={16} />
              </Button>
            </div>

            {/* Members */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#8cb9e0]/60">
                <Users size={14} />
                <span>{members.length} / 5 connected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map((m, i) => (
                  <Badge
                    key={m.userId || i}
                    variant="secondary"
                    className="bg-[#8cb9e0]/10 text-[#8cb9e0]/80 border-[#8cb9e0]/15"
                  >
                    {m.userName || "Anonymous"}
                  </Badge>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Create room */}
            <Button
              onClick={onCreateRoom}
              className="w-full bg-[#8cb9e0]/15 text-[#8cb9e0] border border-[#8cb9e0]/20 hover:bg-[#8cb9e0]/25 hover:border-[#8cb9e0]/30"
            >
              <Users size={16} className="mr-2" />
              Create New Room
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#8cb9e0]/10" />
              <span className="text-xs text-[#8cb9e0]/40">or join existing</span>
              <div className="h-px flex-1 bg-[#8cb9e0]/10" />
            </div>

            {/* Join room */}
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                placeholder="Enter room code"
                maxLength={6}
                className="font-mono tracking-widest text-center text-[#8cb9e0] bg-[#0d1020] border-[#8cb9e0]/15 placeholder:text-[#8cb9e0]/25 focus-visible:ring-[#8cb9e0]/30"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <Button
                onClick={handleJoin}
                disabled={joinCode.length !== 6}
                className="bg-[#8cb9e0]/20 text-[#8cb9e0] hover:bg-[#8cb9e0]/30 disabled:opacity-30"
              >
                Join
              </Button>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        {isConnected && (
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={onLeaveRoom}
              className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10"
            >
              <LogOut size={16} className="mr-2" />
              Leave Room
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
