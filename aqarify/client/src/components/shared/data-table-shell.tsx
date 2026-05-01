import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type Row,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpRight, Search, Settings2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/app-toast";

interface DataFilter {
  key: string;
  label: string;
  value?: string;
  options: { label: string; value: string }[];
  onChange?: (value: string) => void;
}

interface DataTableShellProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: DataFilter[];
  /** Base name for CSV download (without `.csv`). */
  exportFileName?: string;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function headerLabel<TData>(column: { id: string; columnDef: ColumnDef<TData> }): string {
  const h = column.columnDef.header;
  if (typeof h === "string") return h;
  if (typeof h === "number") return String(h);
  return column.id;
}

function cellExportValue<TData>(rowOriginal: TData, columnDef: ColumnDef<TData>): string {
  const withAcc = columnDef as ColumnDef<TData> & { accessorKey?: string; accessorFn?: (row: TData) => unknown };
  if (typeof withAcc.accessorFn === "function") {
    try {
      return String(withAcc.accessorFn(rowOriginal) ?? "");
    } catch {
      /* fall through */
    }
  }
  if (typeof withAcc.accessorKey === "string" && rowOriginal && typeof rowOriginal === "object") {
    const key = withAcc.accessorKey;
    if (key in (rowOriginal as Record<string, unknown>)) {
      return String((rowOriginal as Record<string, unknown>)[key] ?? "");
    }
  }
  return "";
}

function shouldIncludeColumnInCsv<TData>(column: Column<TData, unknown>): boolean {
  const id = column.id;
  if (id === "actions" || id === "action") return false;
  const m = column.columnDef.meta as { omitFromCsv?: boolean } | undefined;
  return m?.omitFromCsv !== true;
}

/** Prefer `meta.csvValue`, then cell accessor value, then other accessors on the definition. */
function exportCellContents<TData>(row: Row<TData>, column: Column<TData, unknown>): string {
  const meta = column.columnDef.meta as { csvValue?: (r: TData) => unknown } | undefined;
  if (meta?.csvValue) return String(meta.csvValue(row.original) ?? "");
  const raw = row.getValue(column.id);
  if (raw !== undefined && raw !== null && raw !== "") return String(raw);
  return cellExportValue(row.original, column.columnDef);
}

export function DataTableShell<TData>({
  columns,
  data,
  searchValue = "",
  searchPlaceholder = "Search",
  onSearchChange,
  filters = [],
  exportFileName = "table-export",
}: DataTableShellProps<TData>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [compactRows, setCompactRows] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  const headRowClass = compactRows ? "h-9 px-4 text-sm" : "h-12 px-4 text-sm";
  const bodyRowClass = compactRows ? "h-12 px-4 text-sm" : "h-16 px-4 text-sm";

  const handleExportCsv = () => {
    const rows = table.getRowModel().rows;
    if (rows.length === 0) {
      toast.warning("Nothing to export", { description: "This table has no rows yet." });
      return;
    }

    const visibleLeaf = table.getVisibleLeafColumns();
    const csvColumns = visibleLeaf.filter(shouldIncludeColumnInCsv);
    if (csvColumns.length === 0) {
      toast.warning("Nothing to export", { description: "All columns are excluded from export." });
      return;
    }
    const headers = csvColumns.map((c) => escapeCsvCell(headerLabel(c)));
    const lines = [
      headers.join(","),
      ...rows.map((row) =>
        csvColumns.map((col) => escapeCsvCell(exportCellContents(row, col))).join(","),
      ),
    ];
    const csv = `\uFEFF${lines.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName.replace(/\.csv$/i, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Table exported", { description: "CSV file download started." });
  };

  const hideableColumns = table.getAllLeafColumns().filter((c) => c.getCanHide());

  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 p-4 shadow-[0_28px_80px_-58px_rgb(20_20_20/.7)] backdrop-blur">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 rounded-full border-transparent bg-background/75 ps-11 shadow-none placeholder:text-muted-foreground focus-visible:ring-lime/50"
            />
          </div>
          {filters.map((filter) => (
            <Select key={filter.key} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="h-12 min-w-[150px] rounded-full border-transparent bg-background/75 px-4 shadow-none">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={compactRows ? "Use taller rows" : "Use compact rows"}
            aria-pressed={compactRows}
            onClick={() => setCompactRows((c) => !c)}
            className="h-12 w-12 rounded-full border-transparent bg-background/75"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Columns"
                className="h-12 w-12 rounded-full border-transparent bg-background/75"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              {hideableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  disabled={column.getIsVisible() && table.getVisibleLeafColumns().length <= 1}
                  onCheckedChange={(checked) => {
                    if (!checked && column.getIsVisible() && table.getVisibleLeafColumns().length <= 1) {
                      toast.warning("Keep at least one column visible.");
                      return;
                    }
                    column.toggleVisibility(!!checked);
                  }}
                >
                  {headerLabel(column)}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setColumnVisibility({});
                }}
              >
                Reset columns
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Export CSV"
            onClick={handleExportCsv}
            className="h-12 w-12 rounded-full border-transparent bg-background/75"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem]">
          <Table>
            <TableHeader className="bg-transparent">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="border-border/60 hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead key={header.id} className={`font-medium text-muted-foreground ${headRowClass}`}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="border-border/40 hover:bg-background/45">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={bodyRowClass}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
