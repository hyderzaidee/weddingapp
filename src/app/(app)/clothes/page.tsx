"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EditableTable,
  type EditableCellValue,
  type EditableColumn,
} from "@/components/editable-table";
import { InspirationImages } from "@/components/inspiration-images";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, toNumber } from "@/lib/currency";
import {
  buildEventSelectOptions,
  ensureDefaultEvents,
} from "@/lib/event-options";
import { normalizeImageUrls } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";
import type {
  Database,
  Event,
  Outfit,
  OutfitStatus,
} from "@/types/database";

const OUTFIT_STATUS_OPTIONS = [
  { label: "Idea", value: "idea" },
  { label: "Ordered", value: "ordered" },
  { label: "Fitting", value: "fitting" },
  { label: "Ready", value: "ready" },
] as const;

const OUTFIT_STATUS_BADGE_CLASS: Record<OutfitStatus, string> = {
  idea: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
  ordered: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100",
  fitting:
    "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100",
  ready:
    "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
};

const OUTFIT_STATUS_LABEL: Record<OutfitStatus, string> = {
  idea: "Idea",
  ordered: "Ordered",
  fitting: "Fitting",
  ready: "Ready",
};

function isOutfitStatus(value: string): value is OutfitStatus {
  return (
    value === "idea" ||
    value === "ordered" ||
    value === "fitting" ||
    value === "ready"
  );
}

function toOutfit(row: Outfit): Outfit {
  return {
    ...row,
    cost: row.cost == null ? null : toNumber(row.cost),
    image_urls: normalizeImageUrls(row.image_urls),
  };
}

function toEvent(row: Event): Event {
  return {
    ...row,
    image_urls: normalizeImageUrls(row.image_urls),
  };
}

export default function ClothesPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const loadOutfits = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("outfits")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load outfits.");
        setOutfits([]);
        return;
      }

      setOutfits((data ?? []).map(toOutfit));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load outfits."
      );
      setOutfits([]);
    }
  }, []);

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
      setIsLoadingOutfits(true);
      setIsLoadingEvents(true);

      await Promise.all([
        loadOutfits().finally(() => {
          if (!cancelled) setIsLoadingOutfits(false);
        }),
        loadEvents().finally(() => {
          if (!cancelled) setIsLoadingEvents(false);
        }),
      ]);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadOutfits, loadEvents]);

  const eventOptions = useMemo(
    () =>
      buildEventSelectOptions(
        events.map((event) => event.event_name),
        outfits
          .map((outfit) => outfit.event_name ?? "")
          .filter((name) => name.trim().length > 0)
      ),
    [events, outfits]
  );

  const outfitColumns: EditableColumn[] = useMemo(
    () => [
      {
        key: "person_name",
        label: "Person",
        type: "text",
        placeholder: "Name",
        className: "min-w-[8rem]",
      },
      {
        key: "event_name",
        label: "Event",
        type: "select",
        options: eventOptions,
        placeholder: "Select event",
      },
      {
        key: "outfit_description",
        label: "Outfit",
        type: "text",
        placeholder: "Describe the outfit",
        className: "min-w-[12rem]",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [...OUTFIT_STATUS_OPTIONS],
        renderDisplay: (value) => {
          const status = String(value);
          if (!isOutfitStatus(status)) return String(value);
          return (
            <Badge className={OUTFIT_STATUS_BADGE_CLASS[status]}>
              {OUTFIT_STATUS_LABEL[status]}
            </Badge>
          );
        },
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
        key: "image_urls",
        label: "Inspo",
        type: "text",
        editable: false,
        className: "min-w-[14rem]",
        customCell: ({ row, value, onUpdate }) => (
          <InspirationImages
            urls={normalizeImageUrls(value)}
            folder={`outfits/${row.id}`}
            onChange={(urls) => onUpdate(urls)}
          />
        ),
      },
    ],
    [eventOptions]
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
      {
        key: "image_urls",
        label: "Inspo",
        type: "text",
        editable: false,
        className: "min-w-[14rem]",
        customCell: ({ row, value, onUpdate }) => (
          <InspirationImages
            urls={normalizeImageUrls(value)}
            folder={`events/${row.id}`}
            onChange={(urls) => onUpdate(urls)}
          />
        ),
      },
    ],
    []
  );

  async function handleAddOutfit() {
    try {
      const { error } = await getSupabase()
        .from("outfits")
        .insert({ person_name: "New person" })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add outfit.");
        return;
      }

      await loadOutfits();
      toast.success("Outfit added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add outfit."
      );
    }
  }

  async function handleUpdateOutfit(
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) {
    const nextValue =
      columnKey === "cost"
        ? newValue == null || newValue === ""
          ? null
          : toNumber(newValue)
        : columnKey === "image_urls"
          ? normalizeImageUrls(newValue)
          : newValue;

    try {
      const { error } = await getSupabase()
        .from("outfits")
        .update({
          [columnKey]: nextValue,
        } as Database["public"]["Tables"]["outfits"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save outfit.");
        await loadOutfits();
        return;
      }

      setOutfits((current) =>
        current.map((row) =>
          row.id === rowId ? { ...row, [columnKey]: nextValue } : row
        )
      );
      if (columnKey !== "image_urls") {
        toast.success("Saved.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save outfit."
      );
      await loadOutfits();
    }
  }

  async function handleDeleteOutfit(rowId: string) {
    try {
      const { error } = await getSupabase()
        .from("outfits")
        .delete()
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to delete outfit.");
        return;
      }

      setOutfits((current) => current.filter((row) => row.id !== rowId));
      toast.success("Outfit deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete outfit."
      );
    }
  }

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
        : columnKey === "image_urls"
          ? normalizeImageUrls(newValue)
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
      if (columnKey !== "image_urls") {
        toast.success("Saved.");
      }
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
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Clothes & Event Plans
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track outfits for each celebration and keep event details in one place.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Outfits
        </h2>
        <EditableTable
          columns={outfitColumns}
          rows={outfits}
          isLoading={isLoadingOutfits}
          emptyMessage="No outfits yet. Add one to get started."
          addLabel="Add outfit"
          onAdd={handleAddOutfit}
          onUpdate={handleUpdateOutfit}
          onDelete={handleDeleteOutfit}
        />
      </section>

      <div className="border-t border-border" role="separator" />

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            Event Details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit event names here — they show up in Tasks and Outfits dropdowns.
          </p>
        </div>
        <EditableTable
          columns={eventColumns}
          rows={events}
          isLoading={isLoadingEvents}
          emptyMessage="No events yet. Add one to get started."
          addLabel="Add event"
          onAdd={handleAddEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      </section>
    </div>
  );
}
