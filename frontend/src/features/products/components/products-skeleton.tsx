import { Skeleton } from "@components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";

export function ProductsTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[36%]">Product Name</TableHead>
          <TableHead className="w-[16%]">Category</TableHead>
          <TableHead className="w-[12%]">Price</TableHead>
          <TableHead className="w-[18%]">Created</TableHead>
          <TableHead className="w-[18%]">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index} data-state="loading">
            <TableCell>
              <Skeleton className="h-3.5 w-4/5" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-28" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ProductsCardsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 md:hidden">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-3">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-3 h-3 w-1/3" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
