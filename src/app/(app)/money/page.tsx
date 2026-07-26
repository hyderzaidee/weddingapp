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
import type { Database, MoneyTransaction } from "@/types/database";

const PAYMENT_METHOD_OPTIONS = [
  { label: "Cash", value: "Cash" },
  { label: "UPI", value: "UPI" },
  { label: "Card", value: "Card" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Other", value: "Other" },
] as const;

function toTransaction(row: MoneyTransaction): MoneyTransaction {
  return {
    ...row,
    amount: toNumber(row.amount),
  };
}

export default function MoneyPage() {
  const [transactions, setTransactions] = useState<MoneyTransaction[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategoryNames = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("budget_categories")
        .select("category_name")
        .order("category_name", { ascending: true });

      if (error) {
        toast.error(error.message || "Failed to load categories.");
        setCategoryNames([]);
        return;
      }

      const names = Array.from(
        new Set(
          (data ?? [])
            .map((row) => row.category_name?.trim())
            .filter((name): name is string => Boolean(name))
        )
      ).sort((a, b) => a.localeCompare(b));

      setCategoryNames(names);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load categories."
      );
      setCategoryNames([]);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const { data, error } = await getSupabase()
        .from("money_transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message || "Failed to load transactions.");
        setTransactions([]);
        return;
      }

      setTransactions((data ?? []).map(toTransaction));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load transactions."
      );
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      setIsLoading(true);
      try {
        await Promise.all([loadTransactions(), loadCategoryNames()]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to load money data."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [loadTransactions, loadCategoryNames]);

  const totalSpent = useMemo(
    () => transactions.reduce((sum, row) => sum + toNumber(row.amount), 0),
    [transactions]
  );

  const paidByBreakdown = useMemo(() => {
    const totals = new Map<string, number>();

    for (const row of transactions) {
      const name = row.paid_by?.trim() || "Unassigned";
      totals.set(name, (totals.get(name) ?? 0) + toNumber(row.amount));
    }

    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  }, [transactions]);

  const categoryOptions = useMemo(() => {
    const options = categoryNames.map((name) => ({
      label: name,
      value: name,
    }));

    if (!categoryNames.includes("Other")) {
      options.push({ label: "Other", value: "Other" });
    }

    return options;
  }, [categoryNames]);

  const columns: EditableColumn[] = useMemo(
    () => [
      {
        key: "transaction_date",
        label: "Date",
        type: "date",
      },
      {
        key: "description",
        label: "Description",
        type: "text",
        placeholder: "What was this for?",
        className: "min-w-[10rem]",
      },
      {
        key: "amount",
        label: "Amount",
        type: "number",
        placeholder: "0",
        renderDisplay: (value) => formatCurrency(toNumber(value)),
      },
      {
        key: "paid_by",
        label: "Paid by",
        type: "text",
        placeholder: "Name",
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: categoryOptions,
        placeholder: "Select category",
      },
      {
        key: "payment_method",
        label: "Payment method",
        type: "select",
        options: [...PAYMENT_METHOD_OPTIONS],
        placeholder: "Select method",
      },
      {
        key: "notes",
        label: "Notes",
        type: "textarea",
        placeholder: "Notes",
        className: "min-w-[12rem]",
      },
    ],
    [categoryOptions]
  );

  async function handleAdd() {
    try {
      const { error } = await getSupabase()
        .from("money_transactions")
        .insert({
          description: "New transaction",
          amount: 0,
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Failed to add transaction.");
        return;
      }

      await loadTransactions();
      toast.success("Transaction added.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add transaction."
      );
    }
  }

  async function handleUpdate(
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) {
    const nextValue =
      columnKey === "amount" ? toNumber(newValue) : newValue;

    try {
      const { error } = await getSupabase()
        .from("money_transactions")
        .update({
          [columnKey]: nextValue,
        } as Database["public"]["Tables"]["money_transactions"]["Update"])
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to save transaction.");
        await loadTransactions();
        return;
      }

      setTransactions((current) => {
        const updated = current.map((row) =>
          row.id === rowId ? { ...row, [columnKey]: nextValue } : row
        );

        return [...updated].sort((a, b) => {
          const dateCompare = (b.transaction_date ?? "").localeCompare(
            a.transaction_date ?? ""
          );
          if (dateCompare !== 0) return dateCompare;
          return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        });
      });
      toast.success("Saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save transaction."
      );
      await loadTransactions();
    }
  }

  async function handleDelete(rowId: string) {
    try {
      const { error } = await getSupabase()
        .from("money_transactions")
        .delete()
        .eq("id", rowId);

      if (error) {
        toast.error(error.message || "Failed to delete transaction.");
        return;
      }

      setTransactions((current) => current.filter((row) => row.id !== rowId));
      toast.success("Transaction deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete transaction."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Money
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log payments and see who’s covering what.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <Card className="border-border/80 bg-card/85 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent So Far
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/85 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Who’s paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paidByBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground/80">No payments logged yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground/90">
                {paidByBreakdown.map(({ name, amount }) => (
                  <li key={name}>
                    <span className="font-medium text-foreground">{name}</span>
                    {" paid: "}
                    <span className="tabular-nums">
                      {formatCurrency(amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <EditableTable
        columns={columns}
        rows={transactions}
        isLoading={isLoading}
        emptyMessage="No transactions yet. Add one to get started."
        addLabel="Add transaction"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
