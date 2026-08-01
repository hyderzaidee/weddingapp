"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { ensureDefaultEvents } from "@/lib/event-options";
import { getSupabase } from "@/lib/supabase";
import type { Event, Guest } from "@/types/database";

type EventWithTotal = Event & { memberTotal: number };

function formatEventDate(value: string | null) {
  if (!value) return "Date TBD";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function GuestsPage() {
  const [events, setEvents] = useState<EventWithTotal[]>([]);
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
        toast.error(guestsResult.error.message || "Failed to load guests.");
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
        (eventsResult.data ?? []).map((event) => ({
          ...event,
          memberTotal: totals.get(event.id) ?? 0,
        }))
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load guest lists."
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

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Guests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an event to manage its guest list and headcount.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events yet. Add one under Events first.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/guests/${event.id}`}
                className="wedding-panel flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {event.event_name}{" "}
                    <span className="tabular-nums text-muted-foreground">
                      ({event.memberTotal}{" "}
                      {event.memberTotal === 1 ? "guest" : "guests"})
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatEventDate(event.event_date)}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
