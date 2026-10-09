"use client";

import { useState } from "react";
import { deleteAnnouncement } from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteAnnouncementButton({ id, title }: { id: string; title: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete announcement "${title}"?`)) return;
    setLoading(true);
    try {
      await deleteAnnouncement(id);
    } catch (e: any) {
      alert(e.message || "Failed to delete announcement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      title="Delete Announcement"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </Button>
  );
}
