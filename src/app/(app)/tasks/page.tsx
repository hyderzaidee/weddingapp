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
import { formatCurrency, toNumber } from "@/lib/currency";
import { getSupabase } from "@/lib/supabase";
import {
  buildEventSelectOptions,
  ensureDefaultEvents,
} from "@/lib/event-options";
import type {
  Database,
  Task,
  TaskCategory,
  TaskStatus,
} from "@/types/database";

const STATUS_OPTIONS = [
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" },
] as const;

const CATEGORY_OPTIONS = [
  { label: "Wedding Preparation", value: "wedding_preparation" },
  { label: "Hira's Stuff", value: "hiras_stuff" },
  { label: "Ahmed and Family", value: "ahmed_and_family" },
] as const;

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  todo: "border-transparent bg-red-100 text-red-800 hover:bg-red-100 focus:bg-red-100 data-[highlighted]:bg-red-100 data-[highlighted]:text-red-800",
  in_progress:
    "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100 focus:bg-yellow-100 data-[highlighted]:bg-yellow-100 data-[highlighted]:text-yellow-800",
  done: "border-transparent bg-green-100 text-green-800 hover:bg-green-100 focus:bg-green-100 data-[highlighted]:bg-green-100 data-[highlighted]:text-green-800",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  wedding_preparation: "Wedding Preparation",
  hiras_stuff: "Hira's Stuff",
  ahmed_and_family: "Ahmed and Family",
};

const ALL_FILTER = "__all__";

function isTaskStatus(value: string): value is TaskStatus {
  return value === "todo" || value === "in_progress" || value === "done";
}

function isTaskCategory(value: string): value is TaskCategory {
  return (
    value === "wedding_preparation" ||
    value === "hiras_stuff" ||
    value === "ahmed_and_family"
  );
}

function toTask(row: Task): Task {
  return {
    ...row,
    cost: row.cost == null ? null : toNumber(row.cost),
    category: isTaskCategory(row.category)
      ? row.category
      : "wedding_preparation",
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedFilter, setAssignedFilter] = useState(ALL_FILTER);
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);
  const [eventFilter, setEventFilter] = useState(ALL_FILTER);
  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER);

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
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load tasks.");
        setTasks([]);
        return;
      }

      setTasks((data ?? []).map(toTask));
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
      if (categoryFilter !== ALL_FILTER && task.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, assignedFilter, statusFilter, eventFilter, categoryFilter]);

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
        key: "category",
        label: "Category",
        type: "select",
        options: [...CATEGORY_OPTIONS],
        placeholder: "Select category",
        className: "min-w-[11rem]",
        renderDisplay: (value) => {
          const category = String(value);
          if (!isTaskCategory(category)) return String(value);
          return CATEGORY_LABEL[category];
        },
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
        key: "cost",
        label: "Cost",
        type: "number",
        placeholder: "0",
        renderDisplay: (value) =>
          value == null || value === ""
            ? "—"
            : formatCurrency(toNumber(value)),
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [...STATUS_OPTIONS],
        selectClassName: (value) =>
          isTaskStatus(value) ? STATUS_BADGE_CLASS[value] : undefined,
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
    ],
    [eventOptions]
  );

  async function handleAdd() {
    try {
      const { error } = await getSupabase()
        .from("tasks")
        .insert({
          title: "New task",
          category: "wedding_preparation",
        })
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
    const nextValue =
      columnKey === "cost"
        ? newValue == null || newValue === ""
          ? null
          : toNumber(newValue)
        : newValue;

    try {
      const { error } = await getSupabase()
        .from("tasks")
        .update({
          [columnKey]: nextValue,
        } as Database["public"]["Tables"]["tasks"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save task.");
        await loadTasks();
        return;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === rowId ? { ...task, [columnKey]: nextValue } : task
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
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Tasks & Responsibilities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {completedCount} of {filteredTasks.length} tasks completed
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="filter-category">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="filter-category" className="h-11 sm:h-10">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>All categories</SelectItem>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-assigned">Assigned to</Label>
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger id="filter-assigned" className="h-11 sm:h-10">
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

          <div className="space-y-1.5">
            <Label htmlFor="filter-status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="filter-status" className="h-11 sm:h-10">
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

          <div className="space-y-1.5">
            <Label htmlFor="filter-event">Event</Label>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger id="filter-event" className="h-11 sm:h-10">
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
        collapsibleMobile
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
