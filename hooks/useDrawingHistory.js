"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useDrawingHistory(userId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveDrawing = useCallback(
    async (paths, thumbnailDataUrl) => {
      if (!userId || !paths || paths.length === 0) return null;

      try {
        const { data, error } = await supabase.from("drawings").insert({
          user_id: userId,
          paths: JSON.stringify(paths),
          thumbnail: thumbnailDataUrl || null,
        }).select();

        if (error) {
          console.error("Failed to save drawing:", error);
          return null;
        }

        return data?.[0] || null;
      } catch (err) {
        console.error("Save drawing error:", err);
        return null;
      }
    },
    [userId]
  );

  const loadHistory = useCallback(async () => {
    if (!userId) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("id, user_id, thumbnail, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Failed to load history:", error);
        return [];
      }

      setHistory(data || []);
      return data || [];
    } catch (err) {
      console.error("Load history error:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadDrawing = useCallback(async (drawingId) => {
    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("paths")
        .eq("id", drawingId)
        .single();

      if (error) {
        console.error("Failed to load drawing:", error);
        return null;
      }

      return typeof data.paths === "string"
        ? JSON.parse(data.paths)
        : data.paths;
    } catch (err) {
      console.error("Load drawing error:", err);
      return null;
    }
  }, []);

  const deleteDrawing = useCallback(
    async (drawingId) => {
      try {
        const { error } = await supabase
          .from("drawings")
          .delete()
          .eq("id", drawingId);

        if (error) {
          console.error("Failed to delete drawing:", error);
          return false;
        }

        setHistory((prev) => prev.filter((d) => d.id !== drawingId));
        return true;
      } catch (err) {
        console.error("Delete drawing error:", err);
        return false;
      }
    },
    []
  );

  return {
    history,
    loading,
    saveDrawing,
    loadHistory,
    loadDrawing,
    deleteDrawing,
  };
}
