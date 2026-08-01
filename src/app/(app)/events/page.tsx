"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EditableTable,
  type EditableCellValue,
  type EditableColumn,
} from "@/components/editable-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureDefaultEvents } from "@/lib/event-options";
import { normalizeImageUrls } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import type { Database, Event, Guest } from "@/types/database";

type EventWithGuestTotal = Event & { guests_total: number };

function toEvent(row: Event, guestsTotal = 0): EventWithGuestTotal {
  return {
    ...row,
    image_urls: normalizeImageUrls(row.image_urls),
    guests_total: guestsTotal,
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithGuestTotal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      await ensureDefaultEvents();

      const [eventsResult, guestsResult] = await Promise.all([
        getSupabase()
          .from("events")
          .select("*")
          .order("event_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true }),
        getSupabase().from("guests").select("event_id, member_count"),
      ]);

      if (eventsResult.error) {
        toast.error(eventsResult.error.message || "Failed to load events.");
        setEvents([]);
        return;
      }

      if (guestsResult.error) {
        toast.error(
          guestsResult.error.message || "Failed to load guest totals."
        );
        setEvents([]);
        return;
      }

      const totals = new Map<string, number>();
      for (const row of (guestsResult.data ?? []) as Pick<
        Guest,
        "event_id" | "member_count"
      >[]) {
        totals.set(
          row.event_id,
          (totals.get(row.event_id) ?? 0) + Number(row.member_count ?? 0)
        );
      }

      setEvents(
        (eventsResult.data ?? []).map((event) =>
          toEvent(event, totals.get(event.id) ?? 0)
        )
      );
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

  const totalGuestsAcrossEvents = useMemo(
    () => events.reduce((sum, event) => sum + event.guests_total, 0),
    [events]
  );

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
        key: "guests_total",
        label: "Guests",
        type: "number",
        editable: false,
        renderDisplay: (value) => (
          <span className="tabular-nums">{Number(value ?? 0)}</span>
        ),
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
    if (columnKey === "guests_total") return;

    try {
      const { error } = await getSupabase()
        .from("events")
        .update({
          [columnKey]: newValue,
        } as Database["public"]["Tables"]["events"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save event.");
        await loadEvents();
        return;
      }

      setEvents((current) =>
        current.map((row) =>
          row.id === rowId ? { ...row, [columnKey]: newValue } : row
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
          Guest totals come from each event’s guest list.
        </p>
      </div>

      <Card className="wedding-panel shadow-none">
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total guests across events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isLoading ? "…" : totalGuestsAcrossEvents}
          </p>
        </CardContent>
      </Card>

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
