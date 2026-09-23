import { MouseEvent } from "react";
import {
  AudioWaveform,
  Clock,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetadataItem } from "@/components/ui/metadata-item";
import {
  formatLabel,
  formatTaskContextLabel,
  Task,
} from "@/lib/whatnext-data";

type TaskListProps = {
  editingTaskId: number | null;
  isFormOpen: boolean;
  tasks: Task[];
  onDelete: (taskId: number) => void;
  onEdit: (task: Task, event: MouseEvent<HTMLButtonElement>) => void;
};

export function TaskList({
  editingTaskId,
  isFormOpen,
  tasks,
  onDelete,
  onEdit,
}: TaskListProps) {
  return (
    <div className="border-t border-line-subtle pt-ds-4">
      {tasks.length === 0 ? (
        <div className="space-y-ds-1 rounded-card border border-line-subtle bg-surface-secondary p-ds-5">
          <p className="text-component-title text-content-primary">No tasks yet</p>
          <p className="text-body-small text-content-secondary">
            Add a task when you’re ready, or restore the sample tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-ds-3">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-card border border-line-subtle bg-surface-primary px-ds-4 py-ds-4"
            >
              <div className="flex flex-col gap-ds-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-ds-2">
                  <div className="flex flex-wrap items-center gap-ds-2">
                    <h3 className="text-component-title text-content-primary">
                      {task.name}
                    </h3>
                    <Badge
                      variant={task.readiness === "ready" ? "success" : "danger"}
                    >
                      {task.readiness === "ready" ? "Ready" : "Blocked"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-ds-4 gap-y-ds-2">
                    <MetadataItem icon={Clock}>{task.duration} min</MetadataItem>
                    <MetadataItem icon={MapPin}>
                      {formatTaskContextLabel(task.contextTag)}
                    </MetadataItem>
                    <MetadataItem icon={AudioWaveform}>
                      {formatLabel(task.focusRequired)} focus
                    </MetadataItem>
                    <MetadataItem>
                      {formatLabel(task.importance)} importance
                    </MetadataItem>
                    <MetadataItem>{formatLabel(task.urgency)} urgency</MetadataItem>
                  </div>

                  <p className="text-metadata text-content-muted">
                    {task.canBeDoneInParts === "yes"
                      ? "Can be done in parts"
                      : "Needs a full session"}
                  </p>
                </div>

                <div className="flex shrink-0 gap-ds-2">
                  <Button
                    type="button"
                    variant="tertiary"
                    aria-controls="task-form"
                    aria-expanded={isFormOpen && editingTaskId === task.id}
                    onClick={(event) => onEdit(task, event)}
                  >
                    <Pencil aria-hidden="true" className="size-icon-compact" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 aria-hidden="true" className="size-icon-compact" />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
