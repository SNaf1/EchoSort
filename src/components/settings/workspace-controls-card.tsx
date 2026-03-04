"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { rotateWorkspaceAction } from "@/app/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WorkspaceControlsCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const rotateWorkspace = () => {
    startTransition(async () => {
      try {
        await rotateWorkspaceAction();
        toast.success("Started a new workspace.");
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start new workspace.");
      }
    });
  };

  return (
    <Card className="glass-panel border-border/60 bg-card/55">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Workspace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Start a fresh anonymous workspace without clearing browser data. Your current workspace
          remains isolated and inaccessible unless the cookie is restored.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={rotateWorkspace}
          disabled={isPending}
          className="w-full justify-center rounded-xl"
        >
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 size-4" />
          )}
          Start New Workspace
        </Button>
      </CardContent>
    </Card>
  );
}
