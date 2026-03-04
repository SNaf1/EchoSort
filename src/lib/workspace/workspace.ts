import { cookies } from "next/headers";

export const WORKSPACE_COOKIE_NAME = "es_workspace";

export async function getWorkspaceIdOrThrow() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;
  if (!workspaceId) {
    throw new Error("Workspace cookie is missing.");
  }
  return workspaceId;
}
