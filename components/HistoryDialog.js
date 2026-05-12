"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export default function HistoryDialog({
  open,
  onOpenChange,
  history,
  loading,
  onLoadDrawing,
  onDeleteDrawing,
  onRefresh,
}) {
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#141832]/95 backdrop-blur-xl border-[#8cb9e0]/15">
        <DialogHeader>
          <DialogTitle className="text-[#8cb9e0]">Drawing History</DialogTitle>
          <DialogDescription className="text-[#8cb9e0]/50">
            Click a drawing to load it onto the canvas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#8cb9e0]/40" size={24} />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-[#8cb9e0]/30 text-sm">
            No saved drawings yet
          </div>
        ) : (
          <div className="history-grid">
            {history.map((drawing) => (
              <div
                key={drawing.id}
                className="history-card"
                onClick={() => onLoadDrawing(drawing.id)}
              >
                {drawing.thumbnail ? (
                  <img src={drawing.thumbnail} alt="Drawing" />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#8cb9e0]/20 text-xs">
                    No preview
                  </div>
                )}
                <div className="history-date">
                  {formatDate(drawing.created_at)}
                </div>
                <div className="history-delete">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDrawing(drawing.id);
                    }}
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-400/15 h-6 w-6"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
