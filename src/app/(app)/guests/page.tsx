"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/dates";
import { ensureDefaultEvents } from "@/lib/event-options";
import { getSupabase } from "@/lib/supabase";
import type { Event, Guest } from "@/types/database";

type EventWithTotal = Event & { memberTotal: number };

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
    <div className="space-y-4 sm:space-y-6">
      <div className="hidden md:block">
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
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No events yet. Add one under Events first.
          </p>
          <Button type="button" className="mt-4" asChild>
            <Link href="/events">Go to Events</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/guests/${event.id}`}
                className="wedding-panel flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 py-3.5 transition-colors active:bg-muted/50 hover:bg-muted/40 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {event.event_name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatEventDate(event.event_date)} · {event.memberTotal}{" "}
                    {event.memberTotal === 1 ? "guest" : "guests"}
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
