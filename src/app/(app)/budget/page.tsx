"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toNumber } from "@/lib/currency";
import { formatEventDate } from "@/lib/dates";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type {
  MoneyTransaction,
  Task,
  TaskCategory,
  TaskStatus,
} from "@/types/database";

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  wedding_preparation: "Wedding Preparation",
  hiras_stuff: "Hira's Stuff",
  ahmed_and_family: "Ahmed and Family",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  todo: "border-transparent bg-red-100 text-red-800",
  in_progress: "border-transparent bg-yellow-100 text-yellow-800",
  done: "border-transparent bg-green-100 text-green-800",
};

function isTaskCategory(value: string): value is TaskCategory {
  return (
    value === "wedding_preparation" ||
    value === "hiras_stuff" ||
    value === "ahmed_and_family"
  );
}

function toMoneyRow(row: MoneyTransaction): MoneyTransaction {
  return {
    ...row,
    amount: toNumber(row.amount),
  };
}

function toTaskExpense(row: Task): Task {
  return {
    ...row,
    cost: row.cost == null ? null : toNumber(row.cost),
    category: isTaskCategory(row.category)
      ? row.category
      : "wedding_preparation",
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return formatEventDate(value);
}

export default function BudgetPage() {
  const [collections, setCollections] = useState<MoneyTransaction[]>([]);
  const [taskExpenses, setTaskExpenses] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCollections = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("money_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message || "Failed to load money collected.");
        setCollections([]);
        return;
      }

      setCollections((data ?? []).map(toMoneyRow));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load money collected."
      );
      setCollections([]);
    }
  }, []);

  const loadTaskExpenses = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("tasks")
        .select("*")
        .not("cost", "is", null)
        .order("updated_at", { ascending: false });

      if (error) {
        toast.error(error.message || "Failed to load task expenses.");
        setTaskExpenses([]);
        return;
      }

      setTaskExpenses(
        (data ?? [])
          .map(toTaskExpense)
          .filter((task) => task.cost != null && toNumber(task.cost) !== 0)
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load task expenses."
      );
      setTaskExpenses([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await Promise.all([loadCollections(), loadTaskExpenses()]);
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadCollections, loadTaskExpenses]);

  const totals = useMemo(() => {
    const totalBudget = collections.reduce(
      (sum, row) => sum + toNumber(row.amount),
      0
    );
    const totalSpent = taskExpenses.reduce(
      (sum, row) => sum + toNumber(row.cost),
      0
    );
    const remaining = totalBudget - totalSpent;

    return { totalBudget, totalSpent, remaining };
  }, [collections, taskExpenses]);

  return (
    <div className="space-y-4 pb-20 sm:space-y-6 md:pb-0">
      <div className="hidden md:block">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Budget
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Money collected on the Money screen sets the pot. Task costs come out
          of it.
        </p>
      </div>

      <Card className="wedding-panel shadow-none md:hidden">
        <CardContent className="space-y-1 p-4">
          <p className="text-xs font-medium text-muted-foreground">Remaining</p>
          <p
            className={cn(
              "text-3xl font-semibold tracking-tight",
              totals.remaining < 0 ? "text-red-600" : "text-emerald-600"
            )}
          >
            {formatCurrency(totals.remaining)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(totals.totalSpent)} spent of{" "}
            {formatCurrency(totals.totalBudget)} collected
          </p>
        </CardContent>
      </Card>

      <div className="hidden grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid">
        <Card className="wedding-panel shadow-none">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total collected
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {formatCurrency(totals.totalBudget)}
            </p>
          </CardContent>
        </Card>

        <Card className="wedding-panel shadow-none">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spent on tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {formatCurrency(totals.totalSpent)}
            </p>
          </CardContent>
        </Card>

        <Card className="wedding-panel shadow-none">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p
              className={cn(
                "text-xl font-semibold tracking-tight sm:text-2xl",
                totals.remaining < 0 ? "text-red-600" : "text-emerald-600"
              )}
            >
              {formatCurrency(totals.remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Money collected
            </h2>
            <p className="mt-1 hidden text-sm text-muted-foreground md:block">
              From the Money screen — cash people put into the wedding pot.
            </p>
          </div>
          <Button asChild variant="outline" className="hidden w-full sm:w-auto md:inline-flex">
            <Link href="/money">Manage on Money</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No money collected yet. Add entries on the Money screen.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/85">
            <ul className="divide-y divide-border/80">
              {collections.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium text-foreground">
                      {row.description || "Contribution"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(row.transaction_date)}</span>
                      {row.paid_by?.trim() ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{row.paid_by.trim()}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                    {formatCurrency(toNumber(row.amount))}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Task expenses
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every task with a cost is deducted from the budget.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : taskExpenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No task costs yet. Add a cost on a task to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/85">
            <ul className="divide-y divide-border/80">
              {taskExpenses.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium text-foreground">
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {CATEGORY_LABEL[task.category] ?? task.category}
                      </span>
                      {task.assigned_to ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{task.assigned_to}</span>
                        </>
                      ) : null}
                      <Badge className={STATUS_BADGE_CLASS[task.status]}>
                        {STATUS_LABEL[task.status]}
                      </Badge>
                    </div>
                  </div>
                  <p className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                    {formatCurrency(toNumber(task.cost))}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border/80 bg-card/95 px-3 py-2.5 backdrop-blur-md md:hidden">
        <Button asChild className="w-full">
          <Link href="/money">Manage money</Link>
        </Button>
      </div>
    </div>
  );
}
