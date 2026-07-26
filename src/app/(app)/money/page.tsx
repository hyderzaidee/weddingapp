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

function toTransaction(row: MoneyTransaction): MoneyTransaction {
  return {
    ...row,
    amount: toNumber(row.amount),
  };
}

export default function MoneyPage() {
  const [transactions, setTransactions] = useState<MoneyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        await loadTransactions();
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
  }, [loadTransactions]);

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
        label: "From",
        type: "text",
        placeholder: "Name",
      },
    ],
    []
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
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Money
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log cash collected for the wedding budget.
        </p>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-3">
        <Card className="wedding-panel shadow-none">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total money collected
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>

        <Card className="wedding-panel shadow-none">
          <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Who contributed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {paidByBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground/80">
                No money collected yet.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 text-sm text-foreground/90 sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
                {paidByBreakdown.map(({ name, amount }) => (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 sm:bg-transparent sm:px-0 sm:py-0"
                  >
                    <span className="font-medium text-foreground">{name}</span>
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
