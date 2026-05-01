import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, Search, Settings2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
}

export function DataTableShell<TData>({
  columns,
  data,
  searchValue = "",
  searchPlaceholder = "Search",
  onSearchChange,
  filters = [],
}: DataTableShellProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 p-4 shadow-[0_28px_80px_-58px_rgb(20_20_20/.7)] backdrop-blur">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-transparent bg-background/75">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-transparent bg-background/75">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-transparent bg-background/75">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-[1.5rem]">
          <Table>
            <TableHeader className="bg-transparent">
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="border-border/60 hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead key={header.id} className="h-12 px-4 text-sm font-medium text-muted-foreground">
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
                      <TableCell key={cell.id} className="h-16 px-4 text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
