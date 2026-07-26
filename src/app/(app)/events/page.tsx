"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EditableTable,
  type EditableCellValue,
  type EditableColumn,
} from "@/components/editable-table";
import { toNumber } from "@/lib/currency";
import { ensureDefaultEvents } from "@/lib/event-options";
import { normalizeImageUrls } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import type { Database, Event } from "@/types/database";

function toEvent(row: Event): Event {
  return {
    ...row,
    image_urls: normalizeImageUrls(row.image_urls),
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      await ensureDefaultEvents();
      const { data, error } = await getSupabase()
        .from("events")
        .select("*")
        .order("event_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load events.");
        setEvents([]);
        return;
      }

      setEvents((data ?? []).map(toEvent));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load events."
      );
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await loadEvents();
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadEvents]);

  const eventColumns: EditableColumn[] = useMemo(
    () => [
      {
        key: "event_name",
        label: "Event",
        type: "text",
        placeholder: "Event name",
        className: "min-w-[10rem]",
      },
      {
        key: "event_date",
        label: "Date",
        type: "date",
      },
      {
        key: "venue",
        label: "Venue",
        type: "text",
        placeholder: "Venue",
        className: "min-w-[10rem]",
      },
      {
        key: "guest_count",
        label: "Guests",
        type: "number",
        placeholder: "0",
      },
      {
        key: "notes",
        label: "Notes",
        type: "textarea",
        placeholder: "Notes",
        className: "min-w-[12rem]",
      },
    ],
    []
  );

  async function handleAddEvent() {
    try {
      const { error } = await getSupabase()
        .from("events")
        .insert({ event_name: "New event" })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add event.");
        return;
      }

      await loadEvents();
      toast.success("Event added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add event."
      );
    }
  }

  async function handleUpdateEvent(
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) {
    const nextValue =
      columnKey === "guest_count"
        ? newValue == null || newValue === ""
          ? null
          : toNumber(newValue)
        : newValue;

    try {
      const { error } = await getSupabase()
        .from("events")
        .update({
          [columnKey]: nextValue,
        } as Database["public"]["Tables"]["events"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save event.");
        await loadEvents();
        return;
      }

      setEvents((current) =>
        current.map((row) =>
          row.id === rowId ? { ...row, [columnKey]: nextValue } : row
        )
      );
      toast.success("Saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save event."
      );
      await loadEvents();
    }
  }

  async function handleDeleteEvent(rowId: string) {
    try {
      const { error } = await getSupabase()
        .from("events")
        .delete()
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to delete event.");
        return;
      }

      setEvents((current) => current.filter((row) => row.id !== rowId));
      toast.success("Event deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete event."
      );
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Events
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Event details used across Tasks and the rest of wedding planning.
        </p>
      </div>

      <EditableTable
        columns={eventColumns}
        rows={events}
        isLoading={isLoading}
        emptyMessage="No events yet. Add one to get started."
        addLabel="Add event"
        onAdd={handleAddEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
