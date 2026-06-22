import { AlertCircle, PackageSearch } from "lucide-react";
import { Button } from "@components/ui/button";

interface ProductsEmptyStateProps {
  title: string;
  description: string;
  onReset?: () => void;
  showReset?: boolean;
}

export function ProductsEmptyState({
  title,
  description,
  onReset,
  showReset = false,
}: ProductsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border bg-muted">
        <PackageSearch className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {showReset && onReset ? (
        <Button className="mt-4" variant="outline" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

interface ProductsErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ProductsErrorState({ message, onRetry }: ProductsErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
      </div>
      <h3 className="text-sm font-medium text-foreground">Unable to load products</h3>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
