"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function SubmitError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold">Submit view failed to load</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Please retry. Your existing dashboard data is not affected.
      </p>
      <Button onClick={reset} className="rounded-full px-5">
        Retry
      </Button>
    </div>
  );
}
