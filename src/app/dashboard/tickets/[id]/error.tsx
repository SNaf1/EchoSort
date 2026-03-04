"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function TicketError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold">Ticket failed to load</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Retry loading ticket details. Dashboard data remains unchanged.
      </p>
      <Button onClick={reset} className="rounded-full px-5">
        Retry
      </Button>
    </div>
  );
}
