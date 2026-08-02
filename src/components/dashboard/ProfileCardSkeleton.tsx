import { Card, CardContent } from "@/components/ui/card";

export function ProfileCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="size-16 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
