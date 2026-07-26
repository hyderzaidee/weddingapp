"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EditableTable,
  type EditableCellValue,
  type EditableColumn,
} from "@/components/editable-table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabase } from "@/lib/supabase";
import {
  buildEventSelectOptions,
  ensureDefaultEvents,
} from "@/lib/event-options";
import type { Database, Task, TaskPriority, TaskStatus } from "@/types/database";

const STATUS_OPTIONS = [
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" },
] as const;

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
] as const;

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  todo: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
  in_progress:
    "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100",
  done: "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

const PRIORITY_BADGE_CLASS: Record<TaskPriority, string> = {
  low: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
  medium:
    "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100",
  high: "border-transparent bg-red-100 text-red-800 hover:bg-red-100",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const ALL_FILTER = "__all__";

function isTaskStatus(value: string): value is TaskStatus {
  return value === "todo" || value === "in_progress" || value === "done";
}

function isTaskPriority(value: string): value is TaskPriority {
  return value === "low" || value === "medium" || value === "high";
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedFilter, setAssignedFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [eventFilter, setEventFilter] = useState(ALL_FILTER);

  const loadEventNames = useCallback(async () => {
    try {
      await ensureDefaultEvents();
      const { data, error } = await getSupabase()
        .from("events")
        .select("event_name")
        .order("event_name", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load events.");
        setEventNames([]);
        return;
      }

      setEventNames(
        (data ?? [])
          .map((row) => row.event_name?.trim())
          .filter((name): name is string => Boolean(name))
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load events."
      );
      setEventNames([]);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message || "Failed to load tasks.");
        setTasks([]);
        return;
      }

      setTasks(data ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load tasks."
      );
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await Promise.all([loadTasks(), loadEventNames()]);
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadTasks, loadEventNames]);

  const eventOptions = useMemo(
    () =>
      buildEventSelectOptions(
        eventNames,
        tasks
          .map((task) => task.event_name ?? "")
          .filter((name) => name.trim().length > 0)
      ),
    [eventNames, tasks]
  );

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    for (const task of tasks) {
      const name = task.assigned_to?.trim();
      if (name) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (
        assignedFilter !== ALL_FILTER &&
        (task.assigned_to?.trim() ?? "") !== assignedFilter
      ) {
        return false;
      }
      if (statusFilter !== ALL_FILTER && task.status !== statusFilter) {
        return false;
      }
      if (eventFilter !== ALL_FILTER && task.event_name !== eventFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, assignedFilter, statusFilter, eventFilter]);

  const completedCount = filteredTasks.filter(
    (task) => task.status === "done"
  ).length;

  const columns: EditableColumn[] = useMemo(
    () => [
      {
        key: "title",
        label: "Title",
        type: "text",
        placeholder: "Task title",
        className: "min-w-[10rem]",
      },
      {
        key: "assigned_to",
        label: "Assigned to",
        type: "text",
        placeholder: "Name",
      },
      {
        key: "event_name",
        label: "Event",
        type: "select",
        options: eventOptions,
        placeholder: "Select event",
      },
      {
        key: "due_date",
        label: "Due date",
        type: "date",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [...STATUS_OPTIONS],
        renderDisplay: (value) => {
          const status = String(value);
          if (!isTaskStatus(status)) return String(value);
          return (
            <Badge className={STATUS_BADGE_CLASS[status]}>
              {STATUS_LABEL[status]}
            </Badge>
          );
        },
      },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: [...PRIORITY_OPTIONS],
        renderDisplay: (value) => {
          const priority = String(value);
          if (!isTaskPriority(priority)) return String(value);
          return (
            <Badge className={PRIORITY_BADGE_CLASS[priority]}>
              {PRIORITY_LABEL[priority]}
            </Badge>
          );
        },
      },
      {
        key: "notes",
        label: "Notes",
        type: "textarea",
        placeholder: "Notes",
        className: "min-w-[12rem]",
      },
    ],
    [eventOptions]
  );

  async function handleAdd() {
    try {
      const { error } = await getSupabase()
        .from("tasks")
        .insert({ title: "New task" })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add task.");
        return;
      }

      await loadTasks();
      toast.success("Task added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add task."
      );
    }
  }

  async function handleUpdate(
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) {
    try {
      const { error } = await getSupabase()
        .from("tasks")
        .update({
          [columnKey]: newValue,
        } as Database["public"]["Tables"]["tasks"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save task.");
        await loadTasks();
        return;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === rowId ? { ...task, [columnKey]: newValue } : task
        )
      );
      toast.success("Saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save task."
      );
      await loadTasks();
    }
  }

  async function handleDelete(rowId: string) {
    try {
      const { error } = await getSupabase()
        .from("tasks")
        .delete()
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to delete task.");
        return;
      }

      setTasks((current) => current.filter((task) => task.id !== rowId));
      toast.success("Task deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete task."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Tasks & Responsibilities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount} of {filteredTasks.length} tasks completed
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="w-full space-y-1.5 sm:w-44">
            <Label htmlFor="filter-assigned">Assigned to</Label>
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger id="filter-assigned">
                <SelectValue placeholder="All people" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All people</SelectItem>
                {assigneeOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-44">
            <Label htmlFor="filter-status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All statuses</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 sm:w-44">
            <Label htmlFor="filter-event">Event</Label>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger id="filter-event">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All events</SelectItem>
                {eventOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <EditableTable
        columns={columns}
        rows={filteredTasks}
        isLoading={isLoading}
        emptyMessage="No tasks yet. Add one to get started."
        addLabel="Add task"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
