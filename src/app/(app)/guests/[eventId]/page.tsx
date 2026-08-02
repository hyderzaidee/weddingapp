"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  EditableTable,
  type EditableCellValue,
  type EditableColumn,
} from "@/components/editable-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toNumber } from "@/lib/currency";
import { getSupabase } from "@/lib/supabase";
import type { Database, Event, Guest } from "@/types/database";

function toGuest(row: Guest): Guest {
  return {
    ...row,
    member_count: Math.max(1, toNumber(row.member_count) || 1),
  };
}

export default function EventGuestsPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params.eventId;

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!eventId) return;

    try {
      const { data: eventRow, error: eventError } = await getSupabase()
        .from("events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError) {
        toast.error(eventError.message || "Failed to load event.");
        router.replace("/guests");
        return;
      }

      if (!eventRow) {
        toast.error("Event not found.");
        router.replace("/guests");
        return;
      }

      setEvent(eventRow);

      const { data, error } = await getSupabase()
        .from("guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load guests.");
        setGuests([]);
        return;
      }

      setGuests((data ?? []).map(toGuest));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load guest list."
      );
      setGuests([]);
    }
  }, [eventId, router]);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await loadData();
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const totalMembers = useMemo(
    () => guests.reduce((sum, row) => sum + toNumber(row.member_count), 0),
    [guests]
  );

  const columns: EditableColumn[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        type: "text",
        placeholder: "Guest or family name",
        className: "min-w-[12rem]",
      },
      {
        key: "member_count",
        label: "Members",
        type: "number",
        placeholder: "1",
      },
    ],
    []
  );

  async function handleAdd() {
    if (!eventId) return;

    try {
      const { error } = await getSupabase()
        .from("guests")
        .insert({
          event_id: eventId,
          name: "New guest",
          member_count: 1,
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add guest.");
        return;
      }

      await loadData();
      toast.success("Guest added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add guest."
      );
    }
  }

  async function handleUpdate(
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) {
    let nextValue: EditableCellValue | number = newValue;

    if (columnKey === "member_count") {
      const parsed = toNumber(newValue);
      nextValue = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
    }

    if (columnKey === "name") {
      const trimmed = String(newValue ?? "").trim();
      nextValue = trimmed || "New guest";
    }

    try {
      const { error } = await getSupabase()
        .from("guests")
        .update({
          [columnKey]: nextValue,
        } as Database["public"]["Tables"]["guests"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save guest.");
        await loadData();
        return;
      }

      setGuests((current) =>
        current.map((row) =>
          row.id === rowId ? { ...row, [columnKey]: nextValue } : row
        )
      );
      toast.success("Saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save guest."
      );
      await loadData();
    }
  }

  async function handleDelete(rowId: string) {
    try {
      const { error } = await getSupabase()
        .from("guests")
        .delete()
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to delete guest.");
        return;
      }

      setGuests((current) => current.filter((row) => row.id !== rowId));
      toast.success("Guest deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete guest."
      );
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="hidden md:block">
        <Link
          href="/guests"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All events
        </Link>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {event?.event_name ?? "Guest list"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add names and how many members are coming.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/85 px-4 py-3 md:hidden">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold text-foreground">
            {event?.event_name ?? "Guest list"}
          </p>
          <p className="text-xs text-muted-foreground">Headcount</p>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {isLoading ? "…" : totalMembers}
        </p>
      </div>

      <Card className="wedding-panel hidden shadow-none md:block">
        <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total guests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isLoading ? "…" : totalMembers}
          </p>
        </CardContent>
      </Card>

      <EditableTable
        columns={columns}
        rows={guests}
        isLoading={isLoading}
        emptyMessage="No guests yet. Add one to get started."
        addLabel="Add guest"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
