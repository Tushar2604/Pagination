import * as React from "react";
import { cn } from "@lib/utils";

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-md border bg-card">
      <table
        className={cn(
          "w-full border-collapse text-left text-xs text-foreground",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHeader(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className="sticky top-0 z-10 border-b bg-muted/80 text-[11px] font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm"
      {...props}
    />
  );
}

export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className="border-b last:border-0 hover:bg-muted/60 data-[state=loading]:animate-pulse"
      {...props}
    />
  );
}

export function TableHead(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="px-3 py-2 align-middle font-medium"
      {...props}
    />
  );
}

export function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className="px-3 py-2 align-middle text-xs text-foreground"
      {...props}
    />
  );
}

