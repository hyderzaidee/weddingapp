"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  Gift,
  PiggyBank,
  Shirt,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toNumber } from "@/lib/currency";
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
    href: "/budget",
    label: "Budget",
    description: "Estimated vs actual spend",
    icon: PiggyBank,
  },
  {
    href: "/money",
    label: "Money",
    description: "Payments and who’s covering what",
    icon: Wallet,
  },
  {
    href: "/clothes",
    label: "Clothes & Events",
    description: "Outfits and celebration details",
    icon: Shirt,
  },
  {
    href: "/gifts",
    label: "Gifts",
    description: "Gift ideas, status, and inspo",
    icon: Gift,
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
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatEventDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

        const [tasksResult, budgetResult, eventsResult] = await Promise.all([
          supabase.from("tasks").select("status"),
          supabase
            .from("budget_categories")
            .select("estimated_amount, actual_amount"),
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
        if (budgetResult.error) {
          throw new Error(
            budgetResult.error.message || "Failed to load budget."
          );
        }
        if (eventsResult.error) {
          throw new Error(
            eventsResult.error.message || "Failed to load events."
          );
        }

        const tasks = tasksResult.data ?? [];
        const budget = budgetResult.data ?? [];
        const earliestEventDate = eventsResult.data?.[0]?.event_date ?? null;

        if (!cancelled) {
          setStats({
            tasksDone: tasks.filter((task) => task.status === "done").length,
            tasksTotal: tasks.length,
            budgetActual: budget.reduce(
              (sum, row) => sum + toNumber(row.actual_amount),
              0
            ),
            budgetEstimated: budget.reduce(
              (sum, row) => sum + toNumber(row.estimated_amount),
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
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Shaadi dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Mehndi to walima — where everything stands today.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="wedding-panel shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckSquare className="size-4 text-maroon" />
              Tasks done
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {stats?.tasksDone ?? 0}
                  <span className="text-base font-normal text-muted-foreground/80">
                    {" "}
                    / {stats?.tasksTotal ?? 0}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">completed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="wedding-panel shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PiggyBank className="size-4 text-maroon" />
              Budget spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(stats?.budgetActual ?? 0)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  of {formatCurrency(stats?.budgetEstimated ?? 0)} estimated
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="wedding-panel shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="size-4 text-maroon" />
              Days remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            ) : daysRemaining == null ? (
              <>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  —
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add an event date to start the countdown
                </p>
              </>
            ) : (
              <>
                <p
                  className={cn(
                    "text-2xl font-semibold tracking-tight",
                    daysRemaining < 0 ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {daysRemaining < 0
                    ? "Passed"
                    : daysRemaining === 0
                      ? "Today"
                      : daysRemaining}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {daysRemaining > 0
                    ? `until ${formatEventDate(stats!.earliestEventDate!)}`
                    : daysRemaining === 0
                      ? "Earliest event is today"
                      : `since ${formatEventDate(stats!.earliestEventDate!)}`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Jump in
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-border/80 bg-card/85 p-4 transition-colors hover:border-gold/50 hover:bg-card"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-maroon transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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
