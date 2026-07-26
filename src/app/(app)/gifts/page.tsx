"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EditableTable,
  type EditableCellValue,
  type EditableColumn,
} from "@/components/editable-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, toNumber } from "@/lib/currency";
import {
  buildEventSelectOptions,
  ensureDefaultEvents,
} from "@/lib/event-options";
import { getSupabase } from "@/lib/supabase";
import type { Database, Gift, GiftStatus } from "@/types/database";

const GIFT_STATUS_OPTIONS = [
  { label: "Idea", value: "idea" },
  { label: "Ordered", value: "ordered" },
  { label: "Purchased", value: "purchased" },
  { label: "Wrapped", value: "wrapped" },
  { label: "Given", value: "given" },
] as const;

const GIFT_STATUS_BADGE_CLASS: Record<GiftStatus, string> = {
  idea: "border-transparent bg-muted text-muted-foreground hover:bg-muted",
  ordered: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100",
  purchased:
    "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100",
  wrapped:
    "border-transparent bg-violet-100 text-violet-700 hover:bg-violet-100",
  given:
    "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
};

const GIFT_STATUS_LABEL: Record<GiftStatus, string> = {
  idea: "Idea",
  ordered: "Ordered",
  purchased: "Purchased",
  wrapped: "Wrapped",
  given: "Given",
};

function isGiftStatus(value: string): value is GiftStatus {
  return (
    value === "idea" ||
    value === "ordered" ||
    value === "purchased" ||
    value === "wrapped" ||
    value === "given"
  );
}

function toGift(row: Gift): Gift {
  return {
    ...row,
    cost: row.cost == null ? null : toNumber(row.cost),
  };
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadGifts = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("gifts")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load gifts.");
        setGifts([]);
        return;
      }

      setGifts((data ?? []).map(toGift));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load gifts."
      );
      setGifts([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await Promise.all([loadGifts(), loadEventNames()]);
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadGifts, loadEventNames]);

  const eventOptions = useMemo(
    () =>
      buildEventSelectOptions(
        eventNames,
        gifts
          .map((gift) => gift.event_name ?? "")
          .filter((name) => name.trim().length > 0)
      ),
    [eventNames, gifts]
  );

  const columns: EditableColumn[] = useMemo(
    () => [
      {
        key: "person_name",
        label: "Person",
        type: "text",
        placeholder: "Name",
        className: "min-w-[8rem]",
      },
      {
        key: "To Whom",
        label: "To Whom",
        type: "text",
        placeholder: "Recipient",
        className: "min-w-[8rem]",
      },
      {
        key: "What to buy",
        label: "What to buy",
        type: "text",
        placeholder: "Gift idea",
        className: "min-w-[12rem]",
      },
      {
        key: "event_name",
        label: "Event",
        type: "select",
        options: eventOptions,
        placeholder: "Select event",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [...GIFT_STATUS_OPTIONS],
        renderDisplay: (value) => {
          const status = String(value);
          if (!isGiftStatus(status)) return String(value);
          return (
            <Badge className={GIFT_STATUS_BADGE_CLASS[status]}>
              {GIFT_STATUS_LABEL[status]}
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
    ],
    [eventOptions]
  );

  async function handleAdd() {
    try {
      const { error } = await getSupabase()
        .from("gifts")
        .insert({ person_name: "New person" })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add gift.");
        return;
      }

      await loadGifts();
      toast.success("Gift added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add gift."
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
        .from("gifts")
        .update({
          [columnKey]: nextValue,
        } as Database["public"]["Tables"]["gifts"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save gift.");
        await loadGifts();
        return;
      }

      setGifts((current) =>
        current.map((row) =>
          row.id === rowId ? { ...row, [columnKey]: nextValue } : row
        )
      );
      toast.success("Saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save gift."
      );
      await loadGifts();
    }
  }

  async function handleDelete(rowId: string) {
    try {
      const { error } = await getSupabase()
        .from("gifts")
        .delete()
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to delete gift.");
        return;
      }

      setGifts((current) => current.filter((row) => row.id !== rowId));
      toast.success("Gift deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete gift."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Gifts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track gift ideas, purchases, and who they’re for.
        </p>
      </div>

      <EditableTable
        columns={columns}
        rows={gifts}
        isLoading={isLoading}
        emptyMessage="No gifts yet. Add one to get started."
        addLabel="Add gift"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
