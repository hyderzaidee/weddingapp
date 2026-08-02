"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, LoaderCircle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatEventDateLong } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type EditableColumnType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "textarea";

export type EditableColumnOption = {
  label: string;
  value: string;
};

export type EditableColumn = {
  key: string;
  label: string;
  type: EditableColumnType;
  options?: EditableColumnOption[];
  placeholder?: string;
  className?: string;
  /** Defaults to true. Set false for calculated / display-only columns. */
  editable?: boolean;
  renderDisplay?: (value: EditableRow[string], row: EditableRow) => ReactNode;
  /** Optional classes for select trigger / items based on current value. */
  selectClassName?: (value: string) => string | undefined;
  /** Fully custom cell (e.g. image gallery). Skips inline editing. */
  customCell?: (ctx: {
    row: EditableRow;
    value: EditableRow[string];
    onUpdate: (newValue: EditableCellValue) => void | Promise<void>;
  }) => ReactNode;
};

export type EditableRow = {
  id: string;
  [key: string]: string | number | boolean | string[] | null | undefined;
};

export type EditableCellValue = string | number | string[] | null;

type EditingCell = {
  rowId: string;
  columnKey: string;
};

type EditableTableProps = {
  columns: EditableColumn[];
  rows: EditableRow[];
  onUpdate: (
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) => void | Promise<void>;
  onAdd: () => void | Promise<void>;
  onDelete: (rowId: string) => void | Promise<void>;
  isLoading?: boolean;
  emptyMessage?: string;
  addLabel?: string;
  className?: string;
  /** Mobile-only: cards start collapsed and can expand. */
  collapsibleMobile?: boolean;
};

function toInputString(value: EditableRow[string]): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function parseCellValue(
  column: EditableColumn,
  raw: string
): EditableCellValue {
  if (raw === "") return null;
  if (column.type === "number") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return raw;
}

function formatDateDisplay(value: string): string {
  return formatEventDateLong(value);
}

function displayValue(
  column: EditableColumn,
  value: EditableRow[string]
): string {
  if (value == null || value === "") return "—";

  if (column.type === "select" && column.options?.length) {
    const match = column.options.find(
      (option) => option.value === String(value)
    );
    return match?.label ?? String(value);
  }

  if (column.type === "date") {
    return formatDateDisplay(String(value));
  }

  return String(value);
}

function renderCellContent(
  column: EditableColumn,
  value: EditableRow[string],
  row: EditableRow
): ReactNode {
  if (column.renderDisplay) {
    if (value == null || value === "") {
      return <span className="text-muted-foreground/80">—</span>;
    }
    return column.renderDisplay(value, row);
  }

  return (
    <span
      className={cn(
        column.type === "date"
          ? "whitespace-nowrap"
          : "whitespace-pre-wrap break-words",
        (value == null || value === "") && "text-muted-foreground/80"
      )}
    >
      {displayValue(column, value)}
    </span>
  );
}

function valuesEqual(
  column: EditableColumn,
  current: EditableRow[string],
  next: EditableCellValue
): boolean {
  const normalizedCurrent = parseCellValue(column, toInputString(current));
  if (normalizedCurrent === next) return true;
  if (normalizedCurrent == null && next == null) return true;
  return String(normalizedCurrent ?? "") === String(next ?? "");
}

export function EditableTable({
  columns,
  rows,
  onUpdate,
  onAdd,
  onDelete,
  isLoading = false,
  emptyMessage = "No rows yet. Add one to get started.",
  addLabel = "Add row",
  className,
  collapsibleMobile = true,
}: EditableTableProps) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [draft, setDraft] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function startEditing(row: EditableRow, column: EditableColumn) {
    if (column.editable === false || column.customCell) return;
    setEditing({ rowId: row.id, columnKey: column.key });
    setDraft(toInputString(row[column.key]));
  }

  function stopEditing() {
    setEditing(null);
    setDraft("");
  }

  async function commitEdit(
    row: EditableRow,
    column: EditableColumn,
    rawValue: string
  ) {
    const nextValue = parseCellValue(column, rawValue);
    stopEditing();

    if (valuesEqual(column, row[column.key], nextValue)) {
      return;
    }

    await onUpdate(row.id, column.key, nextValue);
  }

  async function handleAdd() {
    setIsAdding(true);
    try {
      await onAdd();
    } finally {
      setIsAdding(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTargetId);
      setDeleteTargetId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {isLoading ? (
        <LoadingState columnCount={columns.length} />
      ) : rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <>
          {/* Mobile: stacked labeled fields */}
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <MobileRowCard
                key={row.id}
                row={row}
                columns={columns}
                editing={editing}
                draft={draft}
                onDraftChange={setDraft}
                onStartEdit={startEditing}
                onStopEdit={stopEditing}
                onCommit={commitEdit}
                onUpdate={onUpdate}
                onRequestDelete={setDeleteTargetId}
                collapsible={collapsibleMobile}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card/85 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn("whitespace-nowrap", column.className)}
                    >
                      {column.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column) => {
                      const isEditing =
                        editing?.rowId === row.id &&
                        editing.columnKey === column.key;

                      return (
                        <TableCell
                          key={column.key}
                          className={cn(
                            "align-top",
                            column.type === "textarea" && "min-w-[12rem]",
                            column.type === "date" && "min-w-[11rem] whitespace-nowrap",
                            column.className
                          )}
                        >
                          {column.customCell ? (
                            column.customCell({
                              row,
                              value: row[column.key],
                              onUpdate: (newValue) =>
                                onUpdate(row.id, column.key, newValue),
                            })
                          ) : column.type === "select" ? (
                            <SelectCell
                              column={column}
                              value={row[column.key]}
                              onUpdate={(newValue) =>
                                onUpdate(row.id, column.key, newValue)
                              }
                            />
                          ) : isEditing ? (
                            <CellEditor
                              column={column}
                              value={draft}
                              onChange={setDraft}
                              onCommit={(raw) => commitEdit(row, column, raw)}
                              onCancel={stopEditing}
                            />
                          ) : column.editable === false ? (
                            <div className="px-1.5 py-1 text-sm text-foreground/90">
                              {renderCellContent(column, row[column.key], row)}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditing(row, column)}
                              className="block w-full rounded-md px-1.5 py-1 text-left text-sm text-foreground/90 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {renderCellContent(column, row[column.key], row)}
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="align-top text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground/80 hover:text-red-600"
                        onClick={() => setDeleteTargetId(row.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        disabled={isLoading || isAdding}
        className="hidden gap-2 md:inline-flex"
      >
        {isAdding ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {addLabel}
      </Button>

      <Button
        type="button"
        onClick={handleAdd}
        disabled={isLoading || isAdding}
        aria-label={addLabel}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30 size-14 rounded-full p-0 shadow-lg md:hidden"
      >
        {isAdding ? (
          <LoaderCircle className="size-6 animate-spin" />
        ) : (
          <Plus className="size-6" />
        )}
      </Button>

      <Sheet
        open={deleteTargetId != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTargetId(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 md:mx-auto md:max-w-lg"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border md:hidden" />
          <SheetHeader className="text-left">
            <SheetTitle>Delete this row?</SheetTitle>
            <SheetDescription>
              This can&apos;t be undone. The row will be removed permanently.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="mt-5 gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              No
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Yes"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-10 text-center sm:px-6 sm:py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingState({ columnCount }: { columnCount: number }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-border/80 bg-card/85 p-4"
          >
            {Array.from({ length: Math.min(columnCount, 4) }).map(
              (__, fieldIndex) => (
                <div key={fieldIndex} className="space-y-1.5">
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
                </div>
              )
            )}
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card/85 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {Array.from({ length: columnCount }).map((_, index) => (
                <TableHead key={index}>
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </TableHead>
              ))}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columnCount }).map((__, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
                  </TableCell>
                ))}
                <TableCell>
                  <div className="ml-auto h-8 w-8 animate-pulse rounded-md bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

type MobileRowCardProps = {
  row: EditableRow;
  columns: EditableColumn[];
  editing: EditingCell | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onStartEdit: (row: EditableRow, column: EditableColumn) => void;
  onStopEdit: () => void;
  onCommit: (
    row: EditableRow,
    column: EditableColumn,
    rawValue: string
  ) => void | Promise<void>;
  onUpdate: (
    rowId: string,
    columnKey: string,
    newValue: EditableCellValue
  ) => void | Promise<void>;
  onRequestDelete: (rowId: string) => void;
  collapsible?: boolean;
};

function isCompactMobileField(column: EditableColumn) {
  return (
    !column.customCell &&
    (column.type === "select" ||
      column.type === "date" ||
      column.type === "number")
  );
}

function getMobileTitleColumn(columns: EditableColumn[]) {
  const preferredKeys = [
    "title",
    "person_name",
    "category",
    "event_name",
    "description",
    "item",
  ];

  for (const key of preferredKeys) {
    const match = columns.find(
      (column) => column.key === key && !column.customCell
    );
    if (match) return match;
  }

  return columns.find((column) => column.type === "text" && !column.customCell);
}

function getMobileSummaryColumns(
  columns: EditableColumn[],
  titleKey: string | undefined
) {
  const preferredKeys = ["status", "category", "cost", "assigned_to"];
  return preferredKeys
    .map((key) => columns.find((column) => column.key === key))
    .filter((column): column is EditableColumn =>
      Boolean(column && column.key !== titleKey)
    );
}

function MobileRowCard({
  row,
  columns,
  editing,
  draft,
  onDraftChange,
  onStartEdit,
  onStopEdit,
  onCommit,
  onUpdate,
  onRequestDelete,
  collapsible = false,
}: MobileRowCardProps) {
  const [expanded, setExpanded] = useState(!collapsible);
  const titleColumn = getMobileTitleColumn(columns);
  const bodyColumns = titleColumn
    ? columns.filter((column) => column.key !== titleColumn.key)
    : columns;
  const summaryColumns = getMobileSummaryColumns(columns, titleColumn?.key);

  const titleEditing =
    titleColumn != null &&
    editing?.rowId === row.id &&
    editing.columnKey === titleColumn.key;

  const isExpanded = !collapsible || expanded;

  return (
    <div className="wedding-panel overflow-hidden rounded-2xl p-3.5 shadow-sm sm:p-4">
      <div className={cn("flex items-start gap-2", isExpanded && "mb-3")}>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse row" : "Expand row"}
          >
            <ChevronDown
              className={cn(
                "size-5 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          {titleColumn ? (
            titleColumn.customCell ? (
              titleColumn.customCell({
                row,
                value: row[titleColumn.key],
                onUpdate: (newValue) =>
                  onUpdate(row.id, titleColumn.key, newValue),
              })
            ) : titleColumn.type === "select" ? (
              <SelectCell
                column={titleColumn}
                value={row[titleColumn.key]}
                onUpdate={(newValue) =>
                  onUpdate(row.id, titleColumn.key, newValue)
                }
              />
            ) : titleEditing ? (
              <CellEditor
                column={titleColumn}
                value={draft}
                onChange={onDraftChange}
                onCommit={(raw) => onCommit(row, titleColumn, raw)}
                onCancel={onStopEdit}
              />
            ) : titleColumn.editable === false ? (
              <p className="truncate text-base font-semibold text-foreground">
                {displayValue(titleColumn, row[titleColumn.key])}
              </p>
            ) : collapsible && !isExpanded ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="block w-full rounded-lg px-1 py-1 text-left text-base font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {displayValue(titleColumn, row[titleColumn.key])}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartEdit(row, titleColumn)}
                className="block w-full rounded-lg px-1 py-1 text-left text-base font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {displayValue(titleColumn, row[titleColumn.key])}
              </button>
            )
          ) : (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
              Item
            </p>
          )}

          {collapsible && !isExpanded && summaryColumns.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-1">
              {summaryColumns.map((column) => (
                <div
                  key={column.key}
                  className="inline-flex max-w-full items-center text-xs text-muted-foreground"
                >
                  {renderCellContent(column, row[column.key], row)}
                </div>
              ))}
            </div>
          ) : titleColumn && !(collapsible && !isExpanded) ? (
            <p className="mt-0.5 px-1 text-[11px] text-muted-foreground">
              {titleColumn.label}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 text-muted-foreground/80 hover:text-red-600"
          onClick={() => onRequestDelete(row.id)}
          aria-label="Delete row"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {isExpanded ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {bodyColumns.map((column) => {
            const isEditing =
              editing?.rowId === row.id && editing.columnKey === column.key;
            const spansFull = !isCompactMobileField(column);

            return (
              <div
                key={column.key}
                className={cn("space-y-1.5", spansFull && "col-span-2")}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {column.label}
                </p>
                {column.customCell ? (
                  column.customCell({
                    row,
                    value: row[column.key],
                    onUpdate: (newValue) =>
                      onUpdate(row.id, column.key, newValue),
                  })
                ) : column.type === "select" ? (
                  <SelectCell
                    column={column}
                    value={row[column.key]}
                    onUpdate={(newValue) =>
                      onUpdate(row.id, column.key, newValue)
                    }
                  />
                ) : isEditing ? (
                  <CellEditor
                    column={column}
                    value={draft}
                    onChange={onDraftChange}
                    onCommit={(raw) => onCommit(row, column, raw)}
                    onCancel={onStopEdit}
                  />
                ) : column.editable === false ? (
                  <div className="min-h-11 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-foreground/90">
                    {renderCellContent(column, row[column.key], row)}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartEdit(row, column)}
                    className="block min-h-11 w-full rounded-xl border border-transparent bg-muted/60 px-3 py-2.5 text-left text-sm text-foreground/90 transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {renderCellContent(column, row[column.key], row)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type SelectCellProps = {
  column: EditableColumn;
  value: EditableRow[string];
  onUpdate: (newValue: EditableCellValue) => void | Promise<void>;
};

function SelectCell({ column, value, onUpdate }: SelectCellProps) {
  const stringValue = value == null ? "" : String(value);
  const options = column.options ?? [];
  const hasCurrentOption =
    !stringValue || options.some((option) => option.value === stringValue);
  const valueClassName = stringValue
    ? column.selectClassName?.(stringValue)
    : undefined;

  return (
    <Select
      value={stringValue || undefined}
      onValueChange={(next) => {
        if (next !== stringValue) {
          void onUpdate(next);
        }
      }}
    >
      <SelectTrigger
        className={cn(
          "h-11 w-full min-w-0 md:h-9 md:min-w-[8rem]",
          valueClassName
        )}
      >
        <SelectValue placeholder={column.placeholder ?? "Select…"} />
      </SelectTrigger>
      <SelectContent>
        {!hasCurrentOption && stringValue ? (
          <SelectItem value={stringValue}>{stringValue}</SelectItem>
        ) : null}
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={column.selectClassName?.(option.value)}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type CellEditorProps = {
  column: EditableColumn;
  value: string;
  onChange: (value: string) => void;
  onCommit: (rawValue: string) => void | Promise<void>;
  onCancel: () => void;
};

function CellEditor({
  column,
  value,
  onChange,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (column.type === "textarea") {
      textareaRef.current?.focus();
      return;
    }

    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [column.type]);

  function handleCancel() {
    cancelledRef.current = true;
    onCancel();
  }

  function handleBlurCommit() {
    if (cancelledRef.current) return;
    void onCommit(value);
  }

  if (column.type === "textarea") {
    return (
      <Textarea
        ref={textareaRef}
        value={value}
        placeholder={column.placeholder}
        className="min-h-[72px]"
        onChange={(event) => onChange(event.target.value)}
        onBlur={handleBlurCommit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            handleCancel();
          }
        }}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      type={
        column.type === "number"
          ? "number"
          : column.type === "date"
            ? "date"
            : "text"
      }
      value={value}
      placeholder={column.placeholder}
      className={cn("h-11 md:h-9", column.type === "date" && "min-w-0 md:min-w-[11rem]")}
      onChange={(event) => onChange(event.target.value)}
      onBlur={handleBlurCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          handleCancel();
        }
      }}
    />
  );
}
