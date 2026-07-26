"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EditableTable,
  type EditableCellValue,
  type EditableColumn,
} from "@/components/editable-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, toNumber } from "@/lib/currency";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { BudgetCategory, Database } from "@/types/database";

type BudgetRow = BudgetCategory & {
  difference: number;
};

function toBudgetRow(category: BudgetCategory): BudgetRow {
  const estimated_amount = toNumber(category.estimated_amount);
  const actual_amount = toNumber(category.actual_amount);

  return {
    ...category,
    estimated_amount,
    actual_amount,
    difference: actual_amount - estimated_amount,
  };
}

function withRecalculatedDifference(row: BudgetRow): BudgetRow {
  return {
    ...row,
    difference: toNumber(row.actual_amount) - toNumber(row.estimated_amount),
  };
}

export default function BudgetPage() {
  const [categories, setCategories] = useState<BudgetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("budget_categories")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load budget.");
        setCategories([]);
        return;
      }

      setCategories((data ?? []).map(toBudgetRow));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load budget."
      );
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      await loadCategories();
      if (!cancelled) setIsLoading(false);
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadCategories]);

  const totals = useMemo(() => {
    const totalEstimated = categories.reduce(
      (sum, row) => sum + toNumber(row.estimated_amount),
      0
    );
    const totalActual = categories.reduce(
      (sum, row) => sum + toNumber(row.actual_amount),
      0
    );
    const remaining = totalEstimated - totalActual;

    return { totalEstimated, totalActual, remaining };
  }, [categories]);

  const columns: EditableColumn[] = useMemo(
    () => [
      {
        key: "category_name",
        label: "Category",
        type: "text",
        placeholder: "Category name",
        className: "min-w-[10rem]",
      },
      {
        key: "estimated_amount",
        label: "Estimated",
        type: "number",
        placeholder: "0",
        renderDisplay: (value) => formatCurrency(toNumber(value)),
      },
      {
        key: "actual_amount",
        label: "Actual",
        type: "number",
        placeholder: "0",
        renderDisplay: (value) => formatCurrency(toNumber(value)),
      },
      {
        key: "difference",
        label: "Difference",
        type: "number",
        editable: false,
        renderDisplay: (value) => {
          const amount = toNumber(value);
          return (
            <span
              className={cn(
                "font-medium",
                amount > 0 && "text-red-600",
                amount < 0 && "text-emerald-600",
                amount === 0 && "text-muted-foreground"
              )}
            >
              {formatCurrency(amount)}
            </span>
          );
        },
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

  async function handleAdd() {
    try {
      const { error } = await getSupabase()
        .from("budget_categories")
        .insert({ category_name: "New category" })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add category.");
        return;
      }

      await loadCategories();
      toast.success("Category added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add category."
      );
    }
  }

  async function handleUpdate(
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) {
    try {
      const { error } = await getSupabase()
        .from("budget_categories")
        .update({
          [columnKey]: newValue,
        } as Database["public"]["Tables"]["budget_categories"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save category.");
        await loadCategories();
        return;
      }

      setCategories((current) =>
        current.map((row) => {
          if (row.id !== rowId) return row;
          return withRecalculatedDifference({
            ...row,
            [columnKey]: newValue,
          });
        })
      );
      toast.success("Saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save category."
      );
      await loadCategories();
    }
  }

  async function handleDelete(rowId: string) {
    try {
      const { error } = await getSupabase()
        .from("budget_categories")
        .delete()
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to delete category.");
        return;
      }

      setCategories((current) => current.filter((row) => row.id !== rowId));
      toast.success("Category deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Budget
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track estimated vs actual spend by category.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 bg-card/85 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Estimated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatCurrency(totals.totalEstimated)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/85 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatCurrency(totals.totalActual)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/85 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining / Over
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-semibold tracking-tight",
                totals.remaining < 0 ? "text-red-600" : "text-emerald-600"
              )}
            >
              {formatCurrency(totals.remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      <EditableTable
        columns={columns}
        rows={categories}
        isLoading={isLoading}
        emptyMessage="No budget categories yet. Add one to get started."
        addLabel="Add category"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
