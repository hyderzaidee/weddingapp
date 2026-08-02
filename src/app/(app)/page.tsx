"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  PiggyBank,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toNumber } from "@/lib/currency";
import { formatEventDate } from "@/lib/dates";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const modules = [
  {
    href: "/tasks",
    label: "Tasks",
    description: "Responsibilities and to-dos",
    icon: CheckSquare,
  },
  {
    href: "/money",
    label: "Money",
    description: "Payments and who’s covering what",
    icon: Wallet,
  },
  {
    href: "/budget",
    label: "Budget",
    description: "Estimated vs actual spend",
    icon: PiggyBank,
  },
  {
    href: "/events",
    label: "Events",
    description: "Celebration dates, venues, and guests",
    icon: CalendarDays,
  },
  {
    href: "/guests",
    label: "Guests",
    description: "Guest lists and headcount per event",
    icon: Users,
  },
  {
    href: "/vision-board",
    label: "Vision Board",
    description: "Pics, links, and comments by event",
    icon: Sparkles,
  },
] as const;

type DashboardStats = {
  tasksDone: number;
  tasksTotal: number;
  budgetActual: number;
  budgetEstimated: number;
  earliestEventDate: string | null;
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetUtc = Date.UTC(year, month - 1, day);
  return Math.round((targetUtc - todayUtc) / 86_400_000);
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setIsLoading(true);

      try {
        const supabase = getSupabase();

        const [tasksResult, collectionsResult, taskCostsResult, eventsResult] =
          await Promise.all([
            supabase.from("tasks").select("status"),
            supabase.from("money_transactions").select("amount"),
            supabase.from("tasks").select("cost").not("cost", "is", null),
            supabase
              .from("events")
              .select("event_date")
              .not("event_date", "is", null)
              .order("event_date", { ascending: true })
              .limit(1),
          ]);

        if (tasksResult.error) {
          throw new Error(tasksResult.error.message || "Failed to load tasks.");
        }
        if (collectionsResult.error) {
          throw new Error(
            collectionsResult.error.message || "Failed to load budget."
          );
        }
        if (taskCostsResult.error) {
          throw new Error(
            taskCostsResult.error.message || "Failed to load task costs."
          );
        }
        if (eventsResult.error) {
          throw new Error(
            eventsResult.error.message || "Failed to load events."
          );
        }

        const tasks = tasksResult.data ?? [];
        const collections = collectionsResult.data ?? [];
        const taskCosts = taskCostsResult.data ?? [];
        const earliestEventDate = eventsResult.data?.[0]?.event_date ?? null;

        if (!cancelled) {
          setStats({
            tasksDone: tasks.filter((task) => task.status === "done").length,
            tasksTotal: tasks.length,
            budgetActual: taskCosts.reduce(
              (sum, row) => sum + toNumber(row.cost),
              0
            ),
            budgetEstimated: collections.reduce(
              (sum, row) => sum + toNumber(row.amount),
              0
            ),
            earliestEventDate,
          });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load dashboard."
          );
          setStats({
            tasksDone: 0,
            tasksTotal: 0,
            budgetActual: 0,
            budgetEstimated: 0,
            earliestEventDate: null,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const daysRemaining =
    stats?.earliestEventDate != null
      ? daysUntil(stats.earliestEventDate)
      : null;

  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="hidden md:block">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Shaadi dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Mehndi to walima — where everything stands today.
        </p>
      </div>

      <div className="-mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0">
        <Card className="wedding-panel min-w-[9.5rem] shrink-0 snap-start shadow-none sm:min-w-0">
          <CardHeader className="p-3 pb-1.5 sm:p-6 sm:pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
              <CheckSquare className="size-3.5 text-maroon sm:size-4" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {stats?.tasksDone ?? 0}
                  <span className="text-sm font-normal text-muted-foreground/80 sm:text-base">
                    {" "}
                    / {stats?.tasksTotal ?? 0}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
                  completed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="wedding-panel min-w-[9.5rem] shrink-0 snap-start shadow-none sm:min-w-0">
          <CardHeader className="p-3 pb-1.5 sm:p-6 sm:pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
              <PiggyBank className="size-3.5 text-maroon sm:size-4" />
              Spent
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="h-7 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {formatCurrency(stats?.budgetActual ?? 0)}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
                  of {formatCurrency(stats?.budgetEstimated ?? 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="wedding-panel min-w-[9.5rem] shrink-0 snap-start shadow-none sm:min-w-0">
          <CardHeader className="p-3 pb-1.5 sm:p-6 sm:pb-2">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground sm:gap-2 sm:text-sm">
              <CalendarDays className="size-3.5 text-maroon sm:size-4" />
              Days left
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {isLoading ? (
              <div className="h-7 w-14 animate-pulse rounded bg-muted" />
            ) : daysRemaining == null ? (
              <>
                <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  —
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
                  Add an event date
                </p>
              </>
            ) : (
              <>
                <p
                  className={cn(
                    "text-xl font-semibold tracking-tight sm:text-2xl",
                    daysRemaining < 0 ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {daysRemaining < 0
                    ? "Passed"
                    : daysRemaining === 0
                      ? "Today"
                      : daysRemaining}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
                  {daysRemaining > 0
                    ? `until ${formatEventDate(stats!.earliestEventDate!)}`
                    : daysRemaining === 0
                      ? "Event is today"
                      : `since ${formatEventDate(stats!.earliestEventDate!)}`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
          Jump in
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          {modules.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-14 items-center gap-3 rounded-2xl border border-border/80 bg-card/85 p-3.5 transition-colors active:bg-card hover:border-gold/50 hover:bg-card sm:min-h-16 sm:items-start sm:p-4"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-maroon transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:size-10">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  {label}
                  <ArrowRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
