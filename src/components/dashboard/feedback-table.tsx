"use client";
/* eslint-disable react-hooks/incompatible-library */

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CategoryBadge,
  PriorityBadge,
  SentimentBadge,
  TeamBadge,
} from "@/components/dashboard/feedback-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import { applyFeedbackFilters, defaultFeedbackFilters } from "@/lib/filters";
import type { FeedbackDTO } from "@/lib/types";

type FeedbackTableProps = {
  feedback: FeedbackDTO[];
};

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultFeedbackFilters.query);
  const [categories, setCategories] = useState<string[]>(defaultFeedbackFilters.categories);
  const [priorities, setPriorities] = useState<string[]>(defaultFeedbackFilters.priorities);

  const filteredData = useMemo(
    () => applyFeedbackFilters(feedback, { query, categories, priorities }),
    [feedback, query, categories, priorities]
  );

  const columns = useMemo<ColumnDef<FeedbackDTO>[]>(
    () => [
      {
        id: "reporter",
        accessorKey: "name",
        header: "Reporter",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium">{row.original.name}</p>
            <p className="text-[11px] text-muted-foreground/80">
              {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "message",
        header: "Feedback",
        cell: ({ row }) => (
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
            {row.original.message}
          </p>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <CategoryBadge value={row.original.category} />,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => <PriorityBadge value={row.original.priority} />,
      },
      {
        accessorKey: "sentiment",
        header: "Sentiment",
        cell: ({ row }) => <SentimentBadge value={row.original.sentiment} />,
      },
      {
        accessorKey: "assignedTeam",
        header: "Team",
        cell: ({ row }) => <TeamBadge value={row.original.assignedTeam} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 12,
      },
    },
  });

  const hasFilters = query.length > 0 || categories.length > 0 || priorities.length > 0;

  const toggleCategory = (category: string) => {
    setCategories((previous) =>
      previous.includes(category)
        ? previous.filter((item) => item !== category)
        : [...previous, category]
    );
  };

  const togglePriority = (priority: string) => {
    setPriorities((previous) =>
      previous.includes(priority)
        ? previous.filter((item) => item !== priority)
        : [...previous, priority]
    );
  };

  const getCellClass = (columnId: string) => {
    if (columnId === "reporter") return "w-[17%] whitespace-normal align-top";
    if (columnId === "message") return "w-[35%] whitespace-normal align-top";
    if (columnId === "category") return "w-[12%] whitespace-normal align-top";
    if (columnId === "priority") return "w-[12%] whitespace-normal align-top";
    if (columnId === "sentiment") return "w-[12%] whitespace-normal align-top";
    if (columnId === "assignedTeam") return "w-[12%] whitespace-normal align-top";
    return "whitespace-normal align-top";
  };

  const getHeadClass = (headerId: string) => {
    if (headerId === "reporter") return "w-[17%]";
    if (headerId === "message") return "w-[35%]";
    if (headerId === "category") return "w-[12%]";
    if (headerId === "priority") return "w-[12%]";
    if (headerId === "sentiment") return "w-[12%]";
    if (headerId === "assignedTeam") return "w-[12%]";
    return "";
  };

  return (
    <div className="glass-panel overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[250px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Fuzzy search ticket ID, name, email, message..."
            className="h-10 border-border/70 bg-background/70 pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-full">
              <Filter className="size-4" />
              Category
              {categories.length > 0 && <Badge className="ml-1 rounded-full">{categories.length}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 border-border/70 bg-popover/95">
            <div className="space-y-2">
              {CATEGORY_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={categories.includes(item)}
                    onCheckedChange={() => toggleCategory(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-full">
              <SlidersHorizontal className="size-4" />
              Priority
              {priorities.length > 0 && <Badge className="ml-1 rounded-full">{priorities.length}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 border-border/70 bg-popover/95">
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={priorities.includes(item)}
                    onCheckedChange={() => togglePriority(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button
            variant="ghost"
            className="rounded-full text-muted-foreground"
            onClick={() => {
              setQuery("");
              setCategories([]);
              setPriorities([]);
            }}
          >
            <X className="mr-1 size-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70">
        <Table className="w-full table-fixed">
          <TableHeader className="bg-secondary/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-secondary/40">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`${getHeadClass(header.id)} text-xs uppercase tracking-wide text-muted-foreground`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-secondary/20"
                  onClick={() => router.push(`/dashboard/tickets/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={`${getCellClass(cell.column.id)} py-3`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No feedback matches the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Showing {table.getRowModel().rows.length} of {feedback.length} feedback items
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
