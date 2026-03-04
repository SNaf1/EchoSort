import { Skeleton } from "@/components/ui/skeleton";

export default function SubmitLoading() {
  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-[30rem] rounded-3xl" />
    </div>
  );
}
