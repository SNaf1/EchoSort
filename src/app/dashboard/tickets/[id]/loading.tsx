import { Skeleton } from "@/components/ui/skeleton";

export default function TicketLoading() {
  return (
    <div className="mx-auto w-full max-w-[96rem] space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-44 rounded-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
