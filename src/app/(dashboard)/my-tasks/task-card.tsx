"use client";

import { useState } from "react";
import { updateTaskStatus } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, Play, Upload } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string;
  assigned_by: { full_name: string | null } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  assigned:    { label: "Assigned",    color: "oklch(0.60 0.18 200)", bg: "oklch(0.60 0.18 200 / 10%)", border: "oklch(0.60 0.18 200 / 30%)" },
  in_progress: { label: "In Progress", color: "oklch(0.72 0.12 75)",  bg: "oklch(0.72 0.12 75 / 10%)",  border: "oklch(0.72 0.12 75 / 30%)" },
  submitted:   { label: "Submitted",   color: "oklch(0.55 0.18 280)", bg: "oklch(0.55 0.18 280 / 10%)", border: "oklch(0.55 0.18 280 / 30%)" },
  completed:   { label: "Completed",   color: "oklch(0.65 0.15 150)", bg: "oklch(0.65 0.15 150 / 10%)", border: "oklch(0.65 0.15 150 / 30%)" },
  overdue:     { label: "Overdue",     color: "oklch(0.70 0.2 27)",   bg: "oklch(0.70 0.2 27 / 10%)",   border: "oklch(0.70 0.2 27 / 30%)" },
};

function getNextActions(status: string): Array<{ label: string; nextStatus: string; Icon: React.ElementType }> {
  if (status === "assigned") return [{ label: "Start Task", nextStatus: "in_progress", Icon: Play }];
  if (status === "in_progress") return [{ label: "Submit for Review", nextStatus: "submitted", Icon: Upload }];
  return [];
}

export function TaskCard({ task }: { task: Task }) {
  const [loading, setLoading] = useState(false);
  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.assigned;
  const nextActions = getNextActions(task.status);
  const isOverdue = new Date(task.deadline) < new Date() && !["completed"].includes(task.status);

  async function handleStatus(nextStatus: string) {
    setLoading(true);
    try { await updateTaskStatus(task.id, nextStatus); }
    catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="group rounded-xl border bg-card p-5 space-y-4 hover:border-[oklch(0.72_0.12_75_/_40%)] transition-all duration-200 card-hover"
      style={{ borderColor: cfg.border }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base leading-snug">{task.title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          {cfg.label}
        </span>
      </div>

      {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock size={11} className={isOverdue ? "text-destructive" : "text-[oklch(0.72_0.12_75)]"} />
          <span className={isOverdue ? "text-destructive font-semibold" : ""}>
            Due: {new Date(task.deadline).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
        {task.assigned_by && (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={11} /> Assigned by: {task.assigned_by.full_name}
          </span>
        )}
      </div>

      {nextActions.length > 0 && (
        <div className="flex gap-2 pt-1">
          {nextActions.map(({ label, nextStatus, Icon }) => (
            <Button key={nextStatus} size="sm" disabled={loading} onClick={() => handleStatus(nextStatus)}
              className="h-8 text-xs font-semibold bg-[oklch(0.72_0.12_75)] hover:bg-[oklch(0.68_0.10_75)] text-[oklch(0.12_0.01_240)] border-0">
              <Icon size={12} className="mr-1.5" />
              {loading ? "Updating..." : label}
            </Button>
          ))}
        </div>
      )}

      {task.status === "completed" && (
        <div className="flex items-center gap-1.5 text-xs text-[oklch(0.65_0.15_150)]">
          <CheckCircle2 size={13} /> Task completed
        </div>
      )}
    </div>
  );
}
